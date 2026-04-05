Lower-third background video
=============================

1. Copy your template video here and name it exactly:

   lower-third.mov

   Example (macOS):
   cp "/path/to/tv-lower-third-uhd-....mov" browser/assets/lower-third.mov

2. Optional: add lower-third.mp4 (H.264) for better playback in OBS’s browser
   (Chromium sometimes plays MP4 more reliably than MOV). If present, the page
   tries .mp4 first, then .mov.

3. This file is gitignored when named lower-third.mov / lower-third.mp4 so the
   large UHD asset is not pushed to GitHub. Deploy the asset on your server
   separately, or use OBS with a Media Source under the Browser source instead.
