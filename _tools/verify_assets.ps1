# Verify all referenced assets exist locally
$ErrorActionPreference = 'Stop'
Set-Location D:\webstarts\yogava

$refs = New-Object System.Collections.Generic.HashSet[string]

# 1. Parse _original.html (skip cloudflare paths)
$html = [System.IO.File]::ReadAllText("D:\webstarts\yogava\_original.html")
foreach ($m in [regex]::Matches($html, '(?:src|href)="([^"]+)"')) {
    $v = $m.Groups[1].Value
    if ($v -match '^(https?:|//|/cdn-cgi|mailto:|tel:|#)' ) { continue }
    if ($v -match '\.(png|jpg|jpeg|gif|webp|svg|css|js|ico|ttf|woff2?)(\?|$)') { $refs.Add($v.Split('?')[0]) | Out-Null }
}
# CSS links are relative to root: css/... js/... images/...
# 2. Parse all css files for url() starting ../
Get-ChildItem css\*.css | ForEach-Object {
    $css = [System.IO.File]::ReadAllText($_.FullName)
    foreach ($m in [regex]::Matches($css, 'url\(\s*[''"]?([^''")]+)[''"]?\s*\)')) {
        $v = $m.Groups[1].Value.Trim()
        if ($v.StartsWith('data:')) { continue }
        if ($v -match '^https?://') { continue }
        # strip url query (?...) and fragment (#...) e.g. font.woff?wmnaxx#iefix
        $v = ($v -split '\?')[0]
        $v = ($v -split '#')[0]
        # ../images/... -> images/...
        if ($v.StartsWith('../')) { $v = $v.Substring(3) }
        if ($v -match '\.(png|jpg|jpeg|gif|webp|svg|ttf|woff2?)$') { $refs.Add($v) | Out-Null }
    }
}

$missing = @()
$present = 0
foreach ($r in $refs | Sort-Object) {
    $local = Join-Path "D:\webstarts\yogava" ($r -replace '/', '\')
    if (Test-Path $local) { $present++ } else { $missing += $r }
}
Write-Host "Total referenced: $($refs.Count) | Present: $present | Missing: $($missing.Count)"
$missing | ForEach-Object { Write-Host "MISSING $_" }
