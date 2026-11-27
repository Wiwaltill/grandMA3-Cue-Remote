# Bedienoberfläche

Dunkles, kontrastreiches Live-Design ohne unnötige Menüs. Primär iPad, auch Desktop-Browser. Sichtbare Texte zentral in Textmodulen; technische Bezeichner Englisch. Keine horizontale Scrollleiste, mindestens 44 CSS-Pixel hohe Bedienelemente, sichtbarer Fokus und Safe Areas. Farbe nie als einziges Statusmerkmal.

## Hauptansicht

Kopfzeile mit MA3 CUE REMOTE, DataPool, gewählter Sequenznummer und Name, ausdrücklich beschriftetem Verbindungsstatus und Bedienungssperre. Zahnrad öffnet eine separate Web-Einstellungsseite für DataPool und Sequenznummer mit Übernehmen und Verwerfen. Nicht übernommene/ungültige Eingaben sperren Playback. Wechsel löst keinen GO aus und sperrt bis zum frischen vollständigen Snapshot. Zuvor entsperrte Bedienung wird dann automatisch wieder freigegeben; manuelle Sperre sowie Sperren nach Fehler/Timeout bleiben bestehen.

CURRENT CUE grün, NEXT CUE blau, jeweils mit großer Nummer, Name, MA-Gesamtdauer sowie allgemeinen/individuellen Fade- und Delay-Werten. Next zeigt immer den nächsten Eintrag der gelieferten Liste, bei Off den ersten Cue und am Listenende „Ende der Cueliste“. Goto wird später umgesetzt.

Cueliste mit Nummer, Name, Fade und textlichem Statussymbol. Aktuelle Zeile grün, nächste blau. Automatisch folgen, manuelles Scrollen erlauben; Auto-Follow wieder einschaltbar. Separater Listenfortschritt zeigt Position/Anzahl, keinen zeitlichen Ablauf.

Sehr großer grüner GO+-Button mit Next-Name. Darunter GO− und **Pause** nebeneinander; Pause/Fortsetzen setzt gezielt Pause On/Off. Nach bestätigtem On leuchtet der Button gelb mit „Pause aktiv“ und aria-pressed; nach Off wieder neutral. Unbekannter Zustand wird nicht als inaktiv ausgegeben. Während eines ausstehenden Befehls sind weitere Bedienbefehle deaktiviert. Resynchronisation ist separat erreichbar. Im Hochformat Bedienung unter der intern scrollenden Liste; im Querformat neben der Liste. Die Hauptansicht nutzt die Viewporthöhe. Bei sehr niedrigen Fenstern bleibt die Seite scrollbar. Resynchronisation liegt auf der Einstellungsseite. Kein Demo-Modus, kein Reset und keine Dummy-Cues im Produkt.

## Berechnete Fade-Vorschau

In der Current-Karte steht dezent **Fade** mit Prozentwert, Balken und ungefährer Restzeit. Die große Berechnet-Beschriftung entfällt auf Benutzerwunsch; Tooltip und Einstellungen erklären die Berechnung. GO+ wird während der berechneten Fade-Dauer gelb und pulsiert langsam (1,8 Sekunden), mit dem Text „Fade läuft“. Bei angehaltenem Fade dauerhaft gelb; nach Ablauf grün. GO bleibt bedienbar. Reduced Motion unterdrückt das Pulsieren. In der aktuellen Cue-Zeile erscheint derselbe Verlauf als schmaler blauer Balken. Die Berechnung beginnt erst nach einem bestätigten Cue-Wechsel, verwendet MA-Duration einschließlich Cue-Delay und individueller Zeiten und aus der App bestätigte Pause-Tastendrücke und stoppt bei fehlenden frischen Pultdaten. Keine angeblich gemessene MA-Fortschrittsanzeige.

Bei unbekannter Fade-Zeit, initial bereits laufendem Cue oder fehlender Synchronisation gibt es keinen laufenden Balken. Externe Pause und dynamische Timing-/Rate-Master werden nicht vollständig abgebildet. Die Anzeige ist ein linearer Verlauf der Gesamtdauer, keine Attribut-Fadekurve. Diese Grenzen sind dokumentiert, die Berechnungsgrundlage bleibt in Tooltip und Einstellungen erkennbar. Für reduzierte Animationen Fortschritt nur mit Statusupdates aktualisieren. Fortschrittsänderungen nicht ständig per Screenreader ankündigen.

## Verbindung und Betrieb

CONNECTING / ONLINE / STALE / OFFLINE. ONLINE nur nach validierter frischer MA-Antwort. Unbekannte Werte als — anzeigen. Bei Sperre oder unklarem Status Bedienung deaktivieren und Grund zeigen. Keine optimistische Current-Aktualisierung durch Sendebestätigungen. Unbekanntes Befehlsergebnis sperrt bis zur expliziten vollständigen Resynchronisation und manuellen Freigabe.

Die Mac-App trennt Webserver- und OSC-Status. Server starten/stoppen sowie Weboberfläche öffnen per UI. OSC-Felder: Ziel-IP, lokale Rückmelde-IP, Port und Präfix. Playback-Ziel ausschließlich in den Web-Einstellungen; initial DataPool 1 / Sequenz 1. „Verbinden“ fragt lesend ab, „Trennen“ beendet die Abfragen. Verbindungsdaten während einer Verbindung sperren. Webadressen mit Bedienerschlüssel erst nach Serverstart anzeigen; LAN-Freigabe standardmäßig aus. Keine Terminalbedienung für den normalen Betrieb.
