# Roadmap

v0.1.0 wurde als Demo implementiert (seit v0.2.2 aus dem Produkt entfernt); die Abnahme auf echtem iPad/Safari steht noch aus. Auf Benutzerwunsch ist zusätzlich eine grafische macOS-Serversteuerung für die Demo vorgezogen. v0.2.0 enthält die OSC-Bridge mit echten Sequenz-Snapshots und wurde auf der freigegebenen lokalen Testshow geprüft. Die vollständige Live-/Hardware-Abnahme bleibt offen.

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

## v0.2.2 – ausschließlich Pultanbindung, Pause und Fade-Vorschau
Auf Benutzerwunsch Demo-Modus/Adapter/Reset und deren Produktzugänge entfernt. Pause/Fortsetzen neben GO− mit echter MA-Cmd-Ausführungsbestätigung. Berechnete Fade-Vorschau in Current und aktueller Cue-Zeile; sichtbar als berechnet gekennzeichnet. Kein verifizierter tatsächlicher Fade-Prozentwert, keine vollständige Nachführung externer Pause/Timing-Master. Dies ist die ausdrücklich gewählte Rechenvorschau. Tests, Installation und tatsächliche Grenzen dokumentieren.

## v0.2.3 – Web-Einstellungen und kompakte Hauptseite
DataPool/Sequenz aus der nativen Netzwerkkonfiguration entfernt und als gemeinsame Zielwahl auf eine kleine Web-Einstellungsseite verschoben. Hauptseite nutzt die Viewporthöhe, Cueliste scrollt intern. Nach erfolgreichem Zielwechsel automatische Freigabe nur bei zuvor frischer entsperrter Bedienung; manuelle Sperren und Ausfälle bleiben gesperrt. Keine Playback-Befehle beim Zielwechsel.

## v0.2.4 - Fade-Warnung und Pause-Anzeige
Auf Benutzerwunsch große Berechnet-Beschriftung durch dezentes Fade mit Tooltip-/Einstellungshinweis ersetzt. GO+ gelb und langsam pulsierend während der berechneten Fade-Dauer, statisch bei Pause, danach grün. Warnung ohne zusätzliche GO-Sperre. Pause On/Off mit bestätigter gemeinsamer App-Aktiv-Anzeige, unabhängig von vorhandener Fade-Vorschau; unbekannt nach Statusverlust/Resync/Ziel-/Cue-Wechsel. Externe Pult-Pause bleibt nicht auslesbar.

## v0.2.5 - Cue-Delay und MAtricks-Zeiten
Die Vorschau verwendet die maximale von MA gelieferte Duration aller Cue-Parts statt des Cue-Fades des ersten Parts. Cue-Delay und individuelle gespeicherte/gekochte MAtricks-Zeiten fließen damit in die Gesamtdauer ein. Allgemeine und individuelle Fade-/Delay-Werte werden angezeigt. Native Sekundenwerte statt formatierter Texte; fehlende Gesamtdauer erzeugt keinen Ersatz aus bloßem Fade. Gegen den vom Benutzer genannten Cue rein lesend verifiziert: allgemeine Zeiten 0, individuelle Fade 3 s, Delay 30 s, Duration 33 s.

## v0.2.6 - Follow-Cues sichtbar
Trigger und Triggerzeit aus MA, Follow-Markierungen in Current/Next und Cueliste. Next-Hinweis auf automatischen Start nach vorherigem Übergang plus Zusatzwartezeit. Automatik ausschließlich im Pult; Current/Next wechseln nach dessen bestätigter Rückmeldung. Keine lokale GO-Planung, keine Änderung der Showtrigger. Automatisierter Test und Browserprüfung mit isoliertem simuliertem MA; echte Triggerabfrage rein lesend geprüft.

## v0.2.7 - OSC-Playback-Pause
Zusätzlicher konfigurierbarer Feedback-Empfänger. MA-Pause On/Off real verifiziert (OSC Pause 1/0); Toggle 2 bleibt unbekannt. Bekannter Zustand nur kurzzeitig, danach unbekannt und Vorschau verworfen. Dynamische Objektadresse, Quell-IP-/Frameprüfung, keine automatische Showkonfiguration. Ende-zu-Ende mit onPC und isolierten UDP-/Browsertests geprüft.
