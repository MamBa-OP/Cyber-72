/* Saveable mission rules, independent of rendering and input. */
window.C72Campaign = (() => {
  const key='cyber72.campaign.v1',count=10,phases=['explore','feedback','attacked','complete'];
  const fresh=()=>({version:1,level:0,health:100,encounter:0,mistakes:0,targetSeed:null,previousSeed:null,retrying:false,phase:'explore',result:null,briefed:false,checked:[],records:[]});
  const copy=s=>JSON.parse(JSON.stringify(s));
  function valid(s){
    if(!s||s.version!==1||!Number.isInteger(s.level)||s.level<0||s.level>count||![0,20,60,100].includes(s.health)||!phases.includes(s.phase))return false;
    if(!Number.isSafeInteger(s.encounter)||s.encounter<0||!Number.isSafeInteger(s.mistakes)||s.mistakes<0)return false;
    if([s.targetSeed,s.previousSeed].some(v=>v!==null&&!Number.isSafeInteger(v)))return false;
    if(typeof s.retrying!=='boolean')return false;
    if(s.level===count)return s.phase==='complete'&&s.health>0&&s.result?.level===9&&s.result?.correct===true&&Number.isInteger(s.result.choice)&&s.result.choice>=0&&s.result.choice<3;
    if((s.health===0)!==(s.phase==='attacked'))return false;
    if(s.phase==='complete')return false;
    if(s.phase==='feedback'||s.phase==='attacked')return s.result&&Number.isInteger(s.result.level)&&s.result.level>=0&&s.result.level<count&&typeof s.result.correct==='boolean'&&Number.isInteger(s.result.choice)&&s.result.choice>=0&&s.result.choice<3&&s.result.level===s.level-(s.result.correct?1:0);
    return s.result===null;
  }
  function create(storage){
    let state=fresh(),saved=true;
    try{const old=JSON.parse(storage?.getItem(key)||'null');if(valid(old))state=old;}catch{}
    state.briefed=typeof state.briefed==='boolean'?state.briefed:state.encounter>0;
    state.checked=Array.isArray(state.checked)?[...new Set(state.checked.filter(n=>Number.isInteger(n)&&n>=0&&n<3))]:[];
    state.records=Array.isArray(state.records)?state.records.filter(r=>r&&typeof r==='object'&&Number.isInteger(r.level)&&r.level>=0&&r.level<10&&Number.isInteger(r.choice)&&r.choice>=0&&r.choice<3&&typeof r.correct==='boolean'&&Number.isFinite(r.seconds)&&r.seconds>=0&&Number.isInteger(r.checks)&&r.checks>=0&&r.checks<=3).slice(-100):[];
    function save(){try{if(!storage)throw new Error('Session only');storage.setItem(key,JSON.stringify(state));saved=true;}catch{saved=false;}return snapshot();}
    function snapshot(){return {...copy(state),saved};}
    function order(){const orders=[[0,1,2],[1,2,0],[2,0,1],[2,1,0],[0,2,1],[1,0,2]];return orders[state.encounter%orders.length].slice();}
    return {
      snapshot,order,
      briefing(){state.briefed=true;return save();},
      inspect(ids){if(state.phase==='explore')state.checked=[...new Set(ids.filter(i=>Number.isInteger(i)&&i>=0&&i<3))];return save();},
      target(seed){if(state.phase!=='explore'||!Number.isSafeInteger(seed))return snapshot();state.targetSeed=seed;return save();},
      answer(choice,seconds=0){
        if(state.phase!=='explore'||state.level>=count||!Number.isInteger(choice)||choice<0||choice>=3)return null;
        const correct=window.C72Cases[state.level].options[choice].safe;
        state.records.push({level:state.level,choice,correct,checks:state.checked.length,seconds:Math.round(Math.max(0,Math.min(3600,Number(seconds)||0)))});state.records=state.records.slice(-100);state.checked=[];
        state.result={level:state.level,choice,correct};state.previousSeed=state.targetSeed;state.targetSeed=null;state.retrying=!correct;state.encounter++;
        if(correct){state.level++;state.phase=state.level===count?'complete':'feedback';}
        else{state.health=Math.max(0,state.health-40);state.mistakes++;state.phase=state.health===0?'attacked':'feedback';}
        return save();
      },
      acknowledge(){if(state.phase!=='feedback')return null;state.phase='explore';state.result=null;return save();},
      retry(){if(state.phase!=='attacked')return null;state=fresh();return save();},
      replay(){state=fresh();return save();}
    };
  }
  return Object.freeze({create,key,count});
})();
