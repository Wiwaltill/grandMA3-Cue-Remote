export const text = {
  brand:'MA3', title:'CUE REMOTE', subtitle:'PLAYBACK CONTROL', pageTitle:'MA3 Cue Remote',
  sequence:'SEQUENZ', dataPool:'DATAPOOL', current:'CURRENT CUE', next:'NEXT CUE', fade:'Fade', followTrigger:'FOLLOW', timeTrigger:'TIME', soundTrigger:'SOUND', bpmTrigger:'BPM', triggerUnknown:'Trigger unbekannt', triggerWait:'Zusatzwartezeit unbekannt', followAutomatic:'Automatisch nach aktuellem Übergang', followOff:'FOLLOW · Automatik durch Pult', timing:'ZEIT', total:'Gesamt', delay:'Delay', individual:'Individuell', off:'Off', end:'Ende der Cueliste', emptyList:'Keine Cues vorhanden',
  sequenceNumber:'Sequenznummer', applySequence:'Übernehmen', discardSequence:'Verwerfen',
  settings:'Einstellungen', back:'Playback', targetSettings:'Playback-Ziel', dataPoolNumber:'DataPool', targetInvalid:'DataPool und Sequenz müssen positive ganze Zahlen sein.',
  settingsDescription:'Playback-Ziel für alle verbundenen Bediener. Netzwerkverbindung in der Mac-App konfigurieren.',
  sequenceHint:'Beim Wechsel wartet die App auf den vollständigen Pultstatus. Eine zuvor entsperrte Bedienung wird danach automatisch freigegeben. Manuelle Sperren bleiben bestehen.',
  sequenceInvalid:'Diese Sequenznummer ist ungültig. Bitte eine positive ganze Zahl eingeben.',
  sequencePending:'Änderungen in Einstellungen übernehmen oder verwerfen.',
  list:'Cueliste', number:'CUE', name:'NAME', status:'STATUS', position:'POSITION IN DER CUELISTE',
  follow:'Aktueller Cue folgen', following:'Auto-Follow aktiv', manual:'Manuelle Ansicht',
  lock:'Bedienung sperren', unlock:'Bedienung entsperren', locked:'Gesperrt', unlocked:'Entsperrt',
  lockReason:'Bedienung gesperrt. Zum Fortfahren oben entsperren.', ready:'Pultstatus frisch · Gewählte Sequenz bereit.', offReady:'Sequenz ist Off · GO+ wird an das Pult gesendet.',
  fadeRunning:'Fade läuft', fadeEstimate:'Zeitvorschau aus MA-Gesamtdauer inklusive Delay und individuellen Zeiten; kein gemessener Pultwert.',
  loaded:'GELADEN', loadUnknown:'Load-Status unbekannt', load:'Load', goto:'Goto', targetCue:'Ziel-Cue', cancel:'Abbrechen', maConfirmed:'MA bestätigt', selectionChanged:'Pultstatus hat sich geändert. Bitte Auswahl schließen und erneut öffnen.', loadHint:'Cue im Pult vorladen. GELADEN zeigt die Pult-Rückmeldung; GO+ zeigt das vorgeladene Ziel. NEXT bleibt der Listennachfolger.', gotoHint:'Direkt zum gewählten Cue springen. Die gespeicherten MA-Zeiten gelten.',
  goPlus:'GO+', goMinus:'GO−', previous:'Vorheriger Cue',
  footer:'OSC · PULTSTATUS', version:'v0.2.11', noNext:'Kein weiterer Cue', unavailable:'Status unklar · Bedienung gesperrt',
  connectionNotice:'grandMA3 OSC · Gewählte Sequenz', unknown:'Status unbekannt',
  pending:'Befehl gesendet · Warte auf Rückmeldung des Pults.', unknownResult:'Ergebnis unbekannt · Gesperrt. Neu synchronisieren; Befehl wird nicht wiederholt.',
  resync:'Neu synchronisieren', error:'Befehl nicht ausgeführt. Bitte Status prüfen.', cooldown:'Doppelklickschutz aktiv',
  fadePreview:'Fade', fadeWaiting:'—', fadeUnavailable:'Keine frischen Pultdaten.', fadeComplete:'Abgeschlossen',
} as const;
export const fadeLabel = (fade?: number) => fade === undefined ? '—' : `${fade.toFixed(1)} s`;
export const fadeRemainingLabel = (remaining: number,total: number) => `Rest ca. ${(remaining/1000).toFixed(1)} s · Gesamt ${(total/1000).toFixed(1)} s`;

export const timingLabel=(cue?: {duration?: number})=>fadeLabel(cue?.duration);
export const timingDetails=(cue?: {fade?: number;delay?: number;individualFade?: number;individualDelay?: number})=>cue?`${text.fade} ${fadeLabel(cue.fade)} / ${text.delay} ${fadeLabel(cue.delay)}${cue.individualFade || cue.individualDelay?` · ${text.individual}: ${text.fade} ${fadeLabel(cue.individualFade)} / ${text.delay} ${fadeLabel(cue.individualDelay)}`:''}`:'—';

export const triggerLabel=(cue?: {trigger?: string;triggerTime?: number})=>{
  if(!cue?.trigger || cue.trigger==='Go')return '';
  const label=cue.trigger==='Follow'?text.followTrigger:cue.trigger==='Time'?text.timeTrigger:cue.trigger==='Sound'?text.soundTrigger:cue.trigger==='BPM'?text.bpmTrigger:text.triggerUnknown;
  return cue.trigger==='Follow' || cue.trigger==='Time'?`${label} · ${cue.triggerTime===undefined?'—':`${cue.trigger==='Follow'?'+':''}${fadeLabel(cue.triggerTime)}`}`:label;
};
export const followHint=(cue: {triggerTime?: number})=>`${text.followAutomatic} · ${cue.triggerTime===undefined?text.triggerWait:`+${fadeLabel(cue.triggerTime)}`}`;
