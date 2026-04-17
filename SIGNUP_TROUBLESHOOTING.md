# Signup Troubleshooting Guide

## ✅ Checklist to Fix Signup Issues

### 1. **Verify MongoDB is Running**
```bash
# Open a new Command Prompt and run:
mongod
# You should see: "waiting for connections on port 27017"
```

### 2. **Verify Backend Server is Running**
```bash
# In backend folder:
npm run dev
# You should see:
# ✅ MongoDB Connected Successfully
# Server running on port 5000
# API available at http://localhost:5000/api
```

### 3. **Check Frontend is Running**
```bash
# In frontend folder:
npm start
# Should open browser at http://localhost:3000
```

### 4. **Test API Endpoint Directly**
Use Postman or browser DevTools:

**POST** `http://localhost:5000/api/auth/signup`

Headers:
```json
{
  "Content-Type": "application/json"
}
```

Body:
```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "role": "student"
}
```

Expected Response (201):
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "...",
    "name": "Test User",
    "email": "test@example.com",
    "role": "student"
  }
}
```

### 5. **Check Browser Console for Errors**
1. Open Browser DevTools (F12)
2. Go to Console tab
3. Try signup again
4. Look for error messages

### 6. **Check Network Request**
1. Open Browser DevTools (F12)
2. Go to Network tab
3. Try signup again
4. Click on the `signup` POST request
5. Check:
   - Status: Should be 201
   - Response: Should contain token and user data
   - Error: Check if there's an error message

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| MongoDB not found | Run `mongod` in new terminal |
| Backend not running | Run `npm run dev` in backend folder |
| CORS error | Check if backend CORS is enabled |
| Connection refused | Ensure backend is on port 5000 |
| 500 Server error | Check backend console for error details |

## Still Not Working?

1. **Kill existing processes** and restart:
   ```bash
   # Kill all node processes (Windows):
   taskkill /F /IM node.exe
   
   # Kill all mongod processes (Windows):
   taskkill /F /IM mongod.exe
   ```

2. **Start fresh**:
   - Terminal 1: `mongod`
   - Terminal 2: `cd backend && npm run dev`
   - Terminal 3: `cd frontend && npm start`

3. **Share error messages** from:
   - Browser Console (F12)
   - Backend terminal output
   - Network tab showing the failed request
