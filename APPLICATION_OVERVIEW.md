# Point of Sale (POS) Application Overview

## Application Overview

This is a full-stack Point of Sale (POS) system with a decoupled architecture built with modern web technologies.

## Frontend Details

- **Language**: TypeScript
- **Framework**: React
- **Build Tool**: Vite
- **UI Components**: Custom React components with shadcn-inspired UI components
- **State Management**: React Context (RestaurantContext.tsx)
- **Styling**: CSS modules and global styles (globals.css)
- **API Communication**: Custom service layer (api.ts)
- **Type Safety**: TypeScript type definitions
- **Key Components**:
  - OrdersPage.tsx
  - MenuPage.tsx
  - ReportsPage.tsx
  - SettingsPage.tsx
  - POSLayout.tsx (main layout component)

## Backend Details

- **Language**: Python
- **Framework**: Flask
- **Database**: PostgreSQL (using psycopg3)
- **ORM**: SQLAlchemy (inferred from models.py)
- **Key Files**:
  - app.py (main application entry point)
  - models.py (data models)
  - init_db.py (database initialization)
- **Dependencies**: Managed through requirements.txt

## Infrastructure & Deployment

- **Containerization**: Docker (separate Dockerfiles for frontend and backend)
- **Orchestration**: Docker Compose (docker-compose.yml)
- **Web Server**: Nginx (for production serving)
- **Deployment**: Configured for Render platform (render.yaml)
- **Environment Management**: .env.example files for both frontend and backend

## UI Structure

The application follows a three-column layout structure with:
- Navigation panel on the left
- Main content in the middle
- Cart panel on the right

All implemented with a responsive design approach.