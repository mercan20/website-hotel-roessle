#!/bin/bash
curl -X POST \
  -F "vorname=Test" \
  -F "nachname=User" \
  -F "email=test@example.com" \
  -F "telefon=+49 7461 2913" \
  -F "checkin=2024-11-15" \
  -F "checkout=2024-11-18" \
  -F "einzelzimmer=1" \
  -F "doppelzimmer=0" \
  -F "familienzimmer=0" \
  -F "wuensche=Testanfrage" \
  -F "origin=https://www.hotelroessle.eu" \
  -F "userAgent=curl-test" \
  http://localhost:8000/booking.php
