# Replace with your Vercel production URL and SETUP_SECRET from Vercel env vars
$baseUrl = "https://YOUR-APP.vercel.app"
$secret = "YOUR_SETUP_SECRET"

Write-Host "Health check..."
Invoke-RestMethod "$baseUrl/api/health" | ConvertTo-Json

Write-Host "Bootstrapping demo users..."
Invoke-RestMethod -Method POST "$baseUrl/api/setup/bootstrap" -Headers @{ "x-setup-secret" = $secret } | ConvertTo-Json
