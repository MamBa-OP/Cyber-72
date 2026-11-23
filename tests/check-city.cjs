// Exercise the real scene, actors and controller with a deterministic clock.
// Drawing requires a separate browser check; this harness verifies scene behaviour.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const base=path.resolve(__dirname,"../dist/city");
global.window=global;global.THREE=require(path.join(base,"vendor/three.min.js"));
global.innerWidth=1100;global.innerHeight=720;global.devicePixelRatio=1;
global.matchMedia=()=>({matches:false});
const noop=()=>{},events={},windowEvents={},frames=new Map(),nodes=new Map();
let nextID=0,lastCamera,lastScene,missionAPI,missionController;
const missionMode=process.argv.includes('--missions');
const campaignStorage=new Map();global.localStorage={getItem:k=>campaignStorage.get(k)||null,setItem:(k,v)=>campaignStorage.set(k,v)};
const gradient={addColorStop:noop};
const context=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),
  getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)}),createRadialGradient:()=>gradient,
  createLinearGradient:()=>gradient,measureText:s=>({width:s.length*8})},{get:(o,k)=>k in o?o[k]:noop});
function node(id){
  if(nodes.has(id))return nodes.get(id);
  const listeners={},child={style:{}};
  const n={id,name:id,width:780,height:608,clientWidth:1100,clientHeight:720,firstElementChild:child,style:{},dataset:{},hidden:false,
    complete:true,naturalWidth:2048,decode:async()=>{},getContext:()=>context,addEventListener:(name,fn)=>(listeners[name]??=[]).push(fn),
    dispatch:(name,args={})=>(listeners[name]||[]).forEach(fn=>fn({preventDefault:noop,...args})),focus(){document.activeElement=n;},
    children:[],setPointerCapture:noop,setAttribute:noop,replaceChildren(...items){this.children=items;},append(...items){this.children.push(...items);},before:noop,after:noop,
    querySelector(selector){if(selector==='#mission-options button')return node('mission-options').children[0];return selector.startsWith('#')?node(selector.slice(1)):node(id+'-'+selector);},querySelectorAll:()=>[],getClientRects:()=>[{}],
    getBoundingClientRect:()=>({left:0,top:0,width:100,height:100}),classList:{remove:noop,toggle:noop}};
  let currentID=id;Object.defineProperty(n,'id',{get:()=>currentID,set(value){currentID=value;nodes.set(value,n);}});nodes.set(id,n);return n;
}
global.document={getElementById:node,querySelectorAll:()=>[],createElement:name=>node(name+nextID++),createTextNode:s=>s,
  addEventListener:(name,fn)=>(events[name]??=[]).push(fn),hidden:false};
global.addEventListener=(name,fn)=>(windowEvents[name]??=[]).push(fn);global.requestAnimationFrame=fn=>{const id=++nextID;frames.set(id,fn);return id;};
global.cancelAnimationFrame=id=>frames.delete(id);
// Browser QA covers real decoding and drawing. These odd dimensions exercise
// the WebGL1 path that previously lost detail when resampling artwork.
const fallbackDecode=process.argv.includes("--image-fallback");
global.createImageBitmap=async blob=>{
  assert.equal(blob.type,"image/webp");
  if(fallbackDecode)throw new Error("Bitmap decoder unavailable");
  return {width:7,height:5,close:noop};
};
global.Image=class {
  set src(uri){
    assert(fallbackDecode&&uri.startsWith("data:image/webp;base64,"));
    this.width=7;this.height=5;queueMicrotask(this.onload);
  }
};
const uploads=[];
THREE.WebGLRenderer=class {
  constructor(){this.shadowMap={};this.capabilities={maxTextureSize:2048,isWebGL2:fallbackDecode,getMaxAnisotropy:()=>2};}
  initTexture(map){uploads.push(map);}
  getContext(){return {getExtension:()=>null};}
  setSize(){} setPixelRatio(){}
  render(scene,camera){lastScene=scene;lastCamera=camera;}
};
for(const name of ["textures/atlas-data","atlases","batch","people/anatomy","people/motion-data","gait","death-motion","death-audio","people","district","vehicles","streets","terrain","street-art","life","ambience","camera-rig",...(missionMode?['missions-data','choices','dialogue-copy','campaign','journey','missions']:[]),"play"])
  vm.runInThisContext(fs.readFileSync(path.join(base,name+".js"),"utf8"),{filename:name});
if(missionMode){const create=C72Missions.create;C72Missions.create=api=>{missionAPI=api;return missionController=create(api);};}
let world,life;
const build=C72Streets.build,create=C72Life.create;
C72Streets.build=async(...args)=>(world=await build(...args));
C72Life.create=async(...args)=>(life=await create(...args));
let clock=10;
function advance(seconds) {
  for(let i=0;i<Math.round(seconds*60);i++){
    const fn=frames.values().next().value;assert(fn,"Animation loop must run");frames.clear();fn(clock);clock+=1000/60;
  }
}
function key(code,down=true){for(const f of events[down?"keydown":"keyup"]||[])f({code,key:code,preventDefault:noop});}
(async()=>{
  const options={prefs:{name:"Rakib",language:"en"},sound:noop,reset:true};
  const entering=C72Game.enter(options);
  // A resize can arrive while textures load, before the camera exists.
  for(const resize of windowEvents.resize||[])assert.doesNotThrow(resize,"Resizing during loading must wait for the camera");
  await entering;assert(lastScene&&life&&world);assert(node("city-loading").hidden);if(missionMode)node('journey-close').dispatch('click');
  assert.equal(uploads.length,4);
  for(const key of ["facade","upper","retail","face"]){
    const atlas=C72Atlases.get(key);
    assert(uploads.includes(atlas)&&atlas.isDataTexture,"Missing portable atlas "+key);
    const width=fallbackDecode?7:8,height=fallbackDecode?5:8;
    assert.equal(atlas.image.width,width);assert.equal(atlas.image.height,height);
    assert.equal(atlas.image.data.length,width*height*4);assert.equal(atlas.anisotropy,2);
    assert.equal(atlas.minFilter,THREE.LinearMipmapLinearFilter);assert(atlas.generateMipmaps);
  }
  const actor=lastScene.children.find(n=>n.children[0]?.isSkinnedMesh),position=()=>actor.position.clone();
  assert(actor);assert.equal(position().x,C72Streets.spawn.x);
  const cameraStart=lastCamera.position;
  assert(!world.near(cameraStart.x,cameraStart.z).some(b=>b.camera&&cameraStart.x>b.camera.x0&&cameraStart.x<b.camera.x1&&cameraStart.z>b.camera.z0&&cameraStart.z<b.camera.z1),"Starting camera inside a storefront awning");
  assert(world.lots.length>=180);assert(life.drivers.length>=50);assert(life.people.length>=350);
  const streets=C72Streets;
  function checkCrowd(x,z){
    assert(life.people.filter(p=>(p.x-x)**2+(p.z-z)**2<27**2).length>=8,"Empty block at "+x+","+z);
  }
  for(const x of streets.xs)for(let j=0;j<streets.zs.length-1;j++)checkCrowd(x,(streets.zs[j]+streets.zs[j+1])/2);
  for(const z of streets.zs)for(let i=0;i<streets.xs.length-1;i++)checkCrowd((streets.xs[i]+streets.xs[i+1])/2,z);
  const coverage=[];
  for(const area of life.densityAreas)for(const side of [-1,1]){
    const count=life.people.filter(p=>{
      const along=area.alongZ?p.z:p.x,across=area.alongZ?p.x:p.z,center=area.road+(area.alongZ?C72Terrain.bendX(area.road,along):C72Terrain.bendZ(area.road,along));
      return along>=area.from&&along<=area.to&&side*(across-center)>area.half+.15&&side*(across-center)<area.half+4.5;
    }).length;
    coverage.push(count);assert(count>=8,"Quiet street side "+area.index+"/"+side+": "+count);
  }
  assert(life.people.filter(p=>p.courtyard!==undefined).length>=90,"Courtyards remain empty");
  assert.equal(world.streetArt.billboards.length,16);assert(world.streetArt.posters.length>=300);
  assert(world.streetArt.billboards.every(b=>!streets.onRoad(b.x,b.z)),"Billboard support in traffic");
  assert.deepEqual(world.branches.map(b=>b.key),Object.keys(C72District.retailNames));
  for(const b of world.branches){
    assert(!C72Streets.onRoad(b.doorX,b.doorZ,.25),"Shop entrance in the road "+b.key);
    assert(!C72Life.blocked(world,b.doorX,b.doorZ,.29),"Obstructed shop entrance "+b.key);
  }
  assert(world.lots.filter(b=>b.z>80&&Math.abs(b.r-Math.PI)<.01).length>=16,"Southern market frontage");
  assert(world.poles.length>=45);assert(world.trees.length>=60);
  for(const item of [...world.poles,...world.trees]){
    assert(!C72Streets.onRoad(item.x,item.z,1.2),"Street furniture in a road or junction "+JSON.stringify(item));
    assert(C72Life.blocked(world,item.x,item.z,.1),"Trunk or pole missing its collision");
  }
  for(const d of life.drivers){assert(Number.isFinite(d.x+d.z+d.yaw));assert.equal(d.root.parent,lastScene);}
  const jobs=new Set(life.people.map(p=>p.activity));
  for(const name of ["tea","phone","photo","browse","pay","parcel","books","tote","sweep","hail","talk","work","argue"])assert(jobs.has(name),name);
  const nearSpawn=life.people.filter(p=>Math.hypot(p.x-C72Streets.spawn.x,p.z-C72Streets.spawn.z)<35).length;
  assert(nearSpawn>=40,"People at the first intersection: "+nearSpawn);
  const spawn=position(),traffic=life.drivers.map(d=>d.distance),pedestrians=life.people.map(p=>[p.x,p.z]);
  const motorcycles=life.drivers.filter(d=>d.kind==="motorcycle"),police=life.people.filter(p=>p.role==="police");
  assert(motorcycles.length>=8,"Motorcycle traffic missing");assert.equal(police.length,5);
  for(const p of police)assert(!streets.onRoad(p.x,p.z,.05),"Police must be beside the carriageway");
  assert(C72Terrain.holes.length>=100&&C72Terrain.holes.filter(h=>h.wet).length>=70);
  assert(lastScene.getObjectByName("Stagnant rainwater"));assert(lastScene.getObjectByName("Roadside rubbish and brick rubble"));
  const terrain=lastScene.getObjectByName("Uneven Dhaka streets");assert(terrain);
  const elevations=[];
  for(let z=25;z<57;z+=.25)elevations.push(streets.groundAt(-2.7,z));
  assert(Math.max(...elevations)-Math.min(...elevations)>.22,"Road has no physical dips");
  assert(Math.max(...Array.from({length:40},(_,i)=>Math.abs(C72Terrain.bendX(0,20+i))))>.7,"Road is still straight");
  for(const mesh of terrain.children){
    const p=mesh.geometry.attributes.position;
    for(let i=0;i<p.count;i+=173)assert(Math.abs(streets.groundAt(p.getX(i),p.getZ(i))-p.getY(i))<.00002,"Visual and physical terrain disagree");
  }
  assert(C72Terrain.step<=.25,"Terrain remains too coarse");
  const whiteLines=lastScene.getObjectByName("Worn white road dividers"),dividers=world.terrain.dividers;
  assert(whiteLines&&dividers.length>250,"White centre dividers are missing");
  const markedSpans=new Set();
  for(const line of dividers){
    assert(line.to-line.from<=2.81,"Road divider should have visible gaps");
    const axes=line.vertical?streets.zs:streets.xs,index=axes.findIndex((v,i)=>line.from>v&&line.to<axes[i+1]);
    markedSpans.add((line.vertical?'z':'x')+'/'+line.road+'/'+index);
    for(const p of line.points){
      const distance=line.vertical?p.x-line.road-C72Terrain.bendX(line.road,p.z):p.z-line.road-C72Terrain.bendZ(line.road,p.x);
      assert(Math.abs(distance)<.00001,"White line does not follow the curved centre of the street");
      assert(streets.onRoad(p.x,p.z),"White line painted on the pavement");
    }
  }
  assert.equal(markedSpans.size,40,"Some streets are missing their white divider");
  const lineVertices=whiteLines.geometry.attributes.position;
  for(let i=0;i<lineVertices.count;i++)assert(Math.abs(lineVertices.getY(i)-streets.groundAt(lineVertices.getX(i),lineVertices.getZ(i))-.008)<.00005,"Road paint floats above the bumpy surface");
  // Neighbouring terrain tiles must agree on normals, not just positions.
  const edgeNormals=new Map();
  for(const mesh of terrain.children){const p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal;
    for(let i=0;i<p.count;i++)if(Math.abs(p.getX(i)%24)<.0001||Math.abs(p.getZ(i)%24)<.0001){
      const key=p.getX(i)+"/"+p.getZ(i),normal=[n.getX(i),n.getY(i),n.getZ(i)];
      if(edgeNormals.has(key))assert(normal.every((v,j)=>Math.abs(v-edgeNormals.get(key)[j])<.00001),"Square terrain shading seam");
      else edgeNormals.set(key,normal);
    }
  }
  // Feet track the ground across a full walk cycle, rather than sliding above it.
  const gait=C72People.create({role:"player",seed:72}),skinMesh=gait.root.children[0],ankles=[6,9].map(i=>skinMesh.skeleton.bones[i]);
  gait.root.rotation.y=Math.PI;
  let planted=0;
  for(let i=0;i<150;i++){
    gait.root.position.set(27,.19,-18-i*1.94/60);gait.pose("walk",i/60,1.94,{ground:()=>.19});gait.root.updateMatrixWorld(true);
    const feet=ankles.map(b=>b.getWorldPosition(new THREE.Vector3()).y-.075*skinMesh.scale.y-.19);
    if(Math.min(...feet.map(Math.abs))<.09)planted++;
    assert(feet.every(h=>h>-.06&&h<.32),"Walk gait penetrates the ground or over-lifts feet: "+feet);
    if(i>30)for(const ankle of ankles)for(const z of [-.085,.17]){
      const contact=ankle.localToWorld(new THREE.Vector3(0,-.067,z));
      assert(contact.y>.19-.035,"Shoe heel or toe clips through the pavement: "+contact.y);
    }
  }
  assert(planted>135,"Walking feet do not stay planted");
  assert.equal(skinMesh.material.map.image.width,1024,"Low-resolution clothing atlas");
  // A stop must blend the hips instead of teleporting them upward by 7 cm.
  let oldHip=skinMesh.skeleton.bones[0].position.y,maxHipStep=0;
  for(let i=0;i<30;i++){gait.pose("idle",2.5+i/60,0,{ground:()=>.19});const y=skinMesh.skeleton.bones[0].position.y;maxHipStep=Math.max(maxHipStep,Math.abs(y-oldHip));oldHip=y;}
  assert(maxHipStep<.012,"Hip snaps when stopping: "+maxHipStep);
  // At every LOD, the trouser cuff follows the same ankle as the shoe.
  for(const distant of [false,true])for(const seed of [1,5,11,19]){
    const actor=C72People.create({seed,distant}),g=actor.root.children[0].geometry,p=g.attributes.position,j=g.attributes.skinIndex,w=g.attributes.skinWeight;
    let cuffs=0;
    for(let i=0;i<p.count;i++)if(p.getY(i)>.094&&p.getY(i)<.096&&Math.abs(p.getX(i))<.18){
      assert((j.getX(i)===6||j.getX(i)===9)&&w.getX(i)>.95,"Detached trouser cuff");cuffs++;
    }
    assert(cuffs>12,"Missing cuff support rings");
  }
  key("Space");let high=spawn.y;for(let i=0;i<70;i++){advance(1/60);high=Math.max(high,position().y);}key("Space",false);
  assert(high>spawn.y+.8,"Jump must clear a low obstacle");assert(Math.abs(position().y-spawn.y)<.02,"Landing");
  key("KeyW");advance(.8);key("KeyW",false);advance(.3);const walked=position().distanceTo(spawn);
  assert(walked>.86&&walked<2.0,"Forward walking distance "+walked);
  C72Game.leave();await C72Game.enter(options);
  key("ShiftLeft");key("KeyW");advance(.8);key("KeyW",false);key("ShiftLeft",false);advance(.3);
  const ran=position().distanceTo(spawn);assert(ran>walked*1.65,"Running speed "+ran);
  // Approach the wide west wall of the mosque so gaps between shops and
  // moving residents at the arrival forecourt cannot affect this check.
  const arrival={...C72Streets.spawn};
  C72Game.leave();Object.assign(C72Streets.spawn,{x:32.9,z:-17});
  await C72Game.enter(options);Object.assign(C72Streets.spawn,arrival);
  key("KeyW");for(let i=0;i<160;i++){
    advance(1/60);const p=position(),boxes=world.near(p.x,p.z);
    assert(!boxes.some(b=>p.x>b.x0&&p.x<b.x1&&p.z>b.z0&&p.z<b.z1&&b.top>p.y+.22),"Player embedded in wall");
  }key("KeyW",false);const wall=position();
  assert(wall.x>35.15&&wall.x<35.24,"Player should stop one body radius from the wall at x=35.5: "+wall.x);
  const cam0=lastCamera.position.clone();node("city-screen").dispatch("pointerdown",{pointerId:1,clientX:100,clientY:200});
  node("city-screen").dispatch("pointermove",{pointerId:1,clientX:300,clientY:120});node("city-screen").dispatch("pointerup",{pointerId:1});advance(.4);
  assert(lastCamera.position.distanceTo(cam0)>.5,"Mouse orbit");
  const moved=life.drivers.filter((d,i)=>d.distance>traffic[i]+2).length;
  const walkers=life.people.filter((p,i)=>Math.hypot(p.x-pedestrians[i][0],p.z-pedestrians[i][1])>1).length;
  assert(moved>=18);assert(walkers>=20);key("KeyM");assert(!node("city-map").hidden);key("Escape");key("Escape");assert(!node("city-pause").hidden);
  // The plaza gives touch sprinting a clear run independent of the passing crowd.
  C72Game.leave();const start={...C72Streets.spawn};Object.assign(C72Streets.spawn,{x:27,z:-18});
  await C72Game.enter(options);Object.assign(C72Streets.spawn,start);
  const pad=node("walk-pad"),touchStart=position();
  pad.dispatch("pointerdown",{pointerId:5,clientX:50,clientY:13});node("touch-run").dispatch("click");advance(.6);
  pad.dispatch("lostpointercapture",{pointerId:5});const touchRun=position().distanceTo(touchStart);assert(touchRun>1.8,"Touch sprint "+touchRun);
  node("touch-jump").dispatch("pointerdown");advance(.25);assert(position().y>touchStart.y+.45,"Touch jumping");
  const distances=life.drivers.map(d=>d.distance);
  for(let i=0;i<520;i++)life.update(.15,14+i*.15,spawn);
  const liveTraffic=life.drivers.filter((d,i)=>d.distance-distances[i]>20).length;assert(liveTraffic>life.drivers.length/2,"Traffic circulation over time "+liveTraffic);
  let circulating=liveTraffic,sawBusStop=false;
  for(let minute=0;minute<4;minute++){
    const before=life.drivers.map(d=>d.distance);
    for(let i=0;i<400;i++){
      life.update(.15,92+minute*60+i*.15,spawn);
      if(!sawBusStop)sawBusStop=life.drivers.some(d=>d.kind==="bus"&&d.dwell>0&&Math.hypot(d.x-42,d.z-67)<1.5);
    }
    circulating=life.drivers.filter((d,i)=>d.distance-before[i]>4).length;
    assert(circulating>life.drivers.length*.60,"Junctions stopped circulating at minute "+(minute+2)+": "+circulating);
  }
  assert(sawBusStop,"A bus must serve the marked Bangshal stop");
  C72Game.setPreferences({name:"Mina",language:"bn"});
  if(missionMode){const c=missionController.campaign;c.briefing();c.answer(1);c.acknowledge();c.answer(0);c.acknowledge();assert.equal(c.snapshot().level,1);assert.equal(c.snapshot().health,60);}
  node("show-pause").dispatch("click");node("restart-play").dispatch("click");
  if(missionMode){const s=missionController.campaign.snapshot();assert.equal(s.level,0);assert.equal(s.health,100);assert.equal(s.mistakes,0);assert.equal(s.records.length,0);assert.equal(s.briefed,false);assert.equal(node('journey-overlay').hidden,false);assert.equal(node('journey-content').children.filter(c=>c.className==='guide-level').length,10);node('journey-close').dispatch('click');assert.equal(missionController.campaign.snapshot().briefed,true);}
  assert(position().distanceTo(spawn)<.001,"Restart must restore the spawn");
  assert(node("city-pause").hidden&&node("city-hud").hidden===false);
  assert(node("pause-location").textContent.includes("Mina"),"Restart discarded preferences");
  life.drivers.forEach((d,i)=>assert(Math.abs(d.distance-traffic[i])<.001,"Restart failed to reset traffic"));
  life.people.forEach((p,i)=>assert(Math.hypot(p.x-pedestrians[i][0],p.z-pedestrians[i][1])<.001,"Restart failed to reset a pedestrian"));
  assert.equal(frames.size,1,"Restart created another animation loop");
  advance(.5);assert(position().distanceTo(spawn)<.001,"Restart retained movement keys");
  // Walk out of range and reload the same block. Detailed geometry can be
  // retired, but both the distant frontage and the returning shop use the same pixels.
  const store=world.branches.find(b=>b.key==="shwapno"),retail=C72Atlases.get("retail");
  world.loadNearby(store.doorX,store.doorZ,32,40);
  const firstShop=lastScene.getObjectByName("Shwapno");
  assert(firstShop);
  function hasRetail(root){
    let uses=false;root.traverse(n=>{if(n.material?.map===retail)uses=true;});return uses;
  }
  assert(hasRetail(firstShop));
  world.loadNearby(-130,-115,2,40);
  assert(!firstShop.parent);
  assert(lastScene.children.some(child=>!child.name&&child.isGroup&&hasRetail(child)),"Distant shops lost their textures");
  world.loadNearby(store.doorX,store.doorZ,32,40);
  const returned=lastScene.getObjectByName("Shwapno");
  assert(returned&&returned!==firstShop&&hasRetail(returned));
  assert.equal(uploads.length,4,"Streaming a shop must reuse the four prepared atlases");
  if(missionMode){
    const m=missionController,seen=new Set();
    function approach(){
      const p=m.point();assert(p,'A pending level needs an NPC');seen.add(m.campaign.snapshot().targetSeed);
      assert.equal(life.people.filter(p=>p.missionTarget).length,1,'Exactly one active neighbour');
      assert(!C72Streets.onRoad(p.x,p.z,.05),'Active NPC in traffic');
      let opened=false;
      for(let i=0;i<16&&!opened;i++){const a=i*Math.PI/8,x=p.x+Math.sin(a)*1.2,z=p.z+Math.cos(a)*1.2;if(C72Life.blocked(world,x,z,.3))continue;Object.assign(missionAPI.player,{x,z,y:C72Streets.groundAt(x,z)});m.update(clock++);opened=m.open();}
      assert(opened,'NPC must have a clear talking approach');assert.equal(node('mission-overlay').hidden,false);
    }
    function choose(safe){assert(node('mission-options').children.every(b=>!b.disabled),'Answers must be available without evidence checks');const index=C72Cases[m.campaign.snapshot().level].options.findIndex(o=>o.safe===safe),visible=m.campaign.order().indexOf(index);node('mission-options').children[visible].dispatch('click');}
    for(let level=0;level<10;level++){
      assert.equal(m.campaign.snapshot().level,level);
      if(level===2&&!m.deathChecked){m.deathChecked=true;
        for(const health of [60,20,0]){approach();const old=m.campaign.snapshot().targetSeed;choose(false);if(health===0){for(let n=0;n<240;n++){const f=frames.values().next().value;if(!f)break;frames.clear();f(clock);clock+=1000/60;}}assert.equal(m.campaign.snapshot().health,health);assert.equal(m.campaign.snapshot().level,2);node('mission-continue').dispatch('click');assert.notEqual(m.campaign.snapshot().targetSeed,old,'Wrong answer reused the same NPC');}
        assert.equal(m.campaign.snapshot().health,100);assert.equal(m.campaign.snapshot().level,0,'Death must restart from level one');assert.equal(node('journey-overlay').hidden,false);node('journey-close').dispatch('click');level=-1;continue;
      }
      approach();choose(true);assert.equal(m.campaign.snapshot().level,level+1);node('mission-continue').dispatch('click');
    }
    assert.equal(m.campaign.snapshot().phase,'complete');assert.equal(m.point(),null);assert.equal(life.people.filter(p=>p.missionTarget).length,0);assert(seen.size>=10);
    m.resume();node('mission-menu').dispatch('click');assert.equal(m.campaign.snapshot().level,0);assert.equal(m.campaign.snapshot().health,100);assert(m.point());assert.equal(node('journey-overlay').hidden,false);node('journey-close').dispatch('click');
    m.campaign.briefing();m.campaign.inspect([0,1]);m.campaign.answer(1);m.campaign.acknowledge();m.prepare();
    assert.equal(C72Game.progress().level,1);C72Game.newRun();assert.equal(C72Game.progress().level,0);assert.equal(C72Game.progress().records.length,0);
    m.campaign.briefing();node('city-screen').dispatch('webglcontextlost');assert.equal(node('city-loading').hidden,false);assert.equal(frames.size,0);
    node('city-screen').dispatch('webglcontextrestored');assert.equal(node('city-loading').hidden,true);advance(.1);
    const beforeLook=lastCamera.position.clone();key('KeyJ');advance(.4);key('KeyJ',false);assert(lastCamera.position.distanceTo(beforeLook)>.1,'Keyboard camera does not rotate');key('Home');advance(.2);
    C72Game.setPreferences({...options.prefs,quality:'low',sensitivity:150,invertY:true,keyLayout:'zqsd'});advance(.1);assert(lastCamera.position.toArray().every(Number.isFinite));
    console.log('Scene missions verified: all 10 levels, direct replies, deaths, full restart, automatic guidebook, keyboard camera, quality changes and context recovery handlers.');
  }
  console.log(JSON.stringify({lots:world.lots.length,people:life.people.length,quietestStreetSide:Math.min(...coverage),billboards:world.streetArt.billboards.length,posters:world.streetArt.posters.length,whiteDividerDashes:dividers.length,markedStreets:markedSpans.size,nearSpawn,vehicles:life.drivers.length,motorcycles:motorcycles.length,police:police.length,potholes:C72Terrain.holes.length,restart:"passed",movingVehicles:moved,walkingNPCs:walkers,liveTraffic,circulating,poles:world.poles.length,trees:world.trees.length,
    jumpMetres:+(high-spawn.y).toFixed(2),walkMetres:+walked.toFixed(2),runMetres:+ran.toFixed(2),wallStopX:+wall.x.toFixed(2)}));
})().catch(e=>{console.error(e);process.exitCode=1;});
