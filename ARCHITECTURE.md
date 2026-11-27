# Architektur

## Datenfluss und Struktur

Webbrowser/iPad ⇄ lokales HTTP-API ⇄ Node-Bridge im Electron-Hauptprozess ⇄ OSC/UDP ⇄ grandMA3 onPC 2.5.1.1. Electron enthält Laufzeit, Server und gebaute Oberflächen. Keine Cloud, Telemetrie oder Laufzeitabhängigkeit von einem Terminal.

- `apps/web`: React-UI und HTTP-Transport; keine OSC-/Lua-Kommandos aus der UI.
- `apps/desktop`: Electron, schmaler Preload-Vertrag, HTTP-Server, OSC-Bridge.
- `packages/shared`: Domänenmodell, Sequenzvalidierung und reine Fade-Vorschau-Berechnung.
- `tests`: isolierte UDP-/HTTP-Empfänger und Domänentests; keine Pultzugriffe in CI.

Der frühere Demo-Adapter und alle Produktzugänge dazu sind seit v0.2.2 auf Benutzerwunsch entfernt. Unverbunden zeigt die UI unbekannte Werte und gesperrte Bedienung.

## Domänenmodell

SequenceRef enthält DataPool, ID, Nummer und Name. Cue enthält ID, Cue-Nummer als String, Name und optionale allgemeine/individuelle Fade-/Delay-Zeiten sowie MA-Duration, validierten Trigger (Go/Follow/Time/Sound/BPM/Unknown) und optionale numerische Triggerzeit. PlaybackSnapshot enthält Sequenz, Cues, bestätigten Current, Next als Listennachfolger, Running/Off, Verbindungsstatus, Revision, Zeitstempel, Lock und Befehlsstatus. Die optionale FadePreview ist ausdrücklich eine Berechnung, kein autoritativer MA-Fade-Prozentwert.

Command enthält Request-ID, Zielreferenz, erwartete Revision und ausschließlich goPlus, goMinus, load oder goto. Bei load/goto ist cueId aus der aktuellen Sequenzliste erforderlich. Die gemeinsame DataPool-/Sequenzwahl verlangt die erwartete Revision und sperrt bis zum neuen vollständigen Pultstatus. Eine vor dem Wechsel frische, entsperrte Bedienung wird ausschließlich nach gültigem neuen Snapshot wieder freigegeben. Manuelle Sperre, Fehler, Timeout, Serverstopp und Resync widerrufen diese Freigabe. Zielwahl ist auch im gesperrten Zustand möglich; sie hebt bestehende Sperren nicht auf. Keine frei eingebbaren MA-/Lua-Kommandos. Cue-Nummern bleiben Strings; Next folgt der gelieferten Listenreihenfolge (Off → erster Cue, Listenende → null). Next bleibt auch nach Load der Listennachfolger.

## OSC und Status

`osc.ts` validiert IPv4, Ports, Präfix und kanonische positive Zielnummern. OSC-Stringnachrichten verwenden korrektes Type-Tag und Vierbyte-Padding. GO adressiert ausschließlich `Go+ DataPool <n> Sequence <n>` bzw. Go−. MA bleibt für tatsächliche Übergänge, Loop und Restart zuständig.

Der Rückweg nutzt fest erzeugte lesende Lua-Abfragen über den offiziellen OSC-Command-Eingang. MA liest ausschließlich den gewählten DataPool/die Sequenz und sendet JSON per vorhandenem socket.udp-Modul zurück. Keine Showfile-/Plugin-Installation und kein undokumentiertes Webremote-Protokoll. IPv4-Rückmeldeziele müssen lokal sein. Antwort-IP, zufällige 128-Bit-Nonce, Version, Ziel, Größen, Cue-Nummern und Referenzen werden geprüft. Alte/vertauschte Antworten werden verworfen. Maximal eine Statusabfrage ausstehend.

Status-Polling erfolgt alle 500 ms, HTTP-Statusaktualisierung alle 250 ms. Vollständige Snapshots: maximal 500 Cues/60 KB. Unveränderte Heartbeats ändern nur Frische, nicht die semantische Revision. Zielversion ist derzeit exakt 2.5.1.1. Die verfügbaren socket-/json-Module, ObjectList, Children, Get, IsRunningPlayback und Cue-/CuePart-Eigenschaften sind anhand installierter MA-Ressourcen und realer Testshow-Antworten geprüft. Alle Cue-Parts werden ausgewertet. CueInFade, CueInDelay, IndivFade, IndivDelay und Duration werden als native numerische Sekundenwerte gelesen, unabhängig vom formatierten Edit-Text. Je Feld wird das Maximum der Parts übertragen. Die Vorschau verwendet ausschließlich MA-Duration; fehlt sie bei einem Part, wird keine Gesamtdauer erfunden.

Primärbelege: offizielle MA-Dokumentation für OSC, DataPool, Go+, Go−, Pause und Cmd; außerdem `gma3_2.5.1/shared/resource/lib_plugins/requirements/{socket,json}.lua`, `systemtests/gma3_api_meta.lua`, `systemtests/db/system_test_sequence_pause.lua`, `system_test_sequence_off.lua` und `system_test_sequence_set.lua`. Die mit HelpLua exportierte API-Liste wurde geprüft. MA-Dateien werden nicht in das Repository kopiert.

## Befehlsbestätigung

GO wird einmal gesendet und setzt Pending; erst geänderter autoritativer Current/Running-Status beendet Pending. UDP-Sendebestätigung ist kein Playback-Erfolg.

Pro Sequenz höchstens ein ausstehender Bedienbefehl. Request-Deduplizierung, erwartete Revision, Ziel, Lock und Frische werden serverseitig geprüft. Nach 3 Sekunden ohne passenden Status/Bestätigung ist das Ergebnis unbekannt: STALE, Lock, keine Queue, kein automatischer Retry. Neue Freigabe erst nach explizitem vollständigem Resync und bewusstem Entsperren. UDP garantiert keine Ende-zu-Ende-Exactly-once-Semantik.

## Berechnete Fade-Vorschau

Auf ausdrücklichen Benutzerwunsch wird eine klar bezeichnete Rechenvorschau angezeigt. Die geprüfte öffentliche API liefert keine verifizierte tatsächliche Fade-Prozentanzeige. GetFader/FaderX meldete im echten automatischen Fade unverändert 0 und wird deshalb nicht als Fortschritt missbraucht.

Eine Vorschau entsteht ausschließlich nach einem bestätigten Current-Wechsel bei zuvor frischem Status. Beim eigenen GO wird dessen Auslösezeitpunkt erst nach bestätigtem Wechsel als Startschätzung verwendet; bei externem Cue-Wechsel die Mitte zwischen den beiden Statuszeitpunkten. Dauer ist die maximale MA-Duration aller Cue-Parts, einschließlich Delay und individueller gespeicherter/gekochter MAtricks-Zeiten. Die Dauer wird nicht aus getrennten maximalen Fade- und Delay-Werten addiert. Nullzeit ergibt sofort 100 %, unbekannte Dauer keinen Balken. Bei initial bereits laufendem Cue wird kein neuer Übergang erfunden.

Die Bridge führt eine gemeinsame Berechnungsbasis für alle Clients. Der Client interpoliert zwischen Statusantworten, ohne daraus Playback-Status abzuleiten. Reduced Motion unterdrückt die Zwischenanimation. Bei Disconnect, Stale, unbekanntem Ergebnis oder Resync wird die Vorschau verworfen.

Grenzen: dynamische Timing-/Rate-Master, abweichende GO−-Zeiten und extern betätigte Pause sind nicht vollständig nachgeführt. Die große Berechnet-Beschriftung entfällt auf Benutzerwunsch; Tooltip und Einstellungen erklären die Zeitvorschau. GO+ verwendet sie für eine gelbe Warnung mit langsamem Pulsieren. Die Warnung sperrt keine Befehle und ersetzt weder Current-Feedback noch Frischeprüfung.

## HTTP, IPC und Betrieb

HTTP bindet standardmäßig lokal; LAN nur nach UI-Freigabe in einem vertrauenswürdigen Show-Netz. Zufälliger Bedienerschlüssel pro Serverstart, Transport im URL-Fragment, danach sessionStorage und Entfernung des Fragments. GET /api/state liefert vollständigen Status. Schreibzugriffe nur commands, target (DataPool und Sequenz), sequence (bisheriger Endpunkt), lock und resync mit Schlüssel-, Origin-, Größen- und Eingabeprüfung. Der Schlüssel gewährt Bedienerrechte einschließlich validierter Zielwahl, keine freie Netzwerkkonfiguration oder Shell. Kein Logging von Schlüsseln.

Nur der native validierte IPC-Aufrufer kann die OSC-Netzwerkverbindung konfigurieren/trennen. Die Zielauswahl bleibt bei einem erneuten nativen Verbinden innerhalb desselben App-Laufs erhalten; sie startet nach App-Neustart bei DataPool 1 / Sequenz 1. Die Web-Einstellungsseite wird über ?page=settings im selben React-Client geöffnet, mit Browser-Zurück-Unterstützung. Desktop-Steuerung wird per loadFile geladen und funktioniert auch bei gestopptem HTTP-Server. Sandbox und Context Isolation aktiv, Node-Integration deaktiviert; IPC auf genaues Fenster, Main Frame und lokale Dateiadresse beschränkt. Navigation, neue Fenster und Berechtigungsanfragen werden abgewiesen. HTTP liefert nur index.html und gebaute Assets.

Server im Hauptprozess, keine Shell-/Kindprozesse; App-Schließen beendet Server und Bridge. Single-Instance-Lock verhindert Doppelstarts. Kein automatischer GO bei Start, Reconnect oder Zielwechsel. Kein Offline-Command-Cache, keine Pult-Tests auf laufenden Shows ohne ausdrückliche Freigabe.

## Offene Abnahme

Stabile MA-Handles bei Objektverschiebungen, große Shows, umfangreiche Sonderzeiten, TLS/erweiterte Rollen, echtes iPad/Safari, native Installations-/Fensterabnahme, Developer-ID-Signatur, Notarisierung und DMG. Lokale Ad-hoc-Signatur und arm64-Bundle sind vorhanden; GitHub baut ein ZIP-Artefakt. Keine Produktionsfreigabe für eine laufende Show.

## Follow-Anzeige seit v0.2.6

Das fest generierte Lua liest TrigType als Display-Text am Cue und TrigTime als native Sekunden. Vorhandene Felder und Werte anhand realer read-only Antworten aus 2.5.1.1 sowie offizieller Sequence-Sheet-Dokumentation geprüft. Unbekannte Trigger werden als Unknown normalisiert, ungültige numerische Triggerzeiten verwerfen den Snapshot. Keine MA-Kommandos aus Metadaten, kein lokaler Scheduler. Follow startet in MA nach Ende des vorherigen Übergangs plus positiver TrigTime, Time dagegen relativ zum Trigger des vorherigen Cues.

Alle externen/autonomen Cue-Wechsel werden ausschließlich aus dem bestätigten Current verarbeitet. HTTP-Polling kann kurze Zwischen-Cues unterhalb des Abfrageintervalls überspringen; die App behauptet keine lückenlose Triggerhistorie. Next bleibt Listennachfolger, keine Vorhersage von Loop/Off-Sonderzielen.

## Pause seit v0.2.8 entfernt

Auf Benutzerwunsch kein Pause-Befehl, kein Pause-Zustandsmodell, kein OSC-Playback-Feedbackempfänger und keine zugehörige Netzwerkkonfiguration mehr im Produkt. Das Web-API validiert goPlus/goMinus/load/goto; alte Pause-Requests werden abgewiesen. Die historische Untersuchung bleibt in tests/PAUSE-INVESTIGATION.md erhalten. Externe Pause am Pult wird durch die berechnete Fade-Vorschau nicht erkannt.

## Load/Goto seit v0.2.9

Cue-ID serverseitig gegen aktuelle Liste validieren, Cue-Nummer ausschließlich daraus ableiten. Feste Cmd-Aufrufe Load/Goto DataPool N Sequence N Cue X; keine freien Kommandos, Namen oder Fade-Overrides. Separate zufällige actionNonce und Quell-IP-Prüfung für Ausführungsbestätigung. Load beendet Pending nur nach OK. Goto fragt nach OK mit neuer Querynonce vollständig ab und endet erst bei laufendem bestätigtem Ziel-Current. Bei gleichem Ziel-Cue wird keine künstliche Cue-Änderung verlangt, aber dennoch eine frische Statusantwort nach OK. Fehlende Bestätigung/Zielantwort: unbekannt, STALE, gesperrt, kein Retry.

cueCommandReceipt ist eine bestätigte vergangene Ausführung, kein dauerhafter LoadedCue-Status. Neue Bedienbefehle/Resync/Verbindungswechsel verwerfen sie. Current und Next bleiben autoritative Current-Rückmeldung bzw. Listennachfolger. Modaler Cue-Dialog bindet Auswahl an Sequenz und Revision beim Öffnen; keine Aktion allein durch Zeilenwahl.
