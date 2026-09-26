"""Generate Folio's simple vector-like app marks (requires Pillow)."""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
FONT = ROOT / "node_modules/@expo-google-fonts/space-grotesk/700Bold/SpaceGrotesk_700Bold.ttf"
DARK = (23, 26, 23, 255)
LIME = (199, 241, 118, 255)


def mark(size: int, background: bool, ink=LIME) -> Image.Image:
    scale = 4
    image = Image.new("RGBA", (size * scale, size * scale), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    if background:
        draw.rounded_rectangle((0, 0, size * scale - 1, size * scale - 1), radius=int(size * scale * 0.23), fill=DARK)
    font = ImageFont.truetype(str(FONT), int(size * scale * 0.57))
    text = "f."
    box = draw.textbbox((0, 0), text, font=font)
    x = (size * scale - (box[2] - box[0])) / 2 - box[0] - size * scale * 0.025
    y = (size * scale - (box[3] - box[1])) / 2 - box[1] - size * scale * 0.025
    draw.text((x, y), text, font=font, fill=ink)
    return image.resize((size, size), Image.Resampling.LANCZOS)


ASSETS.mkdir(exist_ok=True)
mark(1024, True).save(ASSETS / "icon.png")
mark(1024, False).save(ASSETS / "android-icon-foreground.png")
mark(1024, False, (255, 255, 255, 255)).save(ASSETS / "android-icon-monochrome.png")
Image.new("RGB", (1024, 1024), DARK[:3]).save(ASSETS / "android-icon-background.png")
mark(64, True).save(ASSETS / "favicon.png")
mark(1024, False).save(ASSETS / "splash-icon.png")
