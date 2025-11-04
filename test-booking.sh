#!/bin/bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"vorname":"Test","nachname":"User","email":"test@test.de","telefon":"123456","checkin":"2024-11-15T00:00:00.000Z","checkout":"2024-11-16T00:00:00.000Z","doppelzimmer":1,"einzelzimmer":0,"familienzimmer":0,"wuensche":"Test"}' \
  "https://script.google.com/macros/s/AKfycbwOaLB8mCh53n7bylqAcR_Csz1u53siPA_ptk7GDWOt0X-OORRKNUzltChUJNz_KQ2BFQ/exec"
