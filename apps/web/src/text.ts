export const text = {
  brand:'MA3', title:'CUE REMOTE', subtitle:'PLAYBACK CONTROL', demo:'DEMO', demoNotice:'Lokale Simulation · Keine Verbindung zu einem Pult',
  sequence:'SEQUENZ', current:'CURRENT CUE', next:'NEXT CUE', fade:'Fade', off:'Off', end:'Ende der Sequenz',
  sequenceNumber:'Sequenznummer', applySequence:'Übernehmen', discardSequence:'Verwerfen',
  sequenceHint:'Demo-Auswahl · Beispiel-Cues, keine Pultdaten. Wechsel startet Off.',
  sequenceInvalid:'Diese Sequenznummer ist ungültig. Bitte eine positive ganze Zahl eingeben.',
  sequencePending:'Sequenznummer zuerst übernehmen oder Eingabe verwerfen.',
  sequenceOff:'Demo-Sequenz ist Off · GO+ startet den ersten Cue.',
  list:'Cueliste', number:'CUE', name:'NAME', status:'STATUS', position:'POSITION IN DER CUELISTE',
  follow:'Aktueller Cue folgen', following:'Auto-Follow aktiv', manual:'Manuelle Ansicht',
  lock:'Bedienung sperren', unlock:'Bedienung entsperren', locked:'Gesperrt', unlocked:'Entsperrt',
  lockReason:'Bedienung gesperrt. Zum Fortfahren oben entsperren.', ready:'Demo bereit · Jeder Tastendruck schaltet einen Cue.',
  goPlus:'GO+', goMinus:'GO−', previous:'Vorheriger Cue', reset:'Demo Reset', resetTitle:'Demo auf Cue 04 zurücksetzen',
  resetConfirm:'Demo auf Cue 04 zurücksetzen?', cancel:'Abbrechen', confirm:'Zurücksetzen',
  footer:'DEMO ENGINE', version:'v0.1.0', noNext:'Kein weiterer Cue', unavailable:'Status unklar · Bedienung gesperrt',
  error:'Befehl nicht ausgeführt. Bitte Status prüfen.', cooldown:'Doppelklickschutz aktiv',
} as const;
export const fadeLabel = (fade?: number) => fade === undefined ? '—' : `${fade.toFixed(1)} s`;
