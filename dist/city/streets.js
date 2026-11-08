"use strict";

// Metres, Y up. The south end of Islampur Road meets the Bangshal shopping street.
window.C72Streets = (() => {
  const T = window.THREE;
  const xs = [-134, -68, 0, 66, 132], zs = [-132, -83, -34, 15, 65];
  const limits = { left: -143, right: 141, north: -141, south: 84.4 };
  const spawn = { x: -7.0, z: 48.8 };
  const pois = [
    { x: -9, z: 25, en: "Tea corner", bn: "চায়ের মোড়", icon: "01" },
    { x: 20, z: 3, en: "Chawk Bazaar", bn: "চকবাজার", icon: "02" },
    { x: -89, z: 53, en: "Merchant courtyard", bn: "সওদাগর বাড়ির উঠান", icon: "03" },
    { x: 20, z: 73, en: "Bangshal Market", bn: "বংশাল বাজার", icon: "04" },
    { x: 91, z: -58, en: "Rickshaw yard", bn: "রিকশার গ্যারেজ", icon: "05" }
  ];
  const halfX = x => x === 0 ? 5.7 : Math.abs(x) > 100 ? 4.9 : 4.3;
  const halfZ = z => z === 65 ? 6 : z === 15 || z === -83 ? 5.1 : 4.1;
  const roadBeds=[
    ...xs.map(x=>({x0:x-halfX(x),x1:x+halfX(x),z0:-166,z1:71})),
    ...zs.map(z=>({x0:-161,x1:161,z0:z-halfZ(z),z1:z+halfZ(z)}))
  ];
  function onRoad(x,z,clearance=0){
    if(window.C72Terrain)return C72Terrain.roadDistance(x,z)<=clearance;
    return roadBeds.some(b=>x+clearance>=b.x0&&x-clearance<=b.x1&&z+clearance>=b.z0&&z-clearance<=b.z1);
  }
  function random(seed) {
    return () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; };
  }
  function canvasMap(w, h, draw, repeat = false) {
    const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
    draw(canvas.getContext("2d"), w, h);
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    texture.anisotropy = 4;
    if (repeat) texture.wrapS = texture.wrapT = T.RepeatWrapping;
    return texture;
  }
  function groundTexture(kind) {
    const rng = random(kind === "road" ? 49 : kind === "stone" ? 719 : 282);
    return canvasMap(512, 512, (c,w,h) => {
      const pixels = c.createImageData(w,h);
      const base = kind === "road" ? [109,101,88] : kind === "stone" ? [167,151,128] : [155,133,105];
      for (let y=0;y<h;y++) for (let x=0;x<w;x++) {
        const idx=(y*w+x)*4, v=(rng()-.5)*42+Math.sin(x/29+y/43)*4+Math.cos(y/18-x/54)*3;
        for(let k=0;k<3;k++) pixels.data[idx+k]=base[k]+v;
        pixels.data[idx+3]=255;
      }
      c.putImageData(pixels,0,0);
      if(kind==="stone") {
        for(let j=-1;j<13;j++) for(let i=-1;i<9;i++) {
          const x=i*64+(j%2)*32,y=j*43;
          c.fillStyle="rgba(81,64,50,"+(.06+rng()*.16)+")"; c.fillRect(x+2,y+2,61,40);
          c.strokeStyle="#655f5190"; c.lineWidth=2; c.strokeRect(x,y,64,43);
          c.fillStyle="#e2d6b94d"; c.fillRect(x+2,y+2,60,1);
        }
      } else {
        for(let i=0;i<(kind==="road"?70:26);i++) {
          let x=rng()*w,y=rng()*h; c.beginPath(); c.moveTo(x,y);
          for(let n=0;n<4;n++){x+=rng()*11-4;y+=rng()*12-3;c.lineTo(x,y);}
          c.strokeStyle=kind==="road"?"rgba(52,49,44,"+(.09+rng()*.26)+")":"#bdaa7d4d";c.lineWidth=.5+rng()*1.6;c.stroke();
        }
        for(let k=0;k<48;k++){const x=rng()*w,y=rng()*h,r=4+rng()*55;
          const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,"rgba(211,184,137,.15)");g.addColorStop(1,"rgba(198,172,134,0)");c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
      }
    },true);
  }
  function zone(x,z) {
    if(z>57) return ["Bangshal Road","বংশাল রোড"];
    if(x<-69 && z>18) return ["Merchant courtyard","সওদাগর বাড়ির উঠান"];
    if(x>69 && z < -35) return ["Rickshaw yard","রিকশার গ্যারেজ"];
    if(x< -35 && z<0) return ["Shankhari lanes","শাঁখারী গলি"];
    if(z< -70) return ["Nawabpur workshops","নবাবপুরের কারখানা"];
    if(z<16 && x>-8) return ["Chawk Bazaar","চকবাজার"];
    return ["Islampur Road","ইসলামপুর রোড"];
  }
  function groundAt(x,z) {
    return window.C72Terrain ? C72Terrain.heightAt(x,z) : onRoad(x,z) ? .025 : .19;
  }

  async function build(scene, report) {
    const rng = random(1972), groups = new Map(), hash = new Map(), lots = [], structures = [], streams = [];
    const branches=[],poles=[],trees=[];
    const palette = new Map(), boxGeo = new T.BoxGeometry(1,1,1);
    const waitPaint=()=>new Promise(resolve=>setTimeout(resolve,0));
    function mat(hex) { if(!palette.has(hex)) palette.set(hex,new T.MeshStandardMaterial({color:hex,roughness:.86})); return palette.get(hex); }
    function chunkAt(x,z) {
      const key=Math.floor(x/42)+"/"+Math.floor(z/42);
      if(!groups.has(key)){const g=new T.Group();groups.set(key,g);scene.add(g);} return groups.get(key);
    }
    function box(x,y,z,w,h,d,m,group=chunkAt(x,z)) {
      const o=new T.Mesh(boxGeo,typeof m==="number"?mat(m):m);
      o.position.set(x,y,z);o.scale.set(w,h,d);group.add(o);return o;
    }
    function cylinder(x,y,z,top,bottom,h,m,sides=16) {
      const o=new T.Mesh(new T.CylinderGeometry(top,bottom,h,sides),mat(m));
      o.position.set(x,y,z);chunkAt(x,z).add(o);return o;
    }
    function collision(x,z,w,d,top,bottom=-1,overhang=null) {
      const b={x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2,top,bottom};
      if(overhang)b.camera={x0:b.x0+Math.min(0,overhang.x),x1:b.x1+Math.max(0,overhang.x),
        z0:b.z0+Math.min(0,overhang.z),z1:b.z1+Math.max(0,overhang.z)};
      const bounds=b.camera||b;
      for(let i=Math.floor((bounds.x0-1)/12);i<=Math.floor((bounds.x1+1)/12);i++)
        for(let j=Math.floor((bounds.z0-1)/12);j<=Math.floor((bounds.z1+1)/12);j++){
          const key=i+"/"+j;if(!hash.has(key))hash.set(key,[]);hash.get(key).push(b);
        }
    }
    const near=(x,z)=>hash.get(Math.floor(x/12)+"/"+Math.floor(z/12))||[];
    const roadGrain=groundTexture("road"),paveGrain=groundTexture("stone");
    const asphalt=new T.MeshStandardMaterial({map:roadGrain,bumpMap:roadGrain,bumpScale:.025,roughness:.94});
    const paving=new T.MeshStandardMaterial({map:paveGrain,bumpMap:paveGrain,bumpScale:.035,roughness:.88});
    const earth=new T.MeshStandardMaterial({map:groundTexture("earth"),roughness:1});
    function quad(x,z,w,d,y,material,metres=6) {
      if(material===asphalt||material===paving)return;
      const g=new T.PlaneGeometry(w,d);g.rotateX(-Math.PI/2);
      const uv=g.attributes.uv,pos=g.attributes.position;
      for(let i=0;i<4;i++)uv.setXY(i,(pos.getX(i)+x)/metres,(pos.getZ(i)+z)/metres);
      const o=new T.Mesh(g,material);o.position.set(x,y,z);o.receiveShadow=true;chunkAt(x,z).add(o);
    }
    quad(0,-35,670,400,-.7,earth);
    const terrain=await C72Terrain.build(scene,paving,report);
    for(const b of roadBeds){
      const w=b.x1-b.x0,d=b.z1-b.z0;
      quad((b.x0+b.x1)/2,(b.z0+b.z1)/2,w,d,w>d?.021:.017,asphalt);
    }
    const atlas=C72Atlases.get("upper");
    const farMat=new T.MeshStandardMaterial({map:atlas,roughness:1});
    function proxy(x,z,w,d,h,seed,rot,entry=null) {
      const geo=new T.BoxGeometry(w*.97,h*.97,entry?d-1.35:d*.97),uv=geo.attributes.uv;
      const cell=seed%8,col=cell%4,row=1-Math.floor(cell/4);
      for(let i=0;i<uv.count;i++)uv.setXY(i,(col+.006+uv.getX(i)*.988)/4,(row+.006+uv.getY(i)*.988)/2);
      const o=new T.Mesh(geo,farMat);o.position.set(x,h*.485+.17,z);o.rotation.y=rot;chunkAt(x,z).add(o);
      if(entry){
        // Keep the painted shop behind the detailed wall, and ahead of the
        // distant shell. Its identity stays visible even while streaming.
        const front=C72District.distantFront(entry);
        front.rotation.y=rot;front.position.set(x+Math.sin(rot)*(d/2-.52),.19,z+Math.cos(rot)*(d/2-.52));
        chunkAt(x,z).add(front);
      }
    }
    const shopTypes=["tea","grocery","tailor","cycle","pharmacy","fruit","books","hardware"];
    function lot(x,z,w,d,r,seq,brand=null) {
      const seed=(seq*2347+Math.round((x+170)*19+(z+160)*31))>>>0;
      const h=6.4+Math.floor(rng()*4)*2.85+(rng()>.94?5.8:0);
      const swap=Math.abs(Math.sin(r))>.5, aw=swap?d:w,ad=swap?w:d;
      const entry={x,z,w,d,h,seed,r,shop:brand||shopTypes[seed%8]};lots.push(entry);
      const fx=Math.sin(r),fz=Math.cos(r);
      collision(x,z,aw,ad,h+.2,-1,{x:fx*1.17,z:fz*1.17});structures.push([x,z,aw,ad]);proxy(x,z,w,d,h,seed,r,entry);
      if(brand){
        branches.push({key:brand,x,z,yaw:r,doorX:x+fx*(d/2+1.35),doorZ:z+fz*(d/2+1.35)});
      }
      streams.push({x,z,r,brand,reach:brand?77:55,make:()=>C72District.building({w,d,h,seed,shop:entry.shop,kind:"shop"})});
    }
    function prop(type,x,z,r=0,foot=null,y=groundAt(x,z),reach=58,scale=1) {
      const seed=Math.floor(rng()*999999);
      streams.push({x,z,r,y,reach,scale,make:()=>C72District.prop(type,seed)});
      if(foot) {
        const swap=Math.abs(Math.sin(r))>.5;collision(x,z,swap?foot[1]:foot[0],swap?foot[0]:foot[1],y+foot[2]);
      }
    }
    function curb() { /* Pavement edges follow the continuous curved height field. */ }
    const mainStreetRetail=new Map([
      ["1/3/1/0","starkabab"],["2/3/0/0","bkash"],["2/3/0/1","shwapno"],["1/2/1/2","dbbl"]
    ]);
    for(let ix=0;ix<4;ix++) for(let iz=0;iz<4;iz++) {
      const west=xs[ix]+halfX(xs[ix]),east=xs[ix+1]-halfX(xs[ix+1]);
      const north=zs[iz]+halfZ(zs[iz]),south=zs[iz+1]-halfZ(zs[iz+1]);
      const cx=(west+east)/2,cz=(north+south)/2;
      quad(cx,cz,east-west,south-north,.178,paving,4.4);
      curb(west+.08,cz,.18,south-north);curb(east-.08,cz,.18,south-north);
      curb(cx,north+.08,east-west,.18);curb(cx,south-.08,east-west,.18);
      if((ix===0&&iz===3)||(ix===2&&iz===2)||(ix===3&&iz===1))continue;
      const a=west+4.2,b=east-4.2,c=north+3,d=south-3;
      for(let side=0;side<2;side++) {
        const depth=7.5+rng()*2, parts=3, span=(d-c)/parts;
        for(let j=0;j<parts;j++){
          const w=span-1.0-rng()*1.3;
          const stallBay=iz===3&&j===0&&((ix===1&&side===1)||(ix===2&&side===0));
          const arrivalForecourt=ix===1&&iz===3&&side===1&&j===2;
          const inset=stallBay?3.55:arrivalForecourt?2.14:0;
          const brand=mainStreetRetail.get([ix,iz,side,j].join("/"));
          lot(side?b-depth/2-inset:a+depth/2+inset,c+span*(j+.5),w,depth,side?Math.PI/2:-Math.PI/2,ix*151+iz*11+j+side*2,brand);
        }
      }
      const left=a+10.2,right=b-10.2;
      for(let j=0;j<2;j++)for(let k=0;k<2;k++){
        const width=(right-left)/2,depth=6.8+rng()*1.8;
        lot(left+width*(j+.5),k?d-depth/2:c+depth/2,width-1.6,depth,k?0:Math.PI,30+ix*71+iz*17+j*3+k);
      }
    }
    // The opposite pavement stays built up at the edges of the playable district.
    for(const edge of [-1,1]){
      const road=edge<0?xs[0]:xs[xs.length-1],sidewalk=road+edge*(halfX(road)+4);
      for(let block=0;block<4;block++){
        const start=zs[block]+halfZ(zs[block]),end=zs[block+1]-halfZ(zs[block+1]);
        quad(sidewalk,(start+end)/2,8,end-start,.178,paving,4.4);
        for(let bay=0;bay<3;bay++){
          const z=zs[block]+10+bay*13.5;
          lot(road+edge*16.5,z,11.6,8,edge<0?Math.PI/2:-Math.PI/2,800+block*5+bay+(edge+1)*50);
        }
      }
    }
    for(let block=0;block<4;block++){
      const start=xs[block]+halfX(xs[block]),end=xs[block+1]-halfX(xs[block+1]);
      quad((start+end)/2,-140.6,end-start,9,.178,paving,4.4);
      for(let bay=0;bay<4;bay++)lot(xs[block]+12+bay*13.2,-149,11.7,8.7,0,950+block*5+bay);
    }
    // Bangshal's south pavement is a continuous forecourt, with shops backing
    // onto further city blocks. All five north/south roads meet this boulevard.
    quad(0,79.2,322,16.4,.178,paving,4.4);curb(0,71.10,322,.20);
    const boulevardRetail=new Map([[5,"yellow"],[7,"bata"],[9,"aarong"],[11,"startech"],[13,"apex"]]);
    for(let i=0;i<18;i++){
      const x=-136+i*16,depth=8+(i%4)*.85,front=80.4+(i%3)*.35;
      lot(x,front+depth/2,14.9+(i%2)*.48,depth,Math.PI,1200+i,boulevardRetail.get(i));
    }
    for(let row=0;row<3;row++)for(let i=0;i<24;i++)
      proxy(-193+i*17+row*3,105+row*17+(i%3)*1.8,12+i%5,10+row,9+(i*7+row*3)%17,270+i+24*row,0);
    // Outside the perimeter, continue the skyline beyond the explorable lanes.
    for(let i=0;i<135;i++){
      let x=-255+rng()*510,z=-235+rng()*310;
      if(x>-152&&x<150&&z>-150)continue;
      proxy(x,z,7+rng()*14,7+rng()*12,7+rng()*24,i,0);
    }
    function sign(x,z,y,w,h,english,bangla,rotation=0,color="#265849") {
      const texture=canvasMap(768,256,c=>{
        c.fillStyle=color;c.fillRect(0,0,768,256);c.strokeStyle="#eeddbc";c.lineWidth=5;c.strokeRect(9,9,750,238);
        c.textAlign="center";c.fillStyle="#fff1cf";c.font='bold 84px "Nirmala UI",sans-serif';c.fillText(bangla,384,120,715);
        c.font='bold 37px sans-serif';c.fillText(english.toUpperCase(),384,197,712);
      });
      const o=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:texture,side:T.DoubleSide,roughness:.95}));
      o.position.set(x,y,z);o.rotation.y=rotation;chunkAt(x,z).add(o);
    }
    function dome(x,z,y,r,color) {
      const m=new T.Mesh(new T.SphereGeometry(r,24,12,0,Math.PI*2,0,Math.PI*.50),mat(color));m.position.set(x,y,z);m.scale.y=.82;chunkAt(x,z).add(m);
      cylinder(x,y+r*.91,z,.07,.09,r*.34,0xd4b578,8);
    }
    function arch(x,y,z,w,h,plaster,shade) {
      function panel(width,height,dx,dy,dz,material){
        const half=width/2,shoulder=height*.65,s=new T.Shape();
        s.moveTo(-half,0);s.lineTo(half,0);s.lineTo(half,shoulder);
        s.bezierCurveTo(half,height*.84,width*.13,height*.92,0,height);
        s.bezierCurveTo(-width*.13,height*.92,-half,height*.84,-half,shoulder);s.closePath();
        const m=new T.Mesh(new T.ShapeGeometry(s,9),mat(material));m.position.set(dx,dy,dz);chunkAt(dx,dz).add(m);
      }
      panel(w+.31,h+.24,x,y,z,plaster);panel(w,h,x,y,z+.012,shade);
      box(x,y+h*.30,z+.030,.045,h*.60,.027,0x55524a);
      for(const d of [.18,.41,.62])box(x,y+h*d,z+.023,w*.94,.035,.018,0x736e58);
    }
    // A merchant's courtyard, neighborhood mosque and covered repair yard.
    box(-99,3.25,41,36,6.5,13,0xc98781);box(-99,7.0,41,28,2,11.9,0xdba09a);
    box(-99,6.4,41,37,.45,14,0xf0c8a4);box(-99,8.25,41,29,.5,12.8,0xd6aa99);
    box(-99,8.9,41,9,2,8.8,0xc17f78);dome(-99,41,9.9,4.9,0xa07875);
    for(let x=-114;x<=-84;x+=3.5){
      cylinder(x,2.85,47.85,.22,.3,5.25,0xebc2a3);cylinder(x,.49,47.85,.39,.4,.34,0xd7a789);cylinder(x,5.47,47.85,.43,.27,.33,0xedc3a5);
      arch(x+1.3,1.5,47.53,1.28,2.9,0xe9b79c,0x574a41);
      if(x>-112&&x<-85)arch(x,6.44,47.0,1.05,1.28,0xd7a797,0x6f5c50);
    }
    for(let i=0;i<4;i++){
      const w=11.8-i*.35,d=2.3-i*.52,z=49.4-i*.26,h=.17*(i+1);
      box(-99,h/2,z,w,h,d,0xc4a08b);collision(-99,z,w,d,h);
    }
    collision(-99,41,36,13,11);structures.push([-99,41,36,13]);
    sign(-99,48.0,6.0,9,1.35,"Merchant House","সওদাগর বাড়ি",0,"#7b4741");
    box(45,3.2,-14,18,6.4,13,0xd0c9ab);box(45,6.6,-14,19,.44,14,0x72a28e);dome(45,-14,6.8,4.25,0x537e70);
    for(const x of [36.9,53.1]){cylinder(x,6,-8.0,.69,.97,12,0xdad3b5);cylinder(x,9.3,-8,1.3,1.3,.5,0x6b9d8b);dome(x,-8,12,.94,0x729383);}
    for(let x=39;x<53;x+=3){
      arch(x,.24,-7.476,1.74,4.1,0x9fae91,0x455749);
      box(x,4.99,-7.442,2.33,.08,.15,0x8da38d);
      cylinder(x,6.99,-7.03,.11,.19,.65,0xbec8ac);
    }
    for(const x of [36.9,53.1])for(const y of [3.0,5.8,10.2])
      cylinder(x,y,-8,.82,.86,.20,0x86a295);
    for(const x of [36.1,53.9])box(x,2.95,-7.38,.4,5.9,.35,0xb8bea3);
    box(45,.22,-6.3,18.8,.4,1.8,0xa3a18d);collision(45,-6.3,18.8,1.8,.4);
    collision(45,-14,19,14,12);structures.push([45,-14,19,14]);
    sign(45,-7.35,5.8,8.2,.95,"Jame Masjid","জামে মসজিদ");
    for(let i=0;i<3;i++)lot(85+i*13,-65,11.4,9.8,0,46+i);
    for(const [type,x,z,rot,foot] of [
      ["tea",-10.4,25,Math.PI/2,[3.9,1.8,2.1]],["market",10.4,24,-Math.PI/2,[3.6,2,2.15]],
      ["tea",20,4,Math.PI,[4,2.1,2.4]],["market",16,-2,-Math.PI/2,[3.3,1.8,2.1]],["market",26,0,Math.PI,[3.6,1.8,2.1]],
      ["bench",26,6,Math.PI,[1.8,.58,.72]],["bench",29,5,Math.PI,[1.8,.58,.72]],
      ["tea",-49,-41,0,[3.9,2,2.2]],["tea",86,-53,0,[3.9,2,2.2]],["market",-74,5,Math.PI/2,[3.5,2,2.2]],
      ["bench",-93,55,0,[2,.6,.65]],["bench",-104,55,0,[2,.6,.65]],
      ["crate",81,-57,0,[.8,.5,.6]],["crate",82,-57,.1,[.8,.5,.6]],["crate",11.2,21.9,0,[.7,.5,.5]],
      ["crate",-11.2,27,.2,[.7,.6,.55]]
    ])prop(type,x,z,rot,foot);
    // The open side of the shelter faces the bus lane; the way to the shops runs behind it.
    for(const x of [38.9,45.1]){
      cylinder(x,1.53,74.55,.075,.09,2.72,0x467573,10);collision(x,74.55,.20,.20,2.9);
    }
    box(42,2.96,73.9,7.3,.15,2.1,0x668f81);
    box(42,2.72,72.91,7.3,.36,.12,0x2b564a);
    sign(42,2.72,72.83,5.65,.35,"Bangshal bus stop","বংশাল বাসস্ট্যান্ড",Math.PI);
    prop("bench",42,74.18,Math.PI,[2,.62,.72]);
    sign(-7.45,22.20,3.5,2.8,.78,"Islampur Road","ইসলামপুর রোড",0);
    for(const [x,z] of [[-7.45,22.15],[8.2,-41],[73.5,-59]]){
      cylinder(x,1.84,z,.055,.08,3.5,0x67675b);collision(x,z,.16,.16,3.60);
    }
    sign(8.2,-41,3.5,2.6,.75,"Chawk Bazaar","চকবাজার");
    sign(73.5,-59,3.5,2.5,.7,"Rickshaw yard","রিকশার গ্যারেজ");
    function clearPavement(x,z,r) {
      return !onRoad(x,z,1.25) && Math.hypot(x-spawn.x,z-spawn.z)>3.5 &&
        branches.every(b=>Math.hypot(x-b.doorX,z-b.doorZ)>2.4) &&
        !near(x,z).some(b=>x+r>b.x0&&x-r<b.x1&&z+r>b.z0&&z-r<b.z1&&b.top>.4);
    }
    const wires=[];
    function addRun(fixed,alongZ,axes,half){
      let last=null;
      const yaw=alongZ?0:Math.PI/2;
      for(let block=0;block<axes.length-1;block++){
        const start=axes[block]+half(axes[block])+3,end=axes[block+1]-half(axes[block+1])-3;
        for(const f of [.20,.78]){
          for(const offset of [0,2,-2,4,-4]){
            const along=start+(end-start)*f+offset,x=alongZ?fixed:along,z=alongZ?along:fixed;
            if(!clearPavement(x,z,.69)||poles.some(p=>Math.hypot(p.x-x,p.z-z)<4))continue;
            const y=groundAt(x,z),p={x,z,y,yaw};
            const model=C72District.prop("pole",poles.length+17);
            model.position.set(x,y,z);model.rotation.y=yaw;chunkAt(x,z).add(model);
            cylinder(x,y+.11,z,.24,.30,.22,0x989080,12);collision(x,z,.58,.58,y+6.15);
            if(last)for(const arm of [-.78,-.35,.35,.78]){
              const dx=Math.cos(yaw)*arm,dz=-Math.sin(yaw)*arm;
              const sag=Math.min(.74,.025*Math.hypot(x-last.x,z-last.z));
              for(let i=0;i<10;i++)for(const t of [i/10,(i+1)/10])
                wires.push(last.x+(x-last.x)*t+dx,last.y+(y-last.y)*t+6.04-4*sag*t*(1-t),last.z+(z-last.z)*t+dz);
            }
            poles.push(p);last=p;break;
          }
        }
      }
    }
    for(const x of xs)addRun(x+(x===0?-1:1)*(halfX(x)+1.95),true,zs,halfZ);
    for(const z of [-83,15,65])addRun(z+(z===15?-1:1)*(halfZ(z)+1.95),false,xs,halfX);
    const cableGeo=new T.BufferGeometry();cableGeo.setAttribute("position",new T.Float32BufferAttribute(wires,3));
    scene.add(new T.LineSegments(cableGeo,new T.LineBasicMaterial({color:0x34302b})));
    function plant(x,z) {
      if(!clearPavement(x,z,.80)||trees.some(other=>Math.hypot(x-other.x,z-other.z)<6)||
          poles.some(p=>Math.hypot(x-p.x,z-p.z)<3.7))return;
      const scale=.83+rng()*.38;
      trees.push({x,z,scale});prop("tree",x,z,Math.floor(rng()*4)*Math.PI/2,[.62*scale,.62*scale,4.8*scale],groundAt(x,z),76,scale);
    }
    for(let i=0;i<xs.length;i++)for(let j=0;j<zs.length-1;j++)for(const side of [-1,1]){
      const x=xs[i]+side*(halfX(xs[i])+2.2);
      for(const f of [.33,.69])plant(x,zs[j]+(zs[j+1]-zs[j])*(f+side*.045));
    }
    for(const z of zs)for(let i=0;i<xs.length-1;i++)for(const side of [-1,1])
      plant(xs[i]+(xs[i+1]-xs[i])*(side<0?.35:.67),z+side*(halfZ(z)+1.85));
    for(const [x,z] of [[-118,54],[-86,52],[-81,30],[34,-1],[52,1],[20,-18],[92,-44],[112,-53],[-110,77],[-53,77],[26,77],[93,77]])plant(x,z);
    for(const g of groups.values())C72Batch.staticGroup(g);
    report(.48);
    await waitPaint();
    function loadNearby(x,z,budget=2,buildRadius=Infinity) {
      const pending=[];
      for(const item of streams) {
        const dist=(item.x-x)**2+(item.z-z)**2;
        if(item.object && dist>(item.reach+41)**2){
          item.object.traverse(child=>{if(child.isMesh)child.geometry.dispose();});
          item.object.removeFromParent();item.object=null;
        }
        if(item.object) item.object.visible=dist<(item.reach+11)**2;
        else if(dist<Math.min(item.reach,buildRadius)**2)pending.push([item.brand?dist*.50:dist,item]);
      }
      pending.sort((a,b)=>a[0]-b[0]);
      for(const [,item] of pending.slice(0,budget)){
        const obj=item.make();C72Batch.staticGroup(obj);
        obj.position.set(item.x,item.y??.19,item.z);obj.rotation.y=item.r;obj.scale.setScalar(item.scale??1);scene.add(obj);item.object=obj;
      }
      return Math.max(0,pending.length-budget);
    }
    const initial=loadNearby(spawn.x,spawn.z,0,40);
    for(let left=initial;left>0;){
      left=loadNearby(spawn.x,spawn.z,4,40);
      report(.49+.13*(1-left/initial));await waitPaint();
    }
    const streetArt=C72StreetArt.build(scene,{lots,poles,collision});
    return {near,structures,lots,branches,poles,trees,loadNearby,terrain,streetArt};
  }
  return {build,xs,zs,roadBeds,onRoad,halfX,halfZ,groundAt,limits,pois,spawn,zone,random,canvasMap};
})();
