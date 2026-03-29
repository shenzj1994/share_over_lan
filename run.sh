#!/bin/bash

# Ensure script stops on error
set -e

echo "Setting up Local Share App..."

# Navigate to the repo directory
cd "$(dirname "$0")"

# Check if a python virtual environment exists, if not create one
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate the virtual environment
source venv/bin/activate

# Install dependencies using python -m pip to ensure we use the venv's pip
echo "Installing/Updating dependencies..."
python3 -m pip install -r requirements.txt

# Extract local IP address for easy sharing instructions (macOS friendly)
if command -v ipconfig &> /dev/null; then
    LOCAL_IP=$(ipconfig getifaddr en0)
elif command -v ifconfig &> /dev/null; then
    LOCAL_IP=$(ifconfig | grep "inet " | grep -Fv 127.0.0.1 | awk '{print $2}' | head -n 1)
else
    LOCAL_IP="your-computer-ip"
fi

if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP="your-computer-ip"
fi

echo "================================================="
echo " Starting Local Share Server!"
echo " "
echo " Access the app locally at: http://127.0.0.1:8000"
echo " Access from other devices at: http://${LOCAL_IP}:8000"
echo "================================================="

# Start the server
uvicorn main:app --host 0.0.0.0 --port 8000
