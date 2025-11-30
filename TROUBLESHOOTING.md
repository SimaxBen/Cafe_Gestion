# Quick Start Guide - Troubleshooting

## ✅ Issues Fixed

### Backend Issue: 404 Not Found
**Problem:** API docs showing 404 at `/api/v1/docs`

**Fixed by:**
1. Added missing `__init__.py` to endpoints directory
2. Added missing import `verify_cafe_access` in cafes.py

### Frontend Issue: PostCSS Module Error
**Problem:** `module is not defined in ES module scope`

**Fixed by:**
1. Renamed `postcss.config.js` to `postcss.config.cjs` (CommonJS format)

## 🚀 Start the Application

### Terminal 1 - Backend
```powershell
cd C:\Users\simax\Desktop\Cafe_Gestion\backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Verify it works:**
- Open: http://localhost:8000
- Should see: `{"message": "Cafe Management API", "version": "1.0.0", "docs": "/api/v1/docs"}`
- Open: http://localhost:8000/api/v1/docs
- Should see: Swagger API documentation

### Terminal 2 - Frontend
```powershell
cd C:\Users\simax\Desktop\Cafe_Gestion\frontend
npm run dev
```

**Verify it works:**
- Open: http://localhost:3000
- Should see: Login page

## 🔧 If Backend Still Shows 404

Make sure all these files exist:

```
backend/app/api/v1/endpoints/
├── __init__.py          ← Must exist!
├── auth.py
├── cafes.py
├── stock.py
├── menu.py
├── staff.py
├── orders.py
├── expenses.py
└── reports.py
```

## 🔧 If Frontend Still Has PostCSS Error

1. Delete the old file:
```powershell
cd C:\Users\simax\Desktop\Cafe_Gestion\frontend
Remove-Item postcss.config.js -Force
```

2. Verify `postcss.config.cjs` exists with this content:
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

3. Restart the dev server:
```powershell
npm run dev
```

## 📋 Quick Test Checklist

### Backend Tests
- [ ] http://localhost:8000 returns JSON
- [ ] http://localhost:8000/api/v1/docs shows Swagger UI
- [ ] http://localhost:8000/health returns `{"status": "healthy"}`

### Frontend Tests
- [ ] http://localhost:3000 shows login page
- [ ] No errors in browser console (F12)
- [ ] No errors in terminal

## 🐛 Additional Troubleshooting

### Backend: Import Errors
If you see `ImportError` or `ModuleNotFoundError`:
```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Frontend: Module Not Found
If you see `Cannot find module`:
```powershell
cd frontend
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json -Force
npm install
```

### Database Connection Issues
Make sure your `.env` file has correct Supabase credentials:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
```

## ✨ Next Steps

Once both are running:

1. **Create your first user:**
   - Go to http://localhost:8000/api/v1/docs
   - Use `/auth/register` endpoint
   - Register with email and password

2. **Login to frontend:**
   - Go to http://localhost:3000
   - Login with your credentials

3. **Create a cafe:**
   - After login, you'll see dashboard
   - Use cafe selector to create your first cafe

---

Need more help? Check:
- Backend logs in the uvicorn terminal
- Frontend logs in the npm terminal
- Browser console (F12) for frontend errors
