# grandMA3 Cue Remote

Lokale, iPad-optimierte Fernbedienung für grandMA3-Sequenzen im Konzert- und Livebetrieb.

## v0.1.0 – interaktive Demo

Responsive React/TypeScript-Weboberfläche mit Current/Next, zehn realistischen Cues inklusive Dezimal-Cue `05.1`, Fade-Zeiten, Cueliste, Auto-Follow, GO+/GO−, Bedienungssperre und bestätigtem Demo Reset. Der Fortschritt zeigt die **Listenposition**, keinen zeitlichen Fade-Verlauf.

Die Anwendung ist ausschließlich eine klar gekennzeichnete lokale Simulation. Sie verbindet sich mit keinem Pult. Es gibt noch keine Pult-Bridge, keinen OSC-/Lua-Transport oder Live-Modus. Die macOS-App enthält einen lokalen HTTP-Server ausschließlich für die gebaute Demo. Jeder Browser-Tab hat seine eigene Demo-Sitzung. Nach Laden startet die Demo auf Cue 04. GO+ endet bei Applaus ohne automatischen Loop; GO− stoppt am ersten Cue. Die Sperre blockiert auch Reset. Es gibt einen 450-ms-Doppelklickschutz und keine Befehlswarteschlange.

Die **Sequenznummer** kann oben in der Weboberfläche eingegeben und mit **Übernehmen** ausgewählt werden. Während einer nicht übernommenen Eingabe sind GO+/GO− und Reset gesperrt; **Verwerfen** stellt die aktuelle Auswahl wieder her. Ein Wechsel setzt die lokale Demo-Sequenz auf **Off**, ohne Playback auszulösen. GO+ startet danach den ersten Beispiel-Cue. Demo Reset behält die gewählte Sequenznummer bei. Die Auswahl gilt für den jeweiligen Browser-Tab bis zum Neuladen. Die angezeigten Cues bleiben Beispieldaten; es wird keine Sequenz aus grandMA3 geladen.

## Bedienung ohne Terminal (macOS Apple Silicon)

Die Desktop-App enthält die Laufzeit und die gebaute Weboberfläche. Zur Bedienung ist keine Node-/npm-Installation nötig.

1. `MA3 Cue Remote.app` im Finder per Doppelklick öffnen.
2. Optional einen Port wählen (Standard 4173; 0 = automatisch freier Port).
3. **Server starten** anklicken. Der bestätigte Status wechselt auf „Läuft“.
4. **Weboberfläche öffnen** anklicken. Die Cue Remote öffnet sich im Standardbrowser.
5. **Server stoppen** beendet den HTTP-Server. Auch das Schließen der App beendet ihn.

Die App startet den Server nicht automatisch. Ein zweiter App-Start öffnet das bestehende Fenster. Bei einem belegten Port erscheint eine Fehlermeldung; die App beendet keine fremden Server. Änderungen an Port und LAN-Freigabe sind bei laufendem Server gesperrt.

Für das iPad vor dem Start bewusst **Im lokalen Netzwerk freigeben** aktivieren. Danach die unter „iPad / lokales Netzwerk“ angezeigte Adresse auf dem iPad im gleichen vertrauenswürdigen WLAN öffnen. Standardmäßig ist die Demo nur auf diesem Mac erreichbar. Eine bereits geladene Demo kann nach einem Serverstopp lokal weitersimulieren; sie hat keine Live-Verbindung.

Die App wird lokal unter `release/MA3 Cue Remote-darwin-arm64/MA3 Cue Remote.app` erzeugt. GitHub baut zusätzlich ein ZIP im Workflow [macOS Demo App](https://github.com/Wiwaltill/grandMA3-Cue-Remote/actions/workflows/desktop.yml): erfolgreichen Lauf öffnen, unter „Artifacts“ das macOS-arm64-Artefakt herunterladen, entpacken und die App öffnen. Das darin enthaltene App-ZIP gegebenenfalls ebenfalls entpacken.

Dies ist eine mit Ad-hoc-Signatur gebaute Entwicklungsfassung, noch keine mit Apple-Developer-Zertifikat signierte/notarisierte Distribution. macOS kann heruntergeladene Builds deshalb blockieren. DMG, Developer-ID-Signatur und Notarisierung bleiben Teil des späteren Release-Meilensteins.

Die gebaute Demo lädt keine externen Fonts, Dienste oder Telemetrie. Es gibt keinen Service Worker und keinen Offline-Cache. Die Anwendung braucht nach Installation keinen Internetzugang.

## Entwicklung (technische Referenz)

Voraussetzung für Entwicklung und App-Build: **Node.js 24 LTS ab 24.12**, inklusive npm (getestet mit Node 24.22.3). Die Node-Version steht in `.nvmrc`. Die folgenden Befehle sind für Entwicklung und CI; zur normalen Bedienung wird die App verwendet.

```sh
npm ci
npm run desktop:dev
```

`desktop:dev` baut die Oberflächen und öffnet die grafische Serversteuerung. `npm run desktop:package` erstellt auf macOS das eigenständige arm64-App-Bundle. `npm run dev` startet optional den Vite-Server ausschließlich für Webentwicklung auf 127.0.0.1:5173. Die Desktop-Steuerung funktioniert ausschließlich in Electron; im normalen Browser sind ihre Aktionen deaktiviert. Ihre strikte CSP erfordert für Layout-Prüfungen den Produktionsbuild statt Vites injizierter Entwicklungsstile.

## Prüfungen und Produktionsbuild

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

Der Build liegt in `dist/`. Die Vorschau öffnet man unter [http://127.0.0.1:4173](http://127.0.0.1:4173). Für spätere Änderungen dieselben vier Prüfungen vornehmen; GitHub Actions führt sie ebenfalls aus.

Die zwölf Playback-Tests decken Übergänge, Dezimal-Cues, Listenende/-anfang, expliziten Demo-Loop, Off-Zustand, Sperre/Reset, Request-Duplikate, Doppelklickschutz, konkurrierende Revisionen, Sequenzvalidierung, unklare Verbindungszustände und Abonnements ab. Sechs zusätzliche Servertests prüfen Konfiguration, HTTP-Auslieferung, Start/Stopp/Neustart, Portkonflikte, doppelte Aktionen und die Begrenzung auf Demo-Dateien. Alle 18 Tests verwenden Nodes eingebauten Test-Runner ohne zusätzliche Test-Laufzeit.

Browser-Abnahme: GO+/GO−, Sperre/Entsperren, Reset mit Bestätigung, Current/Next sowie Layout ohne horizontalen Überlauf bei 390×844, 768×1024 und 1024×768 prüfen. Bei manuellem Scrollen wird Auto-Follow deaktiviert; über „Aktueller Cue folgen“ wieder aktivieren. GO am Listenende und GO− am Anfang müssen deaktiviert sein. Alle Bedienelemente sind mindestens 44 CSS-Pixel hoch und per Tastatur erreichbar.

Ausgeführte Prüfungen und offene Hardware-Abnahme: [Testbericht](tests/VERIFICATION.md).

## Struktur und nächste Schritte

- `apps/web`: React-Oberfläche; sichtbare Texte zentral in `src/text.ts`.
- `packages/shared`: Domänenmodell und `PlaybackTransport`-Vertrag.
- `packages/demo`: lokaler Adapter, Statusquelle und Befehlsvalidierung.
- `apps/desktop`: Electron-Startfenster, schmaler IPC-Vertrag und lokaler Demo-Dateiserver.
- `scripts`: Erstellen des macOS-App-Bundles.
- `tests`: Playback- und Servertests sowie manueller Abnahmebericht.

Die UI kennt weder OSC noch MA-Kommandos. Der spätere Live-Transport muss bestätigte Snapshots liefern und serverseitig Frische, Rechte, Sperre, Sequenz, Revision und Request-ID prüfen. Ein gesendeter Befehl ist keine Playback-Bestätigung. Netzwerk-Reconnect, Timeouts, Rollen und echte Multi-Client-Synchronisation gehören zu späteren Roadmap-Meilensteinen und sind noch nicht implementiert.

Ziel für die spätere Pultanbindung: grandMA3 2.5.1.1, lokal ohne Cloud. Keine Live-Tests auf einer laufenden Show; zuerst separate Testshow mit ausdrücklicher Freigabe.

- [Roadmap](ROADMAP.md)
- [Design](DESIGN.md)
- [Architektur](ARCHITECTURE.md)
- [Entwicklungsanweisungen](AGENTS.md)

Toolchain-Quellen: [Node-LTS-Zeitplan](https://github.com/nodejs/Release), [Checkout](https://github.com/actions/checkout), [Setup Node](https://github.com/actions/setup-node), [Upload Artifact](https://github.com/actions/upload-artifact), [Electron-Sicherheit](https://www.electronjs.org/docs/latest/tutorial/security), [Electron Packager](https://electron.github.io/packager/main/). Lizenzentscheidung steht noch aus.
