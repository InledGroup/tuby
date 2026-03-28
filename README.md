# 📺 Youtuby - Easy & Secure Youtube Video & Audio Downloader

![Beta Badge](https://img.shields.io/badge/status-BETA-orange?style=for-the-badge)
![Docker Badge](https://img.shields.io/badge/docker-%232496ED.svg?style=for-the-badge&logo=docker&logoColor=white)
![Astro Badge](https://img.shields.io/badge/astro-%23BC52EE.svg?style=for-the-badge&logo=astro&logoColor=white)

**Youtuby** is a high-performance, aesthetically pleasing YouTube downloader built with **Astro**, **Express**, and **yt-dlp**. It runs in an isolated Docker container, ensuring a secure and clean environment for your media downloads.

---

## ✨ Key Features

- 🎯 **Smart Preview**: See the video thumbnail and title instantly as soon as you paste the link.
- 🎬 **Post-Download Preview**: Verify your download with an integrated player before saving it to your device.
- 🍏 **Apple Ready**: Automatically encodes videos using **H.264 (AVC1)** and **AAC** for 100% compatibility with **QuickTime Player** and Apple devices.
- 🌊 **Modern UI**: A dark, sleek interface with smooth animations powered by **Motion One**.
- 🚀 **Real-time Progress**: Precise progress bars, ETA, and download speeds via Server-Sent Events (SSE).
- 🔒 **Isolated & Secure**: Runs as a non-root user in a minimal Docker environment.

---

## 🚀 Quick Start

### 1. Requirements
- [Docker](https://www.docker.com/get-started) installed on your system.

### 2. Run with one command
We've included a script to handle everything for you:

```bash
chmod +x run.sh
./run.sh
```

The app will be available at: **[http://localhost:4000](http://localhost:4000)**

---

## ⚠️ Beta Disclaimer
This project is currently in **BETA**. You might encounter some bugs or unexpected behavior. Feel free to report issues or suggest improvements.

---

## 🛠️ Tech Stack
- **Frontend**: Astro, Tailwind CSS, Motion One.
- **Backend**: Node.js, Express, TypeScript.
- **Core**: yt-dlp, FFmpeg.
- **Container**: Docker (Multi-stage build).

---

Developed with ❤️ by JaimeGH at InledGroup & Gemini CLI. (the nerve of this AI... Gemini has already credited herself as an author)
