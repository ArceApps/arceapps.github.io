---
title: "The maturity of mydevbot - CI/CD, eGPUs and the future of mobile development"
description: "The final phase. How mydevbot deploys itself using GitHub Actions and Watchtower, mobile programming with VS Code Server and the preparation of the UM890 Pro for extreme local AI via OCuLink."
pubDate: 2026-03-07
tags: ["devlog", "telegram", "mydevbot", "cicd", "oculink", "egpu", "vscode", "n8n"]
heroImage: "/images/mydevbot-cicd-future-hero.svg"
reference_id: "83523401-9392-426f-b039-f3ae73132d40"
---

We have reached the last entry of this trilogy about **mydevbot**. If in the [first article](2026-03-05-mydevbot-genesis-hardware) I talked about the odyssey to find the perfect hardware (the Minisforum UM890 Pro) and in the [second](2026-03-06-mydevbot-github-cron-skills) I detailed how I taught it to use the GitHub API and wake me up with daily summaries, today it's time to talk about scalability, automation, and the real development experience.

Because here is a fascinating paradox: I have built a Telegram bot to manage my software development while I am away from home... but what happens when I want to develop or improve *the bot itself* while I am away from home?

If I am in a coffee shop, without my laptop, and suddenly I come up with a great new *Skill* for mydevbot to format my code using *black*, how do I implement it? I can't send a voice message to the bot telling it to "modify your own source code", because that would be a monumental security risk (as well as technically suicidal with the current version).

I needed to close the circle. I needed the Mini PC hosting mydevbot to become not just an execution server, but my complete remote development environment.

### The Mobile Development Environment: VS Code Server

Writing code on a 6-inch mobile screen is a pain, I admit it. But in the year 2026, modern smartphones (like my Pixel) have fantastic desktop modes when you connect them to an external monitor or even lightweight mixed reality glasses. Even without accessories, with a good foldable Bluetooth keyboard, you can manage very well.

The historical problem has always been the environment. Setting up Git, Python, dependencies, and a decent editor on Android (using Termux, for example) is feasible but clunky.

The solution was already on the Mini PC itself. The UM890 Pro, with its 32GB of RAM, was barely sweating with the *mydevbot* container. I decided to install **VS Code Server**.

For those who don't know it, VS Code Server allows you to run the Visual Studio Code backend on your remote server and access the full, native user interface through any web browser.

I added a new container to my `docker-compose.yml` on the Mini PC: an official `code-server` container from *linuxserver.io*. I configured it to map the folder where the *mydevbot* code lives as a working volume.

To access it securely from outside my home without opening ports to the world (and exposing myself to brute force attacks), I used **Tailscale**. I installed the Tailscale client on the Mini PC and on my mobile phone. Thus, my phone was part of an encrypted mesh virtual private network (VPN) with the Mini PC.

Now, the flow is pure science fiction:
1.  I am on the train.
2.  I turn on the Bluetooth keyboard.
3.  I open my mobile browser (Brave) and type the Tailscale IP of my Mini PC (e.g., `http://100.80.x.x:8443`).
4.  The full VS Code editor appears, with my themes, my keyboard shortcuts, and direct access to the *mydevbot* code.

I can write a new Python function in the browser editor, save it, and immediately test it by running the script in the integrated browser terminal.

But here a problem arises. If I change the code, I need to restart the *mydevbot* Docker container for it to pick up the changes. And worse, those changes are "loose" on the server; I need to commit and push them to GitHub so as not to lose version control.

I could do it by hand from the VS Code Server terminal, but if I have built an automated ecosystem, I wanted my bot's deployment to be automatic as well.

### CI/CD for a Home Bot: Watchtower to the Rescue

I wanted to get to a point where I simply did `git push` (whether from the VS Code Server on my phone or from my laptop at home) and the Mini PC would update itself. A full-fledged Continuous Integration / Continuous Deployment (CI/CD) pipeline, but for my homelab.

Traditionally, in enterprise environments, a GitHub Action would connect via SSH to my server and execute an update script. Or I would use tools like ArgoCD. But those options are complex to maintain in a home environment where my public IP might change (even using Tailscale).

The most elegant answer for Docker containers is **Watchtower**.

Watchtower is a container whose sole job is to watch other containers. Periodically (for example, every 5 minutes), Watchtower queries the image registry (Docker Hub, or GitHub Container Registry) to see if there is a newer version of the image of a currently running container. If it finds a new image, Watchtower gracefully stops the old container, downloads the new image, and starts it using exactly the same environment variables and volumes (`docker-compose` settings) as the original container.

The full pipeline was set up like this:

1.  **Development:** I modify the `mydevbot` code in the browser (via VS Code Server) or locally.
2.  **Commit and Push:** I do `git commit -m "New finance skill"` and `git push`.
3.  **GitHub Actions (CI):** On GitHub, an Action detects the push. It runs a Python linter (flake8), passes the basic unit tests I wrote, and if everything is green, it builds a new Docker image and pushes it to the GitHub Container Registry (GHCR) tagged as `latest`.
4.  **Watchtower (CD):** On my Mini PC, Watchtower, which is running in the background, detects that there is a new `latest` image in the GHCR.
5.  **Automatic Restart:** Watchtower kills the old *mydevbot* process, downloads the new image, and starts it.

All this happens in about 3 minutes on the clock. I push from my phone, take a sip of coffee, and when I return to Telegram, I ask *mydevbot* what version it is running, and it answers with the new commit hash.

It's the magic of DevOps applied to my personal life. There is no more friction. If the bot fails, I fix it, push it, and forget about it.

### The Horizon of Local AI: The OCuLink Port and eGPUs

At this point, the software architecture was solid. But I want to talk about hardware again. About that OCuLink port I mentioned in the first article and which was the decisive factor for buying the Minisforum UM890 Pro instead of cheaper alternatives.

Currently, *mydevbot* uses the Gemini 3.1 Flash-Lite API. It is fast, it is almost free, and it is brilliant for programming. But it is still "The Cloud". If tomorrow I lose internet access (and the fiber optic network in my area has occasional outages), or if Google decides to radically change its API pricing, my automated brain will stop working.

The true sovereignty I spoke of at the beginning is only achieved when the Language Model runs physically in your home.

For simple tasks, the Ryzen 9 8945HS of the Mini PC (with its CPU and its NPU) can run small local models (like a Llama 3 8B or a Phi-3) at an acceptable speed using tools like **Ollama**. But if I want a model that can read my entire code repositories and perform complex reasoning about the software architecture, I need larger models (from 30B to 70B parameters).

And those models devour VRAM (Video Memory).

This is where the OCuLink port comes into play. The plan for Q3 2026 is to acquire an eGPU (External GPU) dock that connects via OCuLink. These docks are essentially a bare PCIe slot with a power supply.

My goal is to connect a dedicated desktop graphics card, like an **RTX 5070 Ti** or even an **RTX 5080** (when they drop in price on the second-hand market or there are sales), directly to the Mini PC.

Unlike Thunderbolt 4 or 5, which introduce latency and bottlenecks due to their data encapsulation, OCuLink is pure PCIe. The performance loss is marginal (between 5% and 10%).

With a 16GB or 24GB VRAM graphics card connected to my low-power Mini PC, *mydevbot*'s architecture will evolve dramatically:
1.  On a day-to-day basis, the Mini PC will run autonomously with its 15W base consumption, managing the code, the cron jobs, and using small models or the cloud.
2.  When I need *mydevbot* to do heavy lifting (like a massive automatic refactor, or complex vulnerability analysis), I will remotely turn on the eGPU power supply.
3.  The bot will detect the presence of the graphics card and switch its inference backend from the Gemini API to a local Ollama/vLLM server running on the eGPU.

This hybridization (low power by default, extreme power on demand) is the future of home servers and personal AI agents.

### Beyond Python: Exploring n8n and MCP

Manually building Skills in Python is fun and gives you total control. But let's admit it: sometimes you want to connect two services without having to write 50 lines of code and handle HTTP API exceptions.

During the last few weeks of *mydevbot* development, I have encountered use cases where writing code seemed like overkill. For example, I wanted that if a billing email arrived at a specific Gmail account, the bot would notify me via Telegram and save it in a Google Drive folder.

I could write a Python Skill for Gmail and Drive. But it's tedious.

To solve this, I have started to integrate **n8n** into my Mini PC cluster.
n8n is a visual workflow automation tool (similar to Zapier or Make, but open-source and self-hostable). It allows you to connect hundreds of applications by dragging and dropping nodes in a graphical interface.

What's fascinating is that n8n doesn't replace *mydevbot*; it complements it. I have configured Webhooks in n8n that *mydevbot* can call as if they were Skills.
Thus, if I tell the bot *"Hey, save this receipt in my invoices Drive"*, the bot invokes the `trigger_n8n_workflow_invoice` Skill, passes it the file, and n8n visually takes care of uploading it to Drive, renaming it, and classifying it. This separation of responsibilities (the AI manages the intention and language, n8n manages the plumbing of the APIs) is extremely efficient.

Finally, the most promising horizon on the software level is the **Model Context Protocol (MCP)**, the standard promoted by Anthropic.
Instead of me having to program each GitHub Skill by hand (writing PyGithub code), MCP proposes an architecture where applications (like GitHub, Notion, or local databases) expose MCP servers.

The AI model simply connects to those MCP servers in a standard way and automatically "discovers" what tools it has available and how to use them.
When Gemini (or local models like Claude/Llama) universally adopt MCP, the amount of "glue" code I'll have to write for *mydevbot* will be reduced by 90%. The bot will simply be the orchestrator (the brain) that connects to the different sensory organs and actuators of the system.

### Epilogue: The End of Desktop PC Tyranny

It has been an intense journey from that frustration on public transport to the sophisticated network of containers, AIs, and integrations that I have at home today.

The most important lesson I have learned is that personal infrastructure must adapt to our way of life, not the other way around. It makes no sense to be chained to a noisy, power-hungry tower to develop software in the year 2026.

With a Minisforum UM890 Pro, Tailscale, VS Code Server, and a super-smart Telegram bot powered by Gemini, I have decoupled *where* I am from *what* I can do.

*mydevbot* welcomes me every morning with a summary of my obligations, watches my servers while I sleep, reviews the code I write from my phone, and deploys itself silently when it detects improvements.

I am no longer a solo developer. I have an operations team working for me 24/7. And it only cost me a little research, some compact hardware, and a fun weekend coding in Python.

The future of development is mobile, assisted, private, and extremely powerful. And thanks to projects like this, that future is already buzzing quietly on a shelf in my living room.

### Real Productivity Impact and Final Thoughts

Looking back at the moment I conceived the idea for *mydevbot* on that crowded subway car, I realize that the real impact of this project goes far beyond mere technical convenience. It's not just about being able to run a `git push` from a mobile phone, or receiving an automated message every morning at 8:30. It's about a fundamental transformation in how I interact with my own projects and my cognitive workload.

Before *mydevbot* arrived, maintaining my personal repositories and home server infrastructure was often a chore. It required a severe mental context switch. I had to physically sit down at the desktop computer, turn on the monitors, open the browser, navigate through multiple GitHub tabs, review Docker container logs via SSH, and finally try to remember exactly what I wanted to do hours ago. That friction-filled process often resulted in procrastination. Issues piled up, dependency updates were postponed, and small UI bugs went unresolved for weeks, simply because "it wasn't worth turning on the PC just to fix a CSS padding."

Today, the story is completely different. *mydevbot* has democratized access to my own development ecosystem, reducing friction to zero. When I spot a small visual bug while testing an app on my phone, I don't make a mental note that I will inevitably forget. I open Telegram, send a quick voice message to my bot explaining the problem, and within seconds, the AI has interpreted my words, interacted with the GitHub API, and created a perfectly formatted, tagged, and assigned issue. The task leaves my head immediately and enters the tracking system in a structured, actionable way.

But the real magic lies in the proactivity driven by cron jobs and APScheduler. The fact that the system informs me, instead of me having to interrogate the system, completely changes the dynamic of responsibility. If a hard drive on my server reaches 90% capacity, *mydevbot* immediately alerts me on Telegram with a priority message. If a critical process fails overnight, I wake up to a detailed summary of the error and often an AI-generated suggestion on how to fix it. I no longer suffer from the anxiety of "is everything running correctly?" I trust that my digital assistant is watching and will let me know if my attention is truly needed.

Furthermore, the integration of VS Code Server and Tailscale has turned any device with a web browser into a powerful software engineering workstation. I have fixed critical bugs, reviewed and merged complex Pull Requests, and even deployed new app versions from a dentist's waiting room, using only a foldable Bluetooth keyboard and my smartphone screen. The feeling of freedom and absolute control over my infrastructure is intoxicating.

Looking to the future, the roadmap for *mydevbot* is as ambitious as it is exciting. The impending integration of an eGPU via the Minisforum UM890 Pro's OCuLink port will open the doors to running massive language models locally, ensuring absolute privacy and freeing me from reliance on cloud APIs. Adopting n8n for visual automation of complex workflows will drastically reduce the amount of custom code I need to write, allowing the bot to interact with hundreds of external services with just a few clicks. And the arrival of the Model Context Protocol (MCP) will standardize how AIs discover and use tools, making *mydevbot* a universal orchestrator capable of handling any task I throw at it.

Ultimately, *mydevbot* does not aim to be a revolutionary commercial product competing with giants like Clawbot. I haven't invented anything new here; I have simply connected existing services (Telegram, Gemini, Docker, GitHub) using glue code in Python. However, the real value lies in the fact that it is tailor-made for my needs, it does not cost me extra money per month, and it keeps my private data under my control.

This trilogy is a demonstration of how, with current tools and a bit of ingenuity, any developer can automate the boring parts of their workflow. The era of development where everything is manual friction can end, and having a Telegram bot watching your repositories while you sleep is not magic, it is simply practical sense.
