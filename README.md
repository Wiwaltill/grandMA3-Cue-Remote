# grandMA3 Cue Remote

Lokale, iPad-optimierte Sequenz-Fernbedienung mit grafischer macOS-Serversteuerung. React/TypeScript, Node und Electron; ohne Cloud oder Telemetrie.

## v0.2.9 - Load und Goto

Die App verbindet sich mit **grandMA3 onPC 2.5.1.1**, liest Sequenzname, Cue-Liste, bekannte Fade-Zeiten und Current-Status aus MA und sendet gezieltes GO+/GO− an den ausgewählten DataPool und die eingetragene Sequenznummer. Die Weboberfläche enthält Lock, Auto-Follow, Listenpositionsfortschritt und eine klar als berechnet markierte Fade-Vorschau. Der Demo-Modus ist entfernt. Sie simuliert im Live-Modus keinen Playback-Erfolg.

Echter Test auf dem Entwicklungs-Mac: Version und Sequenzdaten empfangen, GO+ über die Weboberfläche ausgelöst und anschließend Cue 1 vom Pult bestätigt. GO− ohne Zustandsänderung am Listenanfang führte korrekt zur Sperre „Ergebnis unbekannt“. Resynchronisation und Rückkehr zum ursprünglichen Off-Zustand wurden geprüft. Dies ist eine Entwicklungsfassung; die vollständige Show-/iPad-Abnahme steht aus.

**Next:** Zeigt immer den nächsten Eintrag der Cueliste mit Nummer, Name und bekanntem Fade. Bei Off wird der erste Cue angezeigt, am Listenende „Ende der Cueliste“. Die blaue Tabellenmarkierung und der Text auf GO+ verwenden denselben Listennachfolger. Load/Goto sind als separate kleine Buttons erreichbar. Die Anzeige ändert keinen Cue am Pult; Playback bleibt durch echte Rückmeldungen bestätigt.

## Verbinden – vollständig per UI

Die macOS-arm64-App enthält Laufzeit und Weboberfläche. Für die normale Bedienung werden weder Terminal noch Node/npm benötigt.

1. `MA3 Cue Remote.app` im Finder per Doppelklick öffnen und **Server starten** anklicken.
2. In grandMA3 eine **separate Testshow** öffnen. Unter **Menu → In & Out → OSC** das passende **Interface** wählen, **Enable Input** einschalten und eine Zeile mit **Mode UDP**, beispielsweise **Port 8000**, und **Receive Command: Yes** konfigurieren. Das Präfix darf leer sein oder beispielsweise `gma3` lauten; beide Seiten müssen übereinstimmen. Die allgemeine Receive-Einstellung ist für Command-Eingang nicht ausschlaggebend.
3. Im Abschnitt **grandMA3 onPC · OSC** der Mac-App Ziel-IPv4, OSC-Port, Präfix **ohne Schrägstriche**, lokale Rückmelde-IP eingeben. Bei onPC auf demselben Mac die IPv4 der in MA ausgewählten Schnittstelle verwenden. `127.0.0.1` wird nur funktionieren, wenn MA diese Verbindung tatsächlich annimmt; im hier getesteten Setup war die lokale Schnittstellen-IP erforderlich.
4. **Verbinden** anklicken. Die App fragt ausschließlich lesend ab. Erst eine frische, gültige MA-Antwort für die gewählte Sequenz ergibt **Pultstatus empfangen / ONLINE**.
5. **Weboberfläche öffnen** anklicken. Die Bedienung beginnt gesperrt. Nach Prüfung von DataPool, Sequenz und Cue-Liste oben **entsperren**, dann GO+/GO− bedienen.
6. In der Weboberfläche **Einstellungen** (Zahnrad) öffnen, **DataPool** und **Sequenznummer** eingeben und **Übernehmen** anklicken. Beide Angaben werden gemeinsam übernommen, ohne GO. Während der vollständigen Synchronisation bleibt Playback gesperrt. War die Bedienung vorher entsperrt, wird sie nach gültiger frischer Antwort automatisch wieder frei. Eine manuelle Sperre bleibt erhalten; bei Fehler oder Timeout ist bewusstes Entsperren nötig. Auch eine nicht vorhandene Zielsequenz lässt sich in Einstellungen korrigieren. Nicht übernommene Eingaben sperren Playback bis Übernehmen oder Verwerfen. **Playback** führt zurück; die Hauptseite enthält keine Eingabefelder und scrollt bei üblichen Tablet-/Desktopgrößen nicht, nur die Cueliste. Sehr niedrige Fenster und starke Vergrößerung dürfen für erreichbare Bedienelemente scrollen.
7. **Trennen** beendet die OSC-Abfragen. **Server stoppen** beendet den Webserver und sperrt Playback. Schließen der Mac-App beendet beides.

Es ist kein manuell einzufügendes Lua-Plugin und kein zusätzliches OSC-Sendeprogramm nötig. Die Bridge sendet fest erzeugte, rein lesende Lua-Abfragen über den offiziellen OSC-Command-Eingang. Die verwendeten `socket`-/`json`-Module und Objektzugriffe wurden gegen die installierte Version und echte Rückmeldungen geprüft. Sie sind nicht als universelle Zusage für andere MA-Versionen zu verstehen; die aktuelle Live-Bridge akzeptiert nur 2.5.1.1.

## iPad und mehrere Bediener

Vor dem Webserverstart bewusst **Im lokalen Netzwerk freigeben** aktivieren. Danach eine angezeigte **Live-Adresse** auf dem iPad im gleichen vertrauenswürdigen WLAN öffnen. Diese Adresse enthält einen Laufzeitschlüssel für berechtigte Bediener; nur an Personen weitergeben, die GO auslösen dürfen. Der Browser entfernt ihn aus der sichtbaren Adresse und speichert ihn ausschließlich für die lokale Sitzung. Nach Serverneustart die Live-Adresse aus der Mac-App erneut öffnen.

Standardbindung des HTTP-Servers ist 127.0.0.1. Die OSC-Rückmeldung wird nur von der konfigurierten Ziel-IP und mit passender zufälliger Abfragenonce angenommen. Kein Zugriff aus der Cloud. LAN-HTTP ist für ein vertrauenswürdiges separates Show-Netz vorgesehen; keine Internet-Portweiterleitung.

Alle Live-Clients sehen denselben Bridge-Status und dieselbe Sperre. Der Server prüft Zugriffsschlüssel, Origin, Zielsequenz, erwartete Revision, Statusfrische und Request-ID. Er akzeptiert nur GO+/GO− und gezieltes Load/Goto, validierte DataPool-/Sequenzwahl, Lock und Resynchronisation. Es gibt keine frei eingebbaren MA-/Lua-Kommandos im Web-API.

## Fehler und Resynchronisation

Die Bridge fragt alle 500 ms einen vollständigen Snapshot ab; der Browser aktualisiert den Status alle 250 ms. Ohne frische Antwort nach 3 Sekunden wird serverseitig gesperrt; der Client sperrt ebenfalls bei fehlendem Webserverkontakt. Ein gesendetes UDP-Paket ändert keinen angezeigten Cue.

Nach einem GO ist höchstens ein Bedienbefehl ausstehend. Zeigt MA binnen 3 Sekunden keine Änderung von Current/Running, gilt das Ergebnis als **unbekannt**: Sperre, keine Queue und keine automatische Wiederholung. Das kann auch bei einem korrekt empfangenen GO am Listenanfang/-ende oder einer unveränderten Cue passieren. **Neu synchronisieren** liest erneut vollständig; anschließend bewusst entsperren. Es ist keine Behauptung, dass der Befehl nicht angekommen sei. Bei verlorenem Feedback bleibt die Sperre auch nach frischer Rückmeldung bestehen, bis ein Bediener entsperrt.

Cue-Nummern bleiben Strings; die Anwendung validiert Eingaben und akzeptiert maximal 500 Cues in einem Snapshot bis 60 KB. Unbekannte Fade-Werte werden als — angezeigt. Nicht vorhandene Sequenzen, unpassende MA-Versionen oder ungültige Snapshots geben die Bedienung nicht frei. Nummern werden gezielt adressiert; Schutz vor gleichzeitiger Objektverschiebung und stabile MA-Handles sind noch nicht abgenommen. Die Lösung bietet keine Ende-zu-Ende-Exactly-once-Garantie über UDP.

## Load und Goto

MA-Referenz: [Load](https://help.malighting.com/grandMA3/2.5/HTML/keyword_load.html), [Goto](https://help.malighting.com/grandMA3/2.5/HTML/keyword_goto.html).

Unter GO− liegen zwei kleine Buttons **Load** und **Goto**. Beide öffnen eine Cue-Auswahl mit Nummer und Name aus der frisch bestätigten Cueliste. **Abbrechen** bzw. Escape schließen ohne Befehl. Erst **Load** oder **Goto** im Dialog führt die gewählte Aktion aus. Ändert sich der Pultstatus seit dem Öffnen, Auswahl erneut öffnen; alte Revisionen und Ziele werden serverseitig abgewiesen.

**Load** lädt den Cue vor, ohne ihn zu starten. MA bestätigt die Ausführung per Cmd-OK. Dies ist kein ausgelesener dauerhafter LoadedCue-Status. Der nächste GO kann den geladenen Cue starten; **NEXT bleibt auf Benutzerwunsch immer der Listennachfolger** und ist daher nach Load nicht zwingend das tatsächliche GO-Ziel.

**Goto** springt gezielt zum Cue mit den gespeicherten MA-Zeiten, ohne freien Fade-Override. Erst MA-Cmd-OK und eine neue gültige Statusantwort mit dem Ziel als Current beenden Pending. Es gibt keine optimistische Current-Anzeige. Wird ein sehr kurzer Follow-Cue zwischen zwei Abfragen bereits verlassen, kann der Zielnachweis fehlen; dann bleibt das Ergebnis unbekannt und die Bedienung gesperrt. Keine automatische Wiederholung. Load/Goto sind nur bei entsperrtem, frischem Status ohne ausstehenden Befehl verfügbar und gelten ausschließlich für die gewählte Sequenz. Die Statuszeile zeigt die letzte bestätigte Ausführung, keinen garantierten dauerhaften Ladezustand.

## Follow-Cues

Follow-Cues tragen in Current/Next und Cueliste eine **FOLLOW**-Markierung mit zusätzlicher Trigger-Wartezeit, beispielsweise **FOLLOW · +3,0 s** (Zeitanzeige technisch mit Dezimalpunkt). Steht der nächste Listeneintrag auf Follow und die Sequenz läuft, zeigt die Next-Karte **Automatisch nach aktuellem Übergang** mit der Zusatzwartezeit. Der Trigger gehört zum automatisch startenden Cue: Er beginnt nach vollständigem vorherigem Übergang inklusive individueller Zeiten und anschließender Zusatzwartezeit. Die allgemeine Fade-Vorschau bleibt auf die Übergangsdauer beschränkt; es gibt keinen erfundenen Follow-Countdown.

**grandMA3 steuert die Automatik.** Die App setzt keine Trigger und sendet keinen zusätzlichen GO. Nach dem vom Pult bestätigten Wechsel aktualisieren sich Current, Next, Tabellenmarkierung und Listenposition. Bei Off oder unfrischen Daten wird kein bevorstehender automatischer Start behauptet. Time, Sound und BPM werden ebenfalls als Trigger gekennzeichnet; unbekannte Trigger/Zeitwerte bleiben unbekannt. Follow am Listenende/Wrap-Around wird vom Pult entschieden; Next bleibt wie vereinbart der Listennachfolger. Die Schaltfläche Auto-Follow steuert weiterhin nur das Scrollen der Cueliste.

## Fade-Vorschau

Pause-Button, Pause-Kommandos und zusätzlicher OSC-Playback-Feedbackempfänger sind seit v0.2.8 auf Benutzerwunsch entfernt. Es ist keine zusätzliche MA-Ausgabezeile erforderlich. Alte Pause-Requests werden serverseitig abgewiesen. Die früheren Tests und Untersuchungen bleiben als historische Dokumentation erhalten.

**Fade** erscheint dezent in der Current-Karte und als blauer Balken in der aktuellen Cue-Zeile. Die große Berechnet-Beschriftung entfällt auf Benutzerwunsch; Tooltip und Einstellungen erklären die Zeitvorschau. **GO+ wird während der geschätzten Fade-Dauer gelb und pulsiert langsam**, mit dem Text „Fade läuft“. Nach Ablauf wird er wieder grün. Die Anzeige ist eine Warnung, keine zusätzliche GO-Sperre. Bei reduzierten Animationen bleibt sie statisch. Die Vorschau startet erst nach einem bestätigten Wechsel des aktuellen Cues und verwendet die von MA berechnete Gesamtdauer (Duration). Bei einem durch die App ausgelösten GO wird der Auslösezeitpunkt als Rechenbasis benutzt, sobald MA den Wechsel bestätigt; bei externen Cue-Wechseln die Mitte zwischen den beiden empfangenen Statuszeitpunkten. Es gibt keinen vorgetäuschten Playback-Start aufgrund eines verschickten Pakets.

Bei Verbindungsverlust, unbekanntem Befehlsergebnis oder Resynchronisation wird die Vorschau verworfen. Beim Verbinden mit einem bereits laufenden Cue wird kein angeblich gerade gestarteter Fade erfunden.

Die Vorschau ist **kein gemessener MA-Fade-Prozentwert**. Die von MA gemeldete Duration umfasst Cue-Delay und gespeicherte individuelle Zeiten einschließlich gekochter MAtricks-Zeiten. Bei mehreren Parts gilt die längste Part-Duration, nicht die Summe unabhängiger Maximalwerte. Eine direkt am Pult ausgeführte Pause sowie Rate-/Timing-Master werden von der Rechenvorschau nicht nachgeführt; GO− kann andere Rücklaufzeiten verwenden. Dafür wurde die berechnete Anzeige ausdrücklich gewählt. Fehlt für einen Part eine gültige Duration, gibt es keinen geschätzten Balken aus dem Cue-Fade als Ersatz. Current/Next zeigen Gesamtzeit sowie allgemeine und individuelle Fade-/Delay-Werte; Zeitangaben mehrerer Parts sind Maximalwerte. Der Verlauf bildet den gesamten Übergang linear ab und ist keine einzelne Attribut-Fadekurve. Der separate Listenfortschritt bleibt eine Positionsanzeige.

Die Anwendung besitzt ausschließlich die echte Pultanbindung, keinen Demo-Modus und keinen Demo Reset. Keine externen Fonts, Telemetrie, Service Worker oder Offline-Befehlswarteschlange.

## App beziehen

Lokal liegt das App-Bundle unter `release/MA3 Cue Remote-darwin-arm64/MA3 Cue Remote.app`. GitHub erstellt im Workflow [macOS App](https://github.com/Wiwaltill/grandMA3-Cue-Remote/actions/workflows/desktop.yml) ein ZIP-Artefakt: erfolgreichen Lauf öffnen, Artefakt herunterladen, entpacken und App per Doppelklick öffnen. Das darin enthaltene App-ZIP gegebenenfalls ebenfalls entpacken.

Die App besitzt eine lokale Ad-hoc-Signatur; Apple-Developer-Signatur, Notarisierung und DMG stehen noch aus. macOS kann heruntergeladene Entwicklungsbuilds daher blockieren. Die native Fenster-/Installationsabnahme und echtes iPad/Safari bleiben offen.

## Entwicklung und Prüfungen

Technische Referenz für Entwicklung/CI: **Node.js 24 LTS ab 24.12**, inklusive npm; getestet mit 24.22.3. `.nvmrc` und npm-Lockfile liegen bei. Die folgenden Befehle sind keine Voraussetzung für die normale UI-Bedienung.

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run desktop:dev
npm run desktop:package
```

`desktop:dev` baut und öffnet die Mac-App. `desktop:package` erzeugt auf macOS das arm64-App-Bundle. `npm run dev` und `npm run preview` dienen optional der reinen Webentwicklung; ohne Bridge/API bleibt die Bedienung gesperrt. `dist/` enthält die Webdateien, `dist-desktop/` die kompilierte Desktop-Anwendung.

28 Tests decken Fade-Berechnung, Ablehnung entfernter Pause-Requests, echte UDP-Pakete mit simuliertem MA, Frische, Timeout, Deduplizierung, konkurrierende Revisionen, Zielwechsel, Nonce-Prüfung, Authentifizierung, Origin, Serverstart/-stopp und Zugriffsbeschränkungen ab. CI sendet niemals an ein echtes Pult. Testdetails und offene Abnahmen: [Testbericht](tests/VERIFICATION.md).

Struktur: `apps/web` für UI und HTTP-Transport, `packages/shared` für Typen/Validierung, `apps/desktop` für Electron, HTTP-Server und OSC-Bridge. UI enthält keine OSC-/Lua-Syntax. Keine zusätzlichen Runtime-Abhängigkeiten für OSC; UDP und Paketkodierung verwenden Node-Bordmittel.

- [Roadmap](ROADMAP.md), [Design](DESIGN.md), [Architektur](ARCHITECTURE.md), [Entwicklungsanweisungen](AGENTS.md)
- Primärquellen: [Sequence Sheet / Trigger](https://help.malighting.com/grandMA3/2.5/HTML/cue_sequence_sheet.html), [OSC 2.5](https://help.malighting.com/grandMA3/2.5/HTML/remote_inputs_osc.html), [DataPool-Adressierung](https://help2.malighting.com/grandMA3/2.5/HTML/keyword_datapool.html), [Go+](https://help.malighting.com/grandMA3/2.5/HTML/keyword_goplus.html), [Go−](https://help.malighting.com/grandMA3/2.5/HTML/keyword_gominus.html), [Lua Get](https://help.malighting.com/grandMA3/2.5/HTML/lua_object_get.html), [Pause](https://help.malighting.com/grandMA3/2.5/HTML/keyword_pause.html), [Cmd-Rückmeldung](https://help.malighting.com/grandMA3/2.0/HTML/lua_objectfree_cmd.html)
- Toolchain: [Node-LTS](https://github.com/nodejs/Release), [Electron-Sicherheit](https://www.electronjs.org/docs/latest/tutorial/security), [Packager](https://electron.github.io/packager/main/), [Checkout](https://github.com/actions/checkout), [Setup Node](https://github.com/actions/setup-node), [Upload Artifact](https://github.com/actions/upload-artifact)

Keine Tests auf laufenden Shows ohne ausdrückliche Freigabe. Lizenzentscheidung steht noch aus.
