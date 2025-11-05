#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Konvertiert Bilder (PNG/JPG, optional SVG) zu AVIF & WebP (maximaler Effort)
und erstellt ein CSV-Log mit Einsparungen. Rekursive Verarbeitung von Unterordnern.
"""

from pathlib import Path
from PIL import Image
import pillow_avif  # noqa: F401
import csv
import sys
import tempfile
import os

os.environ['path'] += r';C:\Program Files\GTK3-Runtime Win64\bin'
# ---------------------- Konfiguration ----------------------
QUALITY_WEBP = 80
EFFORT_WEBP = 6
QUALITY_AVIF = 60
EFFORT_AVIF = 10
CSV_FILE = "conversion_log.csv"
SVG_SUPPORT = False
# ------------------------------------------------------------

# Optionales Modul laden
# try:
#     import cairosvg
#     SVG_SUPPORT = True
# except ImportError:
#     SVG_SUPPORT = False
#     pass

    


def convert_svg_to_png(svg_path: Path) -> Path:
    """Konvertiert SVG temporär zu PNG für Pillow-Verarbeitung."""
    tmp_png = Path(tempfile.gettempdir()) / f"{svg_path.stem}_temp.png"
    cairosvg.svg2png(url=str(svg_path), write_to=str(tmp_png))
    return tmp_png


def convert_image(img_path: Path, output_dir: Path):
    """Konvertiert ein einzelnes Bild zu AVIF & WebP und gibt Statistik zurück."""
    input_size = img_path.stat().st_size / 1024.0  # KB
    base_name = img_path.stem

    # SVG nur verarbeiten, wenn unterstützt
    temp_path = None
    if img_path.suffix.lower() == ".svg":
        if not SVG_SUPPORT:
            print(f"[SKIP] {img_path.name} (SVG-Unterstützung nicht installiert)")
            return None
        temp_path = convert_svg_to_png(img_path)
        img_path_to_open = temp_path
    else:
        img_path_to_open = img_path

    img = Image.open(img_path_to_open)
    img.load()

    webp_path = output_dir / f"{base_name}.webp"
    avif_path = output_dir / f"{base_name}.avif"

    # WebP speichern
    img.save(webp_path, "WEBP", quality=QUALITY_WEBP, method=EFFORT_WEBP)
    # AVIF speichern
    img.save(avif_path, "AVIF", quality=QUALITY_AVIF, effort=EFFORT_AVIF)

    if temp_path and temp_path.exists():
        temp_path.unlink()

    webp_size = webp_path.stat().st_size / 1024.0
    avif_size = avif_path.stat().st_size / 1024.0

    webp_saving_kb = input_size - webp_size
    avif_saving_kb = input_size - avif_size
    webp_saving_percent = (webp_saving_kb / input_size) * 100
    avif_saving_percent = (avif_saving_kb / input_size) * 100

    return {
        "input": str(img_path),
        "input_size_kb": round(input_size, 2),
        "avif_output": str(avif_path),
        "avif_size_kb": round(avif_size, 2),
        "avif_saving_kb": round(avif_saving_kb, 2),
        "avif_saving_percent": round(avif_saving_percent, 2),
        "webp_output": str(webp_path),
        "webp_size_kb": round(webp_size, 2),
        "webp_saving_kb": round(webp_saving_kb, 2),
        "webp_saving_percent": round(webp_saving_percent, 2),
    }


def write_csv_log(results, csv_path: Path):
    """Schreibt Ergebnisse in eine CSV-Datei + Summen."""
    if not results:
        print("[INFO] Keine konvertierten Bilder vorhanden.")
        return

    headers = list(results[0].keys())
    total_avif_kb = sum(r["avif_saving_kb"] for r in results)
    total_webp_kb = sum(r["webp_saving_kb"] for r in results)
    total_input_kb = sum(r["input_size_kb"] for r in results)

    total_avif_percent = (total_avif_kb / total_input_kb) * 100
    total_webp_percent = (total_webp_kb / total_input_kb) * 100

    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=headers, delimiter=";")
        writer.writeheader()
        writer.writerows(results)
        writer.writerow({})
        writer.writerow({
            "input": "GESAMT",
            "input_size_kb": round(total_input_kb, 2),
            "avif_saving_kb": round(total_avif_kb, 2),
            "avif_saving_percent": round(total_avif_percent, 2),
            "webp_saving_kb": round(total_webp_kb, 2),
            "webp_saving_percent": round(total_webp_percent, 2),
        })

    print(f"\n[INFO] CSV-Log gespeichert unter: {csv_path}")
    print(f"[INFO] Gesamt-Ersparnis AVIF: {round(total_avif_kb,2)} KB ({round(total_avif_percent,2)} %)")
    print(f"[INFO] Gesamt-Ersparnis WebP: {round(total_webp_kb,2)} KB ({round(total_webp_percent,2)} %)")


def convert_folder(folder: Path):
    """Rekursiv alle Unterordner durchsuchen und Bilder konvertieren."""
    if not folder.exists():
        print(f"[ERROR] Ordner nicht gefunden: {folder}")
        return

    output_dir = folder / "optimized"
    output_dir.mkdir(exist_ok=True)

    # Alle unterstützten Dateien finden
    extensions = [".png", ".jpg", ".jpeg"]
    if SVG_SUPPORT:
        extensions.append(".svg")

    images = [p for p in folder.rglob("*") if p.suffix.lower() in extensions]
    if not images:
        print("[INFO] Keine unterstützten Bilddateien gefunden.")
        return

    results = []
    for i, img_path in enumerate(images, 1):
        print(f"[{i}/{len(images)}] Verarbeite: {img_path.relative_to(folder)}")
        try:
            rel_dir = img_path.parent.relative_to(folder)
            target_dir = output_dir / rel_dir
            target_dir.mkdir(parents=True, exist_ok=True)

            res = convert_image(img_path, target_dir)
            if res:
                results.append(res)
        except Exception as e:
            print(f"[ERROR] Fehler bei {img_path.name}: {e}")

    write_csv_log(results, folder / CSV_FILE)


def interactive_mode():
    """Interaktiver Modus: Benutzer wählt Ordner."""
    print("Interaktiver Modus")
    folder = input("Bitte Pfad zum Bilderordner eingeben: ").strip('" ')
    if not folder:
        print("[ERROR] Kein Pfad eingegeben.")
        return
    convert_folder(Path(folder))


def main():
    if len(sys.argv) > 1:
        path = Path(sys.argv[1])
        if path.is_file():
            print(f"[INFO] Konvertiere einzelne Datei: {path.name}")
            res = convert_image(path, path.parent / "optimized")
            if res:
                write_csv_log([res], path.parent / CSV_FILE)
        elif path.is_dir():
            convert_folder(path)
        else:
            print("[ERROR] Ungültiger Pfad.")
    else:
        interactive_mode()


if __name__ == "__main__":
    main()
