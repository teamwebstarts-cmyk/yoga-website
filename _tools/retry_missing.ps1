# Retry missing assets with backoff
$ErrorActionPreference = 'Continue'
Set-Location D:\webstarts\yogava
$UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"

$targets = @(
    @{ rel = "css/aos.css"; base = "https://html.kodesolution.com/2026/yogava-html/css" },
    @{ rel = "css/swiper.min.css"; base = "https://html.kodesolution.com/2026/yogava-html/css" },
    @{ rel = "css/jquery.fancybox.min.css"; base = "https://html.kodesolution.com/2026/yogava-html/css" },
    @{ rel = "css/jquery-ui.css"; base = "https://html.kodesolution.com/2026/yogava-html/css" },
    @{ rel = "css/linear.css"; base = "https://html.kodesolution.com/2026/yogava-html/css" },
    @{ rel = "css/select2.min.css"; base = "https://html.kodesolution.com/2026/yogava-html/css" },
    @{ rel = "css/fontawesome.css"; base = "https://html.kodesolution.com/2026/yogava-html/css" },
    @{ rel = "css/flaticons-common.css"; base = "https://html.kodesolution.com/2026/yogava-html/css" },
    @{ rel = "css/flaticon-set-medical.css"; base = "https://html.kodesolution.com/2026/yogava-html/css" },
    @{ rel = "css/flaticon-set-yoga.css"; base = "https://html.kodesolution.com/2026/yogava-html/css" },
    @{ rel = "css/tm-bs-mp.css"; base = "https://html.kodesolution.com/2026/yogava-html/css" },
    @{ rel = "css/tm-utility-classes.css"; base = "https://html.kodesolution.com/2026/yogava-html/css" }
)

foreach ($t in $targets) {
    $rel = $t.rel
    $url = "$($t.base)/$(Split-Path $rel -Leaf)"
    $dest = Join-Path "D:\webstarts\yogava" ($rel -replace '/', '\')
    if ((Test-Path $dest) -and (Get-Item $dest).Length -gt 0) { Write-Host "SKIP $rel"; continue }
    $ok = $false
    for ($try = 1; $try -le 3; $try++) {
        Start-Sleep -Milliseconds (400 * $try)
        curl.exe -s -f -A $UA -o $dest --create-dirs --max-time 90 "$url" 2>$null
        if ($LASTEXITCODE -eq 0 -and (Test-Path $dest) -and (Get-Item $dest).Length -gt 0) { $ok = $true; break }
    }
    if ($ok) { Write-Host "OK   $rel ($((Get-Item $dest).Length) bytes)" } else { Write-Host "FAIL $rel" }
}
Write-Host "RETRY-DONE"
