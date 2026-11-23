const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'../dist/city');
global.window=global;global.THREE=require(path.join(base,'vendor/three.min.js'));
const noop=()=>{},nodes=new Map();let newID=0;
function node(id){if(nodes.has(id))return nodes.get(id);const events={},n={id,hidden:false,style:{},dataset:{},children:[],classList:{toggle:noop},setAttribute:noop,focus:noop,append(...a){this.children.push(...a)},after:noop,replaceChildren(...a){this.children=a},addEventListener(k,f){events[k]=f},click(){events.click?.()},querySelector(s){return s.startsWith('#')?node(s.slice(1)):node(id+s)},querySelectorAll:()=>[]};nodes.set(id,n);return n;}
global.document={getElementById:node,createElement:()=>node('new'+newID++),addEventListener:noop};
global.C72Streets={groundAt:()=>0,onRoad:()=>false};global.C72Life={blocked:()=>false};
for(const name of ['missions-data','choices','dialogue-copy','campaign','voices-data','reactions-data','missions','death-motion'])vm.runInThisContext(fs.readFileSync(path.join(base,name+'.js'),'utf8'),{filename:name});
let spoken=[],stops=0;
global.C72Speech={create:()=>({stop(){stops++},playing:()=>false,volume:()=>80,play(index,gender,cb){spoken.push({index,gender});cb('playing')}})};
for(let level=0;level<10;level++)for(let choice=0;choice<3;choice++)for(const gender of ['m','f']){
  const seed=gender==='f'?1:0,storage=new Map([['cyber72.campaign.v1',JSON.stringify({version:1,level,health:100,encounter:7,mistakes:0,targetSeed:seed,previousSeed:null,retrying:false,phase:'explore',result:null})]]);
  global.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
  const scene=new THREE.Scene(),speaker={seed,role:'npc',x:0,z:0,yaw:0},api={prefs:{language:'en'},scene,world:{near:()=>[]},life:{people:[speaker]},player:{x:1,z:0,y:0},camera:new THREE.PerspectiveCamera(),panel:noop,sound:noop};
  const mission=C72Missions.create(api);mission.prepare();assert(mission.open());assert.deepEqual(spoken.at(-1),{index:level,gender});
  const order=mission.campaign.order();node('mission-options').children[order.indexOf(choice)].click();
  assert.deepEqual(spoken.at(-1),{index:level+'-'+choice,gender});
  assert.equal(node('npc-response').textContent,'“'+C72Reactions.lines[level][choice]+'”');
  node('voice-replay').click();assert.deepEqual(spoken.at(-1),{index:level+'-'+choice,gender});
  assert.equal(scene.children[0].children.length,1,'Only the ground ring remains on the NPC');
  assert(scene.children[0].children.every(n=>n.position.y<.1),'Overhead marker remains');
  const before=stops;mission.leave();assert(stops>before);
}
assert.equal(Object.keys(C72Reactions.voices).length,60);assert.equal(new Set(C72Reactions.lines.flat()).size,30);
// Run the real playback selector with a media-element double, including cancellation.
let currentAudio;
global.Audio=class {constructor(){currentAudio=this;this.paused=true;}pause(){this.paused=true;}play(){this.paused=false;return Promise.resolve();}};
vm.runInThisContext(fs.readFileSync(path.join(base,'speech.js'),'utf8'));
(async()=>{
  const speech=C72Speech.create();node('soundtrack').volume=.2;
  for(const [key,src] of Object.entries({...C72Voices,...C72Reactions.voices})){
    const parts=key.split('-'),gender=parts.pop(),index=parts.join('-'),bytes=Buffer.from(src.split(',')[1],'base64');
    assert(bytes.length>1000);assert(bytes[0]===0xff||bytes.subarray(0,3).toString()==='ID3','Invalid MP3 '+key);
    speech.play(index,gender,noop);await Promise.resolve();assert.equal(currentAudio.src,src);assert.equal(node('soundtrack').volume,.05);speech.stop();assert.equal(node('soundtrack').volume,.2);
  }
  let called=false;speech.play(0,'m',s=>{if(s==='playing')called=true});speech.stop();await Promise.resolve();assert(!called,'Stopped speech restarted');
  let state='';speech.preferences({muted:true,voiceVolume:40});speech.play(0,'m',s=>state=s);assert.equal(state,'off');assert(currentAudio.paused);assert.equal(currentAudio.volume,.4);
  speech.preferences({muted:false,voice:false,voiceVolume:30});speech.play(0,'m',s=>state=s);assert.equal(state,'off');assert(currentAudio.paused);
  speech.preferences({muted:false,voice:true,voiceVolume:35});speech.play(0,'m',noop);await Promise.resolve();assert(!currentAudio.paused);assert.equal(currentAudio.volume,.35);speech.stop();
  for(let time=0;time<3.2;time+=1/120){const p=C72DeathMotion.sample(time);assert.equal(p.joints.length,16);assert(p.joints.flat().every(Number.isFinite));assert(Number.isFinite(p.height));}
  assert.deepEqual(C72DeathMotion.sample(3.15),C72DeathMotion.sample(20),'Final pose must stay still');
  console.log('Verified all 60 answer/voice combinations, 80 bundled MP3s, replay/cancel, overhead-marker removal and stable death poses.');
})().catch(e=>{console.error(e);process.exitCode=1;});
