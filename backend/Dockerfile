FROM python:3.12-slim

# Install system dependencies for OpenCV and EasyOCR
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend app
COPY . /app/backend

# Expose port
EXPOSE 8000

# Set environment variable to make imports clean
ENV PYTHONPATH=/app

# Start FastAPI server
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
