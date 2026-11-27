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
DEMO / CONNECTING / ONLINE / STALE / OFFLINE. ONLINE nur bei bestätigtem frischem Pultstatus. Unbekannte Werte als — anzeigen. Bei Sperre oder unklarem Status Steuerung deaktivieren, Grund anzeigen. Next zeigt auf Benutzerwunsch den nächsten Listeneintrag. Bei Off den ersten Cue; am Listenende „Ende der Cueliste“. Tatsächliche Playback-Übergänge bleiben pultgesteuert.

## Lokale Serversteuerung

Ein separates macOS-Fenster dient dem Betrieb, die Playback-Oberfläche bleibt unverändert. Dunkles Design mit eindeutigem DEMO-Hinweis. Sichtbarer Serverstatus (gestoppt, wird gestartet, läuft, wird gestoppt, Fehler), Portfeld und explizite LAN-Freigabe. Große Buttons „Server starten“/„Server stoppen“ und „Weboberfläche öffnen“. Bei laufendem Server Konfiguration sperren; während Statuswechseln Aktionen deaktivieren. Lokale und LAN-Webadressen werden erst nach erfolgreichem Start angezeigt. Serverstatus ist kein Pultverbindungsstatus. Schließen beendet die App inklusive Server.

## Sequenznummer

Unter der Kopfzeile steht ein touchgeeignetes Feld „Sequenznummer“ mit „Übernehmen“. Nur positive ganze Zahlen werden angenommen. Unbestätigte oder ungültige Eingaben sperren Playback und Reset; „Verwerfen“ stellt die übernommene Nummer wieder her. Bei Bedienungssperre oder unklarem Verbindungsstatus kann die Sequenz nicht gewechselt werden. Demo-Auswahl und Beispiel-Cues sind ausdrücklich gekennzeichnet. Ein Wechsel löst kein Playback aus.

## Live-Verbindung ab v0.2.0

Die Mac-App trennt Webserver- und OSC-Verbindungsstatus. Ziel-IP, lokale Rückmelde-IP, OSC-Port, Präfix, DataPool und Sequenznummer werden über Felder eingegeben. „Verbinden“ fragt lesend ab; „Trennen“ beendet Abfragen. „Demo öffnen“ und „Live-Weboberfläche öffnen“ sind getrennte Aktionen. Verbindungsdaten sind während einer Verbindung gesperrt.

Im Live-Browser werden DataPool und Zielsequenz angezeigt. ONLINE gibt es ausschließlich nach validierter frischer Antwort der Zielversion. Die Bedienung beginnt gesperrt. Pending deaktiviert weitere GO-Befehle; unbekanntes Ergebnis sperrt dauerhaft bis zur neuen vollständigen Synchronisation und manuellen Freigabe. „Neu synchronisieren“ löst keinen GO aus. Ein Live-Reset existiert nicht. NEXT CUE, blaue Tabellenmarkierung und GO+-Beschriftung zeigen den nächsten Listeneintrag, auch bei Dezimal-Cues. Geladene Ziele beeinflussen diese Listenanzeige nicht; Goto folgt später. Nur echte Pultdaten bestimmen die Cueliste und Current.
