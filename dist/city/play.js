"use strict";

window.C72Game = (() => {
  const T=window.THREE,S=window.C72Streets,el=id=>document.getElementById(id),clamp=T.MathUtils.clamp;
  const words={
    en:{chapter:"DHAKA / FREE ROAM",field:"CYBER 72 / FIELD LOG 01",old:"Old Dhaka",arrival:"Islampur Road · Bangshal Market",
      departure:"CYBER 72 / YOUR NEXT STOP",stepArt:"Textures",stepStreets:"Streets",stepPeople:"Street life",stepReady:"Ready",
      districtOne:"DISTRICT 01",arrivalShort:"ISLAMPUR, DHAKA",loadingWorld:"A city full of stories. A little awareness goes a long way.",
      tipCode:"Your OTP is yours. Keep it to yourself.",tipLink:"A familiar logo doesn’t make a link safe. Check before you tap.",tipMoney:"An unexpected payment request? Call the person and check first.",tipReady:"Stay curious. Take your time. Look out for your neighbours.",
      map:"Map",pause:"Pause",paused:"Game paused",resume:"Resume walk",restart:"Restart walk",settings:"Settings",main:"Main menu",atlas:"DHAKA / DISTRICT 01",
      run:"Run",jump:"Jump",help:"WASD or ↑↓←→ to walk · Shift to run · Space to jump · Drag to look",
      touchHelp:"Move with the left pad. Swipe the street to look around.",allControls:"WASD or the arrow keys to walk. Shift to run, Space to jump. Drag to look and scroll to zoom. M opens the map. Esc pauses.",
      touchControls:"Use the left pad to walk. Tap Run to change pace, tap Jump to leap, and swipe the street to look around. Open Map to find the shops and markets.",
      textures:"Opening the shop shutters…",roads:"Laying out the streets…",people:"The neighborhood is waking up…",start:"Arriving on Islampur Road…",
      failed:"The district couldn’t open. Reload to try again. A browser with WebGL is required.",close:"Close map",openMap:"Open district map",
      marker:"You",east:"E",north:"N",walk:"Walk through Old Dhaka",districtMap:"District map and player location"},
    bn:{chapter:"ঢাকা / মুক্ত ভ্রমণ",field:"সাইবার ৭২ / মাঠের খাতা ০১",old:"পুরান ঢাকা",arrival:"ইসলামপুর রোড · বংশাল বাজার",
      departure:"সাইবার ৭২ / পরের গন্তব্য",stepArt:"রং ও ছবি",stepStreets:"রাস্তাঘাট",stepPeople:"পাড়ার মানুষ",stepReady:"প্রস্তুত",
      districtOne:"এলাকা ০১",arrivalShort:"ইসলামপুর, ঢাকা",loadingWorld:"গল্পে ভরা একটি শহর। একটু সতর্কতায় অনেকটা নিরাপত্তা।",
      tipCode:"তোমার ওটিপি শুধু তোমার। কাউকে বলো না।",tipLink:"চেনা লোগো দেখেই বিশ্বাস নয়। লিংকে চাপ দেওয়ার আগে যাচাই করো।",tipMoney:"হঠাৎ টাকা চাইছে? আগে ফোন করে নিশ্চিত হও।",tipReady:"চারপাশ দেখো। সময় নিয়ে শেখো। প্রতিবেশীদের পাশে থাকো।",
      map:"মানচিত্র",pause:"বিরতি",paused:"খেলায় বিরতি",resume:"খেলায় ফিরো",restart:"আবার শুরু করো",settings:"সেটিংস",main:"মূল মেনু",atlas:"ঢাকা / এলাকা ০১",
      run:"দৌড়",jump:"লাফ",help:"WASD বা ↑↓←→ হাঁটা · Shift দৌড় · Space লাফ · টেনে চারপাশ দেখো",
      touchHelp:"বাঁ দিকের প্যাড দিয়ে হাঁটো। চারপাশ দেখতে রাস্তায় আঙুল টানো।",allControls:"WASD বা তির চিহ্ন দিয়ে হাঁটো। Shift ধরে দৌড়াও, Space চেপে লাফ দাও। মাউস টেনে চারপাশ দেখো, স্ক্রল করে দূরত্ব বদলাও। M চেপে মানচিত্র ও Esc চেপে বিরতি।",
      touchControls:"বাঁ দিকের প্যাডে হাঁটো। দৌড় বা লাফের জন্য বোতাম ছোঁও। চারপাশ দেখতে রাস্তায় আঙুল টানো। দোকান ও বাজার খুঁজতে মানচিত্র খোলো।",
      textures:"দোকানের ঝাঁপ খুলছে…",roads:"রাস্তাঘাট সাজানো হচ্ছে…",people:"পাড়াটা জেগে উঠছে…",start:"ইসলামপুর রোডে পৌঁছাচ্ছ…",
      failed:"এলাকাটি খোলা যায়নি। আবার লোড করে দেখো। WebGL সমর্থিত ব্রাউজার প্রয়োজন।",close:"মানচিত্র বন্ধ করো",openMap:"এলাকার মানচিত্র খোলো",marker:"তুমি",east:"পূ",north:"উ",walk:"পুরান ঢাকায় ঘুরে বেড়াও",districtMap:"এলাকার মানচিত্র ও তোমার অবস্থান"}
  };
  const canvas=el("city-screen"),keys=new Set(),coarse=matchMedia("(pointer: coarse)");
  let prefs={language:"en",name:"Rakib"},sfx=()=>{},active=false,panel="loading",ready,world,life,scene,renderer,camera,sun,hero,footShade;
  let t=0,previous=0,frame=0,loop=0,progress=0,reveal=0,ratio=1,ratioFloor=1,cost=0,samples=0,softwareGPU=false;
  const spawnYaw=-.91,spawnBoom=4.15;
  const player={x:S.spawn.x,y:.19,z:S.spawn.z,vx:0,vy:0,vz:0,heading:Math.PI+spawnYaw,grounded:true,coyote:.1,jumpAge:0,landing:0};
  const controls={x:0,y:0,run:false,jump:0,drag:null,pad:null,yaw:spawnYaw,pitch:.16,distance:spawnBoom,boom:spawnBoom,basis:spawnYaw,moveAngle:0,wasMoving:false,manualUntil:0};
  const look=new T.Vector3(),eye=new T.Vector3(),aim=new T.Vector3();
  const w=()=>words[prefs.language==="bn"?"bn":"en"];
  const street=()=>S.zone(player.x,player.z)[prefs.language==="bn"?1:0];
  const headingDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
  function setPreferences(value) {
    prefs=value;
    document.querySelectorAll("[data-city]").forEach(item=>{
      let key=item.dataset.city;if(coarse.matches&&key==="help")key="touchHelp";if(coarse.matches&&key==="allControls")key="touchControls";
      item.textContent=w()[key];
    });
    el("radar").setAttribute("aria-label",w().openMap);el("close-map").setAttribute("aria-label",w().close);
    canvas.setAttribute("aria-label",w().walk);el("city-view").setAttribute("aria-label",w().old);
    el("district-map").setAttribute("aria-label",w().districtMap);
    refreshLegend();
    updateHUD();
    if(panel==="loading")loading(progress);
  }
  function loading(fraction) {
    progress=clamp(fraction,0,1);el("city-progress").value=progress*100;
    const stage=progress<.18?0:progress<.63?1:progress<.90?2:3;
    el("load-caption").textContent=w()[["textures","roads","people","start"][stage]];
    el("load-percent").textContent=localDigits(Math.round(progress*100))+"%";
    el("load-tip").textContent=w()[["tipCode","tipLink","tipMoney","tipReady"][stage]];
    window.C72Presentation?.progress(progress);
  }
  const localDigits=value=>prefs.language==="bn"?String(value).replace(/\d/g,d=>"০১২৩৪৫৬৭৮৯"[d]):String(value);
  function refreshLegend(){
    function entry(id,label,shop=false){
      const span=document.createElement("span"),b=document.createElement("b");
      b.textContent=id;if(shop)span.className="shop-key";
      span.append(b,document.createTextNode(label[prefs.language]||label.en));return span;
    }
    el("map-key").replaceChildren(...S.pois.map(p=>entry(localDigits(p.icon),p)));
    const shops=(world?.branches||[]).map(b=>{
      const store=C72District.retailNames[b.key];
      return entry(String.fromCharCode(65+store.tile),store,true);
    });
    el("shop-key").replaceChildren(...shops);
  }
  function updateHUD() {
    el("street-name").textContent=street();el("pause-location").textContent=prefs.name+" · "+street();
    if(world){
      paintMap(el("mini-map"),false);
      if(panel==="map"){
        paintMap(el("district-map"),true);
        const metres=new Intl.NumberFormat(prefs.language==="bn"?"bn-BD":"en").format;
        const unit=prefs.language==="bn"?" মি ":" m ";
        el("map-position").textContent=prefs.name+" · "+street()+"   /   "+metres(Math.round(player.x-S.limits.left))+unit+w().east+" · "+metres(Math.round(S.limits.south-player.z))+unit+w().north;
      }
    }
  }
  function paintMap(target,full) {
    const c=target.getContext("2d"),width=target.width,height=target.height;
    const span=full?309:67,scale=width/span,cx=full?-1:player.x,cz=full?-26:player.z;
    const X=x=>(x-cx)*scale+width/2,Z=z=>(z-cz)*scale+height/2;
    c.fillStyle=full?"#c9c29f":"#777d68";c.fillRect(0,0,width,height);
    c.fillStyle=full?"#a79f81":"#525e51";
    for(const [x,z,ww,dd] of world.structures) c.fillRect(X(x-ww/2),Z(z-dd/2),ww*scale,dd*scale);
    c.fillStyle=full?"#e7dcb9":"#d8caa8";
    c.strokeStyle=c.fillStyle;c.lineCap="round";
    for(const road of S.xs){c.beginPath();c.lineWidth=S.halfX(road)*2*scale;for(let z=-155;z<=71;z+=1.5){const x=road+C72Terrain.bendX(road,z);if(z===-155)c.moveTo(X(x),Z(z));else c.lineTo(X(x),Z(z));}c.stroke();}
    for(const road of S.zs){c.beginPath();c.lineWidth=S.halfZ(road)*2*scale;for(let x=-150;x<=150;x+=1.5){const z=road+C72Terrain.bendZ(road,x);if(x===-150)c.moveTo(X(x),Z(z));else c.lineTo(X(x),Z(z));}c.stroke();}
    c.fillStyle=full?"#869a73":"#83976d";
    for(const tree of world.trees){
      const x=X(tree.x),z=Z(tree.z);if(x<0||x>width||z<0||z>height)continue;
      c.beginPath();c.arc(x,z,full?2.5:2,0,Math.PI*2);c.fill();
    }
    for(const branch of world.branches){
      const shop=C72District.retailNames[branch.key],x=X(branch.x),z=Z(branch.z),r=full?8:3.6;
      c.fillStyle=full?"#345f58":"#68b7a9";c.fillRect(x-r,z-r,r*2,r*2);
      if(full){c.fillStyle="#fff7de";c.font="bold 11px sans-serif";c.textAlign="center";c.textBaseline="middle";c.fillText(String.fromCharCode(65+shop.tile),x,z+.5);}
    }
    for(const p of S.pois){
      c.fillStyle=full?"#79562f":"#a77336";c.beginPath();c.arc(X(p.x),Z(p.z),full?9:3.5,0,2*Math.PI);c.fill();
      if(full){c.fillStyle="#fff3cc";c.textAlign="center";c.textBaseline="middle";c.font='bold 10px "Nirmala UI",sans-serif';c.fillText(localDigits(p.icon),X(p.x),Z(p.z)+.5);}
    }
    c.save();c.translate(X(player.x),Z(player.z));c.rotate(Math.PI-player.heading);
    const k=full?1.02:1.28;
    c.scale(k,k);c.beginPath();c.moveTo(0,-9);c.lineTo(6,6);c.lineTo(0,3);c.lineTo(-6,6);c.closePath();
    c.fillStyle="#175b4d";c.fill();c.lineWidth=2.0;c.strokeStyle="#fff3ce";c.stroke();c.restore();
  }
  function clearInput() {
    keys.clear();controls.x=controls.y=controls.jump=0;controls.drag=controls.pad=null;controls.wasMoving=false;
    controls.run=false;el("touch-run").setAttribute("aria-pressed","false");el("walk-pad").firstElementChild.style.transform="";
  }
  function showPanel(next) {
    panel=next;clearInput();previous=0;C72Ambience.setPlaying(active&&next==="play");
    el("city-loading").hidden=next!=="loading"&&next!=="error";el("city-map").hidden=next!=="map";
    el("city-loading").setAttribute("aria-busy",String(next==="loading"));
    el("city-pause").hidden=next!=="pause";el("city-hud").hidden=next!=="play";
    if(!active)return;
    if(next==="play"){canvas.focus({preventScroll:true});queue();}
    if(next==="pause"){updateHUD();el("resume-play").focus({preventScroll:true});}
    if(next==="map"){updateHUD();el("close-map").focus({preventScroll:true});}
    if(next==="error"){el("load-caption").textContent=w().failed;window.C72Presentation?.error();}
  }
  function resetPlayer() {
    Object.assign(player,{x:S.spawn.x,y:S.groundAt(S.spawn.x,S.spawn.z),z:S.spawn.z,vx:0,vy:0,vz:0,heading:Math.PI+spawnYaw,grounded:true});
    Object.assign(controls,{yaw:spawnYaw,pitch:.16,basis:spawnYaw,distance:spawnBoom,boom:spawnBoom,wasMoving:false,manualUntil:0});
    reveal=t+16;el("city-help").classList.remove("faded");
  }
  function resize() {
    if(!renderer||!active)return;
    const width=canvas.clientWidth||innerWidth,height=canvas.clientHeight||innerHeight;
    renderer.setPixelRatio(ratio);renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();
  }
  function createSky() {
    const sky=new T.Mesh(new T.SphereGeometry(420,28,16),new T.ShaderMaterial({
      side:T.BackSide, depthWrite:false,
      vertexShader:"varying vec3 ray; void main(){ray=position; gl_Position=projectionMatrix * modelViewMatrix * vec4(position,1.0);}",
      fragmentShader:`varying vec3 ray;
        float rand(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
        float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(rand(i),rand(i+vec2(1,0)),f.x),mix(rand(i+vec2(0,1)),rand(i+1.),f.x),f.y);}
        void main(){vec3 n=normalize(ray);float h=clamp(n.y,0.,1.);
          vec3 tone=mix(vec3(.79,.87,.86),vec3(.16,.47,.79),pow(h,.45));
          vec2 p=n.xz/max(.09,n.y+.06)*2.1;float clouds=noise(p)*.55+noise(2.03*p)*.30+noise(p*4.1)*.15;
          tone=mix(tone,vec3(.98,.98,.94),smoothstep(.54,.74,clouds)*.72*smoothstep(.02,.23,h));
          vec3 sunDir=normalize(vec3(-.49,.68,.43));float d=max(dot(n,sunDir),0.);
          tone+=vec3(.18,.14,.08)*pow(d,32.);tone=mix(tone,vec3(1.,.95,.78),smoothstep(.9995,.99989,d));gl_FragColor=vec4(tone,1.);}`
    }));
    sky.frustumCulled=false;sky.renderOrder=-10;scene.add(sky);return sky;
  }
  let sky;
  async function build() {
    loading(.02);
    renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:"high-performance"});
    try {
      await C72Atlases.prepare(renderer, fraction => loading(.02 + .16*fraction));
    } catch(error) {
      renderer.dispose();renderer=null;ready=null;
      throw error;
    }
    const gl=renderer.getContext(),device=gl.getExtension("WEBGL_debug_renderer_info");
    softwareGPU=Boolean(device&&/swiftshader|llvmpipe|software|basic render/i.test(gl.getParameter(device.UNMASKED_RENDERER_WEBGL)));
    ratio=Math.min(devicePixelRatio||1,softwareGPU?.78:1.5,Math.sqrt((softwareGPU?680000:1700000)/Math.max(1,innerWidth*innerHeight)));
    ratioFloor=Math.min(ratio,softwareGPU?.72:.88);
    renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.06;
    renderer.shadowMap.enabled=!softwareGPU;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
    scene=new T.Scene();scene.fog=new T.FogExp2(0xbfd7d5,.0062);
    camera=new T.PerspectiveCamera(56,1,.10,460);resize();sky=createSky();
    scene.add(new T.HemisphereLight(0xd2eaff,0xb5a17d,1.55));
    const reflectedSky=new T.DirectionalLight(0xc2dcff,.72);
    reflectedSky.position.set(24,17,-16);scene.add(reflectedSky);
    sun=new T.DirectionalLight(0xffecce,2.65);sun.castShadow=true;
    sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-24,right:24,bottom:-24,top:24,near:1,far:105});
    sun.shadow.normalBias=.035;sun.shadow.bias=-.0003;scene.add(sun,sun.target);
    loading(.22);await new Promise(r=>setTimeout(r,0));
    world=await S.build(scene,loading);
    world.branches.sort((a,b)=>C72District.retailNames[a.key].tile-C72District.retailNames[b.key].tile);
    refreshLegend();
    hero=C72People.create({role:"player",seed:72});scene.add(hero.root);
    life=await C72Life.create(scene,world,loading);
    footShade=life.shadow(scene,.87,.59);
    loading(.95);life.update(0,t,player);posePlayer(0);follow(1,true);updateHUD();
    renderer.shadowMap.needsUpdate=true;renderer.render(scene,camera);
    loading(1);
  }
  async function enter({prefs:value,reset=false,sound}) {
    active=true;sfx=sound;setPreferences(value);
    if(reset||!ready)resetPlayer();
    if(!ready){showPanel("loading");ready=build();}
    try{
      await ready;if(!active)return;
      resize();posePlayer(0);follow(1,true);showPanel("play");updateHUD();
    }catch(err){console.error("Old Dhaka could not start",err);if(active)showPanel("error");}
  }
  function leave(){active=false;C72Ambience.setPlaying(false);cancelAnimationFrame(loop);loop=0;clearInput();previous=0;}

  const radius=.27,height=1.68;
  function footprint(b,x,z,r) {
    const dx=x-clamp(x,b.x0,b.x1),dz=z-clamp(z,b.z0,b.z1);return dx*dx+dz*dz<r*r;
  }
  function canStand(x,z) {
    const {left,right,north,south}=S.limits;
    if(x<left+radius||x>right-radius||z<north+radius||z>south-radius)return false;
    if(world.near(x,z).some(b=>b.top>player.y+.22&&b.bottom<player.y+height&&footprint(b,x,z,radius)))return false;
    if(life.contact(x,z,radius)&&player.y<2.4)return false;
    for(const n of life.nearbyPeople(x,z)){
      const old=(n.x-player.x)**2+(n.z-player.z)**2,d=(n.x-x)**2+(n.z-z)**2;
      if(d<.45**2&&d<old&&player.y<S.groundAt(x,z)+1.48)return false;
    }
    return true;
  }
  function support(x,z,oldY) {
    let floor=S.groundAt(x,z);
    for(const b of world.near(x,z))if(b.top<=oldY+.22&&b.top>floor&&footprint(b,x,z,radius*.85))floor=b.top;
    return floor;
  }
  let axisUntil=new Map();
  const held=code=>keys.has(code)||(axisUntil.get(code)||-1)>t;
  function move(dt) {
    let side=Number(held("KeyD")||held("ArrowRight"))-Number(held("KeyA")||held("ArrowLeft"))+controls.x;
    let forward=Number(held("KeyW")||held("ArrowUp"))-Number(held("KeyS")||held("ArrowDown"))-controls.y;
    const mag=Math.hypot(side,forward),walking=mag>.075,run=keys.has("ShiftLeft")||keys.has("ShiftRight")||controls.run;
    const angle=Math.atan2(side,forward);
    if(!controls.wasMoving||controls.drag!==null||Math.abs(headingDelta(controls.moveAngle,angle))>.34){
      controls.basis=controls.yaw;controls.moveAngle=angle;
    }
    controls.wasMoving=walking;
    if(mag>1){forward/=mag;side/=mag;}
    const basis=controls.basis,c=Math.cos(basis),s=Math.sin(basis),speed=run?4.4:1.4;
    const vx=walking?(side*c-forward*s)*speed:0,vz=walking?(-side*s-forward*c)*speed:0;
    const ease=1-Math.exp(-dt*(player.grounded?(walking?11:15):4.2));
    player.vx+=(vx-player.vx)*ease;player.vz+=(vz-player.vz)*ease;
    const gradient=(S.groundAt(player.x+player.vx*dt,player.z+player.vz*dt)-S.groundAt(player.x,player.z))/Math.max(.02,Math.hypot(player.vx,player.vz)*dt);
    if(player.grounded&&gradient>.25){const grip=1-clamp(gradient*.08,0,.16);player.vx*=grip;player.vz*=grip;}
    const nx=player.x+player.vx*dt,nz=player.z+player.vz*dt;
    if(canStand(nx,player.z))player.x=nx;else player.vx=0;
    if(canStand(player.x,nz))player.z=nz;else player.vz=0;
    player.coyote=player.grounded?.1:Math.max(0,player.coyote-dt);
    player.landing*=Math.exp(-dt*12);
    if(controls.jump>0&&player.coyote>0){player.vy=5.85;player.grounded=false;controls.jump=0;player.coyote=0;player.jumpAge=0;}
    controls.jump=Math.max(0,controls.jump-dt);
    const oldY=player.y,floor=support(player.x,player.z,oldY);
    if(player.grounded&&oldY-floor>.23)player.grounded=false;
    if(!player.grounded){player.jumpAge+=dt;const cut=player.vy>0&&player.jumpAge>.18&&!keys.has("Space");player.vy-=(cut?25:16.8)*dt;player.y+=player.vy*dt;
      for(const b of world.near(player.x,player.z))if(b.bottom>oldY+height-.01&&b.bottom<player.y+height&&footprint(b,player.x,player.z,radius)){
        player.y=b.bottom-height;player.vy=Math.min(0,player.vy);
      }
    }
    if(player.y<=floor+.012&&player.vy<=0||player.grounded){
      if(!player.grounded)player.landing=clamp(-player.vy/7,0,1);
      player.grounded=true;player.vy=0;player.y=floor;
    }
    const horizontal=Math.hypot(player.vx,player.vz);
    if(horizontal>.075)player.heading+=headingDelta(player.heading,Math.atan2(player.vx,player.vz))*(1-Math.exp(-dt*12));
    if(walking&&horizontal>.55&&controls.drag===null&&t>controls.manualUntil){
      controls.yaw+=headingDelta(controls.yaw,player.heading+Math.PI)*(1-Math.exp(-dt*1.65));
    }
  }
  function posePlayer(dt) {
    const speed=Math.hypot(player.vx,player.vz);
    hero.root.position.set(player.x,player.y,player.z);hero.root.rotation.y=player.heading;
    hero.pose(!player.grounded?"jump":speed>2.75?"run":speed>.12?"walk":"idle",t,speed,{vy:player.vy,landing:player.landing,ground:S.groundAt});
    const floor=support(player.x,player.z,player.y);
    footShade.position.set(player.x,floor+.025,player.z);footShade.rotation.y=player.heading;
    const spread=1+.25*Math.max(0,player.y-floor);footShade.scale.set(.82*spread,1,.6*spread);
    if(!dt||frame%8===0){
      sun.target.position.set(player.x,1,player.z);sun.position.set(player.x-27,40,player.z+24);
      renderer.shadowMap.needsUpdate=true;
    }
  }
  let cameraHeight=player.y;
  function follow(dt,snap=false) {
    cameraHeight=snap?player.y:cameraHeight+(player.y-cameraHeight)*(1-Math.exp(-dt*(player.grounded?9:14)));
    const cy=Math.cos(controls.yaw),sy=Math.sin(controls.yaw),cp=Math.cos(controls.pitch),sp=Math.sin(controls.pitch);
    // The boom pulls forward before it can pass through a wall, bus or canopy.
    aim.set(player.x,cameraHeight+1.29,player.z);
    let boom=controls.distance;
    for(let d=.12;d<controls.distance;d+=.16){
      const x=aim.x+sy*cp*d,y=aim.y+sp*d,z=aim.z+cy*cp*d;
      if(y<S.groundAt(x,z)+.22||world.near(x,z).some(b=>b.top>y-.1&&b.bottom<y+.1&&footprint(b.camera||b,x,z,.23))||y<2.8&&life.contact(x,z,.1)){
        boom=Math.max(.065,d-.17);break;
      }
    }
    controls.boom=snap||boom<controls.boom?boom:controls.boom+(boom-controls.boom)*(1-Math.exp(-dt*4));
    hero.root.visible=controls.boom>.48;
    // Keep the player below the horizon, with an unobstructed view down the street.
    eye.set(player.x+sy*cp*controls.boom,Math.max(S.groundAt(player.x,player.z)+.25,cameraHeight+1.29+sp*controls.boom),player.z+cy*cp*controls.boom);
    look.set(player.x-sy*.82,cameraHeight+1.31,player.z-cy*.82);
    camera.position.copy(eye);camera.lookAt(look);sky.position.copy(camera.position);
  }
  function queue(){if(active&&panel==="play"&&!document.hidden&&!loop)loop=requestAnimationFrame(tick);}
  let streamTime=0,nextHUD=0;
  function tick(now) {
    loop=0;if(!active||panel!=="play"||document.hidden)return;
    const elapsed=previous?(now-previous)/1000:1/60;previous=now;
    // Substeps bound the collision displacement, even when a slow frame stalls.
    const dt=Math.min(Math.max(.001,elapsed),.085),steps=Math.ceil(dt/(1/60));
    frame++;t+=dt;
    for(let i=0;i<steps;i++)move(dt/steps);
    life.update(dt,t,player);world.terrain.update(dt);posePlayer(dt);follow(dt);
    C72Ambience.update(player,controls.yaw,life,world.branches);
    if(t>=streamTime){world.loadNearby(player.x,player.z,1);streamTime=t+.10;}
    renderer.render(scene,camera);
    if(t>=nextHUD){updateHUD();nextHUD=t+.17;el("city-help").classList.toggle("faded",t>reveal);}
    if(elapsed<.4){cost+=elapsed;samples++;}
    if(samples>=75){const average=cost/samples;cost=samples=0;
      if(average>.043&&ratio>ratioFloor){ratio=Math.max(ratioFloor,ratio*.85);resize();}
    }
    queue();
  }
  const movementCodes=new Set(["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"]);
  document.addEventListener("keydown",event=>{
    if(!active||event.ctrlKey||event.metaKey||event.altKey||event.isComposing)return;
    const code=event.code;
    if(event.key==="Tab"&&(panel==="pause"||panel==="map")){
      const overlay=el(panel==="pause"?"city-pause":"city-map"),buttons=overlay.querySelectorAll("button");
      if(buttons.length===1||event.shiftKey&&document.activeElement===buttons[0]||!event.shiftKey&&document.activeElement===buttons[buttons.length-1]){
        event.preventDefault();buttons[event.shiftKey?buttons.length-1:0].focus();
      }
      return;
    }
    if(code==="Escape"&&(panel==="play"||panel==="map"||panel==="pause")){
      event.preventDefault();if(!event.repeat){sfx();axisUntil.clear();showPanel(panel==="play"?"pause":"play");}return;
    }
    if(code==="KeyM"&&(panel==="play"||panel==="map")){
      event.preventDefault();if(!event.repeat){sfx();axisUntil.clear();showPanel(panel==="map"?"play":"map");}return;
    }
    if(panel!=="play")return;
    if(code==="Space"&&document.activeElement?.tagName==="BUTTON")return;
    if(movementCodes.has(code)||code==="Space"||code.startsWith("Shift")){
      event.preventDefault();keys.add(code);
      if(!event.repeat){
        if(movementCodes.has(code))axisUntil.set(code,t+.10);
        if(code==="Space")controls.jump=.12;
      }
    }
  });
  document.addEventListener("keyup",e=>{keys.delete(e.code);});
  function suspendInput(){clearInput();axisUntil.clear();}
  window.addEventListener("blur",suspendInput);
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden){suspendInput();cancelAnimationFrame(loop);loop=0;previous=0;}
    else queue();
  });
  window.addEventListener("resize",resize);
  canvas.addEventListener("contextmenu",e=>e.preventDefault());
  let lastX=0,lastY=0;
  canvas.addEventListener("pointerdown",e=>{
    if(panel!=="play"||controls.drag!==null)return;
    controls.drag=e.pointerId;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});
  });
  canvas.addEventListener("pointermove",e=>{
    if(e.pointerId!==controls.drag)return;
    controls.yaw-=(e.clientX-lastX)*.006;controls.pitch=clamp(controls.pitch+(e.clientY-lastY)*.0045,-.19,.96);
    controls.manualUntil=t+2.2;controls.basis=controls.yaw;lastX=e.clientX;lastY=e.clientY;
  });
  function releaseLook(e){if(e.pointerId===controls.drag)controls.drag=null;}
  canvas.addEventListener("lostpointercapture",releaseLook);canvas.addEventListener("pointerup",releaseLook);
  canvas.addEventListener("wheel",e=>{if(panel==="play"){e.preventDefault();controls.distance=clamp(controls.distance+e.deltaY*.005,1.7,7.4);}},{passive:false});
  const pad=el("walk-pad");
  function setPad(e){
    if(e.pointerId!==controls.pad)return;const r=pad.getBoundingClientRect(),dx=e.clientX-r.left-r.width*.5,dy=e.clientY-r.top-r.height*.5;
    const span=r.width*.37,mag=Math.max(span,Math.hypot(dx,dy));controls.x=dx/mag;controls.y=dy/mag;
    pad.firstElementChild.style.transform="translate("+controls.x*span*.7+"px,"+controls.y*span*.7+"px)";
  }
  pad.addEventListener("pointerdown",e=>{if(controls.pad!==null)return;controls.pad=e.pointerId;pad.setPointerCapture(e.pointerId);setPad(e);});
  pad.addEventListener("pointermove",setPad);
  pad.addEventListener("lostpointercapture",e=>{if(e.pointerId===controls.pad){controls.x=controls.y=0;controls.pad=null;pad.firstElementChild.style.transform="";}});
  el("touch-run").addEventListener("click",()=>{controls.run=!controls.run;el("touch-run").setAttribute("aria-pressed",String(controls.run));});
  el("touch-jump").addEventListener("pointerdown",e=>{e.preventDefault();controls.jump=.15;});
  const button=(id,callback)=>el(id).addEventListener("click",()=>{sfx();axisUntil.clear();callback();});
  button("show-map",()=>showPanel("map"));button("radar",()=>showPanel("map"));button("close-map",()=>showPanel("play"));
  button("show-pause",()=>showPanel("pause"));button("resume-play",()=>showPanel("play"));
  button("restart-play",()=>{
    clearInput();t=0;frame=0;previous=0;streamTime=0;nextHUD=0;cost=0;samples=0;
    resetPlayer();hero.reset();life.reset();world.loadNearby(player.x,player.z,64,40);
    life.update(0,t,player);posePlayer(0);follow(1,true);updateHUD();showPanel("play");
  });
  button("city-settings",()=>{location.hash="city-settings";});
  button("return-menu",()=>{location.hash="menu";});button("loading-back",()=>{location.hash="menu";});
  return {enter,leave,setPreferences};
})();
