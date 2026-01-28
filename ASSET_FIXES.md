# Asset File Fixes Required

## Issue Summary
The following asset files have issues that need to be manually fixed:

1. **icon.png** - File extension is `.png` but content is actually JPG format. Also, the image is not square (dimensions: 1248x567, but should be square for icons).

2. **adaptive-icon.png** - File extension is `.png` but content is actually JPG format. Also, the image is not square (dimensions: 1248x567, but should be square for adaptive icons).

3. **splash.png** - File extension is `.png` but content is actually JPG format. The splash screen can have any aspect ratio, but the file extension should match the content.

## How to Fix

### For icon.png and adaptive-icon.png:
1. Open the image in an image editor (e.g., Photoshop, GIMP, or online tools like Photopea)
2. **Crop the image to be square** (1:1 aspect ratio)
   - Recommended sizes: 1024x1024 pixels for best quality
   - Minimum: 512x512 pixels
3. **Export/Save as PNG format** (not JPG)
4. Replace the existing `icon.png` and `adaptive-icon.png` files in the `assets/` folder

### For splash.png:
1. Open the image in an image editor
2. **Export/Save as PNG format** (not JPG)
   - If you prefer JPG, you can rename the file to `splash.jpg` and update `app.json` to reference `./assets/splash.jpg`
3. Replace the existing `splash.png` file in the `assets/` folder

## Alternative: Use Online Tools
- Use [Squoosh](https://squoosh.app/) to convert JPG to PNG
- Use [Remove.bg](https://www.remove.bg/) or similar tools to create square icons
- Use [Canva](https://www.canva.com/) to create properly sized square icons

## After Fixing
Once you've replaced the files with proper PNG images:
1. Run `npx expo doctor` to verify the fixes
2. The asset validation errors should be resolved

