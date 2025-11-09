# PowerShell script to start Nemotron Docker container
# Run this script from the web directory

Write-Host "Starting Nemotron Docker container..." -ForegroundColor Green

# Set environment variables
$env:NGC_API_KEY = "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"
$env:LOCAL_NIM_CACHE = "$env:USERPROFILE\.cache\nim"

# Create cache directory if it doesn't exist
if (-not (Test-Path $env:LOCAL_NIM_CACHE)) {
    New-Item -ItemType Directory -Force -Path $env:LOCAL_NIM_CACHE | Out-Null
    Write-Host "Created cache directory: $env:LOCAL_NIM_CACHE" -ForegroundColor Yellow
}

# Stop and remove existing container if it exists
Write-Host "Checking for existing container..." -ForegroundColor Yellow
docker stop nemotron 2>$null
docker rm nemotron 2>$null

# Start the Docker container
Write-Host "Starting Docker container..." -ForegroundColor Yellow
docker run -d `
    --name nemotron `
    --gpus all `
    --shm-size=16GB `
    -e NGC_API_KEY `
    -v "${env:USERPROFILE}\.cache\nim:/opt/nim/.cache" `
    -p 8000:8000 `
    nvcr.io/nim/nvidia/llama-3.3-nemotron-super-49b-v1.5:latest

# Wait a moment for container to start
Start-Sleep -Seconds 3

# Check container status
Write-Host "`nContainer status:" -ForegroundColor Green
docker ps --filter "name=nemotron"

# Show logs
Write-Host "`nContainer logs (last 20 lines):" -ForegroundColor Green
docker logs nemotron --tail 20

Write-Host "`nNemotron container is running on http://localhost:8000" -ForegroundColor Green
Write-Host "To view logs: docker logs -f nemotron" -ForegroundColor Cyan
Write-Host "To stop: docker stop nemotron" -ForegroundColor Cyan

