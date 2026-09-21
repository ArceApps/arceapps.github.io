---
title: "RadioHub: delaying audio without breaking time"
description: "How RadioHub turned a 60-second radio delay into a continuous PCM pipeline and unified recording around the bytes AudioTrack actually consumes."
pubDate: 2026-09-20
lastmod: 2026-09-21
author: "ArceApps"
keywords: ["RadioHub", "Media3", "AudioTrack", "PCM", "Android"]
heroImage: "/images/devlog/radiohub-delay-pcm-pipeline.svg"
tags: ["Android", "audio", "Media3", "devlog"]
draft: false
---

Adding a control that delays live radio by anything from zero to sixty seconds looks like a small feature from the outside. A slider, a number, a buffer, done. This week RadioHub provided a useful reminder of why real-time audio punishes that kind of simplification: delaying sound is not only about storing bytes and returning them later. Once the player, the `AudioSink`, `AudioTrack`, and the recorder share the same PCM stream, progress, buffer identity, partial writes, and timelines become part of correctness.

The final result is simpler than several intermediate solutions. The pipeline now follows one rule: **`DelayedAudioSink` decides which PCM should be heard; `RecordingCaptureAdapter` records only the range that `AudioTrack` actually consumes**. Direct playback and delayed playback use the same recording path. Delay changes the PCM content, not the recording mechanism.

Getting there took three pull requests — [#19](https://github.com/ArceApps/RadioHub/pull/19), [#20](https://github.com/ArceApps/RadioHub/pull/20), and [#21](https://github.com/ArceApps/RadioHub/pull/21) — and, more importantly, abandoning an idea that initially looked reasonable: representing delay preroll as a period with no playback progress.

## The real problem was not storing sixty seconds

RadioHub plays streams through Media3. The delay feature is implemented around an `AudioSink` that receives decoded PCM before it reaches the platform output. To create a thirty-second delay, for example, the application must retain enough audio history and feed older samples to the output instead of the newest ones.

The first mental model is straightforward: while there is not enough history, hold the audio; once the buffer reaches the selected duration, start delayed playback. That describes the user-facing behavior reasonably well. Technically, however, it has an important consequence: from the renderer's point of view, preroll can look like a complete lack of progress.

That collided with a legitimate Media3 safeguard. PR #19 documented that stuck-player detection interpreted long intentional delays as playback remaining in `STATE_READY` without advancing. The normal timeout was shorter than RadioHub's intentional zero-to-sixty-second delay window. The first fix increased the radio player's timeout to seventy-five seconds while leaving the alarm service untouched.

It was a narrow, useful fix, with a regression test ensuring the timeout stayed above the maximum intentional delay. It was also evidence that the implementation was stretching the playback contract. If implementing a deliberate delay required persuading the player to tolerate a full minute without progress, perhaps “no progress” was the wrong abstraction.

## A continuous clock before delayed radio exists

PR #21 changed the model. Instead of refusing to consume while history was filling, every incoming PCM buffer began producing output with the same duration. During preroll, that output is valid PCM silence. Once enough history exists for the selected delay, silence is replaced by delayed PCM.

The difference sounds small but changes the temporal contract completely:

```text
incoming PCM -> delay history -> output selection -> AudioTrack
                                  |-> silence during preroll
                                  |-> historical PCM afterwards
```

The renderer no longer sees a hole. Samples are consumed from the beginning and its timeline continues moving. Delay stops meaning “wait before playback” and instead means “play now the content that belongs to another point in the stored history.”

That made it possible to remove the enlarged stuck-player timeout. This is one of the most useful parts of the sequence: PR #19 was not wasted work simply because #21 later replaced its workaround. It isolated the symptom, confirmed the interaction with Media3, and kept behavior stable while a solution that better respected the player model was developed.

The official [Media3 ExoPlayer documentation](https://developer.android.com/media/media3/exoplayer) provides the broader playback model, while [AudioTrack](https://developer.android.com/reference/android/media/AudioTrack) becomes essential once the discussion reaches actual PCM consumption. At that layer, “audio was written” cannot safely be treated as one atomic event.

## Silence has a format too

Emitting silence during preroll sounds trivial: fill a block with zeroes. The sink cannot emit arbitrary bytes, though; it must respect the configured PCM encoding. PR #21 added regression coverage for valid silence in both 8-bit and 16-bit PCM configurations.

The purpose is not to invent another audio source. Silence exists to preserve the consumption cadence until enough historical audio is available. That detail separates a temporally correct design from one that only happens to work under a particular format.

Internal state also keeps `isPreparing=true` until the first real delayed PCM is consumed. The clock can progress and the pipeline can be active without claiming too early that delayed content is already playing. Technical progress and product meaning are related, but they are not identical.

## The second bug: recording while delay is active

After long delays became stable, a more uncomfortable problem remained: recording. Without delay, RadioHub recorded cleanly. With delay enabled, recordings could become choppy and develop an obvious reverberation effect.

That contrast was a strong clue. If the network input, decoder, and encoder could produce a clean recording in direct mode, adding a special recording path for delayed mode multiplied the places where playback and recording could diverge.

PR #20 tried to stabilize that path by capturing PCM released by `DelayedAudioSink` once, before partial `AudioTrack` writes and retries could fragment recording behavior. It also addressed two related issues: transient `isPlaying=false` states while the player was still ready and expected to play, and AAC timestamps when a PCM block was split across multiple `MediaCodec` input buffers.

That was a reasoned improvement, not a random patch. Real-device testing nevertheless showed that delayed recording still did not behave like direct recording. The question that simplified the architecture came from that mismatch: **if the application already knows exactly which bytes are heard, why not record those exact bytes?**

## AudioTrack may consume only part of a buffer

The important detail is that a write to `AudioTrack` can be partial. A buffer offered to the platform output is not necessarily a buffer consumed in full. The operation may require retries. A `flush` can happen. A discontinuity can invalidate pending assumptions.

If the recorder copies an entire buffer in advance because that is what the code *intends* to play, the file may receive samples the platform has not consumed yet. If a partial write then causes some of that content to be retried, a capture model built around intended writes can duplicate or misalign data relative to actual playback.

PR #21 moved the capture boundary. `RecordingCaptureAdapter` no longer observes “the block we plan to send.” It observes the exact range consumed by the output operation.

Conceptually:

```text
DelayedAudioSink
      |
      v
RecordingCaptureAdapter
      |
      +---- copy ONLY consumed bytes ----> AAC encoder
      |
      v
AudioTrack
```

This makes recording follow the most reliable observable event in the pipeline: effective consumption. If `AudioTrack` consumes part of a block, that part is captured. If a retry occurs, the recorder does not invent a second copy. If data is discarded before reaching the output, it cannot appear magically in the file.

## One recording pipeline for direct and delayed playback

The key decision was not to add more delay-specific recording logic, but to remove it. After #21, recording no longer needs to know whether PCM originated from the current stream position or from delayed history.

`DelayedAudioSink` owns one responsibility: choose the PCM that should be heard. It may choose direct audio, preroll silence, or historical audio.

`RecordingCaptureAdapter` owns another: observe how much of that PCM the platform actually consumes and copy exactly that range while recording is active.

`AudioTrack` remains the boundary with platform playback.

The encoder receives captured samples and builds the media file.

This separation removes cross-product state. Previously it was natural to reason about “normal recording” and “delayed recording” as variants. Now there is one recording mechanism; what changes upstream is the signal delivered to it.

For a small independent application, that simplification matters beyond line count. Every additional audio branch is another combination that must be understood months later, retested after Media3 changes, and reconstructed when a user reports a strange edge case.

## ByteBuffer identity matters

Another implementation detail protected by the final design is preserving `ByteBuffer` identity across partial writes. In low-level streaming APIs, two buffers containing the same bytes are not always interchangeable from the consumer's perspective. Position and pending state matter, and a retry must continue from the correct point.

PR #21 includes regressions for partial writes and retries, plus increasing and decreasing the delay, returning to direct playback, `flush`, and discontinuities. That matrix matters because audio pipelines rarely fail only on the happy path. The interesting bugs live at transitions.

Changing from ten to thirty seconds is not equivalent to starting at thirty. Reducing delay can require history to be discarded. Returning to direct mode changes which portion of stored PCM should feed the output. A `flush` invalidates assumptions about pending data. A discontinuity forces the implementation to distinguish the renderer timeline from the timeline that should be written into an M4A recording.

## The recording file should own its clock

The other major simplification concerned AAC timing. PR #20 had already identified that splitting PCM across multiple `MediaCodec` buffers required timestamps to advance consistently. PR #21 took that idea to its natural conclusion: the timestamp of a recording should not be derived from renderer timestamps when the file represents a continuous sequence of samples that were actually captured.

The encoder now retains incomplete PCM fragments across calls and reconstructs complete frames. At the same time, M4A presentation timestamps are generated from the accumulated count of recorded samples.

Conceptually:

```text
presentationTimeUs =
    recordedSamples * 1_000_000 / sampleRate
```

The arithmetic is simple. The architectural choice is the important part. The file has its own clock based on what it contains. If playback timestamps jump forward or backward because of a discontinuity or delay mechanics, the recording does not have to inherit that jump.

The [MediaCodec reference](https://developer.android.com/reference/android/media/MediaCodec) documents the codec buffer and timestamp model. In RadioHub, decoupling the two timelines prevents one timestamp from being asked to represent two different realities.

## Buffering is not the same as a transient “not playing”

PR #20 also covered a state-management subtlety. The active pipeline could produce transient `isPlaying=false` transitions even while the player remained in `STATE_READY`, `playWhenReady=true`, and without playback suppression.

Treating every `isPlaying=false` as a real recording pause was too aggressive. The fix distinguishes those transient gaps from real causes such as buffering, audio focus loss, or interruption.

That distinction remains relevant after the final redesign. During preroll, silence is emitted to preserve sink progress, but regression coverage explicitly requires that preroll silence is not recorded while recording is paused because of `BUFFERING`. The existence of technically consumable bytes does not mean all product conditions for capturing them are satisfied.

## The tests this change deserved

PR #21 did not stop at “delay works.” Its regression set covers:

- silence preroll and the transition to delayed PCM;
- a complete sixty-second delay with continuous sink progress;
- monotonic playback timestamps;
- partial `AudioTrack` writes and retries;
- increasing and decreasing delay;
- returning to direct playback, `flush`, and discontinuities;
- correct 8-bit and 16-bit PCM silence;
- excluding preroll silence while recording is paused for buffering;
- capturing only bytes actually consumed;
- reassembling fragmented PCM before AAC;
- keeping the AAC clock continuous even when playback timestamps move forward or backward.

Those tests do not all verify the same layer. Some protect the Media3 contract, some protect capture semantics, and some protect the resulting file. Together they describe the architecture more effectively than a long comment inside the sink.

There is also a limit worth preserving explicitly. The PR itself states that final verification of audible reverberation and choppiness requires a real device because it depends on actual `AudioTrack` and `MediaCodec` behavior. Tests can prove invariants and logical regressions; they do not turn a simulated environment into a physical speaker.

## A chronology worth keeping honest

There is an important documentation detail in this story. The SpecAI verification closed criteria C1–C5 with runtime acceptance on September 19. PRs #19, #20, and finally #21 followed. That earlier acceptance therefore cannot be used as retrospective proof of the final architecture.

It would be tempting to tell a cleaner story: the feature was implemented, validated, and finished. The real history is more useful. A feature was accepted, problematic behavior appeared under specific conditions, a reasonable workaround was introduced, capture was improved, and then the overall model was simplified.

Commit [28819031](https://github.com/ArceApps/RadioHub/commit/28819031dcecf7de90fcc9d12842001e2786f9f0) integrates the final playback and recording solution. Shortly afterwards, release preparation and the [1.8.0 release commit](https://github.com/ArceApps/RadioHub/commit/d462039606dc40ffe8e7c092c0518799f40099b7) closed the period.

## What I am taking from this week

The first lesson is that audio delay is primarily a time problem. Storage is necessary, but storage alone does not define correctness. The implementation must decide what progress means to the renderer, what each layer's timestamp represents, and what happens while there is not yet enough history to produce delayed content.

The second lesson is that **the observation boundary matters**. Capturing “what I am about to send” and capturing “what was actually consumed” look almost equivalent until partial writes appear. Placing recording after the delay decision and at the effective consumption boundary removes an entire category of mismatches.

The third is to be suspicious of special branches when two modes should have identical semantics. Recording without delay already worked well. The better target was not an increasingly sophisticated delayed recorder; it was making delayed PCM enter the same reliable recorder.

The fourth is that a workaround can be valuable without becoming architecture. Increasing the timeout fixed a concrete failure and produced evidence. Removing it later was an improvement rather than a contradiction: once the sink maintained continuous progress, the exception was no longer necessary.

The fifth is documentary. Earlier validation should not be used to guarantee later code. A technical devlog becomes more useful when it preserves the actual sequence instead of smoothing the rough edges after the fact.

## Final state

By the end of the week, RadioHub had a more coherent model than it started with. A delay of up to sixty seconds no longer requires freezing sink progress. Preroll maintains the timeline with valid PCM silence. Once enough history exists, output switches to delayed PCM. Recording observes the bytes actually consumed by `AudioTrack`, retains fragments until they can form appropriate encoder input, and computes file time from accumulated samples.

Most importantly, direct and delayed playback are no longer separate worlds for recording.

That is exactly the kind of refactor I want to preserve in a devlog: not because the final solution is flashy, but because it ends up easier to explain than the problem it replaced. When an audio architecture can be summarized as “choose what should sound, capture what actually sounded, and count the samples you recorded,” there are fewer places left for a ghost echo to hide.

## The invariants are now explicit

One advantage of going through several iterations is that the system's invariants are now easier to state without relying on accidental implementation details.

**First: the renderer must always be able to make progress.** Selecting a sixty-second delay cannot turn sixty seconds of correct behavior into something indistinguishable from a stuck player. During preroll, valid PCM advances real time; afterwards historical PCM does. The signal changes, but continuity of the contract does not.

**Second: delay never allows recording to run ahead of output.** A block existing in memory does not mean it was played. Only the range confirmed as consumed can enter the recording. This single rule covers complete writes, partial writes, and retries.

**Third: changing delay is a state transition, not a conceptual player restart.** History must adapt without breaking guarantees around the buffer already being processed. That is why increasing and decreasing delay deserve tests just as much as a static sixty-second case.

**Fourth: a flush cuts assumptions about pending work.** Any design retaining references to older data must know which state survives and which must be discarded. Discontinuities create the same pressure: they are exactly where blindly using the renderer clock as the recording clock becomes fragile.

**Fifth: recording owns a sample-derived timeline.** If N samples have been encoded at a known sample rate, the file position has an objective answer. There is no need to reconstruct it from playback events that exist for different reasons.

These invariants are more useful than a class list. If an internal implementation changes later, they let me ask whether behavior remains correct without requiring the code to preserve today's exact shape.

## Why “make the buffer bigger” was not enough

When failures appear at thirty, forty-five, or sixty seconds, it is tempting to suspect capacity alone. A long delay obviously requires more PCM to be stored. The observed symptoms, however, were not merely signs of insufficient storage: Media3 detected missing progress, and delayed recording diverged from direct recording even though direct recording was already stable.

Increasing capacity can prevent an overflow; it cannot repair a temporal contract. It also cannot fix a capture boundary placed on the wrong side of a partial write. Keeping those problems separate prevented the circular buffer from becoming the universal suspect for every audio failure.

This is also why #19 and #21 operate at different levels. #19 changes how long Media3 tolerates a lack of progress. #21 makes progress exist. The latter removes the condition that required the former exception.

Audio engineering makes capacity, latency, and time easy to conflate because bitrate and PCM format connect them mathematically. They are still different dimensions. Memory answers how much history can be retained. Selected latency answers which point in that history should be heard. Progress answers whether the consumer continues satisfying its contract. Mixing them tends to produce patches that feel related simply because all three can be expressed in seconds.

## Testing the boundaries

The sixty-second case deserves a regression test not because sixty is magical, but because it is the edge of the product contract. If users can select it, the implementation should not treat it as an uncovered exception.

Partial writes are another boundary, this time at the API level. They may be invisible in many runs, but the architecture cannot assume every write consumes an entire buffer. Turning that documented possibility into a regression makes support for it deliberate rather than accidental.

Discontinuities form the temporal boundary. They force the implementation to answer which clock belongs to which artifact. The renderer may legitimately adjust position; the recording file still needs a continuous representation of the samples it actually contains.

Taken together, these tests suggest a reusable strategy: test the maximum product value, the non-atomic behavior allowed by the API, and the transitions that break continuity. Those are three places where a happy path often hides assumptions.

## From local fixes to a smaller architecture

The PR sequence also illustrates the difference between fixing a local symptom and reducing the state space.

Increasing a timeout fixes one symptom. Capturing a released delayed buffer before retries attempts to stabilize one route. Making the sink progress continuously and capturing only effective consumption removes states entirely: there is no longer a “valid minute with no progress,” and there is no longer a “special delayed recorder that must stay synchronized with output.”

Reducing states has a compounding effect. There are fewer combinations to test, fewer comments to preserve, and fewer opportunities for a future Media3 or recording change to repair direct mode while leaving delayed mode behind.

That does not mean duplication is always wrong or that one pipeline is automatically superior. It works here because the desired semantics are explicitly identical: the file should contain what the user hears, subject to the real recording state. When two modes share that definition, converging them at the same capture boundary removes differences that provide no product value.

Release 1.8.0 closed this stage with that idea much clearer than it was at the beginning. For me, that is the main technical outcome of the week: delay stopped being an exception leaking into both player and recorder behavior and became a focused signal transformation inside one common pipeline.

## References

- [RadioHub repository](https://github.com/ArceApps/RadioHub)
- [PR #19 — Fix long radio delay triggering Media3 stuck-player error](https://github.com/ArceApps/RadioHub/pull/19)
- [PR #20 — Stabilize recordings with radio delay enabled](https://github.com/ArceApps/RadioHub/pull/20)
- [PR #21 — Stabilize delayed playback and recording](https://github.com/ArceApps/RadioHub/pull/21)
- [PR #21 integration commit](https://github.com/ArceApps/RadioHub/commit/28819031dcecf7de90fcc9d12842001e2786f9f0)
- [RadioHub 1.8.0 release commit](https://github.com/ArceApps/RadioHub/commit/d462039606dc40ffe8e7c092c0518799f40099b7)
- [Android Developers — Media3 ExoPlayer](https://developer.android.com/media/media3/exoplayer)
- [Android Developers — AudioTrack](https://developer.android.com/reference/android/media/AudioTrack)
- [Android Developers — MediaCodec](https://developer.android.com/reference/android/media/MediaCodec)
