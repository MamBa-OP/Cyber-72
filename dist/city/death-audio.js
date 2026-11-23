/* Local Foley and a short low musical cue; no downloads or audio service. */
window.C72DeathAudio=(()=>{
  let context,playing=[],footBuffer;
  function stop(){for(const source of playing){try{source.stop();}catch{}}playing=[];}
  function play(prefs,reduced=false){
    stop();if(prefs.muted||prefs.effects===false||prefs.effectsVolume===0)return;
    const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return;
    try{
      context??=new Context();context.resume().catch(()=>{});
      const now=context.currentTime+.025,volume=(prefs.effectsVolume??50)/100;
      function envelope(at,length,peak){const g=context.createGain();g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(Math.max(.0001,peak*volume),at+.018);g.gain.exponentialRampToValueAtTime(.0001,at+length);g.connect(context.destination);return g;}
      function noise(delay,length,peak,cutoff){
        const at=now+delay,buffer=context.createBuffer(1,Math.ceil(context.sampleRate*length),context.sampleRate),data=buffer.getChannelData(0);let state=7219;
        for(let i=0;i<data.length;i++){state=(Math.imul(state,1664525)+1013904223)>>>0;data[i]=state/2147483648-1;}
        const source=context.createBufferSource(),filter=context.createBiquadFilter();source.buffer=buffer;filter.type='lowpass';filter.frequency.value=cutoff;source.connect(filter);filter.connect(envelope(at,length,peak));source.start(at);source.stop(at+length);playing.push(source);
      }
      function tone(delay,length,from,to,peak){const at=now+delay,source=context.createOscillator();source.type='sine';source.frequency.setValueAtTime(from,at);source.frequency.exponentialRampToValueAtTime(to,at+length);source.connect(envelope(at,length,peak));source.start(at);source.stop(at+length);playing.push(source);}
      const impact=reduced?.03:1.82;
      if(!reduced){noise(.3,.48,.10,1300);noise(.92,.22,.20,470);noise(1.35,.38,.13,1800);tone(.98,.20,95,48,.12);}
      noise(impact,.42,.43,540);tone(impact,.48,82,35,.34);
      tone(impact+.12,1.35,146.83,138.59,.065);tone(impact+.16,1.28,110,103.83,.075);
    }catch{stop();}
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  function step(prefs,running=false,road=true,landing=0){
    if(prefs.muted||prefs.effects===false||prefs.effectsVolume===0||document.hidden)return;
    const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return;
    try{
      context??=new Context();context.resume().catch(()=>{});
      if(!footBuffer){footBuffer=context.createBuffer(1,Math.ceil(context.sampleRate*.15),context.sampleRate);const data=footBuffer.getChannelData(0);let seed=72;for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=(seed/2147483648-1)*Math.exp(-i/data.length*6);}}
      const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();source.buffer=footBuffer;
      filter.type='lowpass';filter.frequency.value=road?850:540;gain.gain.value=((running?.055:.035)+landing*.055)*(prefs.effectsVolume??50)/100;
      source.connect(filter);filter.connect(gain);gain.connect(context.destination);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};source.start();
    }catch{}
  }
  return {play,stop,step};
})();
