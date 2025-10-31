FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

# Use a simple command to run the initialization and start the app
CMD ["sh", "-c", "python init_db.py && python app.py"]