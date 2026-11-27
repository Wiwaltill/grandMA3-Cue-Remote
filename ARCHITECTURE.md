# Architektur

## Datenfluss
iPad Safari ⇄ HTTP/WebSocket ⇄ lokaler Node-Server auf Mac ⇄ OSC/validierter Metadatenkanal ⇄ grandMA3.
Electron verpackt später Server und Konfiguration. Ziel: Apple Silicon, lokales Veranstaltungsnetz ohne Internet.

## Vorgeschlagene Struktur
apps/web (React), apps/server (Node), packages/shared (Typen/Validierung), packages/demo (Demo-Adapter), ma3-plugin (Lua), apps/desktop (später), tests.

## Domänenmodell
SequenceRef: DataPool-Kontext, stabile ID soweit verfügbar, Nummer, Name.
Cue: stabile ID, Cue-Nummer als String (Dezimalwerte erhalten), Name, optional Fade, optional Delay.
PlaybackSnapshot: sequence, cues, currentCueId, nextCueId, playbackState, connectionState, revision, timestamp. Next bei Live-Betrieb nicht ausschließlich aus Listenindex ableiten; Loop, Sprünge und Off berücksichtigen.
Command: requestId, sequenceRef, action (goPlus/goMinus/goto), optional cueId, expectedRevision.

## Schnittstellenentwurf
GET /api/sequences, GET /api/state, POST /api/commands, WS /ws für initialen Snapshot und Updates. API-Formate sind Entwürfe. Server prüft Authentifizierung, Rolle, Lock, ausgewählte Sequenz, Statusfrische, erwartete Revision und Request-ID. Pro Sequenz höchstens ein ausstehender Bedienbefehl; bei Timeout Ergebnis unbekannt, keine Wiederholung. Neue Freigabe erst nach bestätigtem Snapshot. UDP garantiert keine Zustellung; lokale Deduplizierung ersetzt keine Ende-zu-Ende-Exactly-once-Garantie.

## MA-Anbindung – noch zu validieren
Offizielle Dokumentation: https://help.malighting.com/grandMA3/
Zielversion 2.5.1.1. Kandidat für Befehle: Go+ Sequence "Konzert" über konfigurierten OSC-Command-Eingang (typischer Kandidat /cmd; Präfix, Port und Rechte verifizieren). Im Produkt stabile, validierte Sequenzreferenz verwenden.
OSC-Playback-Feedback auf tatsächliche verfügbare Felder prüfen. Lua-Plugin für Sequenz-/Cue-Metadaten und ggf. Statusabfrage prototypisieren. Ob und wie Lua Daten an den Server senden kann, ist offen; keine unbestätigten Socket-/HTTP-APIs voraussetzen. Falls nötig kontrollierten Export oder alternativen unterstützten Kanal evaluieren. Kein Zugriff auf undokumentierte interne Web-Remote-Protokolle als feste Voraussetzung.
Heartbeat, Statusfrische, Abfragefrequenz und Wiederanlauf auf Testshow messen; keine Belastung der Live-Show durch aggressives Polling.

## Sicherheit und Betrieb
Server bindet standardmäßig lokal; LAN-Freigabe bewusst konfigurieren. Vertrauenswürdiges separates Show-Netz, keine Portweiterleitung ins Internet, Session-Token und Rollen, Origin-/CSRF-Prüfung, Eingabevalidierung, keine generische Command-Shell. Bei TLS/HTTPS und Homescreen-Funktionen Safari-Voraussetzungen prüfen. Keine automatischen Kommandos bei Start, Reconnect oder Sequenzwechsel. UI und Server sperren bei unklarem Status. Logging ohne Secrets. Mac per LAN, iPad per WLAN; Lichtpult bleibt unabhängig bedienbar.

## Teststrategie
Unit-Tests für Zustandsmaschine und Befehlsvalidierung, Integrationstests mit simuliertem Adapter, Browser-Tests für Touch/Layouts, Hardware-Abnahme mit Testshow auf MA 2.5.1.1. Paketierung und Signierung gesondert prüfen.
