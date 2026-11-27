# Abnahme v0.2.0

Stand: 27. November 2026. Entwicklungsfassung, keine Freigabe für laufende Shows.

## Automatisch

- TypeScript strict für React, Node-Bridge, Electron-Main und Preload erfolgreich.
- ESLint erfolgreich.
- 26 Tests erfolgreich: 12 Demo-/Sequenztests, 7 OSC-/UDP-Tests, 7 Server-/HTTP-Tests.
- Produktionsbuild und macOS-arm64-App-Bundle erfolgreich; lokale Ad-hoc-Signatur wird beim Packaging mit codesign geprüft.
- npm-Lockfile vorhanden; OSC benötigt keine zusätzliche Runtime-Bibliothek.

Die OSC-Tests benutzen echte UDP-Sockets auf Loopback und einen simulierten MA-Empfänger. Sie prüfen OSC-Adressierung/UTF-8/Padding, Konfiguration, Off-/Dezimal-Cues, unbekanntes Next, keine optimistische Fortschreibung, kein automatisches GO, Request-Deduplizierung, konkurrierende Requests, stabile Revisionen bei Heartbeats, Timeout ohne Retry, gefälschte Nonces, Stale/Recovery, vollständige Resynchronisation und Sequenzwechsel mit neuer Sperre. HTTP-Tests prüfen Bedienerschlüssel, Origin, abgewiesene freie Commands/Konfigurationsversuche und Schlüsselrotation nach Serverneustart. CI spricht niemals ein echtes Pult an.

## Echte lokale Testshow – ausdrücklich freigegeben

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

## Browser und Demo

Die Demo wurde zuvor mit GO+/GO−, Sperre, bestätigtem Reset, Nummernübernahme, ungültiger Eingabe und Verwerfen geprüft. Dokumentbreite entsprach dem Viewport bei 390×844, 768×1024 und 1024×768; Bedienelemente mindestens 44 CSS-Pixel hoch. Auch lange Sequenznummern erzeugten keinen horizontalen Überlauf. Live-Pultdaten, Lock, Pending, echter GO+, unbekanntes GO−-Ergebnis und Resynchronisation wurden im verfügbaren In-App-Browser geprüft.

## Noch offen

- Echtes iPad/Safari, Hardware-Touch, Safe Areas und Netzwerk-/WLAN-Ausfalltests.
- Native Electron-Fenster-/IPC-Bedienung, Doppelstart und Installation aus einem heruntergeladenen Artefakt. Die verfügbaren Browserwerkzeuge steuern keine nativen macOS-Fenster; das Bundle ist gebaut und seine Signatur geprüft.
- Generische Next-Cue-Abfrage. Ohne explizit geladenen Cue bleibt Next unbekannt; keine Index-/Loop-Annahme.
- Umfangreiche Shows, größere Cue-Mengen, Zeitformate/Sonderzustände, gleichzeitige Objektverschiebungen und stabile MA-Handles.
- Apple-Developer-Signatur, Notarisierung und DMG.
- Ein lokal erfolgreicher Build bestätigt nicht automatisch den GitHub-Workflow-Lauf.

Die eingebettete Node-Version der Desktop-Umgebung blockiert native Rollup-Module durch macOS-Library-Validation. Die Prüfungen nutzen deshalb eine unveränderte offizielle Node-24.22.3-Installation im temporären Verzeichnis. Bei regulär installiertem Node inklusive npm ist dieser Umweg nicht nötig.
