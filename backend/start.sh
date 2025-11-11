#!/bin/bash
# Wait for database to be ready
echo "Starting database initialization..."
python init_db.py
echo "Starting Flask application..."
python app.py