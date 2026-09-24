# Regenerates apple-touch-icon.png (180x180) to match favicon.svg: "PG" + lime dot.
# Run from the repo root:  powershell -ExecutionPolicy Bypass -File tools\make-icon.ps1
Add-Type -AssemblyName System.Drawing
$dir = Split-Path -Parent $PSScriptRoot
function C($hex) { [System.Drawing.ColorTranslator]::FromHtml($hex) }

$s = 180
$bmp = New-Object System.Drawing.Bitmap $s, $s
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'; $g.TextRenderingHint = 'AntiAliasGridFit'
$g.Clear((C '#08090b'))

$font = New-Object System.Drawing.Font 'Segoe UI', 72, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
$fmt = [System.Drawing.StringFormat]::GenericTypographic
$size = $g.MeasureString('PG', $font, 1000, $fmt)
$dot = 18; $gap = 6
$x = ($s - ($size.Width + $gap + $dot)) / 2
$y = ($s - $size.Height) / 2
$g.DrawString('PG', $font, (New-Object System.Drawing.SolidBrush (C '#ecebe6')), $x, $y, $fmt)
$baseline = $y + $size.Height * 0.80
$g.FillEllipse((New-Object System.Drawing.SolidBrush (C '#d4ff3f')), $x + $size.Width + $gap, $baseline - $dot, $dot, $dot)

$bmp.Save("$dir\apple-touch-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
