export const text = {
  brand:'MA3', title:'CUE REMOTE', subtitle:'PLAYBACK CONTROL', pageTitle:'MA3 Cue Remote',
  sequence:'SEQUENZ', dataPool:'DATAPOOL', current:'CURRENT CUE', next:'NEXT CUE', fade:'Fade', off:'Off', end:'Ende der Cueliste', emptyList:'Keine Cues vorhanden',
  sequenceNumber:'Sequenznummer', applySequence:'Übernehmen', discardSequence:'Verwerfen',
  sequenceHint:'Sequenz im gewählten DataPool. Wechsel sperrt bis zum vollständigen neuen Pultstatus.',
  sequenceInvalid:'Diese Sequenznummer ist ungültig. Bitte eine positive ganze Zahl eingeben.',
  sequencePending:'Sequenznummer zuerst übernehmen oder Eingabe verwerfen.',
  list:'Cueliste', number:'CUE', name:'NAME', status:'STATUS', position:'POSITION IN DER CUELISTE',
  follow:'Aktueller Cue folgen', following:'Auto-Follow aktiv', manual:'Manuelle Ansicht',
  lock:'Bedienung sperren', unlock:'Bedienung entsperren', locked:'Gesperrt', unlocked:'Entsperrt',
  lockReason:'Bedienung gesperrt. Zum Fortfahren oben entsperren.', ready:'Pultstatus frisch · Gewählte Sequenz bereit.', offReady:'Sequenz ist Off · GO+ wird an das Pult gesendet.',
  goPlus:'GO+', goMinus:'GO−', previous:'Vorheriger Cue', pause:'Pause', pauseHint:'Pause / Fortsetzen',
  footer:'OSC · PULTSTATUS', version:'v0.2.2', noNext:'Kein weiterer Cue', unavailable:'Status unklar · Bedienung gesperrt',
  connectionNotice:'grandMA3 OSC · Gewählte Sequenz', unknown:'Status unbekannt',
  pending:'Befehl gesendet · Warte auf Rückmeldung des Pults.', unknownResult:'Ergebnis unbekannt · Gesperrt. Neu synchronisieren; Befehl wird nicht wiederholt.',
  resync:'Neu synchronisieren', error:'Befehl nicht ausgeführt. Bitte Status prüfen.', cooldown:'Doppelklickschutz aktiv',
  fadePreview:'FADE-VORSCHAU · BERECHNET', fadeWaiting:'Vorschau startet beim nächsten bestätigten Cue-Wechsel.', fadeUnavailable:'Keine frischen Pultdaten.', fadePaused:'Vorschau angehalten', fadeComplete:'Vorschau abgeschlossen',
} as const;
export const fadeLabel = (fade?: number) => fade === undefined ? '—' : `${fade.toFixed(1)} s`;
export const fadeRemainingLabel = (remaining: number,total: number) => `Rest ca. ${(remaining/1000).toFixed(1)} s · Gesamt ${(total/1000).toFixed(1)} s`;
