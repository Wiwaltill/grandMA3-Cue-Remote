# Abnahme v0.2.2

Stand: 27. November 2026. Entwicklungsfassung, keine Freigabe für laufende Shows.

## Automatisch

- TypeScript strict für React, Node-Bridge, Electron-Main und Preload erfolgreich.
- ESLint erfolgreich.
- 19 Tests erfolgreich: 2 Fade-Berechnungstests, 10 OSC-/UDP-Tests, 7 Server-/HTTP-Tests.
- Produktionsbuild und macOS-arm64-App-Bundle erfolgreich; lokale Ad-hoc-Signatur wird beim Packaging mit codesign geprüft.
- npm-Lockfile vorhanden; OSC benötigt keine zusätzliche Runtime-Bibliothek.

Die OSC-Tests benutzen echte UDP-Sockets auf Loopback und einen simulierten MA-Empfänger. Sie prüfen OSC-Adressierung/UTF-8/Padding, Konfiguration, Off-/Dezimal-Cues, Next als Listennachfolger, keine optimistische Fortschreibung, kein automatisches GO, Request-Deduplizierung, konkurrierende Requests, stabile Revisionen bei Heartbeats, Timeout ohne Retry, gefälschte Nonces, Stale/Recovery, vollständige Resynchronisation und Sequenzwechsel mit neuer Sperre. HTTP-Tests prüfen Bedienerschlüssel, Origin, abgewiesene freie Commands/Konfigurationsversuche und Schlüsselrotation nach Serverneustart. CI spricht niemals ein echtes Pult an.

## Echte lokale Testshow v0.2.0 – ausdrücklich freigegeben

Der Benutzer bestätigte eine separate geöffnete Testshow und gab den Verbindungstest frei. Getestet wurde grandMA3 onPC **2.5.1.1 auf demselben Mac**.

1. Offiziellen OSC-Command-Eingang auf UDP 8000 erreicht. Der lokale Schnittstellen-Zugriff funktionierte; Loopback 127.0.0.1 lieferte im konkreten Setup keine Antwort. Leeres Präfix funktionierte.
2. Rein lesende Lua-Abfragen über OSC lieferten Versionsnummer, Sequenzeigenschaften, Cue-Liste und Fade. Verfügbarkeit von socket/json und Objektmethoden wurde mit ausgelieferten MA-Ressourcen abgeglichen und durch tatsächliche Antworten bestätigt.
3. Implementierte Bridge verband sich mit DataPool 1 / Sequenz 1. Der Snapshot enthielt tatsächlichen Namen, Cue 1, Fade 1 s, Off und unbekanntes Next. Keine Demo-Cues im Live-Modus.
4. Die Live-Weboberfläche wurde über ihren zeitlich auf den Serverlauf begrenzten Bedienerlink geöffnet. Sie zeigte ONLINE erst nach echter gültiger Antwort und begann gesperrt. Ziel-DataPool und Sequenz waren sichtbar.
5. Nach explizitem Entsperren wurde einmal GO+ im Browser betätigt. Zunächst Pending und deaktivierte Bedienung; erst die spätere MA-Rückmeldung zeigte tatsächlichen Current Cue 1 und laufendes Playback.
6. Ein GO− am ersten/einzigen Cue änderte den Pultstatus nicht. Die App meldete nach Timeout korrekt „Ergebnis unbekannt“, STALE und gesperrt. Sie wiederholte den GO nicht automatisch.
7. „Neu synchronisieren“ wechselte auf CONNECTING und nach vollständiger neuer Antwort auf ONLINE. Die Bedienung blieb bis zur bewussten Freigabe gesperrt.
8. Die gezielt getestete Sequenz wurde anschließend auf ihren ursprünglichen Off-Zustand zurückgesetzt; die Live-Oberfläche bestätigte Off und Position 0/1. Keine Cue-Programmierung, kein Showfile-Export und kein Pluginimport durchgeführt.

Die echte Abnahme bestätigt diese lokale Konstellation. Sie bestätigt weder jede Cue-/Loop-/Restart-Konfiguration noch verlorene UDP-Pakete oder Ende-zu-Ende-Exactly-once-Semantik.

## Pause und berechnete Fade-Vorschau v0.2.2

Erneuter ausdrücklich freigegebener Test mit grandMA3 onPC 2.5.1.1 und separater Testshow: Ausgangszustand Off geprüft, GO+ durch tatsächliche Statusantwort bestätigt, danach Pause und Fortsetzen jeweils durch MA-`Cmd`-Rückgabe `OK` bestätigt. Die berechnete Vorschau blieb während Pause stehen und lief anschließend weiter. Abschließend Pause Off und Off für ausschließlich die getestete Sequenz gesendet; ursprünglicher Off-Zustand durch erneute Statusantwort bestätigt.

Die geprüfte MA-API liefert gespeicherte Fade-Zeiten, jedoch keinen verifizierten laufenden Fade-Prozentwert. Der Benutzer wählte ausdrücklich eine als berechnet markierte Vorschau. Sie ist keine gemessene Pultfortschrittsanzeige. Externe Pause-/Rate-/Delay-Änderungen sind damit nicht zuverlässig erkennbar. Beim Verbindungsaufbau wird für bereits laufende Cues kein Beginn erfunden.

UDP-Regressionstests prüfen außerdem: Pause bleibt bis zur passenden MA-Bestätigung pending; Vorschau friert erst nach Bestätigung ein und setzt nach erneuter Bestätigung fort. Ohne Bestätigung sperrt Timeout trotz frischer Snapshots; kein automatisches Wiederholen. Reine Berechnungstests prüfen Begrenzung, Pause und unveränderliche Eingaben.

## Browser v0.2.2

Isolierter simulierter MA-Empfänger, kein Pultzugriff: Produktoberfläche enthält keine Demo-/Reset-Bedienung. Current/Next einschließlich Cue 1.5, GO+, Pause, Fortsetzen und berechneter Fortschritt geprüft. Die Vorschau blieb über mehrere Prüfungen bei 7 % stehen und lief nach Fortsetzen weiter. Fortschrittsbalken in Current-Karte und aktueller Tabellenzeile sichtbar. Bei 390×844 und 820×1180 entsprach die Dokumentbreite dem Viewport; GO− und Pause stehen nebeneinander, jeweils 54 CSS-Pixel hoch. Desktopansicht visuell geprüft. Der simulierte Empfänger ist ausschließlich ein temporäres Prüfwerkzeug, kein Produktmodus.

## Noch offen

- Echtes iPad/Safari, Hardware-Touch, Safe Areas und Netzwerk-/WLAN-Ausfalltests.
- Native Electron-Fenster-/IPC-Bedienung, Doppelstart und Installation aus einem heruntergeladenen Artefakt. Die verfügbaren Browserwerkzeuge steuern keine nativen macOS-Fenster; das Bundle ist gebaut und seine Signatur geprüft.
- Goto und eine generische pultbestätigte Next-Abfrage sind spätere Aufgaben. Die aktuelle Next-Anzeige folgt auf Benutzerwunsch der Cueliste.
- Umfangreiche Shows, größere Cue-Mengen, Zeitformate/Sonderzustände, gleichzeitige Objektverschiebungen und stabile MA-Handles.
- Apple-Developer-Signatur, Notarisierung und DMG.
- Ein lokal erfolgreicher Build bestätigt nicht automatisch den GitHub-Workflow-Lauf.

Die eingebettete Node-Version der Desktop-Umgebung blockiert native Rollup-Module durch macOS-Library-Validation. Die Prüfungen nutzen deshalb eine unveränderte offizielle Node-24.22.3-Installation im temporären Verzeichnis. Bei regulär installiertem Node inklusive npm ist dieser Umweg nicht nötig.

## Änderung v0.2.1: Next immer aus der Liste

Zusätzlicher Regressionstest prüft Off → erster Cue, laufender Cue → nächster Listeneintrag einschließlich Dezimal-Cues, Ende → kein Listeneintrag sowie eine leere Liste. Ein abweichender geladener Cue überschreibt den Listennachfolger nicht. Die frühere unbekannte Next-Anzeige des oben dokumentierten Ersttests ist damit ersetzt. Für diese reine Anzeigeänderung werden keine Befehle an ein echtes Pult gesendet.

Browserprüfung mit isoliertem simuliertem MA-Empfänger: Current 1 → Next 1.5 / Solo, nach GO+ Current 1.5 → Next 2 / Finale, nach weiterem GO+ Current 2 → Ende der Cueliste. Next-Karte, blaue Tabellenmarkierung und GO+-Beschriftung waren konsistent. Kein echtes Pult wurde dabei angesprochen.
