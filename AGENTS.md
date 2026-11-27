# Entwicklungsanweisungen für Codex

Lies README.md, ROADMAP.md, DESIGN.md und ARCHITECTURE.md vor Änderungen. Entwickle in kleinen überprüfbaren Schritten gemäß Roadmap. Beginne mit v0.1.0, nicht mit allen Features zugleich.

- React + TypeScript (strict), Node.js, später Electron; npm mit Lockfile. Nutze eine unterstützte Node-LTS-Version und dokumentiere diese.
- Trenne UI, Domänenmodell, Transport und Demo-Adapter. Keine OSC-Kommandos direkt aus der UI.
- UI zunächst deutsch oder mit konsistenten englischen Playback-Begriffen; sichtbare Texte zentral halten. Code und technische Bezeichner Englisch.
- Seit v0.2.2 auf Benutzerwunsch kein Demo-Modus und kein Demo Reset im Produkt. Simulierte Empfänger ausschließlich für Tests; diese dürfen nie ein echtes Pult ansprechen.
- Pultstatus ist autoritativ. Niemals erfolgreiches Playback nur aufgrund einer gesendeten UDP-Nachricht vortäuschen.
- Bei Offline/Stale/Timeout: Bedienung serverseitig und im Client sperren, keine Warteschlange, kein automatischer Retry von GO, vollständige Resynchronisation vor Freigabe.
- Befehle ausschließlich für ausgewählte Sequenz; keine frei eingebbaren MA-Kommandos über das Web-API. Eingaben validieren, Bedienerrechte serverseitig prüfen, keine Secrets committen.
- OSC-/Lua-Syntax anhand offizieller MA-Dokumentation und realer Tests verifizieren. Unbekannte API-Funktionen nicht erfinden. Ungeprüfte Annahmen als solche dokumentieren.
- Tests für Cue-Übergänge, Dezimal-Cues, Ende/Loop, Off-Zustand, stale status, doppelte Requests, Reconnect und mehrere Clients.
- Pro Änderung Typecheck, Lint, Tests und Build durchführen, soweit verfügbar; Ergebnisse und nicht ausgeführte Tests transparent nennen. README mit Startbefehlen ergänzen, sobald diese tatsächlich funktionieren.
- Keine Live-Tests auf einer laufenden Show ohne ausdrückliche Freigabe; zunächst Demo und separate Testshow.
- Keine unnötigen Abhängigkeiten, keine Cloud, keine Telemetrie. GitHub Actions für CI und später macOS arm64 DMG; aktuelle unterstützte Action-Versionen verifizieren.

Die Basis v0.1.0 ist abgeschlossen. Aktuell die echte Pultanbindung in kleinen überprüfbaren Schritten weiterentwickeln und Installation sowie Prüfungen dokumentieren.

## Zusammenarbeit und Auslieferung

- Abgeschlossene, geprüfte Änderungen für dieses Projekt selbstständig committen und zu GitHub pushen; keine erneute Freigabe für gewöhnliche Commits und Pushs anfordern. Keine fremden Änderungen überschreiben und keinen Force-Push verwenden.
- Vom Benutzer keine Terminalbedienung verlangen. Installation, Start und technische Prüfungen selbst übernehmen und eine direkt nutzbare Oberfläche bzw. einen Link bereitstellen.
- Serverstart, Serverstopp und Betriebseinstellungen müssen über eine grafische Benutzeroberfläche bedienbar sein. Ein von Codex gestarteter Terminalprozess ersetzt diese Produktanforderung nicht. Die macOS-App muss per Doppelklick startbar sein.
- Benutzerentscheidung zur Next-Anzeige: immer den nächsten Eintrag der Cueliste anzeigen (bei Off den ersten Cue, am Listenende Ende der Cueliste). Diese Next-Anzeige nicht an LoadedCue koppeln. Seit v0.2.11 LoadedCue getrennt anzeigen und auf GO+ als tatsächliches vorgeladenes Ziel bevorzugen; ausschließlich aus Pultfeedback, nicht aus gesendetem Load ableiten. Load/Goto seit v0.2.9 als kleine Buttons mit Cue-Auswahl; Playback-Erfolg bleibt rückmeldebasiert.
- Seit v0.2.8 auf Benutzerwunsch Pause vollständig aus UI, API und Bridge entfernt; keinen zusätzlichen OSC-Playback-Feedbackempfänger anbieten. Berechnete Fade-Vorschau weiterhin dezent per Tooltip/Einstellungen erklären; GO+ währenddessen gelb pulsierend warnen. Externe Pult-Pause wird nicht nachgeführt.

- Seit v0.2.3 DataPool/Sequenz ausschließlich in Web-Einstellungen. Nach erfolgreichem Zielwechsel zuvor frische entsperrte Bedienung automatisch freigeben; manuelle Sperren sowie Fehler-/Timeout-Sperren nie automatisch aufheben. Hauptseite kompakt mit intern scrollender Cueliste.
