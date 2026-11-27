# Abnahme v0.1.0

Stand: 27. November 2026.

## Automatisch

- TypeScript strict: erfolgreich.
- ESLint: erfolgreich.
- Node-Test-Runner: 18 Tests erfolgreich (12 Playback-, 6 Servertests).
- Vite-Produktionsbuild: erfolgreich.
- npm-Abhängigkeiten mit Lockfile; Installation meldet keine bekannten Schwachstellen.

Die in der Desktop-App eingebettete Node-Version kann native Rollup-Module wegen macOS-Library-Validation nicht laden. Für den Build wurde eine unveränderte offizielle Node-24.22.3-Installation in einem temporären Verzeichnis verwendet. Dies ist keine Voraussetzung bei regulär installiertem Node.js inklusive npm.

## Browser

Im verfügbaren In-App-Browser geprüft:

- Start auf Current 04 / Next 05.
- GO+ wechselt auf 05 / 05.1; Positionsanzeige folgt.
- GO− wechselt zurück auf 04 / 05.
- Sperre deaktiviert Playback und Reset; Entsperren gibt Bedienung frei.
- Reset zeigt einen Bestätigungsdialog und stellt Cue 04 wieder her.
- Desktopdarstellung visuell geprüft.
- Responsive Layouts 390×844, 768×1024, 1024×768: Dokumentbreite entspricht Viewportbreite, kein horizontaler Überlauf.
- Mobile Bedienflächen mindestens 44 CSS-Pixel hoch.
- Keine Browser-Konsolenfehler während der Prüfung.

## Noch offen

Echtes iPad/Safari, Hardware-Touch, Safe Areas auf einem Gerät und Safari-Abnahme sind hier nicht verfügbar. Der Roadmap-Akzeptanzpunkt „Bedienung in Safari“ ist daher noch offen.

Keine Pult- oder onPC-Tests durchgeführt. Netzwerk-Reconnect, Timeout, echte Serverrollen und mehrere Browser-Clients sind in v0.1.0 nicht implementiert. Die Adaptertests prüfen konkurrierende Befehle und mehrere Abonnenten innerhalb einer Demo-Instanz; sie ersetzen keine spätere Netzwerk-Abnahme.

## Ergänzung: grafischer Serverbetrieb

- Typecheck für Renderer, Electron-Main und Preload sowie Lint erfolgreich.
- Server-Integrationstests mit echten lokalen Test-Ports: Start, HTTP-/Asset-Auslieferung, HEAD, Stop, Neustart, Konfigurationsvalidierung, belegter Port, doppelte Aktionen, fehlender Build und Schutz vor Zugriff auf Repository-/Desktop-Dateien erfolgreich.
- Eigenständiges macOS-arm64-Bundle mit Electron 45.5.0 erstellt. Lokale Ad-hoc-Signatur wird im Packaging-Schritt per codesign geprüft.
- Die gebaute Web-Demo nach Umstellung auf den gemeinsamen Build erneut geladen und GO+ auf Current 05 / Next 05.1 im Browser bestätigt.
- Gestaltung der gebauten Desktop-Seite im verfügbaren Browser visuell geprüft. Ohne Electron-Bridge sind alle Serveraktionen gesperrt und ein Hinweis auf die Desktop-App wird angezeigt.
- Native Electron-UI/IPC-Bedienung, Standardbrowser-Öffnung, macOS-Schließen/Single-Instance-Verhalten und LAN-/iPad-Erreichbarkeit sind noch manuell abzunehmen. Die verfügbaren Browserwerkzeuge steuern keine nativen macOS-Fenster. Der Server-Lebenszyklus selbst ist durch Integrationstests abgedeckt.
- GitHub-Artefakt-Workflow hinzugefügt; ein grüner lokaler Build ersetzt keinen bestätigten GitHub-Lauf.

## Ergänzung: Sequenznummer per UI

- Zwei zusätzliche Domänentests: ungültige Eingaben ohne Zustandsänderung; Übernahme/Normalisierung; neue Demo-Sequenz beginnt Off; alte Zielreferenz wird abgewiesen; Reset behält Nummer; Sperre, Status, Revision und Doppelklickschutz werden eingehalten.
- Im Produktionsbuild per Browser geprüft: 42 eingeben sperrt Playback bis zur Übernahme; Übernahme zeigt Sequenz 42, Current Off, Next Einlass und Position 0/10 ohne Playback.
- Ungültige Nummer 0 zeigt einen Hinweis und sperrt Übernahme/Playback. „Verwerfen“ stellt 42 wieder her. Lock deaktiviert das Eingabefeld.
- Auch mit langer gültiger Nummer kein horizontaler Überlauf bei 390×844 und 1024×768.
- Typecheck, Lint, alle 18 Tests, Web-/Desktop-Build erfolgreich; macOS-App neu gebaut. Keine Verbindung oder Befehle an grandMA3 gesendet. Native GUI-/Safari-Abnahme bleibt offen.
