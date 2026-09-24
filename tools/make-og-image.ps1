# Regenerates og-image.png (the 1200x630 link-preview card) from prateek.jpg.
# Run from the repo root:  powershell -ExecutionPolicy Bypass -File tools\make-og-image.ps1
Add-Type -AssemblyName System.Drawing
$dir = Split-Path -Parent $PSScriptRoot
function C($hex) { [System.Drawing.ColorTranslator]::FromHtml($hex) }

$bmp = New-Object System.Drawing.Bitmap 1200, 630
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'; $g.TextRenderingHint = 'AntiAliasGridFit'
$g.Clear((C '#08090b'))

# soft lime glow
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddEllipse(700, -350, 800, 800)
$pgb = New-Object System.Drawing.Drawing2D.PathGradientBrush $path
$pgb.CenterColor = [System.Drawing.Color]::FromArgb(60, 212, 255, 63)
$pgb.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 212, 255, 63))
$g.FillPath($pgb, $path)

# black-and-white portrait in a rounded frame
$src = [System.Drawing.Image]::FromFile("$dir\prateek.jpg")
$pw = 380; $ph = 475; $px = 760; $py = 78; $r = 36
$ia = New-Object System.Drawing.Imaging.ImageAttributes
$cm = New-Object System.Drawing.Imaging.ColorMatrix (,[single[][]]@(
  [single[]]@(0.30,0.30,0.30,0,0), [single[]]@(0.59,0.59,0.59,0,0), [single[]]@(0.11,0.11,0.11,0,0),
  [single[]]@(0,0,0,1,0), [single[]]@(0,0,0,0,1)))
$ia.SetColorMatrix($cm)
$clip = New-Object System.Drawing.Drawing2D.GraphicsPath
$clip.AddArc($px, $py, $r*2, $r*2, 180, 90); $clip.AddArc($px+$pw-$r*2, $py, $r*2, $r*2, 270, 90)
$clip.AddArc($px+$pw-$r*2, $py+$ph-$r*2, $r*2, $r*2, 0, 90); $clip.AddArc($px, $py+$ph-$r*2, $r*2, $r*2, 90, 90); $clip.CloseFigure()
$g.SetClip($clip)
$g.DrawImage($src, (New-Object System.Drawing.Rectangle $px, $py, $pw, $ph), 0, 0, $src.Width, $src.Height, [System.Drawing.GraphicsUnit]::Pixel, $ia)
$g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(40, 212, 255, 63))), $px, $py, $pw, $ph)
$g.ResetClip(); $src.Dispose()

# text
$white = New-Object System.Drawing.SolidBrush (C '#ecebe6')
$muted = New-Object System.Drawing.SolidBrush (C '#8b8a84')
$lime  = New-Object System.Drawing.SolidBrush (C '#d4ff3f')
$g.FillEllipse($lime, 72, 104, 14, 14)
$dot = [char]0x00B7   # middle dot, written as a code so the file encoding can't mangle it
$g.DrawString("LEAD ENGINEER  $dot  JAVA  $dot  FLUTTER",(New-Object System.Drawing.Font 'Consolas', 19), $lime, 96, 96)
$big = New-Object System.Drawing.Font 'Segoe UI', 112, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
$g.DrawString('Prateek', $big, $white, 58, 140)
$g.DrawString('Garg', $big, $white, 58, 262)
$g.DrawString('*', (New-Object System.Drawing.Font 'Segoe UI', 84, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)), $lime, 330, 262)
$body = New-Object System.Drawing.Font 'Segoe UI', 27, ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
$g.DrawString('Hands-on lead. Offline-first Java and Flutter', $body, $muted, 72, 430)
$g.DrawString('systems at national scale. Team of 10+ engineers.', $body, $muted, 72, 466)

$pill = New-Object System.Drawing.Drawing2D.GraphicsPath
$pill.AddArc(72, 530, 44, 44, 90, 180); $pill.AddArc(330, 530, 44, 44, 270, 180); $pill.CloseFigure()
$g.FillPath($lime, $pill)
$g.DrawString('OPEN TO UK ROLES', (New-Object System.Drawing.Font 'Consolas', 17, ([System.Drawing.FontStyle]::Bold)), (New-Object System.Drawing.SolidBrush (C '#0a0b0d')), 110, 540)
$g.DrawString('prateekgarg.dev', (New-Object System.Drawing.Font 'Consolas', 18), $white, 420, 540)

$bmp.Save("$dir\og-image.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Host "Wrote $dir\og-image.png"
