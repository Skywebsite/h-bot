const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

const sourceImage = path.join(__dirname, 'assets', 'icon-source.jpg');
const outputIcon = path.join(__dirname, 'assets', 'icon.png');
const outputAdaptiveIcon = path.join(__dirname, 'assets', 'adaptive-icon.png');

// Recommended icon size: 1024x1024 for best quality
const iconSize = 1024;

async function convertIcon() {
  try {
    console.log('Loading source image...');
    const image = await Jimp.read(sourceImage);
    const { width, height } = image.bitmap;
    
    console.log(`Original image dimensions: ${width}x${height}`);
    
    // Calculate square crop (center crop)
    const size = Math.min(width, height);
    const left = Math.floor((width - size) / 2);
    const top = Math.floor((height - size) / 2);
    
    console.log(`Cropping to square: ${size}x${size} from position (${left}, ${top})`);
    
    // Crop to square and resize
    const squareIcon = image
      .crop(left, top, size, size)
      .resize(iconSize, iconSize, Jimp.RESIZE_LANCZOS);
    
    // Save as icon.png
    await squareIcon.writeAsync(outputIcon);
    console.log(`✓ Created icon.png (${iconSize}x${iconSize})`);
    
    // Save as adaptive-icon.png (same image)
    await squareIcon.writeAsync(outputAdaptiveIcon);
    console.log(`✓ Created adaptive-icon.png (${iconSize}x${iconSize})`);
    
    console.log('\n✓ Icon conversion complete!');
    console.log('The icons are now ready to use.');
    
  } catch (error) {
    console.error('Error converting icon:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

convertIcon();

