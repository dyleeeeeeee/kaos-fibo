# Update Frontend API URL Script
# Run this after deploying to Railway

param(
    [Parameter(Mandatory=$true)]
    [string]$RailwayUrl
)

Write-Host "🔧 Updating Frontend Configuration..." -ForegroundColor Cyan

# Validate URL format
if ($RailwayUrl -notmatch "^https?://") {
    Write-Host "❌ Error: URL must start with http:// or https://" -ForegroundColor Red
    Write-Host "Example: https://your-app.up.railway.app" -ForegroundColor Yellow
    exit 1
}

# Remove trailing slash if present
$RailwayUrl = $RailwayUrl.TrimEnd('/')

$scriptPath = $PSScriptRoot
$frontendScriptPath = Join-Path $scriptPath "frontend\script.js"

# Check if file exists
if (-not (Test-Path $frontendScriptPath)) {
    Write-Host "❌ Error: frontend/script.js not found!" -ForegroundColor Red
    exit 1
}

# Read the file
$content = Get-Content $frontendScriptPath -Raw

# Replace localhost URL with Railway URL
$oldPattern = "API_BASE_URL:\s*['""]http://localhost:5000['""]"
$newValue = "API_BASE_URL: '$RailwayUrl'"

if ($content -match $oldPattern) {
    $content = $content -replace $oldPattern, $newValue
    
    # Write back to file
    Set-Content -Path $frontendScriptPath -Value $content -NoNewline
    
    Write-Host "✅ Frontend updated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Changes made:" -ForegroundColor Yellow
    Write-Host "   OLD: API_BASE_URL: 'http://localhost:5000'" -ForegroundColor Red
    Write-Host "   NEW: API_BASE_URL: '$RailwayUrl'" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Your frontend will now connect to Railway!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Open frontend/index.html in browser"
    Write-Host "   2. Test compression with: 1,2,3,4,5"
    Write-Host "   3. Verify it connects to Railway backend"
    
} else {
    Write-Host "⚠ Warning: Could not find API_BASE_URL in script.js" -ForegroundColor Yellow
    Write-Host "Please manually update line 9 in frontend/script.js" -ForegroundColor Yellow
    Write-Host "Change: API_BASE_URL: 'http://localhost:5000'" -ForegroundColor Yellow
    Write-Host "To: API_BASE_URL: '$RailwayUrl'" -ForegroundColor Yellow
}
