# Quick Start Script for Backend

Write-Host "🚀 Starting Esports Backend Setup..." -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "📦 Checking Docker..." -ForegroundColor Yellow
$dockerRunning = docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker is running" -ForegroundColor Green
Write-Host ""

# Start Docker containers
Write-Host "🐘 Starting PostgreSQL and Redis..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start containers" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Containers started" -ForegroundColor Green
Write-Host ""

# Wait for database to be ready
Write-Host "⏳ Waiting for PostgreSQL to be ready (15 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15
Write-Host "✅ Database should be ready" -ForegroundColor Green
Write-Host ""

# Generate Prisma client
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Yellow
pnpm db:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Prisma client generated" -ForegroundColor Green
Write-Host ""

# Push schema to database
Write-Host "📊 Pushing schema to database..." -ForegroundColor Yellow
pnpm db:push
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to push schema" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Schema pushed successfully" -ForegroundColor Green
Write-Host ""

Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run 'pnpm dev' to start the development server"
Write-Host "  2. Backend will be available at http://localhost:3000"
Write-Host "  3. Access admin at http://localhost:5173/admin/login (password: admin123)"
Write-Host ""
