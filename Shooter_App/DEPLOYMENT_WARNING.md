# 🚨 Critical Deployment Warnings for Marksman Vision API

## 1. Do NOT Deploy to Serverless Environments
The Vision API (`apps/vision`) loads large neural networks (`yolo26s.pt`) and performs compute-heavy OpenCV processing (warping, CLAHE, morphological operations) on every single frame. 
* **Serverless Platforms** (like Vercel Functions, AWS Lambda, or Netlify Functions) **will fail**. They have cold starts, strict memory limits, and tight timeouts (usually 10s) which makes live-streaming frame analysis impossible.

## 2. Server Requirements (VPS / PaaS)
You must deploy the Vision API to a **persistent background service**.
* **Minimum Specs:** 2GB RAM is the absolute minimum, but **4GB RAM is highly recommended** to safely load YOLO models and process concurrent HTTP/WebSocket streams without Out-Of-Memory (OOM) crashes.
* **CPU Inference:** The code is explicitly designed to handle `live-frame` latency under 200ms by temporarily suppressing YOLO and using the OpenCV compatibility engine. This allows it to run smoothly on standard CPUs without requiring an expensive GPU instance.

## 3. Supported Hosting Platforms
If you don't use this `docker-compose.yml` on a private VPS (like DigitalOcean, AWS EC2, or Hetzner), your alternative is a PaaS (Platform as a Service) that supports persistent background workers:
* **Render.com:** Deploy as a "Background Worker" or standard Web Service with at least the "Standard" tier (2GB RAM).
* **Railway.app / Fly.io:** Deploy using standard Dockerfile builder.

## 4. Docker Architecture Notes
The provided `docker-compose.yml` routes everything perfectly through the Next.js frontend proxy. You only need to expose port `3000` to the internet. Ports `3001` (API) and `8000` (Vision) are safely kept inside the internal Docker network.
