# Asset downloader for Yogava clone
$ErrorActionPreference = 'Continue'
Set-Location D:\webstarts\yogava
$UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
$failed = New-Object System.Collections.Generic.List[string]

function Get-Asset {
    param([string]$rel, [string]$baseurl)
    $url = "$baseurl/$rel"
    $dest = Join-Path "D:\webstarts\yogava" ($rel -replace '/', '\')
    $dir = Split-Path $dest -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    if ((Test-Path $dest) -and (Get-Item $dest).Length -gt 0) { return $true }
    curl.exe -s -f -A $UA -o $dest --create-dirs --max-time 120 "$url" 2>$null
    if ($LASTEXITCODE -ne 0) { if (Test-Path $dest) { Remove-Item $dest -Force -ErrorAction SilentlyContinue }; return $false }
    return $true
}

Write-Host "=== Phase 1: dependency CSS ==="
$depCss = @("animate.css","aos.css","swiper.min.css","jquery.fancybox.min.css","jquery-ui.css","linear.css","select2.min.css","fontawesome.css","flaticons-common.css","flaticon-set-medical.css","flaticon-set-yoga.css","tm-bs-mp.css","tm-utility-classes.css")
foreach ($c in $depCss) {
    if (Get-Asset $c "https://html.kodesolution.com/2026/yogava-html/css") { Write-Host "OK   css/$c" } else { Write-Host "FAIL css/$c"; $failed.Add("css/$c") }
}

Write-Host "=== Phase 2: font ==="
if (Get-Asset "gallient/GallientRegular-eZoMp.ttf" "https://html.kodesolution.com/2026/yogava-html/fonts") { Write-Host "OK   fonts/gallient/GallientRegular-eZoMp.ttf" } else { Write-Host "FAIL font"; $failed.Add("fonts/gallient/GallientRegular-eZoMp.ttf") }

Write-Host "=== Phase 3: HTML images ==="
$htmlImgs = @(
  "images/favicon.png","images/logo.png","images/logo2.png","images/logo3.png",
  "images/icons/arrow.png","images/icons/arrow-left.png","images/icons/arrow-right.png",
  "images/icons/shape-1.png","images/icons/shape-2.png","images/icons/shape-3.png","images/icons/shape-4.png",
  "images/icons/shape-5.png","images/icons/shape-6.png","images/icons/shape-7.png","images/icons/shape-8.png",
  "images/icons/shape-9.png","images/icons/shape-10.png","images/icons/shape-11.png","images/icons/shape-12.png",
  "images/icons/shape-13.png","images/icons/shape-14.png","images/icons/shape-15.png",
  "images/icons/soft-star.png","images/icons/marquee1-1.png","images/icons/check.png",
  "images/banner/banner1-1.png","images/banner/banner1-2.jpg","images/banner/banner1-3.jpg","images/banner/banner1-1.jpg","images/banner/banner1-3-mask.png",
  "images/resource/about1-1.jpg","images/resource/about1-1-mask.png",
  "images/resource/service-bg1-1.png","images/resource/service1-2.jpg","images/resource/service1-1.jpg",
  "images/resource/service2-1-bg.png","images/resource/service2-2-bg.png",
  "images/resource/service2-1.jpg","images/resource/service2-2.jpg","images/resource/service2-3.jpg","images/resource/service2-4.jpg","images/resource/service2-5.jpg",
  "images/resource/gallary1-1.jpg","images/resource/gallary1-1mask.png","images/resource/gallary1-2.jpg","images/resource/gallary1-3.jpg",
  "images/resource/gallary1-4.jpg","images/resource/gallary1-4-mask.png","images/resource/gallary1-5.jpg",
  "images/resource/gallary1-6.jpg","images/resource/gallary1-7.jpg",
  "images/resource/testi1-1.jpg","images/resource/testi1-1-mask.png",
  "images/resource/contact1-1-bg.png","images/resource/contact1-1.jpg",
  "images/resource/blog1-1.jpg","images/resource/blog1-2.jpg","images/resource/blog1-3.jpg",
  "images/resource/gallary2-1.jpg","images/resource/gallary2-2.jpg","images/resource/gallary2-3.jpg",
  "images/resource/gallary2-4.jpg","images/resource/gallary2-5.jpg","images/resource/gallary2-6.jpg",
  "images/background/footer1-pattern1.png","images/background/footer1-pattern2.png",
  "images/icons/bg-lines.jpg","images/icons/preloader.png"
)
foreach ($i in $htmlImgs) {
    if (Get-Asset $i "https://html.kodesolution.com/2026/yogava-html") { Write-Host "OK   $i" } else { Write-Host "FAIL $i"; $failed.Add($i) }
}

Write-Host "=== Phase 4: CSS url() images ==="
$cssUrlImgs = @(
  "images/banner/banner2-1-mask.png","images/banner/icon-big-arrow.png",
  "images/icons/cat-1-bg.png","images/icons/cat-2-bg.png","images/icons/cat-3-bg.png","images/icons/cat-4-bg.png",
  "images/icons/icon-anchor-1.png","images/icons/icon-arrow-2.png",
  "images/icons/icon-big-boat-1.png","images/icons/icon-big-boat-2.png","images/icons/icon-big-boat-3.png","images/icons/icon-big-boat-5.png",
  "images/icons/icon-big-bus.png","images/icons/icon-border-3.png","images/icons/icon-box-2.png","images/icons/icon-box.png",
  "images/icons/icon-bus-2.png","images/icons/icon-bus-3.png","images/icons/icon-bus.png",
  "images/icons/icon-city-2.png","images/icons/icon-city-3.png","images/icons/icon-city.png","images/icons/icon-container.png",
  "images/icons/icon-dots-2.png","images/icons/icon-dots-3.png","images/icons/icon-dots-4.png","images/icons/icon-dots-5.png",
  "images/icons/icon-dots.png","images/icons/icon-dotted-map-2.png","images/icons/icon-dotted-map.png",
  "images/icons/icon-plane-1.png","images/icons/icon-plane-2.png","images/icons/icon-plane-3.png","images/icons/icon-plane-4.png",
  "images/icons/icon-plane-5.png","images/icons/icon-plane-6.png","images/icons/icon-plane-7.png","images/icons/icon-plane-8.png","images/icons/icon-plane-9.png",
  "images/icons/icon-quote-2.png","images/icons/icon-quote.png",
  "images/icons/icon-sailboat-line-1.png","images/icons/icon-sailboat-line-3.png","images/icons/icon-sailboat-line-4.png",
  "images/icons/icon-wheel-1.png","images/icons/icon-wheel-2.png","images/icons/icon-wheel-3.png","images/icons/icon-wheel-5.png",
  "images/icons/icon-wheel-compass-1.png","images/icons/icon-wheel-compass-2.png","images/icons/icon-wheel-compass-3.png",
  "images/icons/overlay-1.png","images/icons/overlay-2.png","images/icons/overlay-3.png","images/icons/overlay-4.png","images/icons/overlay-5.png","images/icons/overlay-6.png",
  "images/icons/pattern-1.png","images/icons/pattern-2.png","images/icons/pattern-3.png","images/icons/pattern-4.png","images/icons/pattern-5.png","images/icons/pattern-6.png","images/icons/pattern-7.png","images/icons/pattern-8.png",
  "images/icons/team-masking.png","images/logo.png",
  "images/resource/about2-1-mask.png","images/resource/cta1-1.png","images/resource/wcu1-1-mask.png"
)
foreach ($i in $cssUrlImgs) {
    if (Get-Asset $i "https://html.kodesolution.com/2026/yogava-html") { Write-Host "OK   $i" } else { Write-Host "FAIL $i"; $failed.Add($i) }
}

Write-Host "=== SUMMARY ==="
Write-Host "FAILED ($($failed.Count)):"
$failed | ForEach-Object { Write-Host "  $_" }
Write-Host "ALL-DONE"
