import os
import json
import uuid
from datetime import datetime, timezone
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI(title="Local Share APP")

DATA_DIR = "data"
UPLOADS_DIR = os.path.join(DATA_DIR, "uploads")
MESSAGES_FILE = os.path.join(DATA_DIR, "messages.json")

os.makedirs(UPLOADS_DIR, exist_ok=True)

if not os.path.exists(MESSAGES_FILE):
    with open(MESSAGES_FILE, "w") as f:
        json.dump([], f)

def load_messages():
    try:
        with open(MESSAGES_FILE, "r") as f:
            return json.load(f)
    except:
        return []

def save_messages(msgs):
    with open(MESSAGES_FILE, "w") as f:
        json.dump(msgs, f)

class Message(BaseModel):
    content: str
    author: str = "Anonymous"

@app.get("/api/messages")
async def get_messages():
    messages = load_messages()
    return JSONResponse(content={"messages": messages})

@app.post("/api/messages")
async def add_message(msg: Message):
    messages = load_messages()
    new_msg = {
        "id": str(uuid.uuid4()),
        "content": msg.content,
        "author": msg.author,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    messages.append(new_msg)
    save_messages(messages)
    return JSONResponse(content=new_msg)

@app.get("/api/files")
async def list_files():
    files_list = []
    if os.path.exists(UPLOADS_DIR):
        for filename in os.listdir(UPLOADS_DIR):
            filepath = os.path.join(UPLOADS_DIR, filename)
            if os.path.isfile(filepath):
                stat = os.stat(filepath)
                files_list.append({
                    "name": filename,
                    "url": f"/files/{filename}",
                    "size": stat.st_size,
                    "timestamp": datetime.fromtimestamp(stat.st_ctime, tz=timezone.utc).isoformat()
                })
    # Sort files by timestamp descending
    files_list.sort(key=lambda x: x["timestamp"], reverse=True)
    return JSONResponse(content={"files": files_list})

@app.post("/api/files")
async def upload_file(file: UploadFile = File(...)):
    filename = file.filename
    if not filename:
        filename = f"upload_{uuid.uuid4().hex[:8]}"
    
    # Handle duplicates by appending uuid if needed
    filepath = os.path.join(UPLOADS_DIR, filename)
    if os.path.exists(filepath):
        name, ext = os.path.splitext(filename)
        filename = f"{name}_{uuid.uuid4().hex[:8]}{ext}"
        filepath = os.path.join(UPLOADS_DIR, filename)
        
    with open(filepath, "wb") as buffer:
        while chunk := await file.read(1024 * 1024): # 1MB chunks
            buffer.write(chunk)
            
    stat = os.stat(filepath)
    return JSONResponse(content={
        "name": filename,
        "url": f"/files/{filename}",
        "size": stat.st_size,
        "timestamp": datetime.fromtimestamp(stat.st_ctime, tz=timezone.utc).isoformat()
    })

@app.delete("/api/messages")
async def clear_messages():
    save_messages([])
    return JSONResponse(content={"status": "ok"})

@app.delete("/api/messages/{msg_id}")
async def delete_message(msg_id: str):
    messages = load_messages()
    messages = [m for m in messages if m["id"] != msg_id]
    save_messages(messages)
    return JSONResponse(content={"status": "ok"})

@app.delete("/api/files")
async def clear_files():
    if os.path.exists(UPLOADS_DIR):
        for filename in os.listdir(UPLOADS_DIR):
            filepath = os.path.join(UPLOADS_DIR, filename)
            if os.path.isfile(filepath):
                try:
                    os.remove(filepath)
                except Exception:
                    pass
    return JSONResponse(content={"status": "ok"})

@app.delete("/api/files/{filename}")
async def delete_file(filename: str):
    if ".." in filename or "/" in filename:
        return JSONResponse(status_code=400, content={"status": "error"})
    filepath = os.path.join(UPLOADS_DIR, filename)
    if os.path.exists(filepath) and os.path.isfile(filepath):
        try:
            os.remove(filepath)
            return JSONResponse(content={"status": "ok"})
        except Exception as e:
            return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})
    return JSONResponse(status_code=404, content={"status": "error", "message": "Not found"})

# Serve uploaded files directly
app.mount("/files", StaticFiles(directory=UPLOADS_DIR), name="files")

# Mount static for frontend
app.mount("/", StaticFiles(directory="static", html=True), name="static")
