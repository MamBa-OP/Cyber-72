"use strict";
window.C72Missions=(()=>{
  const text={
    level:['LEVEL','লেভেল'],life:['Health','স্বাস্থ্য'],
    talk:['Talk','কথা বলো'],find:['Find','খুঁজে নাও'],metres:['m','মি'],near:['Press E or Talk','E চাপো বা কথা বলো'],
    close:['Back to the street','রাস্তায় ফিরে যাও'],safe:['GOOD CALL','সঠিক সিদ্ধান্ত'],risk:['RISKY CHOICE','ঝুঁকিপূর্ণ সিদ্ধান্ত'],
    success:['Neighbour protected','প্রতিবেশীকে সাহায্য করলে'],wrong:['That could help a scammer','এতে প্রতারকের সুবিধা হতে পারে'],
    next:['Find the next neighbour','পরের প্রতিবেশীকে খুঁজে নাও'],another:['Find another neighbour','অন্য প্রতিবেশীকে খুঁজে নাও'],
    again:['Same level. A new neighbour needs your advice.','একই লেভেল। নতুন একজনকে সঠিক পরামর্শ দাও।'],
    attack:['You died','তুমি মারা গেছ'],simulation:['IN-GAME SIMULATION','গেমের অনুশীলন'],
    attackHelp:['Your health reached zero. Your run is over. Restart the game from level 1 with 100 health.','স্বাস্থ্য শূন্য হয়েছে। এই অভিযান শেষ। ১০০ স্বাস্থ্য নিয়ে প্রথম লেভেল থেকে পুরো গেম আবার শুরু করো।'],
    retry:['Restart from level 1','প্রথম লেভেল থেকে শুরু করো'],menu:['Main menu','মূল মেনু'],
    win:['Dhaka’s cyber protector','ঢাকার সাইবার রক্ষক'],winHelp:['Ten scams spotted. Ten neighbours helped. Take these habits into everyday life.','দশটি প্রতারণা চিনেছ। দশজনকে সাহায্য করেছ। এই সতর্কতাগুলো বাস্তব জীবনেও কাজে লাগাও।'],
    explore:['Keep exploring','ঘুরে বেড়াও'],replay:['Play all 10 again','সব ১০টি আবার খেলো'],complete:['ALL 10 LEVELS COMPLETE','সব ১০টি লেভেল শেষ'],
    saved:['Progress saved on this device','এই ডিভাইসে অগ্রগতি রাখা আছে'],session:['Progress lasts for this visit','অগ্রগতি শুধু এই ভিজিটে থাকবে'],
    tip:['THE TAKEAWAY','মনে রাখো'],keyboard:['1–3 choose · Esc return','১–৩ বেছে নাও · Esc ফিরে যাও'],
    learned:['Scams spotted','চেনা প্রতারণা'],mistakes:['Risky choices','ঝুঁকিপূর্ণ সিদ্ধান্ত'],guided:['Follow the map marker','মানচিত্রের চিহ্ন অনুসরণ করো']
  };
  const peopleNames={male:[['Rafiq','রফিক'],['Fahim','ফাহিম'],['Hasan','হাসান'],['Arif','আরিফ'],['Imran','ইমরান'],['Sajid','সাজিদ']],female:[['Ayesha','আয়েশা'],['Ruma','রুমা'],['Nusrat','নুসরাত'],['Mitu','মিতু'],['Farhana','ফারহানা'],['Sadia','সাদিয়া']]};
  function create(api){
    const T=window.THREE,S=window.C72Streets,el=id=>document.getElementById(id);
    let storage;try{storage=localStorage;}catch{}
    const campaign=C72Campaign.create(storage),marker=new T.Group(),direction=new T.Vector3();
    const speech=window.C72Speech?.create();speech?.preferences?.(api.prefs);
    const journey=window.C72Journey?.create({campaign,panel:api.panel,prefs:api.prefs});
    let openedAt=0,portraitStop=()=>{};
    let lang=api.prefs.language==='bn'?1:0,target=null,kind='',choices=[],lastHUD=-Infinity,near=false,distance=0;
    const tr=key=>text[key][lang],num=n=>lang?String(n).replace(/\d/g,d=>'০১২৩৪৫৬৭৮৯'[d]):String(n),local=a=>a[lang];
    const hud=document.createElement('aside');hud.className='mission-hud';hud.setAttribute('aria-label','Current mission');
    hud.innerHTML='<h2 id="mission-title"></h2><div class="mission-target"><i id="mission-direction" aria-hidden="true">↑</i><span id="mission-target"></span><b id="mission-distance"></b></div>';
    el('city-hud').append(hud);
    const levels=document.createElement('aside');levels.className='level-track';levels.setAttribute('aria-labelledby','mission-level');
    levels.innerHTML='<div class="level-caption"><span aria-hidden="true">★</span><span id="mission-level"></span><span aria-hidden="true">★</span></div><div id="mission-steps" role="progressbar" aria-labelledby="mission-level" aria-valuemin="0" aria-valuemax="10"></div>';el('city-hud').append(levels);
    const health=document.createElement('aside');health.className='cyber-health';health.setAttribute('aria-labelledby','mission-life-label');
    health.innerHTML='<svg class="health-shield" viewBox="0 0 24 28" aria-hidden="true"><path d="m12 2 9 4v8c0 6-9 12-9 12S3 20 3 14V6z"/><path d="M12 9v10M7 14h10"/></svg><div class="health-readout"><div class="mission-topline"><span class="mission-life-label" id="mission-life-label"></span><strong id="mission-health"></strong></div><progress id="mission-life" value="100" max="100"></progress></div>';el('city-hud').append(health);
    const talk=document.createElement('button');talk.id='npc-talk';talk.type='button';talk.hidden=true;talk.innerHTML='<kbd aria-hidden="true">E</kbd><span></span><b aria-hidden="true">↗</b>';el('city-hud').append(talk);
    const overlay=document.createElement('div');overlay.id='mission-overlay';overlay.className='city-veil';overlay.hidden=true;
    overlay.innerHTML=`<section class="mission-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-story" tabindex="-1">
      <header class="mission-dialog-head"><span id="dialog-kicker"></span><span class="dialog-health" id="dialog-health"></span><button id="mission-close" type="button">×</button></header>
      <div class="mission-columns"><aside class="mission-story"><div class="speaker-portrait" id="speaker-portrait"><div class="portrait-orbit" aria-hidden="true"></div><canvas id="npc-portrait" width="384" height="480" aria-hidden="true"></canvas><span id="npc-initial" aria-hidden="true"></span><span class="speaker-wave" aria-hidden="true"><i></i><i></i><i></i><i></i></span></div><div class="npc-byline"><span id="npc-name"></span></div></aside>
      <div class="conversation-main"><section class="conversation-copy"><h2 id="dialog-title"></h2><blockquote id="dialog-story"></blockquote></section><section class="mission-decision"><div class="voice-controls"><button id="voice-replay" type="button">বাংলায় শুনুন</button><span id="voice-status" role="status"></span></div><div id="question-view"><div id="mission-options"></div><small id="mission-keyboard"></small></div><div id="answer-view" hidden aria-live="polite"><div class="answer-symbol" id="answer-symbol" aria-hidden="true"></div><h3 id="answer-title" tabindex="-1"></h3><p id="answer-cost"></p><blockquote id="npc-response" lang="bn"></blockquote><div class="mission-lesson"><strong id="lesson-label"></strong><p id="mission-lesson"></p></div><p id="answer-followup"></p><button id="mission-continue" type="button" class="mission-primary"></button><button id="mission-menu" type="button" class="mission-secondary"></button></div></section></div></div></section>`;
    el('city-view').append(overlay);
    const pauseNote=document.createElement('p');pauseNote.id='campaign-summary';el('pause-location').after(pauseNote);
    const mapNote=el('mission-map-note');
    function voiceStatus(state){el('voice-status').textContent=state==='playing'?(lang?'কথা বলছে…':'Speaking in Bangla…'):state==='error'?(lang?'শুনতে আবার চাপো':'Tap to retry voice'):state==='off'?(lang?'সেটিংসে কণ্ঠ বন্ধ আছে':'Dialogue is muted in Settings'):'';el('voice-replay').textContent=state==='playing'?(lang?'কথা থামাও':'Stop voice'):(lang?'আবার শুনুন':'Listen in Bangla');overlay.classList.toggle('is-speaking',state==='playing');}
    function speak(){
      const state=campaign.snapshot(),speaker=target||api.life.people.find(p=>p.seed===state.previousSeed);
      const female=speaker&&[1,4,7,8,12,15,17].includes(speaker.seed%27);
      const clip=kind==='dialogue'?state.level:state.result?state.result.level+'-'+state.result.choice:null;
      if(clip!==null)speech?.play(clip,female?'f':'m',voiceStatus);
    }
    el('voice-replay').addEventListener('click',()=>{if(speech?.playing())speech.stop();else speak();});

    for(let i=0;i<10;i++){const dot=document.createElement('span');dot.setAttribute('aria-hidden','true');el('mission-steps').append(dot);}
    const gold=new T.MeshBasicMaterial({color:0xffdf83}),ring=new T.Mesh(new T.TorusGeometry(.46,.024,8,36),gold);
    ring.rotation.x=-Math.PI/2;ring.position.y=.04;marker.add(ring);
    marker.visible=false;api.scene.add(marker);
    function name(p=target){if(!p)return lang?'প্রতিবেশী':'Neighbour';const female=[1,4,7,8,12,15,17].includes(p.seed%27),list=peopleNames[female?'female':'male'];return local(list[Math.abs(p.seed)%list.length]);}
    function release(){if(target){target.missionTarget=false;target=null;}marker.visible=false;near=false;talk.hidden=true;}
    function reachable(p){
      if(p.role!=='npc'||S.onRoad(p.x,p.z,.05))return false;
      for(let i=0;i<8;i++){const a=i*Math.PI/4,x=p.x+Math.sin(a)*1.1,z=p.z+Math.cos(a)*1.1;if(!S.onRoad(x,z,.1)&&!C72Life.blocked(api.world,x,z,.3))return true;}
      return false;
    }
    function assign(){
      const state=campaign.snapshot();release();if(state.phase!=='explore'||state.level>=10)return;
      const candidates=api.life.people.filter(reachable);
      target=candidates.find(p=>p.seed===state.targetSeed)||null;
      if(!target){
        const retry=state.retrying;
        const anchor=state.level===0||retry?[api.player.x,api.player.z]:C72Cases[state.level].anchor;
        const desired=retry?12:state.level===0?3.3:4;
        const options=candidates.filter(p=>p.seed!==state.previousSeed&&(!retry||Math.hypot(p.x-api.player.x,p.z-api.player.z)>6));
        const pool=options.length?options:candidates.filter(p=>p.seed!==state.previousSeed);
        pool.sort((a,b)=>Math.abs(Math.hypot(a.x-anchor[0],a.z-anchor[1])-desired)-Math.abs(Math.hypot(b.x-anchor[0],b.z-anchor[1])-desired)||a.seed-b.seed);
        target=pool[0]||candidates[0];if(target)campaign.target(target.seed);
      }
      if(target){target.missionTarget=true;target.pace=0;target.surprised=0;target.poseAt=0;}
      refresh();
    }
    function clearLine(){
      if(!target)return false;
      const n=Math.max(1,Math.ceil(distance/.3));
      for(let i=1;i<n;i++){const f=i/n,x=api.player.x+(target.x-api.player.x)*f,z=api.player.z+(target.z-api.player.z)*f,y=S.groundAt(x,z)+1.2;
        if(api.world.near(x,z).some(b=>b.top>y&&b.bottom<y&&x>b.x0&&x<b.x1&&z>b.z0&&z<b.z1))return false;
      }return true;
    }
    function refresh(){
      const s=campaign.snapshot(),done=s.level===10;
      hud.setAttribute('aria-label',lang?'বর্তমান অভিযান':'Current mission');
      el('mission-level').textContent=done?tr('complete'):tr('level')+' '+num(s.level+1)+' / '+num(10);
      el('mission-life-label').textContent=tr('life');el('mission-health').textContent=num(s.health)+'%';el('mission-life').value=s.health;el('mission-life').setAttribute('aria-label',tr('life'));
      health.classList.toggle('low-life',s.health<=20);el('mission-title').textContent=done?tr('win'):local(C72Cases[s.level].title);
      el('mission-target').textContent=done?tr('explore'):tr('find')+' '+name();el('mission-distance').textContent=target?num(Math.round(distance))+' '+tr('metres'):'';
      el('mission-steps').setAttribute('aria-valuenow',s.level);el('mission-steps').setAttribute('aria-valuetext',tr('learned')+': '+num(s.level)+' / '+num(10));
      for(const [i,dot] of Array.from(el('mission-steps').children).entries()){dot.textContent=num(i+1);dot.classList.toggle('done',i<s.level);dot.classList.toggle('current',i===s.level);}
      el('campaign-summary').textContent=tr('learned')+': '+num(s.level)+'/'+num(10)+' · '+tr('life')+': '+num(s.health)+'%';
      mapNote.textContent=target?'! '+tr('find')+' '+name()+' · '+tr('guided'):tr('complete');
      talk.querySelector('span').textContent=tr('talk')+' · '+name();talk.setAttribute('aria-label',tr('talk')+' · '+name());
    }
    function show(which){
      speech?.stop();portraitStop();kind=which;openedAt=performance.now();render();api.panel('mission');
      const speaker=target||api.life.people.find(p=>p.seed===campaign.snapshot().previousSeed);
      if(api.livePortrait&&which!=='attacked'){portraitStop=api.livePortrait(speaker,el('npc-portrait'),()=>speech?.energy?.()||0);el('speaker-portrait').classList.toggle('has-portrait',true);}
      else el('speaker-portrait').classList.toggle('has-portrait',!!api.portrait?.(speaker,el('npc-portrait')));
      const focus=el(which==='dialogue'?'dialog-title':'answer-title');focus.tabIndex=-1;focus.focus();overlay.querySelector('.mission-dialog').scrollTop=0;el('mission-options').setAttribute('aria-label',lang?'তোমার উত্তর':'Your reply');speak();
    }
    function render(){
      const s=campaign.snapshot(),isQuestion=kind==='dialogue',isDead=kind==='attacked',isWin=kind==='complete';
      const index=isQuestion?s.level:s.result?.level??Math.min(9,s.level),entry=C72Cases[index],correct=!!s.result?.correct;
      overlay.dataset.kind=kind;overlay.classList.toggle('correct',correct);overlay.classList.toggle('incorrect',!correct&&!isQuestion);
      el('dialog-kicker').textContent=isWin?tr('complete'):tr('level')+' '+num(index+1)+' / '+num(10);
      el('dialog-health').textContent=tr('life')+' '+num(s.health)+'%';el('mission-close').setAttribute('aria-label',tr('close'));el('mission-close').hidden=isDead;
      const speaker=target||api.life.people.find(p=>p.seed===s.previousSeed);el('npc-name').textContent=name(speaker);el('npc-initial').textContent=name(speaker).slice(0,1);
      el('dialog-title').textContent=isDead?tr('attack'):local(entry.title);el('dialog-story').textContent='“'+local(entry.story)+'”';
      el('question-view').hidden=!isQuestion;el('answer-view').hidden=isQuestion;
      voiceStatus(speech?.playing()?'playing':'idle');
      if(isQuestion){
        el('mission-keyboard').textContent=tr('keyboard');
        choices=campaign.order();el('mission-options').replaceChildren(...choices.map((index,i)=>{
          const button=document.createElement('button');button.type='button';button.className='mission-option';const key=document.createElement('b'),content=document.createElement('span');key.textContent=num(i+1);content.textContent=local(entry.options[index].text);button.append(key,content);button.addEventListener('click',()=>answer(index));return button;
        }));
      }else{
        el('answer-symbol').textContent=isWin?'★':isDead?'!':correct?'✓':'−40';
        el('answer-title').textContent=isWin?tr('win'):isDead?tr('attack'):correct?tr('success'):tr('wrong');
        el('answer-cost').textContent=isWin?tr('winHelp'):isDead?tr('attackHelp'):correct?tr('level')+' '+num(index+1)+' ✓':tr('life')+' −'+num(40)+' · '+num(s.health)+'%';
        const response=window.C72Reactions?.lines[index]?.[s.result?.choice]||'';el('npc-response').textContent=response?'“'+response+'”':'';el('npc-response').hidden=!response;
        el('lesson-label').textContent=tr('tip');el('mission-lesson').textContent=local(entry.lesson);
        el('answer-followup').textContent=isWin?tr('mistakes')+': '+num(s.mistakes):!correct&&!isDead?tr('again'):'';
        el('mission-continue').textContent=isWin?tr('explore'):isDead?tr('retry'):correct?tr('next'):tr('another');
        el('mission-menu').textContent=isWin?tr('replay'):tr('menu');el('mission-menu').hidden=!isDead&&!isWin;
      }
    }
    function update(time){
      if(!target){talk.hidden=true;marker.visible=false;return;}
      distance=Math.hypot(target.x-api.player.x,target.z-api.player.z);
      near=distance<=2.8&&Math.abs(api.player.y-S.groundAt(target.x,target.z))<.8&&clearLine();talk.hidden=!near;
      marker.position.set(target.x,S.groundAt(target.x,target.z),target.z);marker.visible=distance<56;
      if(distance<6)target.yaw+=Math.atan2(Math.sin(Math.atan2(api.player.x-target.x,api.player.z-target.z)-target.yaw),Math.cos(Math.atan2(api.player.x-target.x,api.player.z-target.z)-target.yaw))*.08;
      api.camera.getWorldDirection(direction);el('mission-direction').style.transform='rotate('+((Math.atan2(target.x-api.player.x,-(target.z-api.player.z))-Math.atan2(direction.x,-direction.z))*180/Math.PI)+'deg)';
      if(time-lastHUD>.15){lastHUD=time;refresh();}
    }
    function open(){update(0);if(!near||kind||campaign.snapshot().phase!=='explore')return false;api.sound();show('dialogue');return true;}
    function answer(index){if(kind!=='dialogue')return;const s=campaign.answer(index,(performance.now()-openedAt)/1000);if(!s)return;api.sound();near=false;talk.hidden=true;refresh();if(s.phase==='attacked'){portraitStop();speech?.stop();kind='dying';overlay.hidden=true;release();if(api.death)api.death(()=>show('attacked'));else show('attacked');}else show(s.phase==='complete'?'complete':'result');}
    function close(){
      if(kind==='attacked'||kind==='dying')return;portraitStop();speech?.stop();
      if(kind==='result'){campaign.acknowledge();assign();}
      if(kind==='complete')release();kind='';overlay.hidden=true;refresh();api.panel('play');
    }
    talk.addEventListener('click',open);el('mission-close').addEventListener('click',close);
    el('mission-continue').addEventListener('click',()=>{portraitStop();speech?.stop();api.sound();if(kind==='attacked'){campaign.retry();release();kind='';api.restart();}else close();});
    el('mission-menu').addEventListener('click',()=>{portraitStop();speech?.stop();api.sound();if(kind==='complete'){campaign.replay();release();kind='';api.restart();}else location.hash='menu';});
    return {
      campaign,prepare(){assign();lastHUD=-Infinity;refresh();},update,open,
      resume(){const s=campaign.snapshot();if(s.phase==='feedback')show('result');else if(s.phase==='attacked'){if(api.death)api.death(()=>show('attacked'));else show('attacked');}else if(s.phase==='complete')show('complete');else if(!s.briefed)journey?.show('briefing');},
      guidebook(){speech?.stop();portraitStop();journey?.show('guidebook');},
      leave(){journey?.leave();portraitStop();speech?.stop();kind='';overlay.hidden=true;},
      preferences(p){lang=p.language==='bn'?1:0;speech?.preferences?.(p);journey?.preferences(p);refresh();if(kind)render();},
      point(){return target&&campaign.snapshot().phase==='explore'?{x:target.x,z:target.z,label:name()}:null;},
      key(event){
        if(journey?.active())return journey.key(event);
        if(!kind)return false;
        if(event.key==='Tab'){
          const buttons=Array.from(overlay.querySelectorAll('button,input')).filter(b=>!b.hidden&&!b.disabled&&b.getClientRects().length);
          const first=buttons[0],last=buttons[buttons.length-1];if(event.shiftKey&&(document.activeElement===first||!buttons.includes(document.activeElement))||!event.shiftKey&&document.activeElement===last){event.preventDefault();(event.shiftKey?last:first).focus();}return true;
        }
        if(event.code==='Escape'){event.preventDefault();if(!event.repeat)close();return true;}
        if(kind==='dialogue'&&event.target?.tagName!=='INPUT'&&/^Digit[123]$/.test(event.code)){event.preventDefault();if(!event.repeat)answer(choices[Number(event.code.slice(-1))-1]);return true;}
        return true;
      }
    };
  }
  return {create};
})();
