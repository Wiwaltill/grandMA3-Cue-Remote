# Roadmap

v0.1.0 ist implementiert und lokal geprüft; die Abnahme auf echtem iPad/Safari steht noch aus. Auf Benutzerwunsch ist zusätzlich eine grafische macOS-Serversteuerung für die Demo vorgezogen. v0.2.0 enthält die OSC-Bridge mit echten Sequenz-Snapshots und wurde auf der freigegebenen lokalen Testshow geprüft. Die vollständige Live-/Hardware-Abnahme bleibt offen.

## v0.1.0 – Demo (implementiert; Safari-Abnahme offen)
Responsive React/TypeScript-Oberfläche, Current/Next, Cue-Tabelle, Fortschritt, GO+/GO−, Lock, Reset. Lokaler Demo-Adapter ohne Netzwerk zum Pult. Akzeptanz: Build, Tests und Bedienung in Safari; Demo eindeutig sichtbar.

## v0.2.0 – OSC (implementiert, lokale Testshow geprüft)
Node-Bridge, konfigurierbare IP/Ports, gezieltes GO+/GO−, validierte OSC-Konfiguration, Testshow. UDP-Kodierung, gezieltes GO+/GO−, IP/Port/Präfix/DataPool/Sequenz-Konfiguration per UI und echte Rückmeldung sind implementiert. Lokale Testshow: GO+ und Pultfeedback geprüft; GO− am Listenanfang führte korrekt zu unbekanntem Ergebnis und Sperre. Automatische Tests prüfen genau einen Versand und keine Wiederholung. Allgemeine Show-Abnahme bleibt offen.

## v0.3.0 – Sequenzdaten (teilweise vorgezogen)
Lua-Integrationsprototyp, Sequenzauswahl, Cue-Nummern/Namen/Fade, DataPool-Kontext. Akzeptanz: dokumentierte und getestete Datenübertragung aus MA 2.5.1.1; Fallback bei fehlender API.

## v0.4.0 – Live-Feedback
Autoritativer Current/Next-Status, WebSocket-Snapshots, Änderungen am Pult, automatische Scrollposition. Akzeptanz: externe GO-Aktion und Reconnect werden korrekt angezeigt; Loop/Off/Tracking-Sonderfälle geprüft.

## v0.5.0 – Betriebssicherheit
Serverseitige Sperren, Request-Deduplizierung, keine Offline-Queue, bestätigtes Goto, Session-/Bedienerrechte, Read-only-Clients. Akzeptanz: Ausfall-, Doppelclick-, Multi-Client- und Wiederverbindungstests.

## v0.6.0 – iPad
Hoch-/Querformat, Safe Areas, Touch-Ziele, Homescreen-Metadaten, Safari-Test auf echtem iPad. Kein Offline-Caching von Live-Kommandos.

## v1.0.0 – macOS Release
Electron-App, Serverkonfiguration und Start/Stop, arm64-DMG via GitHub Actions, Setup-Anleitung für MA und Netzwerk, Release-Checks. Signierung/Notarisierung abhängig von verfügbaren Zertifikaten; Einschränkungen dokumentieren. Freigabe erst nach Test mit echtem Pult/onPC und iPad.

## Vorgezogen: grafischer Demo-Serverbetrieb
Desktop-Startfenster mit Server starten/stoppen, bestätigtem HTTP-Status, Portwahl, expliziter LAN-Freigabe, Browser öffnen und eigenständigem arm64-App-Bundle. Bedienung per Doppelklick ohne Terminal. Lokaler Build und Servertests vorhanden; native GUI-Abnahme noch offen. Dieser Teil ersetzt nicht die spätere DMG-/Signierungs- oder Hardware-Abnahme von v1.0.0.

## Vorgezogen: Sequenznummer eingeben
Auf Benutzerwunsch ist die Eingabe/Übernahme der Sequenznummer in der Web-UI vorhanden, derzeit ausschließlich für virtuelle Demo-Sequenzen. Validierung, Sperre bei unbestätigter Eingabe und Wechsel ohne automatisches Playback sind umgesetzt. Reale Auswahl, Existenzprüfung und Cuedaten aus grandMA3 bleiben bei v0.3.0 und der Live-Anbindung.

## Live-Stand v0.2.0
Echte Cue-Liste und Current/Off kommen aus lesenden Lua-Abfragen über OSC; kein Pluginimport nötig. Der Übertragungsweg nutzt auf der Zielversion vorhandene und auf der Testshow geprüfte socket-/json-Module. Seit v0.2.1 zeigt Next auf ausdrücklichen Benutzerwunsch immer den folgenden Listeneintrag (Off: erster Cue, Listenende: kein weiterer Eintrag). Goto folgt später. Eine allgemeine pultbestätigte Next-Abfrage, stabile Handles, größere Shows, Netzwerk-Ausfall-Abnahme und echtes iPad/Safari bleiben offen. Server-Token, Origin-Prüfung, Lock, Frische, Deduplizierung, ein ausstehender Befehl und explizite Resynchronisation sind als notwendige Basis vorgezogen, ersetzen aber keine Produktionsabnahme von v0.5.0.

## v0.2.1 – Next aus der Cueliste
Benutzerentscheidung umgesetzt: NEXT CUE ist immer der Listennachfolger nach dem bestätigten Current. Dezimal-Cues bleiben erhalten; Karte, Tabelle und GO+-Beschriftung sind konsistent. Goto bleibt ein späterer Meilenstein. Kein zusätzlicher Playback-Befehl durch die Anzeige.
