# Roadmap

Alle Meilensteine sind geplant, noch nicht implementiert.

## v0.1.0 – Demo
Responsive React/TypeScript-Oberfläche, Current/Next, Cue-Tabelle, Fortschritt, GO+/GO−, Lock, Reset. Lokaler Demo-Adapter ohne Netzwerk zum Pult. Akzeptanz: Build, Tests und Bedienung in Safari; Demo eindeutig sichtbar.

## v0.2.0 – OSC
Node-Bridge, konfigurierbare IP/Ports, gezieltes GO+/GO−, validierte OSC-Konfiguration, Testshow. Akzeptanz: ein Tastendruck löst genau einen gezielten Befehl aus; unbekanntes Ergebnis wird nicht als Erfolg angezeigt.

## v0.3.0 – Sequenzdaten
Lua-Integrationsprototyp, Sequenzauswahl, Cue-Nummern/Namen/Fade, DataPool-Kontext. Akzeptanz: dokumentierte und getestete Datenübertragung aus MA 2.5.1.1; Fallback bei fehlender API.

## v0.4.0 – Live-Feedback
Autoritativer Current/Next-Status, WebSocket-Snapshots, Änderungen am Pult, automatische Scrollposition. Akzeptanz: externe GO-Aktion und Reconnect werden korrekt angezeigt; Loop/Off/Tracking-Sonderfälle geprüft.

## v0.5.0 – Betriebssicherheit
Serverseitige Sperren, Request-Deduplizierung, keine Offline-Queue, bestätigtes Goto, Session-/Bedienerrechte, Read-only-Clients. Akzeptanz: Ausfall-, Doppelclick-, Multi-Client- und Wiederverbindungstests.

## v0.6.0 – iPad
Hoch-/Querformat, Safe Areas, Touch-Ziele, Homescreen-Metadaten, Safari-Test auf echtem iPad. Kein Offline-Caching von Live-Kommandos.

## v1.0.0 – macOS Release
Electron-App, Serverkonfiguration und Start/Stop, arm64-DMG via GitHub Actions, Setup-Anleitung für MA und Netzwerk, Release-Checks. Signierung/Notarisierung abhängig von verfügbaren Zertifikaten; Einschränkungen dokumentieren. Freigabe erst nach Test mit echtem Pult/onPC und iPad.
