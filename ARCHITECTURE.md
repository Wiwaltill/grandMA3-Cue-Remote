# Architektur

## Datenfluss
iPad Safari ⇄ HTTP/WebSocket ⇄ lokaler Node-Server auf Mac ⇄ OSC/validierter Metadatenkanal ⇄ grandMA3.
Electron verpackt Server und Konfiguration bereits als lokale Entwicklungs-App. Ziel: Apple Silicon, lokales Veranstaltungsnetz ohne Internet.

## Vorgeschlagene Struktur
apps/web (React), apps/server (Node), packages/shared (Typen/Validierung), packages/demo (Demo-Adapter), ma3-plugin (Lua), apps/desktop (Demo-Startfenster vorhanden), tests.

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

## Implementierter Stand v0.1.0

`apps/web` verwendet ausschließlich den `PlaybackTransport`-Vertrag aus `packages/shared`. `packages/demo` verwaltet synchrone lokale Snapshots, Revisionen, Request-Deduplizierung, Sperre und Doppelklickschutz. React abonniert die Snapshots via `useSyncExternalStore`; Playback-Zustand wird nicht separat in der UI fortgeschrieben. Cue-Nummern bleiben Strings, Next wird vom Adapter geliefert. Ein absichtlicher Demo-Loop und Off-Snapshots sind im Adapter testbar; die Standarddemo läuft ohne Loop.

Der injizierbare Ausgangssnapshot ist für Simulationstests vorgesehen. Der Demo-Adapter akzeptiert ausschließlich den Status DEMO; ONLINE, STALE, OFFLINE und CONNECTING geben keine Befehle frei. Es gibt keine Netzwerkverbindung, keinen Heartbeat und keinen Reconnect. Browser-Tabs teilen keinen Zustand. Dies beschreibt die isolierte Demo. Die echte Bridge ist seit v0.2.0 als separater Pfad ergänzt (siehe unten). Für Live-Betrieb genügt die clientseitige Sperre ausdrücklich nicht.

## Grafischer Serverbetrieb (vorgezogener Desktop-Teil)

Auf ausdrücklichen Benutzerwunsch übernimmt eine kleine Electron-App schon jetzt den Demo-Serverstart und -stopp. Das ist ein vorgezogener Teil der Desktop-Roadmap, keine Live-/Release-Freigabe. `apps/desktop/src/server.ts` liefert ausschließlich die gebaute Demo und Assets per HTTP aus. Im Demo-Pfad gibt es keine Playback- oder Shell-Aufrufe. Der seit v0.2.0 ergänzte Live-Pfad ist separat authentifiziert. Standardbindung ist 127.0.0.1; LAN muss in der UI explizit aktiviert werden. Portkonflikte werden als Fehler angezeigt, niemals durch Beenden anderer Prozesse gelöst.

Die Desktop-Steuerung wird lokal per `loadFile` geladen und bleibt auch bei gestopptem HTTP-Server erreichbar. Sandbox und Context Isolation sind aktiv, Node-Integration ist deaktiviert. Der Preload exponiert nur Status, Start, Stopp und Öffnen der fest abgeleiteten lokalen Demo-URL. IPC-Aufrufer werden gegen Fenster, Main Frame und genaue lokale Dateiadresse geprüft. Navigation, neue Fenster und Berechtigungsanfragen werden abgewiesen. Die HTTP-Auslieferung erlaubt nur GET/HEAD auf index.html und gebaute Assets.

Der Server läuft im Hauptprozess, ohne Shell oder Kindprozess. Das Schließen der App beendet ihn, und ein Single-Instance-Lock verhindert parallele App-Instanzen. Start erfolgt nur durch den UI-Button. Der Status wird nach erfolgreichem Listen-Ereignis als laufend gemeldet. Das bedeutet ausschließlich HTTP-Verfügbarkeit der Demo, niemals ONLINE-Status eines Pults.

Der Packager erzeugt ein eigenständiges macOS-arm64-App-Bundle mit eingebetteter Electron-Laufzeit, gebauten Oberflächen und einer lokalen Ad-hoc-Signatur. Der GitHub-Workflow stellt es als ZIP-Artefakt bereit. DMG, Apple-Developer-Signatur, Notarisierung und Live-Konfiguration bleiben offen.

## Sequenznummer aus der UI

Die Weboberfläche hält eine noch nicht übernommene Eingabe getrennt vom autoritativen Snapshot. `parseSequenceNumber` in `packages/shared` validiert Dezimalziffern, positive sichere Ganzzahlen und normalisiert führende Nullen. Dies ist eine Anwendungsvalidierung und keine Aussage über den tatsächlichen MA-Poolbereich. Ein späterer Live-Server muss Bereich, Existenz, DataPool und Rechte selbst prüfen.

`PlaybackTransport.selectSequenceNumber` verlangt die erwartete Revision. Der Demo-Adapter prüft zusätzlich Sperre, DEMO-Status und Doppelklickschutz und veröffentlicht beim Wechsel eine neue virtuelle Sequenzreferenz mit Off-Status und explizitem Next. Alte Befehle mit vorheriger Sequenzreferenz werden abgewiesen. Es wird weder GO gesendet noch realer Pultstatus simuliert. Reset behält die Auswahl bei. Die Auswahl ist aktuell pro Browser-Tab flüchtig; im getrennten Live-Modus wird die Auswahl inzwischen an die serverseitige Bridge übergeben.

## Implementierte OSC-Bridge v0.2.0

Der Datenfluss ist jetzt: Live-Web-UI → authentifiziertes lokales HTTP-API → `OscBridge` → echtes OSC/UDP an MA. Der Rückweg ist eine fest erzeugte lesende Lua-Abfrage über denselben OSC-Command-Eingang: MA liest den gewählten DataPool/die Sequenz, kodiert einen vollständigen Snapshot mit dem auf 2.5.1.1 vorhandenen json-Modul und sendet ihn mit socket.udp an den lokalen Rückmeldeport. Es werden keine Dateien oder Plugins im Showfile installiert. Die UI und das Web-API können keinen freien Lua-/MA-Code einreichen.

`osc.ts` validiert IPv4, Ports, Präfix und kanonische positive Zielnummern und erzeugt OSC-Adresse, String-Type-Tag und Vierbyte-Padding. Playback besteht ausschließlich aus `Go+ DataPool <n> Sequence <n>` oder `Go- ...`. IPv4-Rückmeldeziele müssen zu einer lokalen Schnittstelle gehören. Jede Statusabfrage hat eine neue zufällige 128-Bit-Nonce; Antwort-IP, Nonce, Version, Ziel, Größen, Cue-Nummern und Referenzen werden geprüft. Alte/vertauschte Antworten werden verworfen. Es ist maximal eine Abfrage ausstehend.

Die tatsächliche Verfügbarkeit von `socket`, `json`, `ObjectList`, `Children`, `Get`, `IsRunningPlayback`, `CueNo`, `LoadedCue` und Cue-/CuePart-Eigenschaften wurde mit den installierten MA-Ressourcen und lesenden Antworten auf 2.5.1.1 abgeglichen. Primärbelege liegen unter `gma3_2.5.1/shared/resource/lib_plugins/requirements/{socket,json}.lua`, `systemtests/gma3_api_meta.lua`, `systemtests/db/system_test_sequence_off.lua` und `system_test_sequence_set.lua`. Diese Dateien werden nicht kopiert oder modifiziert. Laufzeitvalidierung verweigert andere MA-Versionen oder unvollständige Daten; sie erfindet keine Ersatzwerte.

Eine generische Next-API ist nicht verifiziert. Der Snapshot enthält deshalb `nextCueKnown: false`, außer ein explizit geladener Cue lässt sich einem realen Cue zuordnen. GO wird trotzdem gezielt an MA gesendet; Loop, Restart und Listenende werden nicht in der Bridge nachgerechnet. Current/Off und Cue-Liste sind echte Rückmeldungen. Optionaler Fade stammt aus dem ersten Cue-Part und wird bei unbekannten Werten weggelassen.

Polling erfolgt mit 1 Hz; Frische-/Befehls-Timeout beträgt 3 Sekunden. Semantisch unveränderte Heartbeats aktualisieren den Zeitstempel ohne neue Revision, damit sie keinen ansonsten gültigen Tastendruck entwerten. GO setzt zuerst serverseitig Pending. Die UDP-Sendebestätigung ist kein Erfolg. Erst ein neuer Pultstatus ändert Current/Running. Bleibt dieser unverändert, wird das Ergebnis unbekannt, STALE und gesperrt. Status-Polling darf weiterlaufen, GO niemals automatisch wiederholt werden. Explizite Resynchronisation verwirft die alte Abfragenonce und verlangt einen vollständigen neuen Snapshot; Lock bleibt bis zur bewussten Freigabe aktiv. UDP gewährleistet keine Ende-zu-Ende-Exactly-once-Semantik.

Der HTTP-Server erzeugt pro Start einen zufälligen Bedienerschlüssel. Live-URLs transportieren ihn im Fragment; der Client entfernt das Fragment und hält den Schlüssel nur im sessionStorage derselben lokalen Sitzung. GET /api/state liefert vollständigen Status. Schreibzugriffe sind auf commands, sequence, lock und resync begrenzt, mit Größen-/Schema-/Origin-Prüfung. Nur der native, validierte IPC-Aufrufer kann die Zielverbindung konfigurieren oder trennen. Der Live-Schlüssel gewährt Bedienerrechte, keinen allgemeinen Konfigurations-/Shell-Zugriff. Demo-Tabs benutzen weiterhin ausschließlich den DemoAdapter.

Offene Grenzen: keine vollständige Next-/Loop-Vorschau, keine stabilen MA-Handles bei gleichzeitigem Verschieben von Objekten, maximal 500 Cues/60-KB-Antwort, keine allgemeine rollenbasierte Benutzerverwaltung oder TLS-Terminierung. Produktionsabnahme, natives Installationsverhalten und echtes iPad/Safari bleiben offen.
