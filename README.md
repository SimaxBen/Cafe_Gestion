# Cafe Management System

A professional multi-cafe management system with FastAPI backend and React frontend.

## 🏗️ Architecture

This is a **3-tier application**:

1. **Frontend (React + TypeScript)** - Modern responsive UI
2. **Backend (FastAPI + Python)** - RESTful API with business logic
3. **Database (PostgreSQL)** - Multi-tenant data storage

## 📁 Project Structure

```
Cafe_Gestion/
├── database_schema.sql      # Complete PostgreSQL schema
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       └── endpoints/  # API routes
│   │   ├── core/           # Config, security, database
│   │   ├── models/         # SQLAlchemy ORM models
│   │   └── schemas/        # Pydantic schemas
│   ├── requirements.txt
│   └── .env.example
└── frontend/               # React frontend
    ├── src/
    │   ├── api/           # API client
    │   ├── components/    # Reusable components
    │   ├── pages/         # Page components
    │   ├── store/         # Zustand state management
    │   └── main.tsx       # Entry point
    ├── package.json
    └── vite.config.ts
```

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- Supabase account (free tier available at https://supabase.com)

### 1. Database Setup

1. Go to https://supabase.com and create a new project
2. Wait for the database to be provisioned
3. Go to the SQL Editor in your Supabase dashboard
4. Copy the contents of `database_schema.sql` and execute it
5. Get your connection details from Settings > Database:
   - Connection string (for SQLAlchemy)
   - Project URL and anon key (optional, for direct Supabase client)

### 2. Backend Setup

```powershell
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: http://localhost:8000
API docs at: http://localhost:8000/api/v1/docs

### 3. Frontend Setup

```powershell
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:8000/api/v1" > .env

# Run development server
npm run dev
```

Frontend will be available at: http://localhost:3000

## 🎯 Features

### Core Features
- ✅ Multi-cafe support with role-based access
- ✅ Historical price & cost tracking
- ✅ Daily and monthly profit reports
- ✅ Inventory management with low-stock alerts
- ✅ Menu items with recipes
- ✅ Staff management with salary history
- ✅ Order tracking and management
- ✅ **Undo orders** (restore stock)
- ✅ Daily & monthly expenses
- ✅ Pro-rated expense calculations

### Advanced Features (Ready to Implement)
- 📦 Supplier management
- 📝 Purchase orders
- 📊 Advanced reporting with charts
- 🖼️ Image uploads for menu items
- 📱 Mobile-responsive design

## 🔐 Default Login

After running the schema, you'll need to register a user through the API:

```bash
# Register first user
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cafe.com",
    "password": "your_password",
    "full_name": "Admin User"
  }'
```

## 📡 API Endpoints

All endpoints are under `/api/v1/`

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token
- `GET /auth/me` - Get current user info

### Cafes
- `GET /cafes` - Get user's cafes
- `POST /cafes` - Create new cafe

### Stock (per cafe)
- `GET /cafes/{cafe_id}/stock` - Get all stock items
- `POST /cafes/{cafe_id}/stock` - Create stock item
- `PUT /cafes/{cafe_id}/stock/{item_id}/cost` - Update cost
- `POST /cafes/{cafe_id}/stock/{item_id}/restock` - Restock

### Menu (per cafe)
- `GET /cafes/{cafe_id}/menu` - Get menu items
- `POST /cafes/{cafe_id}/menu` - Create menu item
- `PUT /cafes/{cafe_id}/menu/{item_id}/price` - Update price
- `GET /cafes/{cafe_id}/menu/{item_id}/recipe` - Get recipe
- `POST /cafes/{cafe_id}/menu/{item_id}/recipe` - Add ingredient

### Orders (per cafe)
- `GET /cafes/{cafe_id}/orders` - Get orders
- `POST /cafes/{cafe_id}/orders` - Create order (daily sales)
- `DELETE /cafes/{cafe_id}/orders/{order_id}` - **Delete & restock**

### Reports (per cafe)
- `GET /cafes/{cafe_id}/reports/daily?date=YYYY-MM-DD`
- `GET /cafes/{cafe_id}/reports/monthly?month=YYYY-MM-DD`

Full API documentation available at `/api/v1/docs` when backend is running.

## 🛠️ Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **PostgreSQL** - Relational database
- **JWT** - Authentication
- **Pydantic** - Data validation

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **TanStack Query** - Data fetching & caching
- **Zustand** - State management
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Vite** - Build tool

## 📝 Environment Variables

### Backend (.env)
```
# Get this from Supabase: Settings > Database > Connection string > URI
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Optional: Direct Supabase client credentials
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_KEY=your-anon-key
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000/api/v1
```

## 🔄 Development Workflow

1. Make changes to backend code → Server auto-reloads
2. Make changes to frontend code → HMR updates browser
3. Test API at http://localhost:8000/api/v1/docs
4. Test UI at http://localhost:3000

## 📦 Building for Production

### Backend
```powershell
# Backend runs with uvicorn in production
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Frontend
```powershell
cd frontend
npm run build
# Serve the dist/ folder with nginx or similar
```

## 🤝 Contributing

This is a private project. Contact the owner for contribution guidelines.

## 📄 License

Proprietary - All rights reserved.

## 🆘 Support

For issues or questions:
1. Check API docs at `/api/v1/docs`
2. Review error logs in terminal
3. Check browser console for frontend errors

---

Built with ☕ for cafe owners everywhere.
