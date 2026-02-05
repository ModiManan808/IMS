# IMS Startup Script
# This script starts both backend and frontend servers

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   IMS Project Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Backend
Write-Host "[1/2] Starting Backend Server..." -ForegroundColor Yellow
Set-Location "c:/Users/modim/Code/IMS/ims-backend-main"

# Check if JWT_SECRET is set
$envContent = Get-Content .env -ErrorAction SilentlyContinue
if ($envContent -notmatch "JWT_SECRET=") {
    Write-Host "WARNING: JWT_SECRET not found in .env file!" -ForegroundColor Red
    Write-Host "Please add it to the .env file before proceeding." -ForegroundColor Red
    exit 1
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:/Users/modim/Code/IMS/ims-backend-main'; node server.js"

Write-Host "Backend server started on http://localhost:5586" -ForegroundColor Green
Write-Host ""

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Frontend
Write-Host "[2/2] Starting Frontend Server..." -ForegroundColor Yellow
Set-Location "c:/Users/modim/Code/IMS/ims-frontend-main"

# Check if node_modules exists
if (!(Test-Path "node_modules")) {
    Write-Host "node_modules not found. Running npm install..." -ForegroundColor Yellow
    npm install
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:/Users/modim/Code/IMS/ims-frontend-main'; `$env:REACT_APP_API_URL='http://localhost:5586/api'; npm start"

Write-Host "Frontend server starting on http://localhost:3759" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Both servers are starting!" -ForegroundColor Green
Write-Host ""
Write-Host "URLs:" -ForegroundColor Cyan
Write-Host "  - Frontend: http://localhost:3759" -ForegroundColor White
Write-Host "  - Backend:  http://localhost:5586" -ForegroundColor White
Write-Host ""
Write-Host "Admin Credentials:" -ForegroundColor Cyan
Write-Host "  - Username: admin" -ForegroundColor White
Write-Host "  - Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C in each terminal to stop servers" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
