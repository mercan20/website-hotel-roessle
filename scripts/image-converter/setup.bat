@echo off
setlocal

echo ==============================================
echo Python Image Converter Setup
echo ==============================================

:: Prüfen, ob Python installiert ist
python --version
if %errorlevel% neq 0 (
    echo.
    echo Python wurde nicht gefunden.
    echo Bitte installiere zuerst Python von:
    echo https://www.python.org/downloads/
    echo.
    echo Nach der Installation bitte dieses Skript erneut starten.
    pause
    exit /b 1
)

echo.
echo Python wurde gefunden.

:: Prüfen ob pip verfügbar ist
python -m pip --version
if %errorlevel% neq 0 (
    echo "pip (Python Package Manager) wurde nicht gefunden."
    echo Versuche pip zu installieren...
    python -m ensurepip --upgrade
)

echo.
echo Installiere benoetigte Bibliotheken ...
python -m pip install --upgrade pip
python -m pip install pillow pillow-avif-plugin cairosvg

if %errorlevel% neq 0 (
    echo Fehler beim Installieren der Bibliotheken.
    echo "Bitte manuell ausfuehren (ohne Anfuehrungszeichen):"
    echo "python -m pip install pillow pillow-avif-plugin cairosvg"
    pause
    exit /b 1
)

echo.
echo Setup erfolgreich abgeschlossen!
echo.
echo Du kannst jetzt das Skript mit folgendem Befehl starten:
echo python convert_images.py oder run.bat
echo achte darauf, dass du dich im Verzeichnis scripts/image-converter befindest.
echo.
pause
endlocal
