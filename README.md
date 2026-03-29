# LAN ShareHub

A simple, lightweight, and blazing-fast web application designed to smoothly share text messages and files across devices operating on your Local Area Network (Wi-Fi) without requiring authentication or any third-party cloud syncing!

## Features
- **Real-Time Cross-Device Sharing**: Broadcast messages and upload files natively between your computers, phones, and tablets across your local Wi-Fi.
- **Modern Premium UI/UX**: Aesthetic dark-mode interface featuring glassmorphism, responsive inputs, interactive micro-animations, and instant "Click-to-Copy" text utilities.
- **One-Click Cleanup**: Dedicated buttons to instantly delete singular messages/files, or wipe all records clean at once.
- **FastAPI Powered**: A rock-solid, ultra-fast Python-based API server backing all the real-time communications.
- **Deploy Anywhere**: Works completely offline out of the box using a simple bash script.

## Quick Start (Native)
Run the application instantly without compiling using the built-in auto-setup bash script:

```bash
git clone https://github.com/YOUR_USERNAME/share_over_lan.git
cd share_over_lan
./run.sh
```
*The script automatically sets up a virtual Python environment, seamlessly installs all dependencies, and binds the server natively to your local IP address for sharing.*

## Docker Support (Recommended)
This application also ships completely containerized. If you want the deepest level of system isolation and stability to host on another Linux computer:

```bash
docker build -t local-share-hub .
docker run -d -p 8000:8000 -v $(pwd)/data:/app/data --name sharehub local-share-hub
```
*Note: Your application history will correctly persist even across container restarts since the `data/` volume dynamically maps straight into your Docker environment.*

## Built With
- **Backend:** Python + FastAPI + Uvicorn
- **Frontend:** Vanilla HTML5, Vanilla JavaScript, CSS3
- **Containerization:** Docker
