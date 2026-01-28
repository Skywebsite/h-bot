# PowerShell script to convert JPG to square PNG icon
Add-Type -AssemblyName System.Drawing

$sourceImage = Join-Path $PSScriptRoot "assets\icon-source.jpg"
$outputIcon = Join-Path $PSScriptRoot "assets\icon.png"
$outputAdaptiveIcon = Join-Path $PSScriptRoot "assets\adaptive-icon.png"
$iconSize = 1024

Write-Host "Loading source image: $sourceImage"

if (-not (Test-Path $sourceImage)) {
    Write-Host "Error: Source image not found at $sourceImage" -ForegroundColor Red
    exit 1
}

try {
    # Load the image
    $originalImage = [System.Drawing.Image]::FromFile($sourceImage)
    $width = $originalImage.Width
    $height = $originalImage.Height
    
    Write-Host "Original image dimensions: ${width}x${height}"
    
    # Calculate square crop (center crop)
    $size = [Math]::Min($width, $height)
    $left = [Math]::Floor(($width - $size) / 2)
    $top = [Math]::Floor(($height - $size) / 2)
    
    Write-Host "Cropping to square: ${size}x${size} from position ($left, $top)"
    
    # Create a square bitmap
    $squareBitmap = New-Object System.Drawing.Bitmap $size, $size
    $graphics = [System.Drawing.Graphics]::FromImage($squareBitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    # Draw the cropped portion
    $graphics.DrawImage($originalImage, 0, 0, (New-Object System.Drawing.Rectangle $left, $top, $size, $size), [System.Drawing.GraphicsUnit]::Pixel)
    $graphics.Dispose()
    
    # Resize to target size
    $resizedBitmap = New-Object System.Drawing.Bitmap $iconSize, $iconSize
    $resizedGraphics = [System.Drawing.Graphics]::FromImage($resizedBitmap)
    $resizedGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $resizedGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $resizedGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $resizedGraphics.DrawImage($squareBitmap, 0, 0, $iconSize, $iconSize)
    $resizedGraphics.Dispose()
    
    # Save as PNG
    $resizedBitmap.Save($outputIcon, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "Created icon.png ($iconSize x $iconSize)" -ForegroundColor Green
    
    # Save as adaptive icon (same image)
    $resizedBitmap.Save($outputAdaptiveIcon, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "Created adaptive-icon.png ($iconSize x $iconSize)" -ForegroundColor Green
    
    # Cleanup
    $originalImage.Dispose()
    $squareBitmap.Dispose()
    $resizedBitmap.Dispose()
    
    Write-Host ""
    Write-Host "Icon conversion complete!" -ForegroundColor Green
    Write-Host "The icons are now ready to use."
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

