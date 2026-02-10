# Fix Book Routes File Name
# Run this in PowerShell from the server directory

Write-Host "Fixing bookRoutes.js file name..." -ForegroundColor Cyan
Write-Host ""

# Navigate to routes directory
Set-Location "src\routes"

# Step 1: Rename to temporary name
if (Test-Path "BookRoutes.js") {
    Write-Host "Step 1: Renaming BookRoutes.js to temp_bookRoutes.js" -ForegroundColor Yellow
    Rename-Item "BookRoutes.js" "temp_bookRoutes.js" -Force
    Write-Host "✓ Done" -ForegroundColor Green
} elseif (Test-Path "bookRoutes.js") {
    Write-Host "Step 1: File already named correctly, renaming to temp first..." -ForegroundColor Yellow
    Rename-Item "bookRoutes.js" "temp_bookRoutes.js" -Force
    Write-Host "✓ Done" -ForegroundColor Green
}

# Step 2: Rename to correct name
Write-Host "Step 2: Renaming temp_bookRoutes.js to bookRoutes.js" -ForegroundColor Yellow
Start-Sleep -Seconds 1
Rename-Item "temp_bookRoutes.js" "bookRoutes.js" -Force
Write-Host "✓ Done" -ForegroundColor Green

Write-Host ""
Write-Host "File name fixed successfully!" -ForegroundColor Green
Write-Host ""

# Go back to server directory
Set-Location "..\..\"

# List the file to verify
Write-Host "Verification:" -ForegroundColor Cyan
Get-ChildItem "src\routes\bookRoutes.js" | Select-Object Name, LastWriteTime

Write-Host ""
Write-Host "Now restart your server:" -ForegroundColor Yellow
Write-Host "  npm run dev" -ForegroundColor White
