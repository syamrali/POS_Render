FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Make the startup script executable
RUN chmod +x start.sh

EXPOSE 5000

# Use the startup script to run the initialization and start the app
CMD ["./start.sh"]