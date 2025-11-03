# POS_Render

## Project Structure

This project is organized into separate frontend and backend directories:

```
POS_Render/
├── frontend/              # React + Vite frontend application
│   ├── src/              # Source code
│   ├── index.html        # HTML entry point
│   ├── package.json      # Frontend dependencies
│   ├── vite.config.ts    # Vite configuration
│   ├── nginx.conf        # Nginx configuration for production
│   ├── Dockerfile        # Frontend Docker configuration
│   └── .env.example      # Environment variables template
│
├── backend/              # Python Flask/FastAPI backend
│   ├── app.py           # Main application
│   ├── models.py        # Database models
│   ├── init_db.py       # Database initialization
│   ├── requirements.txt # Python dependencies
│   ├── Dockerfile       # Backend Docker configuration
│   └── .env.example     # Environment variables template
│
├── docker-compose.yml   # Docker Compose configuration
├── render.yaml          # Render deployment configuration
└── DEPLOYMENT_CHECKLIST.md
```

## Getting Started

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Backend Development
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Docker Deployment
```bash
docker-compose up --build
```

## Deployment

See `RENDER_DEPLOYMENT.md` for detailed deployment instructions.






