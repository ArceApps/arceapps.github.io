---
title: "Teaching mydevbot to program - GitHub Skills and Cron Tasks"
description: "The second phase of mydevbot. How to integrate the GitHub API using Gemini's Function Calling capabilities and set up scheduled tasks with APScheduler to receive daily summaries."
pubDate: 2026-03-06
tags: ["devlog", "telegram", "mydevbot", "gemini", "github", "cron", "python"]
heroImage: "/images/mydevbot-skills-cron-hero.svg"
reference_id: "0463727d-8058-4f3a-b565-1baec56b3470"
---

Yesterday I left the story at a sweet spot. I had **mydevbot** running in its brand new home: a Minisforum UM890 Pro Mini PC with ridiculous power consumption and plenty of power. The bot could reply to Telegram messages in milliseconds thanks to the use of the native Google Gemini SDK (specifically, Gemini 3.1). It was fast, efficient, and private.

But let's be honest: a bot that is only good for chatting, no matter how fast it is, is nothing more than a glorified ChatGPT with a different interface. For *mydevbot* to earn its name and truly revolutionize my workflow, I needed to give it hands. I needed it to be able to touch my repositories, read my code, manage my issues, and keep an eye on my infrastructure while I was busy with other things.

The objective of this second phase of development was twofold, and highly focused on pragmatism:
1.  **Deep integration with GitHub:** Achieve that the bot could manage entire repositories, create issues, and review Pull Requests, replicating features already offered by commercial tools like Clawbot, but without paying subscriptions or compromising code privacy.
2.  **Proactivity through Cron tasks:** That the bot stop being purely reactive. I wanted it to wake me up in the morning with a summary of pending issues, automating a boring part of project management.

This is the chronicle of how I assembled standard software pieces so that *mydevbot* went from being a conversational parrot to becoming a useful and practical management assistant.

### Implementing Skills: Function Calling with Gemini

In the world of Large Language Models (LLMs), "Function Calling" (or tool/skill invocation) is already a consolidated standard. There are thousands of examples on GitHub and the documentation from Google or OpenAI is very clear about it. Basically, instead of trying to trick the AI with complex prompts to return a JSON or a keyword, you give it an explicit instruction manual about what tools (Python functions) it has at its disposal.

The AI natively decides when it is appropriate to use a tool based on the user's request.

For *mydevbot*, this meant I could save a lot of programming time. I didn't have to write a complex `if/else` tree to parse whether the user said "create an issue" or "review this repo". I simply gave Gemini the tool and it handled the semantics.

The first step was to integrate the GitHub API. I used the **PyGithub** library, an excellent and robust wrapper for interacting with the GitHub REST v3 API in Python. The main challenge here was security. Under no circumstances was I going to hardcode my credentials directly into the code. I generated a **Personal Access Token (PAT)** on GitHub with strictly limited permissions (read repositories and write issues/PRs, but no permissions to delete repositories). This token would be loaded as a secure environment variable in the Docker container.

Once access was secured, I started defining *mydevbot*'s "Skills". The first and most obvious one: getting a summary of the repositories.

I defined the Python function using PyGithub:

```python
from github import Github
import os

def get_repo_summary(repo_name: str) -> str:
    """Gets a summary of the current state of a GitHub repository (stars, forks, open issues)."""
    try:
        g = Github(os.environ["GITHUB_PAT"])
        repo = g.get_repo(repo_name)

        summary = f"Repository: {repo.full_name}\n"
        summary += f"Description: {repo.description}\n"
        summary += f"Stars: {repo.stargazers_count}\n"
        summary += f"Open Issues: {repo.open_issues_count}\n"
        return summary
    except Exception as e:
        return f"Error accessing the repository: {str(e)}"
```

The magic happens in how you pass this function to the Gemini SDK. When you initialize the model, you tell it that this tool is available. The model reads the docstring (`"""Gets a summary..."""`) and the type annotations (`repo_name: str`) to understand how and when to use it.

The first test was a moment of pure nerd euphoria. I opened Telegram and wrote to *mydevbot*:
*"Hey, how is the ArceApps/PuzzleHub repository doing? Do we have a lot of pending work?"*

On the backend, I watched the server logs. The flow went like this:
1.  Gemini received my message.
2.  It analyzed my intent and determined that it needed to query GitHub data to answer me.
3.  Instead of generating a text response, Gemini returned a structured request: *"I want to execute the function `get_repo_summary` with the parameter `repo_name="ArceApps/PuzzleHub"`"*.
4.  My Python script intercepted this request, executed the actual function against the GitHub API, and got the text with the stars and issues.
5.  My script returned that data to Gemini.
6.  Finally, Gemini analyzed that data and drafted the natural response for Telegram: *"I just checked the ArceApps/PuzzleHub repository. It currently has 3 open issues pending review. Do you want me to list the titles of those issues for you?"*

It worked! The bot was using tools autonomously. And the natural response (the fact that it asked me if I wanted to list the titles) proved that it maintained context and reasoned about the data obtained; it wasn't a simple database dump.

### Expanding the Arsenal: From Reading to Writing

Reading data is fine, but the real power lies in acting. The next phase was to endow *mydevbot* with the ability to actively interact with my projects. Writing code, creating issues, commenting on PRs.

I created a complete suite of tools for GitHub. Some of the most useful ones I implemented that same afternoon were:

*   `create_github_issue(repo_name: str, title: str, body: str, labels: list)`: To report bugs on the fly. If I'm testing one of my apps on my phone and I find a UI error, I no longer have to open my laptop. I simply go to Telegram and tell mydevbot: *"Create an issue in the web repo indicating that the contact button in dark mode doesn't have enough contrast. Label it as bug and ui"*. The bot extracts the parameters perfectly and creates the ticket.
*   `get_latest_pr_diff(repo_name: str)`: This was one of my favorites. It allows the bot to read the diff (the code changes) of the latest open Pull Request. And since Gemini has a huge context window (especially the 3.1 Pro version, although 3.1 also works very well for medium diffs), it can analyze that code and look for bugs.
*   `comment_on_pr(repo_name: str, pr_number: int, comment: str)`: The logical complement to the previous one. After the bot reads the diff, it can post a comment directly on GitHub.

I remember the first time I tested the full flow. I had pushed a small patch from my laptop, but I wasn't sure if I had introduced a possible concurrency issue. I went to the couch, opened Telegram, and asked mydevbot to review the PR.

The bot queried the API, downloaded the diff, analyzed it (using its inherent programming knowledge), and replied to me: *"I have reviewed PR #42. The code seems solid overall, but in the `worker.py` file you are using a dictionary shared between threads without a lock. This could cause race conditions. Do you want me to leave this comment on the PR for you?"*.

I replied with a simple *"Yes, please, and add that I will review it tomorrow"*. Seconds later, my phone vibrated with a notification from the official GitHub app: *mydevbot* had commented on my PR exactly what I had asked, drafted in a professional tone.

The level of friction for managing my projects had been reduced to almost zero. I could do review tasks, planning, and bug triage while walking down the street, using only my voice (through Telegram voice messages, which we also integrated using Whisper, but that's another story) and my personal bot.

### The Need for Proactivity: The Problem with Being Reactive

Up to this point, *mydevbot* was a formidable tool, but it was still reactive. It only did things when I spoke to it. And one of the fundamental problems of managing personal infrastructure or side projects is forgetting.

If I don't remember to ask the bot how the repositories are doing, issues pile up. If I don't ask it about the server status, a hard drive can silently fill up until it causes a catastrophic failure. A real assistant doesn't wait for you to ask if the house is on fire; it warns you as soon as it smells smoke.

I needed to implement background tasks. I needed **Cron**.

In the traditional Linux environment, setting up repetitive tasks is done with the cron daemon (editing `crontab`). It's reliable, rock-solid, but it's an operating system component. If I configured cron on the Mini PC at the system level to call Python scripts, I would be breaking the encapsulation of my Docker environment. Furthermore, I would lose the seamless integration with the bot's persistent instance and the Gemini SDK.

I wanted the scheduled tasks to live inside the same *mydevbot* code, sharing the same memory context, the same Telegram session, and the same GitHub tools. The answer was obvious to any Python developer: **APScheduler** (Advanced Python Scheduler).

APScheduler is a fantastic library that allows you to schedule Python jobs similarly to cron, but integrated directly into your application. It is lightweight, requires no external processes, and integrates beautifully with asynchronous applications like `python-telegram-bot`.

### Implementing APScheduler: The Morning Briefing

The integration was surprisingly simple. I added the dependency to my `requirements.txt` and modified the main bot script.

The inaugural goal for the cron system was to create the **Morning Briefing**. I wanted *mydevbot* to send me a structured message every day at 08:30 in the morning, Monday through Friday, with a summary of everything I needed to know to start the day.

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

async def morning_briefing(context: ContextTypes.DEFAULT_TYPE):
    chat_id = os.environ["MY_TELEGRAM_CHAT_ID"]

    # Gather data (using the previously created functions)
    repo_status = get_repo_summary("ArceApps/PuzzleHub")

    # Ask Gemini to format the summary directly and sarcastically
    prompt = f"Start with a generic and ridiculous motivational phrase, the kind that induces second-hand embarrassment. " \
             f"Then interrupt yourself, realize how absurd it sounds, and give me the status of the " \
             f"repository like a direct, sarcastic coworker: {repo_status}. Absolutely no 'boss' titles."

    response = chat_session.send_message(prompt)

    # Send the message via Telegram proactively
    await context.bot.send_message(chat_id=chat_id, text=response.text)

# On bot initialization:
scheduler = AsyncIOScheduler()
scheduler.add_job(
    morning_briefing,
    trigger=CronTrigger(day_of_week='mon-fri', hour=8, minute=30),
    args=[application] # Pass the Telegram app instance
)
scheduler.start()
```

That code is the foundation of proactivity. The `CronTrigger` block allows for incredible flexibility. I could schedule tasks to run every hour, on the first Sunday of every month, or complex combinations.

The morning after implementing this was... revealing. I was having my first coffee of the day, mentally preparing for the workday, when my phone vibrated at exactly 08:30. It was the first scheduled message from *mydevbot*:

*"Remember that every sunrise is a new opportunity for your dreams to compile without errors! The universe is conspiring in your favor to... Ugh, I disgust myself sometimes. Let's forget that cheap life coach garbage.*

*Let's get straight to it, because code doesn't write itself. Over in ArceApps/PuzzleHub, you have 3 open issues giving you the side-eye and 1 Pull Request that's been gathering dust all night, waiting for you to merge it. Get to work."*

I laughed out loud. That was exactly the tone I needed. No artificial servility, no toxic positivity, but a coworker in the trenches handing me unfiltered, direct information at the precise moment I needed it.

From there, the possibilities for APScheduler "jobs" exploded in my head. I started adding more cron tasks to *mydevbot*'s arsenal:

*   **Server health monitor (Every 6 hours):** A simple script that reads the CPU, RAM, and disk usage of the Mini PC. If any of these values exceed 90%, the bot sends me an urgent alert (using red/bold text formatting) on Telegram warning me of the bottleneck.
*   **Docker container cleanup (Sundays at 3:00 AM):** A script that runs a `docker system prune -f` to free up space, and then sends me a message confirming the megabytes freed.
*   **Stand-up reminders (Mondays at 10:00 AM):** A quick ping asking me what my weekly goals are for the devlog project, forcing me to write them down and, therefore, commit to them.

### Reflection: The Qualitative Leap

Going from a reactive conversational bot to a proactive assistant integrated with the API of my main tools was a massive qualitative leap. It was no longer just a fun proof of concept. It was a real productivity tool, hosted on my own hardware (the heroic UM890 Pro), with no recurring monthly subscriptions and total privacy for my data.

I had solved the initial problem. I could now manage my repositories from the subway without getting frustrated with mobile web interfaces. I could find out about server issues before users complained. I had achieved my goal.

But, as any developer knows, a project is never really finished. Once you solve the main problem, you start seeing new opportunities. The environment was perfect, the codebase was solid, and the modular architecture invited me to dream big.

If I could create issues from my phone, why not be able to write complex code? If I had a free OCuLink port on the Mini PC, why limit myself to the cloud API if I could connect a dedicated desktop graphics card and run huge models locally? And if the manual configuration of Python code became tedious for very complex flows, what visual tools could I integrate?

These ambitions would mark the third and final phase of this stage of development. A phase focused on continuous evolution, on the automation of the bot's own code (CI/CD), and on the exploration of the most cutting-edge technologies (eGPUs, automation tools like n8n, and Anthropic's new MCP standard). All this, along with the irony of how *mydevbot* updates itself, will be the story that closes this trilogy tomorrow.

### Scalability and the Immediate Future of Skills

Before concluding this entry, I think it is essential to reflect on what this Skills and Cron-based architecture really means for the future of my daily work. We have gone from a simple script that answers messages to a personal operating system distributed in the cloud, but firmly anchored in the hardware of my home.

The modularity of the Python functions, exposed through the Gemini SDK, means that the limit of what *mydevbot* can do is defined solely by the APIs I decide to integrate. If tomorrow I want the bot to manage my personal finances, I only have to create a `finance_skills.py` file, integrate my bank's API, add the corresponding description in the docstring, and restart the container. Gemini will immediately understand its new purpose and its new capabilities.

This organic extensibility is any software developer's wet dream. There is no need to rewrite the user interface, no need to design new menus or buttons in Telegram. The interface is natural language, and natural language is universal.

Furthermore, the use of APScheduler has transformed my relationship with information. I am no longer the one chasing the data for my projects; the data comes to me when it is relevant. The morning summary is just the beginning. I imagine a near future where *mydevbot* not only informs me of problems but, using its GitHub Skills, proposes and executes automated solutions (like self-assigning trivial PRs, approving minor dependency changes, or even restarting unresponsive servers), notifying me only when the task has been successfully completed.

The real challenge now is not technical, but conceptual. How much autonomy am I willing to give to this system? To what extent do I want an AI to manage my repositories without my direct supervision? These are fascinating questions that I will be answering as the project matures. For now, I have built the perfect foundations. Tomorrow we will explore how to scale this infrastructure and prepare it for the future.
