"""Exportiert die Website-Bilder neu aus den Originalfotos.

Je Bild: fester Ausschnitt im Original, mehrere Breiten, jeweils JPG (Fallback) sowie WebP und AVIF
im Ordner images/optimized/ (gleiche Struktur und Qualität wie convert_images.py).
Die Ausschnitte stehen unten in IMAGES; neue Breiten müssen auch im srcset in index.html stehen.

Voraussetzung: pip install pillow (ab Version 11.2, mit AVIF-Unterstützung)
Aufruf (aus dem Repo-Ordner):
    python scripts/image-converter/export_site_images.py "G:\\Hotel Rössle\\Allgemein\\Bilder" .
    python scripts/image-converter/export_site_images.py "G:\\Hotel Rössle\\Allgemein\\Bilder" . --preview <Ordner>
      → nur eine Vorschau der Ausschnitte (crops-neu.png), nichts wird geschrieben
    ... --only hero/   → nur die Bilder, deren Name so beginnt
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps

SRC = Path(sys.argv[1])
REPO = Path(sys.argv[2])
PREVIEW = Path(sys.argv[sys.argv.index("--preview") + 1]) if "--preview" in sys.argv else None
ONLY = sys.argv[sys.argv.index("--only") + 1] if "--only" in sys.argv else None  # z. B. --only hero/

QUALITY_JPG, QUALITY_WEBP, QUALITY_AVIF = 80, 80, 60

# Ziel (ohne Breite und Endung) -> Quelle, Ausschnitt (x, y, b, h) im Original, Breiten
IMAGES = {
    # Hero: 2:1, Bogenfenster mit Blumen, Eingang und Fahrräder groß im Bild (links das Nachbarhaus unter dem Verlauf)
    "hero/fassade": ("Bilder Aussen/DSC_3021_1_NEU.jpg", (700, 1150, 3147, 1574), [960, 1440, 1920, 2560]),
    # Über uns und Tagungen: 5:4, volle Höhe des Originals
    "events/gaststube-theke": ("Bilder Innen/01.jpg", (800, 0, 5040, 4032), [800, 1200, 1600]),
    "events/gaststube": ("Bilder Innen/05.jpg", (504, 0, 5040, 4032), [800, 1200, 1600]),
    # Zimmer: 3:2. Bei 15, 16 und 17 ragt unten ein graues Teil ins Bild, das fällt weg
    "zimmer/einzelzimmer-1": ("Bilder Innen/16.jpg", (2050, 1200, 3150, 2100), [480, 800, 1200, 1600]),
    "zimmer/einzelzimmer-2": ("Bilder Innen/15.jpg", (454, 0, 5140, 3427), [800, 1600]),
    "zimmer/einzelzimmer-3": ("Bilder Innen/17.jpg", (544, 0, 4959, 3306), [800, 1600]),
    "zimmer/doppelzimmer-1": ("Bilder Innen/13.jpg", (0, 0, 6048, 4032), [480, 800, 1200, 1600]),
    "zimmer/familienzimmer-1": ("Bilder Innen/08.jpg", (0, 0, 6048, 4032), [480, 800, 1200, 1600]),
    "zimmer/familienzimmer-2": ("Bilder Innen/11.jpg", (0, 0, 6048, 4032), [800, 1600]),
    "zimmer/familienzimmer-3": ("Bilder Innen/10.jpg", (0, 0, 6048, 4032), [800, 1600]),
    "zimmer/familienzimmer-4": ("Bilder Innen/09.jpg", (0, 0, 6048, 4032), [800, 1600]),
    "zimmer/bad-1": ("Bilder Innen/14.jpg", (0, 0, 6048, 4032), [800, 1600]),
}


def open_crop(rel, box):
    with Image.open(SRC / rel) as im:
        im = ImageOps.exif_transpose(im).convert("RGB")
        x, y, w, h = box
        assert x >= 0 and y >= 0 and x + w <= im.width and y + h <= im.height, f"Ausschnitt außerhalb: {rel} {box} {im.size}"
        return im.crop((x, y, x + w, y + h))


def preview():
    PREVIEW.mkdir(parents=True, exist_ok=True)
    tiles = []
    for name, (rel, box, _) in IMAGES.items():
        with Image.open(SRC / rel) as im:
            full = im.size
            im.draft("RGB", (900, 900))
            im = ImageOps.exif_transpose(im).convert("RGB")
        im.thumbnail((440, 440))
        s = im.width / full[0]
        x, y, w, h = box
        dim = Image.new("RGB", im.size, "black")
        mask = Image.new("L", im.size, 150)
        ImageDraw.Draw(mask).rectangle([x * s, y * s, (x + w) * s, (y + h) * s], fill=0)
        im = Image.composite(dim, im, mask)  # außerhalb des Ausschnitts abgedunkelt
        tiles.append((f"{name}  ({w}x{h}, {w / h:.2f}:1)", im))
    cols, cw, ch = 3, 450, 330
    sheet = Image.new("RGB", (cols * cw, ((len(tiles) + cols - 1) // cols) * ch), "white")
    d = ImageDraw.Draw(sheet)
    for i, (label, im) in enumerate(tiles):
        px, py = (i % cols) * cw + 5, (i // cols) * ch + 4
        d.text((px, py), label, fill="black")
        sheet.paste(im, (px, py + 16))
    sheet.save(PREVIEW / "crops-neu.png")
    print("Vorschau:", PREVIEW / "crops-neu.png")


def export():
    total = {"jpg": 0, "webp": 0, "avif": 0}
    for name, (rel, box, widths) in IMAGES.items():
        if ONLY and not name.startswith(ONLY):
            continue
        crop = open_crop(rel, box)
        for w in widths:
            h = round(w * crop.height / crop.width)
            img = crop.resize((w, h), Image.LANCZOS)
            jpg = REPO / "images" / f"{name}-{w}.jpg"
            opt = REPO / "images" / "optimized" / f"{name}-{w}"
            jpg.parent.mkdir(parents=True, exist_ok=True)
            opt.parent.mkdir(parents=True, exist_ok=True)
            # Ohne EXIF (Kamera-/Ortsdaten), sRGB wie das Original
            img.save(jpg, "JPEG", quality=QUALITY_JPG, optimize=True, progressive=True)
            img.save(opt.with_suffix(".webp"), "WEBP", quality=QUALITY_WEBP, method=6)
            img.save(opt.with_suffix(".avif"), "AVIF", quality=QUALITY_AVIF, speed=4)
            sizes = {ext: (opt.with_suffix(f".{ext}") if ext != "jpg" else jpg).stat().st_size for ext in total}
            for ext, b in sizes.items():
                total[ext] += b
            print(f"{name}-{w}  {w}x{h}  jpg {sizes['jpg'] // 1024} KB  webp {sizes['webp'] // 1024} KB  avif {sizes['avif'] // 1024} KB")
    print("Summe:", {k: f"{v / 1024 / 1024:.1f} MB" for k, v in total.items()})


if __name__ == "__main__":
    preview() if PREVIEW else export()
