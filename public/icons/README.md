# PWA Icons

Please add the following icon files:
- icon-192.png (192x192 pixels)
- icon-512.png (512x512 pixels)

Recommended design:
- Background: Teal/blue gradient (#2563eb theme color)
- Symbol: "FN" text or field note clipboard icon
- Format: PNG with transparency
- Style: Modern, clean, professional

You can generate these icons using:
1. Online tools like https://realfavicongenerator.net/
2. Design tools like Figma, Canva, or Adobe Illustrator
3. Command-line tools like ImageMagick

Until you add real icons, the app will still work but may show a broken image on the home screen.

## Current Status

Temporary SVG icons have been created (icon-192.svg and icon-512.svg).

**Important:** For best PWA compatibility, you should convert these to PNG format:
1. Open the SVG files in a browser
2. Take screenshots or use an online converter (e.g., https://cloudconvert.com/svg-to-png)
3. Save as icon-192.png and icon-512.png
4. Update manifest.json to reference the PNG files

Alternatively, you can use the SVG files directly by updating the manifest.json:
```json
"icons": [
  { "src": "/public/icons/icon-192.svg", "sizes": "192x192", "type": "image/svg+xml" },
  { "src": "/public/icons/icon-512.svg", "sizes": "512x512", "type": "image/svg+xml" }
]
```
