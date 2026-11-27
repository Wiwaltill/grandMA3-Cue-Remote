# Bedienoberfläche

Dunkles, kontrastreiches Live-Design ohne unnötige Menüs. Primär iPad; auch Desktop-Browser. Kein Nachbau der gesamten grandMA3-Oberfläche.

## Hauptansicht
Kopfzeile: MA3 CUE REMOTE, ausgewählte Sequenz (Nummer und Name), eindeutig beschrifteter Verbindungsstatus, Schloss.
Zwei Statusflächen: CURRENT CUE grün, NEXT CUE blau; große Cue-Nummer, Name, Fade falls bekannt.
Fortschritt: Position in Liste / Anzahl, nicht als zeitlicher Ablauf interpretieren.
Cueliste: Nummer, Name, Fade, Statussymbol. Aktuelle Zeile grün, nächste blau; automatisch folgen, manuelles Scrollen erlauben.
Unten fixiert: sehr große grüne GO+-Taste mit nächstem Cue-Namen; kleinere GO−-Taste. Demo Reset nur im Demo-Modus. Goto nur mit expliziter Bestätigung. Kein versehentliches Goto beim Scrollen.

## Beispiel
Current 04 Song 01 – Opening, Fade 2.0 s
Next 05 Song 02 – Ballade, Fade 4.0 s
Weitere Demo-Cues: Einlass, Begrüßung, Intro, Song 03 – Upbeat, Moderation, Finale, Applaus.

## Layout
Hochformat: Kopf, Status nebeneinander, Liste, fixierte Steuerung.
Querformat: Liste und Steuerbereich nebeneinander, Status jederzeit sichtbar.
Große Touch-Ziele (mindestens 44 CSS-Pixel), ausreichend Abstand, Safe Areas, keine horizontale Scrollleiste. Farbe nie als einziges Statusmerkmal. Kontrastreiche Texte, sichtbarer Fokus.

## Zustände
DEMO / CONNECTING / ONLINE / STALE / OFFLINE. ONLINE nur bei bestätigtem frischem Pultstatus. Unbekannte Werte als — anzeigen. Bei Sperre oder unklarem Status Steuerung deaktivieren, Grund anzeigen. Letzte Cue und Loop anhand Pultstatus behandeln, keine pauschale Endannahme im Live-Modus.

## Lokale Serversteuerung

Ein separates macOS-Fenster dient dem Betrieb, die Playback-Oberfläche bleibt unverändert. Dunkles Design mit eindeutigem DEMO-Hinweis. Sichtbarer Serverstatus (gestoppt, wird gestartet, läuft, wird gestoppt, Fehler), Portfeld und explizite LAN-Freigabe. Große Buttons „Server starten“/„Server stoppen“ und „Weboberfläche öffnen“. Bei laufendem Server Konfiguration sperren; während Statuswechseln Aktionen deaktivieren. Lokale und LAN-Webadressen werden erst nach erfolgreichem Start angezeigt. Serverstatus ist kein Pultverbindungsstatus. Schließen beendet die App inklusive Server.
