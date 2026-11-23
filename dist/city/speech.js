/* Recorded Bangladeshi neural speech, bundled locally. No runtime speech service. */
window.C72Speech={create(){
  const audio=new Audio();audio.preload='none';let callback=()=>{},musicLevel=null,level=80,generation=0,enabled=true,context,analyser,samples;
  try{const stored=localStorage.getItem('cyber72.voice.volume');if(stored!==null)level=Math.max(0,Math.min(100,Number(stored)||0));}catch{}
  audio.volume=level/100;
  const music=()=>document.getElementById('soundtrack');
  function restore(){if(musicLevel!==null&&music()){music().volume=musicLevel;musicLevel=null;}}
  function stop(){generation++;audio.pause();audio.currentTime=0;restore();callback('idle');}
  audio.onended=()=>{restore();callback('idle');};audio.onerror=()=>{restore();callback('error');};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  return {stop,playing:()=>!audio.paused,
    preferences(p){enabled=p.voice!==false&&!p.muted;level=Number.isFinite(p.voiceVolume)?Math.max(0,Math.min(100,p.voiceVolume)):level;audio.volume=level/100;if(!enabled)stop();},
    energy(){if(audio.paused||!enabled||!level)return 0;if(analyser){analyser.getByteTimeDomainData(samples);let sum=0;for(const n of samples)sum+=((n-128)/128)**2;return Math.min(1,Math.sqrt(sum/samples.length)*9);}return .2;},
    volume(value){if(value===undefined)return level;level=Math.max(0,Math.min(100,Number(value)||0));audio.volume=level/100;try{localStorage.setItem('cyber72.voice.volume',String(level));}catch{}if(typeof CustomEvent==='function')document.dispatchEvent(new CustomEvent('c72voicevolume',{detail:level}));},
    play(index,gender,onState){stop();const ticket=generation;callback=onState;if(!enabled){callback('off');return;}const src=(window.C72Voices?.[index+'-'+gender]||window.C72Reactions?.voices[index+'-'+gender]);if(!src){callback('error');return;}audio.src=src;
      try{const Context=window.AudioContext||window.webkitAudioContext;if(Context){if(!context){context=new Context();analyser=context.createAnalyser();analyser.fftSize=256;samples=new Uint8Array(256);context.createMediaElementSource(audio).connect(analyser);analyser.connect(context.destination);}context.resume().catch(()=>{});}}catch{}
      if(music()){musicLevel=music().volume;music().volume=musicLevel*.25;}audio.play().then(()=>{if(ticket===generation)callback('playing');}).catch(()=>{if(ticket===generation){restore();callback('error');}});}
  };
}};
