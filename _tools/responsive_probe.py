#!/usr/bin/env python3
"""Responsive layout metrics probe — run in page context via paste or eval."""
# This file documents the metrics collected at each breakpoint.
# Metrics JSON collected via CDP Runtime.evaluate:
# {
#   "bodyH": document.body.scrollHeight,
#   "overflowX": document.documentElement.scrollWidth - document.documentElement.clientWidth,
#   "hero": size+offset of .banner-section .auto-container .row,
#   "bannerTitle": font-size of .banner-title,
#   "mobileToggler": display of .mobile-nav-toggler (visible < 1200px),
#   "nav": display of .main-menu (hidden < 1200px),
#   "pricingCols": computed width of .pricing-block,
#   "blogImg": height of .blog-block .image,
#   "footerNav": wrapped or row
# }
print("see comments")
