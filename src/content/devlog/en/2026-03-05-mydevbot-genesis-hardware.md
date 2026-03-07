---
title: "The birth of mydevbot and the odyssey of the perfect hardware"
description: "How the need to control my development ecosystem from Telegram arises, the analysis of the AIPAL repository, the disappointment with the Synology DS212+ and the final decision for a Mini PC with the native Gemini SDK."
pubDate: 2026-03-05
tags: ["devlog", "telegram", "mydevbot", "gemini", "hardware", "minipc", "docker"]
heroImage: "/images/mydevbot-hardware-hero.svg"
reference_id: "a2e2f3d0-729b-4fcb-ae9c-5c9c95977d00"
---

Sometimes, the most useful solutions do not come from having a revolutionary, original idea, but from applying existing concepts to solve daily frustrations. It was a Thursday afternoon, I was on public transport coming home, and I remembered that I hadn't reviewed a Pull Request in one of my personal repositories. I took out my phone, opened the browser, entered GitHub and suffered the typical mobile experience: zooming in, trying to press the right button, dealing with the intermittent subway connection...

I am not the first nor the last developer to think: *"There has to be an easier way to manage this from a mobile phone"*. The internet is full of tutorials and tools to connect messaging apps with APIs and LLMs. This is not a technological novelty. Recent commercial tools like **Clawbot** (or Clawdbot) have massively popularized the idea of interacting with your repositories and infrastructure through a chat.

My goal was not to invent the wheel, but to save myself a lot of daily management work. Telegram is fast, lightweight, works perfectly with terrible coverage, and has a fantastic API. I wanted my own assistant there, powered by Artificial Intelligence, but with a crucial nuance: I wanted it to be a private, sovereign, and self-hosted solution. That is how **mydevbot** was born.

In this first entry, I will recount the first steps of this integration and automation project, starting with the choice of hardware. Because, although I evaluated excellent commercial options like Clawbot, I decided to discard them in favor of something "homemade" to maintain absolute control over my private repositories.

### The Starting Point: Exploring the Existing Ecosystem and Inspiration

As I mentioned, the concept of a smart bot is not new. During my research to set up my own version, I came across a repository again that has always seemed like a fantastic reference to me: [AIPAL](https://github.com/antoniolg/aipal), created by antoniolg.

AIPAL proposes using Telegram as a bridge to interact with a local AI. The premise is fantastic: you maintain privacy, use your own resources, and have a universal chat interface. I cloned it, configured it, and it worked. It was magical to be able to send a message from the street and have my PC at home process the request and return the AI's response. The bot acted as a perfect bridge. I didn't need to open ports on my router or deal with complex NAT configurations, since the Telegram library uses *long polling*. The bot simply asks Telegram's servers periodically if there are new messages.

However, after the initial euphoria, the limitations became evident. AIPAL and similar solutions have a fundamental Achilles heel for my use case: they require the equipment where they are running to be turned on and connected to the Internet permanently. In my case, that meant leaving my main computer (a powerful, noisy tower with significant energy consumption) turned on 24/7.

Leaving a 600W machine turned on all day just to keep a Telegram bot alive that receives a few dozen messages a day is inefficient from any point of view. Economically it is a waste on the electricity bill, and ecologically it is irresponsible. Furthermore, the noise of the fans in the silence of the night was a constant annoyance. I needed another solution. The concept of AIPAL validated my hypothesis that Telegram was the perfect interface, but it forced me to completely rethink the hardware.

### The Illusion of the Synology DS212+ and the Clash with Reality

Thinking about low-power hardware that I already had at home, my gaze settled on a corner of my shelf where an old but loyal NAS server was gathering dust: the **Synology DS212+**. It is a classic model, released in 2012. In its golden age, it was a marvel for network storage, and best of all: it consumes very little. We are talking about 15-20W at peak performance and just a few watts at rest. It seemed like the ideal candidate.

The idea was brilliant: run the bot on the NAS. The NAS is already always on, managing my backups and my media files. What does it matter to add a small Python script to manage *mydevbot*?

I connected via SSH to the old DS212+. The terminal welcomed me with that familiar, spartan, stripped-down Linux prompt. I started reviewing the specifications and possibilities. And this is where my dreams violently crashed against the wall of technological obsolescence.

The first major problem: the processor. The DS212+ has an old 32-bit ARM processor. The RAM memory is barely 512 MB. This, in the year 2026, is the technological equivalent of trying to cross the ocean in a nutshell. But the real nail in the coffin was the **lack of support for Docker**.

In the Synology family, only the more recent "+" series models with x86_64 processors (Intel or AMD) have official and functional support for Docker (or Container Manager, as they call it now). For J or Play series models, and certainly for a 2012 model, Docker is an impossible dream.

Why is Docker so critical? You could just install Python, you might say. And yes, it is possible to install Python 3 on the DS212+ through the package center or using community repositories like Entware. But developing, deploying, and maintaining a modern application in such a hostile and fragile environment is a recipe for disaster. Managing virtualized dependencies, compiling C libraries that the AI ecosystem often requires, and dealing with a proprietary operating system (DSM) that is not meant to be a general-purpose application server... was not the way to go.

I imagined the workflow: writing the code on my laptop, passing it via SCP to the NAS, crossing my fingers that the pip dependencies would install correctly on that old ARMv5 architecture, and using the NAS task scheduler to restart the script if it failed. It was going back to the deployment practices of fifteen years ago. The friction would be so high that I would end up abandoning the project.

The Synology DS212+ was ruled out. It remains an excellent guardian of my historical files, but to host *mydevbot*, I needed something modern, efficient, and versatile.

### The Mini PC Revolution: The Perfect Balance

Having ruled out the main PC due to consumption and the NAS due to obsolescence, I evaluated cloud server alternatives. A free Oracle VPS or a small AWS EC2 instance. But here my principles of **technological sovereignty** came into play. If this bot was going to have access to all my private repositories, my tasks, my calendar, and if it was going to be my "extended brain", I didn't want it to be hosted on the infrastructure of a tech giant, subject to changes in terms of service, regional outages, or data inspections. I wanted the iron in my house. Physically under my control.

This led me to the fascinating and competitive world of modern Mini PCs. In recent years, the Mini PC market has exploded, driven by advances in laptop processors that offer spectacular performance with ridiculously low consumption.

I spent days researching, watching benchmarks, and comparing options. The balance quickly tipped towards platforms based on AMD Ryzen. My finalists were three specific models that marked the sweet spot between price, power, efficiency, and crucially, future connectivity.

The undisputed king of my options was the **Minisforum UM890 Pro**. With a Ryzen 9 8945HS processor (Hawk Point architecture with integrated NPU for AI tasks), 32GB of DDR5 RAM, and plenty of connectivity. This beast is the equivalent of a top-tier laptop compressed into a box the size of a small book. Its idle power consumption is around 10-15W, and at peak performance, it doesn't exceed 65W. It was the homelabber's wet dream. However, its price was around €800. A significant investment.

As cheaper alternatives, around €500, there were the **Minisforum UM780 XTX** and the **GMKtec K8**. Both mount the excellent Ryzen 7 7840HS. A step behind the 8945HS, but with more than enough power to be the brain of my digital home, run dozens of Docker containers without breaking a sweat, and handle the bot with ease.

What made these models stand out above other cheaper options (like the typical Intel N100s) was a key feature that weighed heavily on my long-term decision: the **OCuLink port**.

Although *mydevbot* would initially communicate with the Gemini cloud API, my vision for the future is to have the ability to run complex LLMs (deep reasoning models) 100% locally. For that, you need graphics power (VRAM). Integrated graphics (the Radeon 780M on these Ryzens) are surprisingly good, but they can't compete with a dedicated GPU.

The OCuLink (Optical-Copper Link) port is a direct PCIe x4 connection. It is much more efficient than Thunderbolt 4/5 for connecting an external graphics card (eGPU). With an OCuLink eGPU dock, I could connect a desktop graphics card (like a hypothetical RTX 5070 or 5080) directly to the Mini PC in the future. The performance loss compared to plugging it into a traditional motherboard is barely 5-10%. That is to say, the Mini PC gave me the low consumption of a laptop for daily use, with the ability to transform into an AI processing monster when I needed it, simply by plugging in a cable.

Finally, I decided to purchase the Minisforum UM890 Pro. I wanted that extra power from the integrated NPU and the peace of mind of having top-tier hardware for the next five years. I received it at home, installed Ubuntu Server 26.04 LTS on it, and configured the base environment with Docker and Docker Compose. Seeing the system boot up in seconds and consume barely 11 watts confirmed that I had made the right decision. I now had the perfect home for *mydevbot*.

### The Software Architecture: Gemini CLI or Native SDK?

With the hardware ready (the UM890 Pro purring silently on a living room shelf), it was time to define the software stack. I knew I would use Python. I knew I would use the `python-telegram-bot` library to handle the long-polling communication with Telegram's servers. But the central piece was the brain of the AI.

Initially, I evaluated using the official **Gemini CLI** tool. It is a fantastic tool for bash scripts and quick automations. I could have the Python script launch a subprocess (`subprocess.run`), execute the Gemini CLI command passing it the user's message, capture the standard output, and send it back via Telegram.

I did a proof of concept. It worked. But it was clunky.

The CLI-based approach has several serious problems when you try to build a persistent conversational bot:

1. **Context and state management:** Every call to the CLI is, by default, stateless. To maintain a fluid conversation, I would have to save the conversation history in a temporary file, pass the whole thing to the CLI on every call, and parse the response. A nightmare of inefficiency.
2. **Latency (Startup overhead):** No matter how fast it is to invoke a binary, launching a new operating system subprocess for every message adds latency. I wanted *mydevbot* to be instantaneous, agile.
3. **Blind error handling:** Capturing errors by analyzing the output text of a terminal command (stderr) is fragile. If the API changes its error format, the bot breaks silently.
4. **Loss of advanced features:** Features like "Function Calling" (where the AI decides to execute an external tool, like querying the GitHub API) are tremendously complex to implement by parsing text from a CLI.

The decision was obvious: I had to use the **official Google GenAI SDK for Python** (`google-genai`).

By integrating the SDK directly into my bot's code, I gained absolute control. I could initialize an instance of the **Gemini 1.5 Flash** model (I chose Flash for its extreme speed and extremely low cost/free tier, ideal for a quick assistant). The SDK allows managing chat sessions with persistent state. I just have to instantiate a `ChatSession` object, pass it the user's new message, and the SDK takes care of sending all the previous context to the API and returning the response.

The code was simplified enormously:

```python
import google.generativeai as genai

# Initial setup
genai.configure(api_key=os.environ["GEMINI_API_KEY"])
model = genai.GenerativeModel('gemini-1.5-flash')
chat_session = model.start_chat(history=[])

def handle_message(update, context):
    user_text = update.message.text
    # Send to the model, maintaining context
    response = chat_session.send_message(user_text)
    # Reply on Telegram
    update.message.reply_text(response.text)
```

That simplicity is power. With the native SDK, responses arrive in milliseconds. Exception handling (exceeded quotas, network errors) is managed elegantly with `try-catch` blocks. And most importantly, it opened the doors wide to Gemini's tools (Tools/Skills), which would allow me to integrate GitHub natively. But I will talk about that in the next article.

### Conclusion of this first phase: The birth of mydevbot

That same Sunday night, after hours of configuring the server and writing the basic structure of the bot in Python, the moment of truth arrived. I packaged the code into a Docker container using a simple `Dockerfile`, created a `docker-compose.yml` to manage the environment variables (the Telegram Token and the Gemini API Key, safe and protected), and executed the magic command:

`docker compose up -d`

The container started. I checked the logs: `[INFO] Bot started. Polling Telegram servers...`

I turned off my phone's Wi-Fi, connecting to the 5G network to simulate being away from home. I opened Telegram, searched for `@my_private_dev_bot` and wrote the inaugural message:

`"Hello, are you there? Tell me what hardware is running you."`

Half a second passed. The Telegram double check turned blue. And the answer appeared on my screen:

`"Hello! I'm online and ready. Analyzing my environment... I am running inside a Linux container (probably Docker). And judging by the number of cores I see in /proc/cpuinfo, I am running on an 8-core, 16-thread monster. How can I help you boss?"`

I couldn't help but smile. **mydevbot** was born. I no longer depended on my noisy desktop PC being turned on. I had a low-power, powerful, dedicated server, and a clean, native software architecture.

The bridge between my mobile phone anywhere in the world and my development ecosystem was built. But a bridge is not useful if it doesn't lead anywhere. The bot could chat, but it couldn't *work* yet.

The next step, the real challenge that would change the way I work, was to endow it with real skills. Teach it to interact with the GitHub API so it could read my repositories, create issues, and manage my tasks. And, of course, implement a cron task system so the bot would proactively inform me, instead of waiting for my orders.

All of that will be the main topic of the next entry in this devlog. The real revolution of *mydevbot* has just begun. See you tomorrow.

*(Continues in: Teaching mydevbot to program - GitHub Skills and Cron Tasks)*
