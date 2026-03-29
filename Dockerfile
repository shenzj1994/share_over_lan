# Use a lightweight Python base image
FROM python:3.13-slim

# Set the working directory inside the container
WORKDIR /app

# Copy dependency list and install them
# (Doing this first leverages Docker cache to speed up rebuilds)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application files
COPY main.py .
COPY static/ static/

# Environment variable to ensure python output is logged directly
ENV PYTHONUNBUFFERED=1

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application natively on container startup
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
