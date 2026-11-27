# Abnahme v0.2.11

Stand: 27. November 2026. Entwicklungsfassung, keine Freigabe für laufende Shows.

## Automatisch

- TypeScript strict für React, Node-Bridge, Electron-Main und Preload erfolgreich.
- ESLint erfolgreich.
- 35 Tests erfolgreich: 2 Fade-Berechnungstests, 22 OSC-/UDP-Tests, 7 Server-/HTTP-Tests und 4 Beenden-Ablauftests.
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
- Apple-Developer-Signatur und Notarisierung; DMG seit der unten dokumentierten Release-Ergänzung vorhanden.
- Ein lokal erfolgreicher Build bestätigt nicht automatisch den GitHub-Workflow-Lauf.

Die eingebettete Node-Version der Desktop-Umgebung blockiert native Rollup-Module durch macOS-Library-Validation. Die Prüfungen nutzen deshalb eine unveränderte offizielle Node-24.22.3-Installation im temporären Verzeichnis. Bei regulär installiertem Node inklusive npm ist dieser Umweg nicht nötig.

## Änderung v0.2.1: Next immer aus der Liste

Zusätzlicher Regressionstest prüft Off → erster Cue, laufender Cue → nächster Listeneintrag einschließlich Dezimal-Cues, Ende → kein Listeneintrag sowie eine leere Liste. Ein abweichender geladener Cue überschreibt den Listennachfolger nicht. Die frühere unbekannte Next-Anzeige des oben dokumentierten Ersttests ist damit ersetzt. Für diese reine Anzeigeänderung werden keine Befehle an ein echtes Pult gesendet.

Browserprüfung mit isoliertem simuliertem MA-Empfänger: Current 1 → Next 1.5 / Solo, nach GO+ Current 1.5 → Next 2 / Finale, nach weiterem GO+ Current 2 → Ende der Cueliste. Next-Karte, blaue Tabellenmarkierung und GO+-Beschriftung waren konsistent. Kein echtes Pult wurde dabei angesprochen.

## Web-Einstellungen und kompakte Hauptseite v0.2.3

Isolierte UDP-Tests prüfen gemeinsame DataPool-/Sequenzwahl, Validierung beider Nummern, erwartete Revision, Sperre während Synchronisation und Ablehnung alter Playback-Ziele. Eine zuvor frische entsperrte Bedienung wird erst nach gültigem vollständigem Snapshot automatisch freigegeben. Manuelle Sperren bleiben bestehen. Timeout während Zielwechsel oder ein expliziter Lock vor der Antwort widerrufen automatische Freigabe. Keine GO-Nachricht durch Zielwahl. HTTP-Prüfungen ergänzen Origin- und Eingabeprüfung des neuen target-Endpunkts.

Browserprüfung ausschließlich mit isoliertem simuliertem MA-Empfänger: Zahnrad öffnet Einstellungen; DataPool 2 und Sequenz 4 gemeinsam übernommen, anschließend ONLINE und weiterhin entsperrt. Manuellen Lock gesetzt, Sequenz 5 übernommen: weiterhin gesperrt. Reload auf ?page=settings erhält Seite und ausgewähltes Ziel. Hauptseite ohne Eingabefelder; Dokumentgröße entspricht Viewport bei 390×844, 820×1180, 1024×768 und 1280×720. Cueliste hat eigenen Scrollbereich; GO+/GO−/Pause bleiben sichtbar. Bei sehr niedrigen Fenstern wird bewusst Seitenscrollen zugelassen.

Keine erneuten Befehle an ein echtes Pult für diese Änderung. Netzwerk-/OSC-Syntax unverändert. Native Mac-Fensterbedienung und echtes iPad/Safari bleiben offen; arm64-App und Signaturprüfung durch Packaging geprüft.

## Fade-Warnung und Pause-Anzeige v0.2.4

Bestehende UDP-Tests erweitert: Pause sendet ausdrücklich On bzw. Off, kein Aktiv-Zustand allein durch Senden; erst passende MA-Ausführungsbestätigung setzt appPauseState. Bestätigte Pause wird auch ohne Fade-Vorschau angezeigt. Resync und fehlende Pause-Bestätigung verwerfen den Zustand. 21 Tests insgesamt.

Realer Test in der bereits ausdrücklich freigegebenen separaten onPC-Testshow 2.5.1.1: zunächst Off geprüft, GO+ bestätigt, Pause On und Pause Off jeweils mit echter MA-Cmd-Ausführungsbestätigung OK; Berechnung angehalten und fortgesetzt. Abschließend ursprünglichen Off-Zustand wiederhergestellt und durch Statusantwort bestätigt. Keine Showfile-Programmierung.

Isolierter Browsertest: GO+ mit is-fading und CSS-Animation fade-warning (1,8 Sekunden), gelbe Warnfarbe und Text Fade läuft. Nach bestätigtem Pause On gelber Button Pause aktiv, aria-pressed=true und statischer gelber GO+ (Fade angehalten). Nach Pause Off neutraler Pause-Button, aria-pressed=false und wieder laufender Fortschritt. Keine große Berechnet-Beschriftung. Mobile Dokumentgröße 390x844 ohne Seitenscrollen/Überlauf geprüft. Reduced Motion per CSS ohne Pulsieren; reales Betriebssystem-Setting nicht umgestellt. Native Fensterbedienung und echtes iPad/Safari weiterhin offen.

## Duration, Delay und individuelle MAtricks-Zeiten v0.2.5

Rein lesende Prüfung in onPC 2.5.1.1: Benutzer nannte DataPool 1 / Cue 5; dieser wurde in Sequenz 2 gefunden. CueInFade=0, CueInDelay=0, IndivFade=3, IndivDelay=30, Duration=33 Sekunden. Rohwerte p.Duration/p.CueInFade/p.CueInDelay/p.IndivFade/p.IndivDelay sind numerische Sekunden; Edit-/Display-Text ist nur formatiert. Die korrigierte Bridge liefert für diesen Cue duration=33, individualFade=3, individualDelay=30. Keine GO-/Pause-/Programmierbefehle bei dieser Prüfung.

Regressionstests: Dauer 33 s bleibt auch nach 32 s aktiv; fehlende Duration erzeugt keinen Ersatzbalken aus CueFade. Zusätzliche Validierung aller neuen Felder gegen negative, nicht endliche und nicht numerische Werte. 23 Tests erfolgreich. Mehrpart-Auswertung im generierten Lua: Maximum jeder Part-Duration; keine Addition voneinander unabhängiger Timing-Maxima. Mehrpart-MAtricks, Normalized und dynamische Rate-Master nicht separat in einer veränderten realen Show programmiert/getestet.

Isolierter Browsercheck mit denselben Zeitwerten: Current/Next Gesamt 33 s, individuelle Fade 3 s / Delay 30 s; Zeitspalte 33 s und Delay 30 s. Laufende Vorschau Gesamt 33 s und gelber GO+-Hinweis. Bei 390x844 Dokument ohne Überlauf/Seitenscrollen, alle drei Playback-Buttons sichtbar. Native Fenster- und echte iPad/Safari-Abnahme weiterhin offen.

## Follow-Anzeige v0.2.6

Rein lesende Property-Abfrage in onPC 2.5.1.1 bestätigt TRIGTYPE und TRIGTIME direkt am Cue. Korrigierte Bridge liefert für DataPool 1 / Sequenz 2 / Cue 5 trigger=Go und triggerTime=0. Kein Showtrigger geändert und kein reales Playback für diese Änderung ausgelöst. Follow-Bedeutung und Zusatzwartezeit anhand offizieller MA-Sequence-Sheet-Dokumentation geprüft. Ein echter Follow-Ablauf wurde nicht neu programmiert/getestet.

Neue isolierte UDP-Tests prüfen Follow-Metadaten, Zusatzzeit 0, ungültige Zeiten, unbekannte Trigger und externe Current-Wechsel 1 -> 1.5 -> 2 -> Off bei null gesendeten GO-Befehlen. Ohne geänderte Rückmeldung wird Current nicht weitergeschaltet. Insgesamt 25 Tests.

Browser mit isoliertem simuliertem MA: Next zeigt FOLLOW +3,0 s und Automatisch nach aktuellem Übergang +3,0 s. Nach einer vom Empfänger ausgelösten Statusänderung ist Current 1.5 / Next 2; Current- und Next-Zeile sowie GO+-Ziel stimmen. FOLLOW bleibt am aktuellen Cue als Eingangstrigger sichtbar. Bei 390x844 weiterhin kein horizontaler oder vertikaler Dokumentüberlauf, Playback-Buttons sichtbar. Native App-Fenster und echtes iPad/Safari weiterhin nicht interaktiv geprüft.

## Untersuchung externer Pause

Zusätzliche reale Pause-On/Off-Vergleiche auf der freigegebenen lokalen Testshow, danach Off wiederhergestellt und bestätigt. Kein verifizierter abfragbarer Pause-Zustand gefunden; keine Produktimplementierung. [Ergebnisse, Negativbefunde und erforderliche nächste Nachweise](PAUSE-INVESTIGATION.md).

## OSC-Playback-Pause v0.2.7

Reale Pakete und Ende-zu-Ende-Bridge gegen onPC geprüft; siehe Ergänzung im [Untersuchungsbericht](PAUSE-INVESTIGATION.md). On/Off frieren vorhandene Vorschau ein/setzten fort. Toggle oder Frischeablauf entfernen sie und zeigen unbekannt. Keine permanente MA-Konfiguration hinterlassen.

Vier neue automatisierte Tests: strikter Parser inkl. Fremdziel/Präfix/abgeschnittener/überlanger Daten, explizite On/Off-Idempotenz und doppelte Toggles, Ablauf trotz frischer Heartbeats plus Reconnect, sowie verspätetes Cmd-OK nach neuerem mehrdeutigem Feedback. Bestehende Konfigurationsvalidierung um Feedback-Port/Präfix erweitert. 29 Tests erfolgreich. Quell-IP-Prüfung im Receiver; keine kryptographische Authentifizierung von OSC-Ereignissen, nur vertrauenswürdiges Show-LAN.

Browsercheck mit isoliertem simuliertem MA: initial Pause unbekannt ohne false-pressed-Zustand, nach App-OK Pause aktiv und stehender Fade; nach drei Sekunden wieder Pause unbekannt und kein weiterlaufender/abgeschlossener Balken. 390x844 ohne Dokumentüberlauf, Buttons sichtbar. Native Mac-Fenster und manuelles Anlegen der Ausgabezeile per GUI nicht interaktiv geprüft; Text/IPC/Build geprüft.

## v0.2.8 - Pause entfernt

Pause-spezifische Tests und deren Testadapter entfernt. Bestehende Timing-/Follow-/Sicherheitsprüfungen bleiben; UDP- und HTTP-Regression prüfen zusätzlich, dass alte Pause-Requests als invalid abgewiesen werden und keine Nachricht an MA auslösen. Keine echten Pultbefehle für diese Entfernung erforderlich. Historische Pause-Tests oben beschreiben frühere Versionen.

Browserprüfung v0.2.8 mit isoliertem Empfänger: nur GO+ und GO− als Playback-Buttons, keine Pause-Statusanzeige. GO− nutzt die ganze Breite. Bei 390x844 Dokumentbreite und -höhe gleich Viewport, kein Seitenscrollen. Follow-Markierung und Next weiter sichtbar. Native Mac-Fenster und echtes iPad/Safari weiterhin nicht interaktiv geprüft; App-Bundle gebaut und Signaturprüfung erfolgreich.

## Load/Goto v0.2.9

Vier neue Tests: Load mit Dezimal-Cue und MA-OK ohne Current-Änderung, ungültige/fremde Cue-ID und Deduplizierung; Goto erst nach OK plus Zielstatus einschließlich gleichem Ziel-Cue; fehlendes Load-OK bzw. Goto-Zielantwort sperren ohne Retry; feste Kommandosyntax und Injection-Ablehnung. Insgesamt 28 Tests.

Realer Test auf der bereits freigegebenen separaten onPC-Testshow 2.5.1.1: DataPool 1 / Sequenz 1 zunächst Off, Load Cue 1 per MA-Cmd bestätigt bei weiterhin Current=null, danach Goto Cue 1 mit Cmd-OK und Current=1 bestätigt. Abschließend Off gesendet und Off per Snapshot bestätigt. Keine Cue-Programmierung. Der Test bestätigt keine allgemeine LoadedCue-Statusabfrage oder alle Tracking-/Follow-Sonderfälle.

Browser mit isoliertem Empfänger: Load-Dialog mit Cue 1.5 ausgeführt, MA-Bestätigung sichtbar und Current weiterhin Off; Goto-Dialog abgebrochen ohne Current-Änderung, danach Goto Cue 1.5 ausgeführt mit Current 1.5 / Next 2 und korrekter Tabellenmarkierung. Bei 390x844 kein Dokumentüberlauf; beide kleinen Buttons 171x44 CSS-Pixel. Native Fensterbedienung und echtes iPad/Safari weiterhin offen.

## Beenden-Rückfrage v0.2.10

Vier neue Tests der vom Electron-Main verwendeten gemeinsamen Beenden-Steuerung: Abbrechen erhält Server/Verbindung; erneutes Bestätigen beendet einmal; gestoppter Server ohne Dialog; gleichzeitiges Fensterschließen und Quit teilen sich eine Abfrage und warten auf asynchronen Shutdown; Dialog-/Shutdown-Fehler beenden nicht und erlauben Wiederholung. Rekursives app.quit nach Freigabe erzeugt keine weitere Abfrage. 32 Tests insgesamt.

Close-/Before-quit-Handler und native MessageBox-Optionen anhand installierter Electron-Typdefinitionen und offizieller Electron-Dokumentation geprüft. Default/Cancel-ID 0 = Abbrechen. Serverstart/-stopp-Promises werden beim bestätigten Shutdown abgewartet und neue native IPC-Aufrufe verhindert. Keine Pultbefehle für diese Änderung. Native macOS-Dialogbedienung mit Fensterknopf/⌘Q/Escape und ein laufender Electron-Ende-zu-Ende-Test sind mit den verfügbaren Browserwerkzeugen nicht interaktiv geprüft; automatisierte Tests prüfen den Ablauf mit injizierten Abhängigkeiten. App-Bundle und Signaturprüfung durch Packaging.

## LoadedCue-Feedback v0.2.11

Offizielle MA-Release-Notes 2.2 dokumentieren LoadedCue. Tatsächliche Abfrage auf 2.5.1.1: vor Load q.LoadedCue=nil, nach Load Cue 1 userdata mit No=1, nach Goto wieder nil. Neue Bridge bestätigt Load erst nach OK plus LoadedCue-Zielantwort; realer Test mit der freigegebenen separaten Testsequenz 1, danach Off durch Status bestätigt. Kein Eingriff in die laufende Sequenz 2.

Drei neue Tests: externe Load-Wechsel, Aufhebung und Wiederherstellung nach Stale/Resync; MA-OK ohne LoadedCue-Zielnachweis endet unbekannt/gesperrt statt optimistischer Anzeige; null/undefined/ungültige Referenzen getrennt validieren. Bestehende Load-Tests auf echte Statusbestätigung erweitert. 35 Tests insgesamt.

Isolierter Browsercheck: Load Cue 1.5 zeigt GELADEN 1.5/Solo separat neben Next 1/Opening, Tabellenbadge und Load-Button-Nummer. GO+ zeigt GELADEN: 1.5/Solo. Nach Start ist Current 1.5, Next 2 und GELADEN entfernt. Bei 390x844 kein Dokumentüberlauf. Native Mac-Dialogbedienung und echtes iPad/Safari weiterhin offen.

## Release-Ergänzung v0.2.11: DMG

Komprimiertes read-only DMG mit hdiutil erstellt und verifiziert. Image schreibgeschützt eingehängt: App rekursiv mit dem ursprünglichen ZIP-Release-Bundle verglichen (identisch), codesign --verify --deep --strict erfolgreich, Programme-Verknüpfung nach /Applications sowie Installations- und Lizenzdateien geprüft. Image anschließend ausgehängt. Eigene SHA-256-Datei erzeugt; ursprüngliches ZIP und Release-Tag bleiben unverändert. Typecheck, Lint, 35 Tests und Build erneut erfolgreich. Native Finder-Drag-and-drop-/Gatekeeper-Installation weiterhin nicht automatisiert abgenommen; keine Pultbefehle für diese Packaging-Änderung.
