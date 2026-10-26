# Download all fonts referenced by CSS files
$ErrorActionPreference = 'Continue'
Set-Location D:\webstarts\yogava
$UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
$base = "https://html.kodesolution.com/2026/yogava-html"

$fonts = New-Object System.Collections.Generic.HashSet[string]
Get-ChildItem css\*.css | ForEach-Object {
    $css = [System.IO.File]::ReadAllText($_.FullName)
    $matches2 = [regex]::Matches($css, "url\(\s*['""]?([^'"")]+)['""]?\s*\)")
    foreach ($m in $matches2) {
        $v = $m.Groups[1].Value.Trim()
        if ($v -match '^https?://') { continue }
        if ($v.StartsWith('../')) { $v = $v.Substring(3) }
        $v = ($v -split '\?')[0]
        $v = ($v -split '#')[0]
        if ($v -match '\.(ttf|otf|woff2?|eot|svg)$') { $fonts.Add($v) | Out-Null }
    }
}

Write-Host "Fonts to fetch: $($fonts.Count)"
$fail = @()
foreach ($f in ($fonts | Sort-Object)) {
    $dest = Join-Path "D:\webstarts\yogava" ($f -replace '/', '\')
    if ((Test-Path $dest) -and (Get-Item $dest).Length -gt 0) { Write-Host "SKIP $f"; continue }
    $url = "$base/$f"
    $ok = $false
    for ($try = 1; $try -le 3; $try++) {
        Start-Sleep -Milliseconds (300 * $try)
        curl.exe -s -f -A $UA -o $dest --create-dirs --max-time 90 "$url" 2>$null
        if ($LASTEXITCODE -eq 0 -and (Test-Path $dest) -and (Get-Item $dest).Length -gt 0) { $ok = $true; break }
    }
    if ($ok) { Write-Host "OK   $f ($((Get-Item $dest).Length))" } else { Write-Host "FAIL $f"; $fail += $f }
    Start-Sleep -Milliseconds 150
}
Write-Host "FAILED: $($fail.Count)"
$fail | ForEach-Object { Write-Host "  $_" }
Write-Host "FONTS-DONE"
