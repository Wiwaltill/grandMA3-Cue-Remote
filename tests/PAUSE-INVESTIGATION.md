# Untersuchung: tatsächlicher Pause-Zustand in MA 2.5.1.1

Stand: 27. November 2026. Ergebnis: **Kein verifizierter, erneut abfragbarer Pause-Snapshot gefunden. Diese erste Untersuchung wird durch die unten dokumentierte OSC-Ergänzung v0.2.7 erweitert.** Dies ist keine Aussage, dass intern kein solcher Zustand existiert.

## Prüfungen

Offizielle MA-Dokumentation, mit HelpLua exportierte API-Liste der installierten Version, ausgelieferte MA-Systemtests und reale lokale onPC-Testshow untersucht. Nur die zuvor ausgeschaltete DataPool-1-/Sequenz-1-Testsequenz für den ausdrücklich freigegebenen Playback-Test benutzt. Vor jedem erfolgreichen Playback-Test Off geprüft; danach Pause Off und Off wiederhergestellt und durch erneute MA-Rückmeldung bestätigt. Keine Cue-Programmierung und keine Netzwerk-/OSC-Ausgabekonfiguration geändert.

| Datenquelle | Off | Laufend | Pause On | Pause Off |
| --- | --- | --- | --- | --- |
| IsRunningPlayback | false | true | true | true |
| HasActivePlayback | false | true | true | true |
| GetFaderText FaderX/XA/XB/Temp | 0% | 0% | 0% | 0% |
| GetFaderText FaderMaster | 100% | 100% | 100% | 100% |

Alle per PropertyCount/PropertyName enumerierten Sequenz-Display-Eigenschaften verglichen: keine Änderung zwischen laufend, Pause On und Pause Off. Deshalb keine dieser Größen als Ersatz für Paused verwenden. Insbesondere bedeutet IsRunningPlayback=false nicht „pausiert“.

Root().Temp-Playback-Sammler und CmdObj().RunningPlaybacks untersucht. RunningPlaybacks meldet einen Count, liefert über Children/Ptr aber keine lesbaren Einträge mit Pause-Eigenschaft. GetLineCount liefert dort keinen numerischen Zeilenzähler. Die geprüfte exportierte API-Liste und installierten Lua-Systemtests enthalten keinen verifizierten IsPaused-/GetPauseState-Zugriff. Solche Methoden werden nicht erfunden.

ObjectList('RunningPlayback *') lieferte im untersuchten Zugriff keine auswertbare Antwort. Diese fehlgeschlagene Abfrage wurde nicht als Beweis für einen konkreten Zustand interpretiert; bei diesen Versuchen wurde noch vor Playback abgebrochen.

## Dokumentierte OSC-Rückmeldung

MA beschreibt Object Playback Feedback als Ereignisse: Key-Funktion, gedrückt/losgelassen und Cue-Text. Das ist kein dokumentierter vollständiger Pause-Snapshot. Eine externe Pause könnte grundsätzlich über Playback-Ereignisse verfolgt werden; dazu fehlen noch verifiziertes Pause-On/Off-Paketformat, eindeutige Zielzuordnung, sichere Initialisierung und vollständige Wiederherstellung nach verlorenen Ereignissen/Verbindungsabbruch.

Keine OSC-Ausgangskonfiguration verändert und kein angeblicher aktueller Pause-Zustand aus bloßem Ereigniszählen implementiert. Ein UDP-Toggle kann verloren gehen oder doppelt eintreffen. Weiterhin frische Cue-Snapshots erkennen einen solchen Verlust nicht, wenn sie selbst keinen Pause-Zustand enthalten.

## Konsequenz für das Produkt

appPauseState bleibt die letzte bestätigte, explizit durch die App gesetzte Pause On/Off, keine tatsächliche kontinuierliche Paused-Abfrage. Externe Pause kann die berechnete Vorschau weiterhin unbemerkt anhalten bzw. fortsetzen; diese Grenze bleibt sichtbar in Einstellungen/Tooltip und dokumentiert. Kein Produktverhalten wurde für diese Untersuchung geändert.

Für eine zuverlässige Implementierung benötigt die Bridge eine auf 2.5.1.1 praktisch verifizierte Zustandsquelle mit sicherer Initialisierung und Resynchronisation. Eine spätere Umsetzung muss externe Pause/Fortsetzen, initial bereits pausierte Sequenz, mehrere Clients, Cue-Wechsel, Off, verlorene/doppelte/vertauschte Rückmeldungen und Reconnect prüfen. Ein offen gehaltenes bestimmtes MA-UI-Fenster oder eine starre Pixel-/Textposition ist dafür keine belastbare Grundlage.

## Primärquellen

- [MA Pause: Pause On/Off und Toggle](https://help.malighting.com/grandMA3/2.5/HTML/keyword_pause.html)
- [MA OSC: Object Playback Feedback](https://help.malighting.com/grandMA3/2.5/HTML/remote_inputs_osc.html)
- [MA OSC Advanced Examples: Key-Ereignisformat](https://help.malighting.com/grandMA3/2.5/HTML/osc_advanced_examples.html)
- [MA RunningPlayback: Laufende Objekte, keine gleichnamigen Poolnummern](https://help.malighting.com/grandMA3/2.5/HTML/keyword_runningplayback.html)
- [MA Deprecated 2.4: HasActivePlayback deprecated](https://help.malighting.com/grandMA3/2.5/HTML/rn_deprecated-2-4.html)
- Installierte Originalressourcen: gma3_api_meta.lua, system_test_sequence_pause.lua, system_test_framework.lua sowie die lokal mit HelpLua exportierte API-Liste. MA-Dateien werden nicht in dieses Repository kopiert.

## Ergänzung v0.2.7: reale OSC-Playback-Pakete

Auf ausdrücklichen Benutzerwunsch separaten OSC-Ausgabeweg getestet. Bestehende Zeile auf Port 53000 war durch ein anderes Programm belegt und blieb unverändert. Für den Test eigene lokale Ausgabezeile mit eindeutigem Zufallsnamen angelegt; nur deren Port/Prefix/Destination angepasst, Send Yes und Receive/ReceiveCommand/SendCommand No. Enable Output war bereits Yes. Eigene Zeilen anschließend gezielt entfernt; ursprüngliche zwei Zeilen und Sequenz 1 Off bestätigt. Eine Cleanup-Abfrage hatte einen Syntaxfehler; die verbliebene eigene Zeile wurde danach anhand ihres exakten Namens entfernt und der Endzustand erneut geprüft.

| MA-Aktion | OSC-Funktion | Integer | Auswertung |
| --- | --- | --- | --- |
| Pause On | Pause | 1 | kurzzeitig on |
| Pause Off | Pause | 0 | kurzzeitig off |
| Pause (Toggle), beide Richtungen | Pause | 2 | unknown, niemals blind umschalten |

Typetag in allen Fällen ,sis; drittes Argument Cue-Text. Gemessene Adresse war /cuefeedbackprobe/14.14.1.7.1. Der Zahlenpfad unterscheidet sich vom Dokumentationsbeispiel und wird deshalb im Produkt dynamisch aus q:Addr() gelesen. Keine Namen oder geheimen Zugangsdaten protokolliert. Testbefehle kamen gezielt per OSC an onPC außerhalb der App-Befehlsausführung; physische Pulttaste nicht separat bedient.

Neue Bridge tatsächlich gegen Ausgabe an die lokale Schnittstellen-IP geprüft: externes On setzt pauseState=on und friert Fade-Elapsed ein; Off ergibt off; Toggle ergibt unknown und entfernt die Vorschau. Nach 3,6 Sekunden ohne erneuten Nachweis unknown, während Cue-Verbindung ONLINE bleibt. Kein dauerhafter Pause-Snapshot verfügbar. Anwendung beschränkt explizite Ereignis-/Cmd-Bestätigung auf drei Sekunden. UDP-Verlust und Vertauschung können auch innerhalb dieses Fensters unbemerkt bleiben.
