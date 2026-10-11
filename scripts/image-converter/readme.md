# 🖼️ Image Converter – AVIF & WebP Optimizer

Dieses Tool konvertiert automatisch PNG/JPG-Bilder zu AVIF und WebP mit maximaler Kompression (Effort).
Es erstellt zusätzlich eine CSV-Logdatei, in der Dateigrößen und Einsparungen dokumentiert werden.

## 🚀 Funktionen

- Unterstützt Einzeldatei- oder Ordner-Konvertierung
- Interaktiver Modus, wenn kein Pfad angegeben wird
- Erstellt optimierte Bilder im Unterordner "optimized"
- Erstellt CSV-Log mit Dateigrößen, Einsparung in KB und Prozent
- Nutzt maximale Effort-Stufen (beste Kompression)

## 🧰 Voraussetzungen

- Python 3.8 oder neuer muss installiert sein
- Internetverbindung für das erste Installieren der Bibliotheken (nur einmal nötig)

Benötigte Bibliotheken:
- pillow
- pillow-avif-plugin

## ⚙️ Installation

1.  Führe das Setup-Skript aus:
   ```
   setup_convert_images.bat
   ```
   Das Skript prüft, ob Python installiert ist und installiert automatisch die benötigten Pakete.

2. Danach kann das Tool gestartet werden.

## ℹ️ Nutzung

🔸 Einzelbild:
```
python convert_images.py path\zum\bild.png
```

🔸 Ganzer Ordner:
```
python convert_images.py path\zum\bilderordner
```

🔸 Interaktiv:
```
run.bat
```

## 📊 Ergebnis

- Optimierte Bilder liegen im Unterordner `optimized`
- Eine CSV-Datei `conversion_log.csv` wird erstellt, mit Spalten wie:

```
input;input_size_kb;avif_output;avif_size_kb;avif_saving_kb;avif_saving_percent;
webp_output;webp_size_kb;webp_saving_kb;webp_saving_percent
```

Am Ende werden auch die Gesamteinsparungen ausgegeben.

## 🧩 Beispielausgabe

```
[1/3] Verarbeite: hero.png
[2/3] Verarbeite: zimmer1.jpg
[3/3] Verarbeite: restaurant.png

Gesamt-Ersparnis AVIF: 3450.6 KB (85.7 %)
Gesamt-Ersparnis WebP: 2960.1 KB (74.3 %)
CSV-Log gespeichert unter: conversion_log.csv
```

## 💡 Hinweis

Für beste Ergebnisse sollten die Originalbilder bereits zugeschnitten und in geeigneter Auflösung vorliegen.

## 📐 Website-Bilder aus den Originalfotos (`export_site_images.py`)

Hero, Gaststube und Zimmerfotos werden direkt aus den Originalen in
`G:\Hotel Rössle\Allgemein\Bilder\Bilder Aussen` und `...\Bilder Innen` erzeugt: fester Ausschnitt je Foto,
mehrere Breiten (für `srcset`), jeweils JPG sowie WebP und AVIF unter `images/optimized/`.

```
python scripts/image-converter/export_site_images.py "G:\Hotel Rössle\Allgemein\Bilder" .
```

Mit `--preview <Ordner>` entsteht nur eine Vorschau der Ausschnitte. Ausschnitte und Breiten stehen im Skript (`IMAGES`).
