# grandMA3 Cue Remote

Lokale, iPad-optimierte Sequenz-Fernbedienung mit grafischer macOS-Serversteuerung. React/TypeScript, Node und Electron; ohne Cloud oder Telemetrie.

## v0.2.0 – echte OSC-Anbindung

Die App verbindet sich mit **grandMA3 onPC 2.5.1.1**, liest Sequenzname, Cue-Liste, bekannte Fade-Zeiten und Current-Status aus MA und sendet gezieltes GO+/GO− an den ausgewählten DataPool und die eingetragene Sequenznummer. Die Weboberfläche enthält Lock, Auto-Follow und Listenpositionsfortschritt. Sie simuliert im Live-Modus keinen Playback-Erfolg.

Echter Test auf dem Entwicklungs-Mac: Version und Sequenzdaten empfangen, GO+ über die Weboberfläche ausgelöst und anschließend Cue 1 vom Pult bestätigt. GO− ohne Zustandsänderung am Listenanfang führte korrekt zur Sperre „Ergebnis unbekannt“. Resynchronisation und Rückkehr zum ursprünglichen Off-Zustand wurden geprüft. Dies ist eine Entwicklungsfassung; die vollständige Show-/iPad-Abnahme steht aus.

**Next:** Es wird nur ein von MA explizit gemeldeter geladener Cue angezeigt. Ohne diese Information steht dort „Next wird vom Pult nicht gemeldet“. Die App leitet im Live-Modus keinen vermeintlich sicheren Next aus der Listenposition ab. Ende, Wrap Around, Restart Mode und Sprünge entscheidet MA.

## Verbinden – vollständig per UI

Die macOS-arm64-App enthält Laufzeit und Weboberfläche. Für die normale Bedienung werden weder Terminal noch Node/npm benötigt.

1. `MA3 Cue Remote.app` im Finder per Doppelklick öffnen und **Server starten** anklicken.
2. In grandMA3 eine **separate Testshow** öffnen. Unter **Menu → In & Out → OSC** das passende **Interface** wählen, **Enable Input** einschalten und eine Zeile mit **Mode UDP**, beispielsweise **Port 8000**, und **Receive Command: Yes** konfigurieren. Das Präfix darf leer sein oder beispielsweise `gma3` lauten; beide Seiten müssen übereinstimmen. Die allgemeine Receive-Einstellung ist für Command-Eingang nicht ausschlaggebend.
3. Im Abschnitt **grandMA3 onPC · OSC** der Mac-App Ziel-IPv4, OSC-Port, Präfix **ohne Schrägstriche**, lokale Rückmelde-IP, DataPool und Sequenznummer eingeben. Bei onPC auf demselben Mac die IPv4 der in MA ausgewählten Schnittstelle verwenden. `127.0.0.1` wird nur funktionieren, wenn MA diese Verbindung tatsächlich annimmt; im hier getesteten Setup war die lokale Schnittstellen-IP erforderlich.
4. **Verbinden** anklicken. Die App fragt ausschließlich lesend ab. Erst eine frische, gültige MA-Antwort für die gewählte Sequenz ergibt **Pultstatus empfangen / ONLINE**.
5. **Live-Weboberfläche öffnen** anklicken. Die Bedienung beginnt gesperrt. Nach Prüfung von DataPool, Sequenz und Cue-Liste oben **entsperren**, dann GO+/GO− bedienen.
6. Sequenznummer bei Bedarf direkt in der Weboberfläche ändern und **Übernehmen** anklicken. Ein Wechsel sendet keinen GO, sondern sperrt bis zum vollständigen neuen Pultstatus. Danach erneut entsperren. Noch nicht übernommene Eingaben sperren Playback; **Verwerfen** stellt die aktuelle Auswahl wieder her.
7. **Trennen** beendet die OSC-Abfragen. **Server stoppen** beendet den Webserver und sperrt Playback. Schließen der Mac-App beendet beides.

Es ist kein manuell einzufügendes Lua-Plugin und kein zusätzliches OSC-Sendeprogramm nötig. Die Bridge sendet fest erzeugte, rein lesende Lua-Abfragen über den offiziellen OSC-Command-Eingang. Die verwendeten `socket`-/`json`-Module und Objektzugriffe wurden gegen die installierte Version und echte Rückmeldungen geprüft. Sie sind nicht als universelle Zusage für andere MA-Versionen zu verstehen; die aktuelle Live-Bridge akzeptiert nur 2.5.1.1.

## iPad und mehrere Bediener

Vor dem Webserverstart bewusst **Im lokalen Netzwerk freigeben** aktivieren. Danach eine angezeigte **Live-Adresse** auf dem iPad im gleichen vertrauenswürdigen WLAN öffnen. Diese Adresse enthält einen Laufzeitschlüssel für berechtigte Bediener; nur an Personen weitergeben, die GO auslösen dürfen. Der Browser entfernt ihn aus der sichtbaren Adresse und speichert ihn ausschließlich für die lokale Sitzung. Nach Serverneustart die Live-Adresse aus der Mac-App erneut öffnen.

Standardbindung des HTTP-Servers ist 127.0.0.1. Die OSC-Rückmeldung wird nur von der konfigurierten Ziel-IP und mit passender zufälliger Abfragenonce angenommen. Kein Zugriff aus der Cloud. LAN-HTTP ist für ein vertrauenswürdiges separates Show-Netz vorgesehen; keine Internet-Portweiterleitung.

Alle Live-Clients sehen denselben Bridge-Status und dieselbe Sperre. Der Server prüft Zugriffsschlüssel, Origin, Zielsequenz, erwartete Revision, Statusfrische und Request-ID. Er akzeptiert nur GO+/GO−, Sequenzwahl im konfigurierten DataPool, Lock und Resynchronisation. Es gibt keine frei eingebbaren MA-/Lua-Kommandos im Web-API.

## Fehler und Resynchronisation

Die Bridge fragt pro Sekunde einen vollständigen Snapshot ab. Ohne frische Antwort nach 3 Sekunden wird serverseitig gesperrt; der Client sperrt ebenfalls bei fehlendem Webserverkontakt. Ein gesendetes UDP-Paket ändert keinen angezeigten Cue.

Nach einem GO ist höchstens ein Bedienbefehl ausstehend. Zeigt MA binnen 3 Sekunden keine Änderung von Current/Running, gilt das Ergebnis als **unbekannt**: Sperre, keine Queue und keine automatische Wiederholung. Das kann auch bei einem korrekt empfangenen GO am Listenanfang/-ende oder einer unveränderten Cue passieren. **Neu synchronisieren** liest erneut vollständig; anschließend bewusst entsperren. Es ist keine Behauptung, dass der Befehl nicht angekommen sei. Bei verlorenem Feedback bleibt die Sperre auch nach frischer Rückmeldung bestehen, bis ein Bediener entsperrt.

Cue-Nummern bleiben Strings; die Anwendung validiert Eingaben und akzeptiert maximal 500 Cues in einem Snapshot bis 60 KB. Unbekannte Fade-Werte werden als — angezeigt. Nicht vorhandene Sequenzen, unpassende MA-Versionen oder ungültige Snapshots geben die Bedienung nicht frei. Nummern werden gezielt adressiert; Schutz vor gleichzeitiger Objektverschiebung und stabile MA-Handles sind noch nicht abgenommen. Die Lösung bietet keine Ende-zu-Ende-Exactly-once-Garantie über UDP.

## Getrennter Demo-Modus

**Demo öffnen** startet eine unabhängige lokale Simulation mit zehn Beispiel-Cues einschließlich `05.1`. Dieser Modus spricht niemals ein Pult an. Jeder Browser-Tab besitzt eine eigene Demo. Current/Next, Fade-Zeiten, GO+/GO−, Sperre, 450-ms-Doppelklickschutz und bestätigter Reset sind interaktiv. Die frei eingegebene Demo-Sequenznummer lädt keine Pultdaten. Ein Wechsel startet Off; Reset stellt Cue 04 wieder her und behält die Nummer bei. Neuladen verwirft die Demo-Sitzung.

Der Fortschritt zeigt die **Listenposition**, keinen zeitlichen Fade-Verlauf. Keine externen Fonts, Telemetrie, Service Worker oder Offline-Befehlswarteschlange. Eine bereits geladene Demo kann nach Serverstopp weiter simulieren.

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

`desktop:dev` baut und öffnet die Mac-App. `desktop:package` erzeugt auf macOS das arm64-App-Bundle. `npm run dev` und `npm run preview` dienen optional der reinen Webentwicklung; ohne Bridge/API ist dort ausschließlich die Demo funktionsfähig. `dist/` enthält die Webdateien, `dist-desktop/` die kompilierte Desktop-Anwendung.

26 Tests decken Demo-Zustände, echte UDP-Pakete mit simuliertem MA, Frische, Timeout, Deduplizierung, konkurrierende Revisionen, Zielwechsel, Nonce-Prüfung, Authentifizierung, Origin, Serverstart/-stopp und Zugriffsbeschränkungen ab. CI sendet niemals an ein echtes Pult. Testdetails und offene Abnahmen: [Testbericht](tests/VERIFICATION.md).

Struktur: `apps/web` für UI und HTTP-Transport, `packages/shared` für Typen/Validierung, `packages/demo` für die reine Simulation, `apps/desktop` für Electron, HTTP-Server und OSC-Bridge. UI enthält keine OSC-/Lua-Syntax. Keine zusätzlichen Runtime-Abhängigkeiten für OSC; UDP und Paketkodierung verwenden Node-Bordmittel.

- [Roadmap](ROADMAP.md), [Design](DESIGN.md), [Architektur](ARCHITECTURE.md), [Entwicklungsanweisungen](AGENTS.md)
- Primärquellen: [OSC 2.5](https://help.malighting.com/grandMA3/2.5/HTML/remote_inputs_osc.html), [DataPool-Adressierung](https://help2.malighting.com/grandMA3/2.5/HTML/keyword_datapool.html), [Go+](https://help.malighting.com/grandMA3/2.5/HTML/keyword_goplus.html), [Go−](https://help.malighting.com/grandMA3/2.5/HTML/keyword_gominus.html), [Lua Get](https://help.malighting.com/grandMA3/2.5/HTML/lua_object_get.html)
- Toolchain: [Node-LTS](https://github.com/nodejs/Release), [Electron-Sicherheit](https://www.electronjs.org/docs/latest/tutorial/security), [Packager](https://electron.github.io/packager/main/), [Checkout](https://github.com/actions/checkout), [Setup Node](https://github.com/actions/setup-node), [Upload Artifact](https://github.com/actions/upload-artifact)

Keine Tests auf laufenden Shows ohne ausdrückliche Freigabe. Lizenzentscheidung steht noch aus.
