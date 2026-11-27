# Bedienoberfläche

Dunkles, kontrastreiches Live-Design ohne unnötige Menüs. Primär iPad, auch Desktop-Browser. Sichtbare Texte zentral in Textmodulen; technische Bezeichner Englisch. Keine horizontale Scrollleiste, mindestens 44 CSS-Pixel hohe Bedienelemente, sichtbarer Fokus und Safe Areas. Farbe nie als einziges Statusmerkmal.

## Hauptansicht

Kopfzeile mit MA3 CUE REMOTE, DataPool, gewählter Sequenznummer und Name, ausdrücklich beschriftetem Verbindungsstatus und Bedienungssperre. Unter der Kopfzeile: Sequenznummer mit Übernehmen und Verwerfen. Nicht übernommene/ungültige Eingaben sperren Playback. Wechsel löst keinen GO aus und sperrt bis zum frischen vollständigen Snapshot.

CURRENT CUE grün, NEXT CUE blau, jeweils mit großer Nummer, Name und bekannter Fade-Zeit. Next zeigt immer den nächsten Eintrag der gelieferten Liste, bei Off den ersten Cue und am Listenende „Ende der Cueliste“. Goto wird später umgesetzt.

Cueliste mit Nummer, Name, Fade und textlichem Statussymbol. Aktuelle Zeile grün, nächste blau. Automatisch folgen, manuelles Scrollen erlauben; Auto-Follow wieder einschaltbar. Separater Listenfortschritt zeigt Position/Anzahl, keinen zeitlichen Ablauf.

Sehr großer grüner GO+-Button mit Next-Name. Darunter GO− und **Pause** nebeneinander; Pause ist ein Toggle für Pause/Fortsetzen. Während eines ausstehenden Befehls sind weitere Bedienbefehle deaktiviert. Resynchronisation ist separat erreichbar. Im Hochformat Bedienung am unteren Viewportrand; im Querformat neben der Liste. Kein Demo-Modus, kein Reset und keine Dummy-Cues im Produkt.

## Berechnete Fade-Vorschau

In der Current-Karte steht ausdrücklich **FADE-VORSCHAU · BERECHNET** mit Prozentwert, Balken und ungefährer Restzeit. In der aktuellen Cue-Zeile erscheint derselbe Verlauf als schmaler blauer Balken. Die Berechnung beginnt erst nach einem bestätigten Cue-Wechsel, berücksichtigt gespeicherten Fade und aus der App bestätigte Pause-Tastendrücke und stoppt bei fehlenden frischen Pultdaten. Keine angeblich gemessene MA-Fortschrittsanzeige.

Bei unbekannter Fade-Zeit, initial bereits laufendem Cue oder fehlender Synchronisation gibt es keinen laufenden Balken. Externe Pause, individuelle Zeiten, Delay und Timing-/Rate-Master werden nicht vollständig abgebildet. Diese Grenzen sind dokumentiert, die Anzeige bleibt als berechnet erkennbar. Für reduzierte Animationen Fortschritt nur mit Statusupdates aktualisieren. Fortschrittsänderungen nicht ständig per Screenreader ankündigen.

## Verbindung und Betrieb

CONNECTING / ONLINE / STALE / OFFLINE. ONLINE nur nach validierter frischer MA-Antwort. Unbekannte Werte als — anzeigen. Bei Sperre oder unklarem Status Bedienung deaktivieren und Grund zeigen. Keine optimistische Current-Aktualisierung durch Sendebestätigungen. Unbekanntes Befehlsergebnis sperrt bis zur expliziten vollständigen Resynchronisation und manuellen Freigabe.

Die Mac-App trennt Webserver- und OSC-Status. Server starten/stoppen sowie Weboberfläche öffnen per UI. OSC-Felder: Ziel-IP, lokale Rückmelde-IP, Port, Präfix, DataPool und Sequenznummer. „Verbinden“ fragt lesend ab, „Trennen“ beendet die Abfragen. Verbindungsdaten während einer Verbindung sperren. Webadressen mit Bedienerschlüssel erst nach Serverstart anzeigen; LAN-Freigabe standardmäßig aus. Keine Terminalbedienung für den normalen Betrieb.
