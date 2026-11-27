# grandMA3 Cue Remote

Lokale, iPad-optimierte Fernbedienung für grandMA3-Sequenzen im Konzert- und Livebetrieb.

## v0.1.0 – interaktive Demo

Responsive React/TypeScript-Weboberfläche mit Current/Next, zehn realistischen Cues inklusive Dezimal-Cue `05.1`, Fade-Zeiten, Cueliste, Auto-Follow, GO+/GO−, Bedienungssperre und bestätigtem Demo Reset. Der Fortschritt zeigt die **Listenposition**, keinen zeitlichen Fade-Verlauf.

Die Anwendung ist ausschließlich eine klar gekennzeichnete lokale Simulation. Sie verbindet sich mit keinem Pult. Es gibt noch keinen Node-Bridge-Server, OSC-/Lua-Transport oder Live-Modus. Jeder Browser-Tab hat seine eigene Demo-Sitzung. Nach Laden startet die Demo auf Cue 04. GO+ endet bei Applaus ohne automatischen Loop; GO− stoppt am ersten Cue. Die Sperre blockiert auch Reset. Es gibt einen 450-ms-Doppelklickschutz und keine Befehlswarteschlange.

## Installation und Start

Voraussetzung: **Node.js 24 LTS ab 24.12**, inklusive npm (getestet mit Node 24.22.3). Die Node-Version steht in `.nvmrc`; mit nvm zuerst `nvm install` und `nvm use` ausführen.

```sh
npm ci
npm run dev
```

Anschließend [http://127.0.0.1:5173](http://127.0.0.1:5173) öffnen. Der Entwicklungsserver bindet standardmäßig nur lokal. Installation benötigt Internet; die gebaute Demo lädt keine externen Fonts, Dienste oder Telemetrie. Kein Service Worker und kein Offline-Cache; eine bereits geladene Demo arbeitet ohne Pult/Netzwerk weiter.

Für einen bewussten Demo-Test auf dem iPad im gleichen vertrauenswürdigen WLAN:

```sh
npm run dev -- --host 0.0.0.0
```

Auf dem iPad `http://<LAN-IP-des-Mac>:5173` öffnen. Dadurch wird ausschließlich der Demo-Entwicklungsserver im LAN erreichbar. Der Vite-Server ist kein späterer Produktions-/Live-Server.

## Prüfungen und Produktionsbuild

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

Der Build liegt in `dist/`. Die Vorschau öffnet man unter [http://127.0.0.1:4173](http://127.0.0.1:4173). Für spätere Änderungen dieselben vier Prüfungen vornehmen; GitHub Actions führt sie ebenfalls aus.

Die zehn Tests decken Übergänge, Dezimal-Cues, Listenende/-anfang, expliziten Demo-Loop, Off-Zustand, Sperre/Reset, Request-Duplikate, Doppelklickschutz, konkurrierende Revisionen, Sequenzvalidierung, unklare Verbindungszustände und Abonnements ab. Tests verwenden Nodes eingebauten Test-Runner ohne zusätzliche Test-Laufzeit.

Browser-Abnahme: GO+/GO−, Sperre/Entsperren, Reset mit Bestätigung, Current/Next sowie Layout ohne horizontalen Überlauf bei 390×844, 768×1024 und 1024×768 prüfen. Bei manuellem Scrollen wird Auto-Follow deaktiviert; über „Aktueller Cue folgen“ wieder aktivieren. GO am Listenende und GO− am Anfang müssen deaktiviert sein. Alle Bedienelemente sind mindestens 44 CSS-Pixel hoch und per Tastatur erreichbar.

Ausgeführte Prüfungen und offene Hardware-Abnahme: [Testbericht](tests/VERIFICATION.md).

## Struktur und nächste Schritte

- `apps/web`: React-Oberfläche; sichtbare Texte zentral in `src/text.ts`.
- `packages/shared`: Domänenmodell und `PlaybackTransport`-Vertrag.
- `packages/demo`: lokaler Adapter, Statusquelle und Befehlsvalidierung.
- `tests`: Adaptertests und manueller Abnahmebericht.

Die UI kennt weder OSC noch MA-Kommandos. Der spätere Live-Transport muss bestätigte Snapshots liefern und serverseitig Frische, Rechte, Sperre, Sequenz, Revision und Request-ID prüfen. Ein gesendeter Befehl ist keine Playback-Bestätigung. Netzwerk-Reconnect, Timeouts, Rollen und echte Multi-Client-Synchronisation gehören zu späteren Roadmap-Meilensteinen und sind noch nicht implementiert.

Ziel für die spätere Pultanbindung: grandMA3 2.5.1.1, lokal ohne Cloud. Keine Live-Tests auf einer laufenden Show; zuerst separate Testshow mit ausdrücklicher Freigabe.

- [Roadmap](ROADMAP.md)
- [Design](DESIGN.md)
- [Architektur](ARCHITECTURE.md)
- [Entwicklungsanweisungen](AGENTS.md)

Toolchain-Quellen: [Node-LTS-Zeitplan](https://github.com/nodejs/Release), [Checkout](https://github.com/actions/checkout), [Setup Node](https://github.com/actions/setup-node). Lizenzentscheidung steht noch aus.
