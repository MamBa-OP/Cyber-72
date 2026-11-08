/* Cyber 72 · Old Dhaka architecture and street furniture. Coordinates are metres. */
(function () {
  "use strict";

  const TAU = Math.PI * 2;
  const shops = [
    ["মামার চা ঘর", "CHA & SNACKS", "#216958", "#fff0b3", "tea"],
    ["ইসলামপুর ফার্মেসি", "ISLAMPUR PHARMACY", "#176258", "#fff8df", "pharmacy"],
    ["পদ্মা বইঘর", "PADMA BOOK HOUSE", "#7a3a35", "#ffe9c2", "books"],
    ["নূর টেইলার্স", "NOOR TAILORS", "#34456a", "#ffe9a5", "tailor"],
    ["মেঘনা মোবাইল", "MEGHNA MOBILE SERVICE", "#224b75", "#fff0c6", "mobile"],
    ["জনতা ফল ভান্ডার", "JONOTA FRUIT MARKET", "#d9a744", "#372d29", "fruit"],
    ["পুরান ঢাকা হোটেল", "PURAN DHAKA HOTEL", "#853b30", "#ffecca", "hotel"],
    ["মদিনা স্টোর", "MODINA GENERAL STORE", "#3d6754", "#fbefc9", "grocery"],
    ["নবাবপুর ইলেকট্রিক", "NAWABPUR ELECTRIC", "#d2ad52", "#273447", "electric"],
    ["রূপসী বস্ত্রালয়", "RUPOSHI CLOTH HOUSE", "#70415c", "#ffdfae", "textile"],
    ["তাজ বেকারি", "TAJ BAKERY", "#8f4a38", "#ffedbb", "bakery"],
    ["বাংলা প্রিন্টার্স", "BANGLA PRINT WORKS", "#375970", "#f0ead6", "print"],
    ["নদী ট্রেডার্স", "NODI TRADERS", "#49625f", "#fae2b7", "trade"],
    ["বংশাল টিকিট ঘর", "BANGSHAL TICKETS", "#354b72", "#ffe8bb", "tickets"],
    ["মা হার্ডওয়্যার", "MA HARDWARE", "#953e32", "#fbe4ad", "hardware"],
    ["রহিম মিষ্টান্ন", "RAHIM SWEETS", "#8b5254", "#fff0be", "sweets"]
  ];
  // The numbered tiles match the reading order of the nine original shop interiors.
  const retailNames = Object.freeze({
    bkash:    {tile:0,en:"bKash",bn:"বিকাশ",short:"bKash",service:"এজেন্ট",paper:"#bd145d",ink:"#fff9ef",accent:"#fca1c4"},
    dbbl:     {tile:1,en:"Dutch-Bangla Bank",bn:"ডাচ্-বাংলা ব্যাংক",short:"DBBL",service:"এটিএম",paper:"#f3f0e7",ink:"#154178",accent:"#d34245"},
    shwapno:  {tile:2,en:"Shwapno",bn:"স্বপ্ন",short:"Shwapno",service:"সুপারশপ",paper:"#c92432",ink:"#fff9e6",accent:"#ffb73b"},
    starkabab:{tile:3,en:"Star Kabab",bn:"স্টার কাবাব",short:"Star Kabab",service:"রেস্তোরাঁ",paper:"#282a2b",ink:"#ff756c",accent:"#f4bc65"},
    startech: {tile:4,en:"Star Tech Ltd.",bn:"স্টার টেক লিমিটেড",short:"Star Tech",service:"কম্পিউটার",paper:"#182939",ink:"#ffad51",accent:"#ff792a"},
    apex:     {tile:5,en:"Apex",bn:"অ্যাপেক্স",short:"Apex",service:"ফুটওয়্যার",paper:"#f5f1e8",ink:"#b92236",accent:"#237147"},
    aarong:   {tile:6,en:"Aarong",bn:"আড়ং",short:"Aarong",service:"কারুশিল্প",paper:"#a64b20",ink:"#fff0cd",accent:"#efa65b"},
    bata:     {tile:7,en:"Bata",bn:"বাটা",short:"Bata",service:"জুতার দোকান",paper:"#faf4e9",ink:"#c01d32",accent:"#c01d32"},
    yellow:   {tile:8,en:"YELLOW",bn:"ইয়েলো",short:"YELLOW",service:"পোশাক",paper:"#e1b849",ink:"#272620",accent:"#35332a"}
  });
  const paint = [0xb7ac85, 0x98a99a, 0xbf9984, 0xb9ab9c, 0xa1afb0, 0xa6a283, 0xb5907e, 0xb6b2a7];
  const trim = [0x887661, 0x799087, 0x95665b, 0x8b817d, 0x758392, 0x827d61, 0x825d50, 0x87837a];
  const hasBengali = /[\u0980-\u09ff]/;
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const lerp = (a, b, t) => a + (b - a) * t;
  function numberSeed(value) {
    if (typeof value === "number" && Number.isFinite(value)) return value | 0;
    let n = 17;
    for (const ch of String(value || "")) n = Math.imul(n, 31) + ch.charCodeAt(0) | 0;
    return n;
  }
  function random(seed) {
    let state = numberSeed(seed) >>> 0;
    return () => {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function surface(w, h) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    return [canvas, canvas.getContext("2d")];
  }
  let T, unitBox, unitRound, up;
  const geometry = new Map();
  const materials = new Map();
  const textures = new Map();
  function prepare() {
    if (T) return;
    T = window.THREE;
    if (!T) throw new Error("Load Three.js before creating the district.");
    unitBox = new T.BoxGeometry(1, 1, 1);
    unitRound = new T.SphereGeometry(1, 10, 8);
    up = new T.Vector3(0, 1, 0);
  }
  function tex(image, repeat) {
    const texture = new T.Texture(image);
    texture.colorSpace = T.SRGBColorSpace;
    if (repeat) texture.wrapS = texture.wrapT = T.RepeatWrapping;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    return texture;
  }
  function finish(key, color, options) {
    if (!materials.has(key)) materials.set(key, new T.MeshStandardMaterial({color, roughness: .91, metalness: .025, ...options}));
    return materials.get(key);
  }
  // The paint sits millimetres in front of solid walls and sign boards.
  // Give it a depth bias so lower-precision buffers keep the artwork visible.
  const wallPaint={polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2};
  const signPaint={polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4};
  function solid(color) { return finish("solid" + color, color); }
  function metal(color) { return finish("metal" + color, color, {roughness: .68, metalness: .37}); }
  function pattern(kind) {
    if (textures.has(kind)) return textures.get(kind);
    const [c, p] = surface(256, 256), r = random(kind);
    p.fillStyle = kind === "wood" ? "#c8ac88" : kind === "bark" ? "#a39984" : "#d3d0c7";
    p.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 280; i++) {
      const x = r() * 256, y = r() * 256, rad = 2 + r() * 48;
      const g = p.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, r() > .5 ? "rgba(43,34,25,.14)" : "rgba(255,252,232,.18)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      p.fillStyle = g; p.fillRect(x-rad, y-rad, 2*rad, 2*rad);
    }
    if (kind === "tin" || kind === "slat") {
      for (let x = 0; x < 256; x += 16) {
        const g = p.createLinearGradient(x, 0, x+16, 0);
        g.addColorStop(0, "rgba(48,44,39,.48)"); g.addColorStop(.23, "rgba(246,242,216,.18)");
        g.addColorStop(.48, "rgba(255,255,245,.48)"); g.addColorStop(1, "rgba(71,72,67,.18)");
        p.fillStyle = g; p.fillRect(x, 0, 16, 256);
      }
    }
    if (kind === "wood" || kind === "bark") {
      const vertical = kind === "bark";
      p.save();
      if (vertical) { p.translate(256,0); p.rotate(Math.PI/2); }
      for (let i=0;i<165;i++) {
        const y = r()*256;
        p.beginPath(); p.moveTo(0,y); p.bezierCurveTo(58,y+(r()-.5)*18,190,y+(r()-.5)*18,256,y);
        p.strokeStyle = r() < .7 ? "rgba(60,43,34,.29)" : "rgba(232,224,189,.27)";
        p.lineWidth = .4 + r()*1.8; p.stroke();
      }
      for(let i=0;i<34;i++) {
        const x=r()*256,y=r()*256;
        p.beginPath();p.ellipse(x,y,4+r()*11,1+r()*2,0,0,TAU);p.strokeStyle="rgba(63,44,34,.32)";p.stroke();
      }
      p.restore();
    }
    if (kind === "brick") {
      p.fillStyle = "#afa99a";p.fillRect(0,0,256,256);
      for(let j=0;j<12;j++)for(let i=-1;i<9;i++){
        const x=i*32+(j%2)*16,y=j*256/12,n=Math.floor(r()*37);
        p.fillStyle="rgb("+(145+n)+","+(102+n*.7)+","+(83+n*.61)+")";
        p.fillRect(x+1,y+1,30,256/12-2);p.fillStyle="rgba(235,207,164,.28)";p.fillRect(x+1,y+1,30,1);
      }
    }
    if (kind === "cloth") {
      for(let i=0;i<256;i+=3){p.fillStyle="rgba(238,231,198,.16)";p.fillRect(0,i,256,1);p.fillStyle="rgba(55,52,47,.09)";p.fillRect(i,0,1,256);}
    }
    if (kind === "plaster" || kind === "tin") {
      for(let i=0;i<65;i++){
        const x=r()*256,y=r()*250;
        p.fillStyle=kind==="tin"?"rgba(127,73,43,.17)":"rgba(84,79,61,.18)";
        p.fillRect(x,y,.7+r()*3,r()*25+2);
      }
      for(let i=0;i<3;i++){
        let x=r()*256,y=r()*160;p.beginPath();p.moveTo(x,y);
        for(let j=0;j<6;j++){x+=(r()-.5)*9;y+=r()*7;p.lineTo(x,y);}
        p.strokeStyle="rgba(72,70,66,.30)";p.lineWidth=.7;p.stroke();
      }
    }
    for(let i=0;i<3700;i++){
      p.fillStyle=r()>.5?"rgba(255,255,240,.22)":"rgba(65,57,48,.18)";
      p.fillRect(r()*256,r()*256,1+r()*1.1,1);
    }
    const texture=tex(c,true);
    textures.set(kind,texture);
    return texture;
  }
  function rough(kind,color) {
    return finish(kind+color,color,{map:pattern(kind),roughness:kind==="tin"?.79:.97,metalness:kind==="tin"?.24:.015});
  }
  function mesh(g,geo,m,x,y,z,sx=1,sy=1,sz=1) {
    const a=new T.Mesh(geo,m);a.position.set(x,y,z);a.scale.set(sx,sy,sz);
    a.castShadow=true;a.receiveShadow=true;g.add(a);return a;
  }
  const box=(g,x,y,z,w,h,d,m)=>mesh(g,unitBox,m,x,y,z,w,h,d);
  const oval=(g,x,y,z,rx,ry,rz,m)=>mesh(g,unitRound,m,x,y,z,rx,ry,rz);
  function tubeGeo(upperRatio,segments){
    const key="tube:"+upperRatio+":"+segments;
    if(!geometry.has(key))geometry.set(key,new T.CylinderGeometry(upperRatio,1,1,segments));
    return geometry.get(key);
  }
  function tube(g,x,y,z,r,h,m,ratio=1,segments=10){
    return mesh(g,tubeGeo(ratio,segments),m,x,y,z,r,h,r);
  }
  function branch(g,a,b,radius,m,ratio=1,segments=6) {
    const dir=new T.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
    const stick=tube(g,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,radius,dir.length(),m,ratio,segments);
    stick.quaternion.setFromUnitVectors(up,dir.normalize());return stick;
  }
  function ring(g,x,y,z,radius,thickness,m,vertical=false) {
    const ratio=Math.round(100*thickness/radius)/100,key="ring"+ratio;
    if(!geometry.has(key))geometry.set(key,new T.TorusGeometry(1,ratio,5,16));
    const a=mesh(g,geometry.get(key),m,x,y,z,radius,radius,radius);
    if(!vertical)a.rotation.x=Math.PI/2; return a;
  }
  function planeGeo(index=0,cols=1,rows=1){
    const key="face:"+index+":"+cols+":"+rows;
    if(!geometry.has(key)){
      const geo=new T.PlaneGeometry(1,1),uv=geo.attributes.uv;
      const col=index%cols,row=Math.floor(index/cols),gap=cols*rows>1?.009:0;
      for(let i=0;i<uv.count;i++)uv.setXY(i,(col+gap+(1-2*gap)*uv.getX(i))/cols,(rows-row-1+gap+(1-2*gap)*uv.getY(i))/rows);
      geometry.set(key,geo);
    }
    return geometry.get(key);
  }
  function face(g,x,y,z,w,h,m,index=0,cols=1,rows=1) {
    return mesh(g,planeGeo(index,cols,rows),m,x,y,z,w,h,1);
  }
  function sub(g,x,y,z,yaw=0){
    const n=new T.Group();n.position.set(x,y,z);n.rotation.y=yaw;g.add(n);return n;
  }
  function fittedText(p,label,size,x,y,width,color,font){
    p.fillStyle=color;p.font="bold "+size+"px "+font;p.fillText(label,x,y,width);
  }
  const bangla='"Nirmala UI","Noto Sans Bengali","Vrinda",sans-serif';
  function drawSign(p,index,w,h,spec) {
    const [bn,en,bg,fg]=spec,r=random(index+781);
    p.fillStyle=bg;p.fillRect(0,0,w,h);
    p.strokeStyle=fg;p.globalAlpha=.72;p.lineWidth=h*.018;p.strokeRect(w*.011,h*.05,w*.978,h*.90);p.globalAlpha=1;
    p.textAlign="center";p.textBaseline="middle";
    fittedText(p,bn,h*.53,w*.5,h*.44,w*.92,fg,bangla);
    fittedText(p,en,h*.13,w*.5,h*.81,w*.9,fg,"Arial,sans-serif");
    for(let i=0;i<340;i++){p.fillStyle=r()<.5?"rgba(245,231,195,.15)":"rgba(60,49,40,.13)";p.fillRect(r()*w,r()*h,1+r()*2,1);}
    for(const x of [w*.025,w*.975])for(const y of [h*.12,h*.88]){p.fillStyle="#6b665e";p.beginPath();p.arc(x,y,h*.017,0,TAU);p.fill();}
  }
  function signMaterial(){
    if(materials.has("signs"))return materials.get("signs");
    const [c,p]=surface(2048,512);
    shops.forEach((s,i)=>{p.save();p.translate(i%4*512,Math.floor(i/4)*128);drawSign(p,i,512,128,s);p.restore();});
    return finish("signs",0xfffbef,{map:tex(c,false),roughness:.85,...signPaint});
  }
  function customSign(label,index){
    const key="sign-"+label;
    if(materials.has(key))return materials.get(key);
    const [c,p]=surface(512,128),spec=shops[index].slice();spec[0]=label;
    drawSign(p,index,512,128,spec);return finish(key,0xfffbf3,{map:tex(c,false),...signPaint});
  }
  function shopInfo(value,kind,r){
    if(value===false || ((value==null||value==="") && /residen|house|home|mosque|warehouse|godown/i.test(kind)))return null;
    let idx=Math.floor(r()*shops.length), custom="";
    if(typeof value==="number" && Number.isFinite(value))idx=(Math.abs(value)|0)%shops.length;
    const name=typeof value==="string"?value:(value && (value.bn||value.name||value.label||value.type)) || "";
    if(name){
      const text=String(name).trim(), category=text.toLowerCase();
      const match=shops.findIndex(s=>s[0]===text||category.includes(s[4]));
      if(match>=0)idx=match;else if(hasBengali.test(text))custom=text.slice(0,32);
      else if(/food|cafe|restaurant|rice/.test(category))idx=6;
      else if(/bike|repair|tool/.test(category))idx=14;
      else if(/cloth|sari|fabric/.test(category))idx=9;
      else if(/produce|vegetable|market/.test(category))idx=5;
    }
    return {idx,custom};
  }
  function elevation(upper){
    const key=upper?"upper-atlas":"facade-atlas";
    return finish(key,0xfffcf3,{map:C72Atlases.get(upper?"upper":"facade"),roughness:.98,metalness:0,...wallPaint});
  }
  function posterMaterial(){
    if(materials.has("posters"))return materials.get("posters");
    const [c,p]=surface(512,256);
    [["নিরাপদ থাকুন","ওটিপি গোপন রাখুন","#a64737"],["ভর্তি চলছে","কম্পিউটার প্রশিক্ষণ","#234d68"]].forEach((s,i)=>{
      p.save();p.translate(i*256,0);p.fillStyle="#e0d1b1";p.fillRect(0,0,256,256);
      p.fillStyle=s[2];p.fillRect(8,8,240,75);p.textAlign="center";p.textBaseline="middle";
      fittedText(p,s[0],43,128,45,223,"#eee8cb",bangla);
      fittedText(p,s[1],23,128,113,225,s[2],bangla);
      for(let j=0;j<6;j++){p.fillStyle=j%2?"#8e8777":"#705e51";p.fillRect(22,145+j*13,190+(j%3)*12,2);}
      p.fillStyle=s[2];p.fillRect(17,234,222,6);p.restore();
    });
    return finish("posters",0xfffcea,{map:tex(c,false),roughness:1});
  }

  function awningFabric(index){
    const key="awning"+index;
    if(materials.has(key))return materials.get(key);
    const [c,p]=surface(256,128), colors=[["#a05142","#e3d0a3"],["#2d786d","#d6c79e"],["#c89442","#c7b595"],["#507080","#c0c5af"],["#697653","#cfbc88"]][index%5];
    p.fillStyle=colors[1];p.fillRect(0,0,256,128);
    for(let i=0;i<8;i++){p.fillStyle=colors[0];p.fillRect(i*32,0,17,128);p.fillStyle="rgba(68,52,41,.15)";p.fillRect(i*32+18,0,2,128);}
    p.globalAlpha=.26;p.drawImage(pattern("cloth").image,0,0,256,128);p.globalAlpha=1;
    const g=p.createLinearGradient(0,0,0,128);g.addColorStop(0,"rgba(63,52,44,.22)");g.addColorStop(.5,"rgba(255,255,239,0)");g.addColorStop(1,"rgba(245,218,144,.18)");p.fillStyle=g;p.fillRect(0,0,256,128);
    return finish(key,0xffffff,{map:tex(c,false),side:T.DoubleSide,roughness:1});
  }
  function awning(g,x,y,width,reach,index){
    const tarp=awningFabric(index),iron=metal(0x565650);
    const slab=box(g,x,y-.10,reach*.47,width,.055,reach,tarp);slab.rotation.x=.145;
    box(g,x,y-.235,reach*.96,width,.19,.033,tarp);
    for(const edge of [-1,1]){
      const bx=x+edge*(width*.5-.10);
      branch(g,[bx,y-.67,.035],[bx,y-.17,reach*.91],.026,iron);
    }
  }
  function acFace(){
    if(materials.has("acFace"))return materials.get("acFace");
    const [c,p]=surface(160,96);p.fillStyle="#c9c6b4";p.fillRect(0,0,160,96);
    p.fillStyle="#414a46";p.beginPath();p.arc(53,48,36,0,TAU);p.fill();
    p.strokeStyle="#8d9386";p.lineWidth=2;
    for(let i=1;i<7;i++){p.beginPath();p.arc(53,48,i*5,0,TAU);p.stroke();}
    for(let i=0;i<8;i++){p.beginPath();p.moveTo(53,48);p.lineTo(53+Math.cos(i*TAU/8)*36,48+Math.sin(i*TAU/8)*36);p.stroke();}
    for(let i=0;i<11;i++){p.fillStyle=i%2?"#777f72":"#9d9f8d";p.fillRect(101,15+i*6,48,2);}
    p.fillStyle="#455b68";p.fillRect(109,79,33,6);
    return finish("acFace",0xfffbec,{map:tex(c,false)});
  }
  function acUnit(g,x,y){
    box(g,x,y,.23,.80,.50,.39,rough("tin",0xc3bfae));
    face(g,x,y,.434,.77,.46,acFace());
    for(const dx of [-.27,.27])box(g,x+dx,y-.28,.21,.05,.05,.46,metal(0x59605a));
  }
  function balcony(g,x,y,w,r){
    const len=Math.min(3.4,w-.23),iron=metal(0x535c53),front=.77;
    if(len<1.4)return;
    box(g,x,y,.36,len,.15,.82,rough("plaster",0xc2bba9));
    box(g,x,y-.075,front-.01,len,.12,.08,rough("plaster",0x989284));
    box(g,x,y+.83,front,len,.05,.05,iron);
    box(g,x,y+.30,front,len,.035,.04,iron);
    const count=Math.max(4,Math.floor(len/.34));
    for(let i=0;i<=count;i++)box(g,x+len*(i/count-.5),y+.46,front,.024,.74,.024,iron);
    for(const s of [-1,1]){box(g,x+s*len*.5,y+.82,.39,.045,.045,.8,iron);box(g,x+s*len*.5,y+.42,.05,.043,.81,.044,iron);}
    if(r()<.53){
      const cloth=box(g,x+(r()-.5)*len*.4,y+.49,front+.03,Math.min(.77,len*.44),.66,.045,awningFabric(r()*5|0));
      cloth.rotation.z=(r()-.5)*.04;
    }else if(r()<.55){
      tube(g,x+len*.24,y+.19,.53,.18,.24,rough("plaster",0x9d6848),.76,10);
      for(let j=0;j<5;j++)oval(g,x+len*.24+(r()-.5)*.24,y+.39+r()*.16,.53+(r()-.5)*.22,.085,.17,.10,solid(j%2?0x57754b:0x6c874f));
    }
  }
  function upperSide(g,w,h,baseY,r,trimMat,front,back){
    if(h<=.55)return;
    const cols=Math.max(1,Math.round(w/6.1)), rows=Math.max(1,Math.round(h/6.3));
    const cw=w/cols,ch=h/rows,mat=elevation(true),offset=r()*8|0;
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
      face(g,-w/2+cw*(i+.5),baseY+ch*(j+.5),.014,cw+.003,ch+.001,mat,(offset+i+2*j)%8,4,2);
    }
    const levels=Math.max(1,Math.round(h/3.15));
    for(let i=0;i<levels;i++){
      const y=baseY+i*h/levels;
      if(i%2===0)box(g,0,y+.04,.04,w+.03,.11,.14,trimMat);
      if(front && r()<.47 && w>3.1){
        const slot=r()*cols|0,x=-w/2+cw*(slot+.5);
        balcony(g,x,y+.07,cw,r);
      }else if(!back && r()<.39 && w>3)acUnit(g,(r()-.5)*(w-1.2),y+h/levels*.57);
    }
    if(front && w>2.5){
      const drainX=(r()<.5?-1:1)*(w/2-.16),pipe=metal(0x6b7068);
      tube(g,drainX,baseY+h/2,.095,.048,h,pipe,1,7);
      for(let i=1;i<h/2.8;i++)tube(g,drainX,baseY+i*2.8,.095,.062,.075,pipe,1,7);
    }
  }
  function shutter(g,x,width,ground,r) {
    const sh=ground*.75, m=rough("slat",r()<.5?0x728687:0x8c9180);
    // Horizontal rolling shutter slats, with a raised concrete threshold.
    const panel=face(g,x,sh*.5+.12,.035,sh,width,m);panel.rotation.z=Math.PI/2;
    box(g,x,.12,.11,width+.05,.18,.26,rough("plaster",0xa9a18b));
    box(g,x,sh+.15,.10,width+.12,.14,.25,metal(0x5d665e));
  }
  function retailInteriors() {
    return finish("retail-atlas",0xfffcf6,{map:C72Atlases.get("retail"),roughness:.82,metalness:.015,...wallPaint});
  }
  function signInk(p,text,x,y,maxWidth,size,font,color,weight="bold"){
    p.fillStyle=color;p.font=weight+" "+size+"px "+font;p.fillText(text,x,y,maxWidth);
  }
  function retailMark(p,s,cx,cy,size){
    p.save();p.translate(cx,cy);p.scale(size/100,size/100);
    p.fillStyle=s.ink;p.strokeStyle=s.ink;p.lineWidth=5;p.lineJoin="round";p.lineCap="round";
    function shape(points,color) {
      p.beginPath();points.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();p.fillStyle=color;p.fill();
    }
    if(s.tile===0){ // Folded paper at the mobile-money window.
      shape([[-39,-30],[-3,-9],[-17,15]],s.ink);
      shape([[-4,-8],[32,-27],[9,6],[-17,18]],s.accent);
      shape([[13,-9],[42,-12],[30,0]],s.ink);
      shape([[-17,21],[6,8],[-13,34]],s.ink);
    }else if(s.tile===1){
      for(let i=0;i<3;i++)shape([[-33+i*17,22],[-24+i*17,-18],[-10+i*17,-28],[-19+i*17,12]],i===1?s.accent:s.ink);
    }else if(s.tile===2){
      shape([[-32,-14],[32,-14],[27,30],[-27,30]],s.ink);
      p.beginPath();p.arc(0,-14,16,Math.PI,2*Math.PI);p.stroke();
      shape([[-12,5],[-1,13],[18,-5],[0,20]],s.paper);
    }else if(s.tile===3){
      const points=Array.from({length:10},(_,i)=>{const r=i%2?15:38,a=i*Math.PI/5-Math.PI/2;return [Math.cos(a)*r,Math.sin(a)*r];});
      shape(points,s.accent);
    }else if(s.tile===4){
      p.strokeRect(-33,-24,66,42);p.fillRect(-4,19,8,10);p.fillRect(-20,27,40,4);
      shape([[-19,9],[-2,-15],[1,-4],[21,-18],[4,6],[0,-4]],s.accent);
    }else if(s.tile===5||s.tile===7){
      shape([[-37,11],[-30,-13],[-21,-8],[-12,-14],[0,-3],[13,4],[33,7],[38,16],[31,20],[-34,20]],s.ink);
      p.fillStyle=s.paper;p.fillRect(-33,14,66,2);
    }else if(s.tile===6){
      for(let i=0;i<6;i++){p.save();p.rotate(i*TAU/6);shape([[0,-7],[-8,-21],[0,-35],[8,-21]],s.ink);p.restore();}
      p.beginPath();p.arc(0,0,6,0,TAU);p.fillStyle=s.accent;p.fill();
    }else{
      shape([[-32,-26],[-18,-26],[0,-3],[18,-26],[32,-26],[7,4],[7,31],[-7,31],[-7,4]],s.ink);
    }
    p.restore();
  }
  function retailSigns(blade) {
    const key=blade?"retail-blades":"retail-signs";
    if(materials.has(key))return materials.get(key);
    const w=blade?320:960,h=blade?216:192,[canvas,p]=surface(3*w,3*h);
    for(const s of Object.values(retailNames)){
      const nativeFirst=[2,3,6].includes(s.tile);
      p.save();p.translate(s.tile%3*w,Math.floor(s.tile/3)*h);
      p.fillStyle=s.paper;p.fillRect(0,0,w,h);p.textBaseline="middle";
      if(blade){
        retailMark(p,s,w*.5,h*.35,h*.52);p.textAlign="center";
        signInk(p,s.short,w*.5,h*.76,w*.90,h*.29,"Arial,sans-serif",s.ink);
      }else{
        p.fillStyle=s.accent;p.fillRect(w*.025,h*.17,w*.009,h*.65);
        retailMark(p,s,w*.142,h*.49,h*.85);p.textAlign="left";
        const left=w*.243,available=w*.73;
        const enFont=s.tile===6||s.tile===7?'Georgia,"Times New Roman",serif':'Arial,"Segoe UI",sans-serif';
        signInk(p,nativeFirst?s.bn:s.en,left,h*.41,available,h*.55,nativeFirst?bangla:enFont,s.ink,s.tile===7?"italic bold":"bold");
        const second=nativeFirst?s.en+"  ·  "+s.service:s.bn+"  ·  "+s.service;
        signInk(p,second,left,h*.795,available,h*.245,bangla,s.ink,"600");
      }
      p.restore();
    }
    return finish(key,0xffffff,{map:tex(canvas,false),roughness:.63,metalness:.04,...signPaint});
  }
  function retailDisplay(g,s,x) {
    const unit=sub(g,x,0,0),iron=metal(0x525753),timber=rough("wood",0xb19571);
    const tile=s.tile;
    if(tile===0){
      box(unit,0,.89,.20,1.17,.82,.33,metal(0xb8b0a4));
      box(unit,0,.91,.377,1.12,.67,.025,solid(0xb82064));
      box(unit,0,1.33,.22,1.27,.07,.47,metal(0x8c8c85));
      box(unit,-.27,1.41,.23,.29,.10,.20,solid(0x464b4c));
    }else if(tile===1){
      box(unit,0,.97,.19,.78,1.81,.37,metal(0x9babb7));
      box(unit,0,1.46,.40,.63,.46,.09,solid(0x23416c));
      face(unit,0,1.47,.45,.44,.25,solid(0x75bac7));
      const keyboard=box(unit,0,1.12,.42,.54,.10,.20,metal(0x697a87));keyboard.rotation.x=.12;
      for(let row=0;row<3;row++)for(let col=0;col<3;col++)box(unit,(col-1)*.048,1.18,.36+row*.036,.029,.01,.024,solid(0xc9c4ad));
      box(unit,0,.86,.383,.34,.053,.015,solid(0x293c4d));box(unit,0,.30,.38,.75,.43,.025,solid(0x28568a));
    }else if(tile===2){
      for(let i=0;i<2;i++){
        const bx=(i-.5)*.69;
        for(let j=0;j<2;j++)box(unit,bx,.22+j*.23,.27,.63,.19,.47,solid(i?0x876a44:0x626d45));
        for(let k=0;k<12;k++){
          const fx=bx+((k%4)-1.5)*.126,fz=.14+Math.floor(k/4)*.125;
          oval(unit,fx,.58+(k%3)*.014,fz,.075,.069,.077,solid((i?[0xc19134,0xceaa4e]:[0x6c8e4e,0x76984e])[k%2]));
        }
      }
    }else if(tile===3){
      box(unit,0,.51,.28,1.47,.64,.48,metal(0x807e70));
      box(unit,0,.86,.27,1.57,.075,.51,metal(0xb1aca0));
      tube(unit,-.34,1.02,.26,.195,.245,metal(0x9b9c90),1.09,14);
      oval(unit,-.34,1.15,.26,.215,.058,.215,metal(0xc0bbae));oval(unit,-.34,1.21,.26,.042,.030,.042,iron);
      box(unit,.34,.935,.27,.59,.08,.38,solid(0x4d4840));
      for(let i=0;i<4;i++){
        const sk=.13+i*.13;
        branch(unit,[sk,.999,.075],[sk,.999,.50],.009,metal(0xb8a88e),1,5);
        for(let j=0;j<3;j++)oval(unit,sk,1.026,.14+j*.105,.041,.048,.062,solid(j%2?0x9d582e:0xae683f));
      }
    }else if(tile===4){
      box(unit,0,.46,.22,1.12,.75,.36,solid(0x2d3d4c));box(unit,0,.88,.25,1.22,.09,.46,timber);
      box(unit,-.14,.95,.29,.45,.032,.26,metal(0x747c81));
      const lid=sub(unit,-.14,1.075,.178);lid.rotation.x=-.09;
      box(lid,0,0,0,.466,.26,.026,iron);face(lid,0,0,.016,.399,.212,solid(0x638caa));
      box(unit,.33,1.04,.20,.21,.23,.16,solid(0xe0823e));
    }else if(tile===5||tile===7){
      const finishColor=tile===5?0xad8d6b:0xe5dfd0;
      box(unit,0,.43,.23,1.26,.58,.40,solid(finishColor));
      box(unit,0,.75,.245,1.31,.06,.44,solid(tile===5?0x785741:0xc54c48));
      for(let i=0;i<4;i++){
        const shoe=sub(unit,(i-1.5)*.275,.79,.235,((i%2)-.5)*.52);
        const leather=solid((tile===5?[0x5b4337,0x493b34]:[0xbbab97,0xe0d9c5])[i%2]);
        oval(shoe,0,.017,.018,.077,.028,.157,solid(0x655d54));
        oval(shoe,0,.057,.015,.070,.056,.145,leather);oval(shoe,0,.085,-.052,.062,.057,.074,leather);
      }
    }else if(tile===6){
      box(unit,0,.34,.25,1.18,.50,.40,timber);
      for(let i=0;i<4;i++)box(unit,-.24,.61+i*.044,.245,.48,.045,.31,solid([0xa44d43,0xc19251,0x516d70,0x8f6e72][i]));
      for(let i=0;i<2;i++){const bx=.13+.23*i;oval(unit,bx,.73,.23,.109,.15,.103,rough("plaster",0xb87650));
        tube(unit,bx,.86,.23,.053,.064,rough("plaster",0xa4774f),1.16,10);}
    }else{
      box(unit,0,.17,.23,1.16,.09,.39,timber);
      for(const bx of [-.52,.52])branch(unit,[bx,.2,.27],[bx,1.67,.27],.022,iron);
      branch(unit,[-.54,1.67,.27],[.54,1.67,.27],.023,iron);
      for(let i=0;i<5;i++){
        const garment=sub(unit,(i-2)*.193,1.14,.255,(i%2-.5)*.19);
        box(garment,0,0,0,.175,.64,.09,solid([0x6c8485,0xcab389,0xaba8a0,0xa88863,0x7c7e91][i]));
        branch(garment,[0,.325,0],[0,.52,0],.012,iron);
      }
    }
  }
  function brandedStorefront(g,w,h,s,distant=false) {
    const sill=rough("plaster",0xa99c8d),dark=metal(0x42484b),paper=solid(s.paper);
    const sh=clamp(h*.26,.70,.94),head=h-sh,viewH=head-.115,cy=h-sh/2;
    face(g,0,.135+viewH/2,.033,w-.16,viewH,retailInteriors(),s.tile,3,3);
    if(distant){
      face(g,0,cy,.05,w-.10,sh,retailSigns(false),s.tile,3,3);
      return;
    }
    box(g,0,.073,.18,w-.04,.145,.37,sill);
    for(const edge of [-1,1])box(g,edge*(w/2-.070),head/2,.075,.15,head,.18,dark);
    box(g,0,cy,.125,w+.025,sh,.214,paper);
    face(g,0,cy,.238,Math.min(w-.18,sh*5.28),sh*.985,retailSigns(false),s.tile,3,3);
    box(g,0,h+.006,.16,w+.055,.055,.29,dark);
    box(g,0,head+.026,.160,w-.09,.040,.28,solid(s.accent));
    // A sidewalk-facing blade lets a walking player recognise the shop along the street.
    const bladeH=.52,bladeD=.74,bx=w*.41,by=Math.max(2.48,cy-.10),bz=.71;
    box(g,bx,by+bladeH*.45,.50,.048,.055,.88,dark);
    box(g,bx,by,bz,.077,bladeH+.04,bladeD+.04,paper);
    for(const side of [-1,1]){
      const panel=face(g,bx+side*.040,by,bz,bladeD,bladeH,retailSigns(true),s.tile,3,3);
      panel.rotation.y=side*Math.PI/2;
    }
    if(w>3.2)retailDisplay(g,s,-w*.30);
  }
  function storefront(g,w,h,r,info,distant=false){
    const bays=Math.max(1,Math.round(w/5.0)), bw=w/bays, shopM=elevation(false),concrete=rough("plaster",0xaa9b86);
    const firstTile=r()*8|0;
    for(let i=0;i<bays;i++){
      const x=-w/2+bw*(i+.5),idx=i===0||info.custom?info.idx:(info.idx+i*3)%shops.length;
      const frontage=Math.max(.5,bw-.21);
      face(g,x,h*.48,.019,frontage,h*.91,shopM,(firstTile+i*3)%8,4,2);
      const sw=frontage-.08,sh=clamp(h*.19,.40,.70),sy=h-sh*.57-.035;
      if(info.custom)face(g,x,sy,.173,sw,sh,customSign(info.custom,idx));
      else face(g,x,sy,.173,sw,sh,signMaterial(),idx,4,4);
      if(distant)continue;
      box(g,x,.09,.23,bw-.02,.17,.49,concrete);
      box(g,x,h*.50,.08,frontage,.062,.13,rough("wood",0x8d7456));
      box(g,x,sy,.095,sw+.055,sh+.045,.14,metal(0x494940));
      if(r()<.65 && bw>2.0)awning(g,x,sy-sh*.53,frontage,lerp(.58,.95,r()),(idx+i)%5);
      else if(r()<.50){const hatch=box(g,x,sy-sh*.55,.27,frontage,.07,.56,rough("tin",0x8b8b7e));hatch.rotation.x=.10;}
      if(r()<.35 && bw>3.5){
        const edge=x+(r()<.5?-.32:.32)*bw;
        box(g,edge,.42,.37,.66,.62,.46,rough("wood",0x98896f));
        box(g,edge,.76,.37,.74,.07,.52,rough("wood",0xb09a72));
        if(idx===5||idx===6||idx===7||idx===10||idx===15){
          for(let k=0;k<7;k++)oval(g,edge+(r()-.5)*.48,.84+r()*.03,.36+(r()-.5)*.30,.075,.067,.080,solid(k%2?0xb6a346:0xaa8340));
        }else{
          for(let k=0;k<3;k++)box(g,edge+(k-1)*.16,.86,.37,.135,.16,.20,solid([0xa55041,0xb8a576,0x58847b][k]));
        }
      }
    }
    for(let i=0;i<=bays;i++)box(g,(i/bays-.5)*w,h*.50,.055,.16,h,.21,concrete);
  }
  function flagMaterial(){
    if(materials.has("bdflag"))return materials.get("bdflag");
    const [c,p]=surface(240,144);p.fillStyle="#21674f";p.fillRect(0,0,240,144);p.fillStyle="#d34e46";
    p.beginPath();p.arc(108,72,48,0,TAU);p.fill();
    p.globalAlpha=.10;p.drawImage(pattern("cloth").image,0,0,240,144);
    return finish("bdflag",0xffffff,{map:tex(c,false),side:T.DoubleSide});
  }
  function flag(g,x,y,z){
    tube(g,x,y+1.06,z,.025,2.15,metal(0x797b6a),.75,7);
    if(!geometry.has("flag")){
      const geo=new T.PlaneGeometry(1.42,.85,9,3),p=geo.attributes.position;
      for(let i=0;i<p.count;i++){const u=geo.attributes.uv.getX(i);p.setY(i,p.getY(i)-u*.13);p.setZ(i,Math.sin(u*9)*u*.12);}
      geo.computeVertexNormals();geometry.set("flag",geo);
    }
    mesh(g,geometry.get("flag"),flagMaterial(),x+.72,y+1.70,z);
  }
  function roofTank(g,x,y,z,r) {
    const a=rough("plaster",0x353f3c),b=solid(0x424c47),size=.55+r()*.22;
    box(g,x,y+.11,z,size*1.9,.22,size*1.9,rough("plaster",0xabaa98));
    tube(g,x,y+.85,z,size,1.29,a,.94,18);
    for(const dy of [.29,.52,.86,1.15,1.44])tube(g,x,y+dy,z,size*1.008,.045,b,.99,18);
    tube(g,x,y+1.54,z,size*.93,.19,a,.63,18);tube(g,x,y+1.66,z,size*.36,.07,b,1,12);
    branch(g,[x+size*.70,y+.29,z],[x+size*1.41,y+.29,z],.035,metal(0x80867c));
  }
  function minaret(g,x,y,z,height,rad){
    const ivory=rough("plaster",0xc8bd9b),green=rough("tin",0x5c8980);
    tube(g,x,y+height*.44,z,rad,height*.88,ivory,.74,12);
    for(const f of [.31,.63,.86])tube(g,x,y+height*f,z,rad*(f===.86?1.30:1.02),.13,ivory,1,12);
    tube(g,x,y+height*.95,z,rad*1.13,height*.18,green,.06,16);
    tube(g,x,y+height*1.08,z,.033,height*.12,metal(0xa49465),.26,8);
  }
  function roof(g,w,d,h,r,kind,wallMat,trimMat){
    const slab=rough("plaster",0xa5a291),tin=rough("tin",0x9da4a1);
    box(g,0,h+.045,0,w+.12,.16,d+.12,slab);
    if(/tin|shed|warehouse|godown|workshop/i.test(kind) || h<3.25){
      const pitch=.13,span=d/2+.12;
      for(const k of [-1,1]){const a=box(g,0,h+.16+span*.065,k*(d*.25),w+.31,.08,span,tin);a.rotation.x=k*pitch;}
      return;
    }
    for(const side of [-1,1]){
      box(g,0,h+.24,side*(d/2-.05),w,.38,.12,wallMat);
      box(g,side*(w/2-.055),h+.24,0,.12,.38,d,wallMat);
      box(g,0,h+.44,side*(d/2-.05),w+.05,.085,.19,trimMat);
    }
    if(/mosque|masjid|prayer/i.test(kind)){
      const radius=Math.min(w*.32,d*.34,2.8),m=rough("tin",0x6e9b80);
      if(!geometry.has("dome"))geometry.set("dome",new T.SphereGeometry(1,24,12,0,TAU,0,Math.PI/2));
      tube(g,0,h+.29,0,radius,.57,wallMat,1,20);
      mesh(g,geometry.get("dome"),m,0,h+.55,0,radius,radius*.83,radius);
      tube(g,0,h+.80+radius*.83,0,.05,.48,metal(0xc2a05f),.22,8);
      minaret(g,-w*.38,h,d*.33,3.4,.32);minaret(g,w*.38,h,d*.33,3.4,.32);
      return;
    }
    if(w>3.1&&d>2.9&&r()<.82)roofTank(g,w*(r()<.5?-.28:.28),h+.13,d*(r()-.5)*.53,r);
    if(w>5.6&&d>3.9&&r()<.60){
      const x=-w*.23,z=-d*.22,sw=Math.min(2.8,w*.33),sd=Math.min(2.2,d*.37);
      box(g,x,h+.82,z,sw,1.48,sd,r()<.5?rough("brick",0xc2ad97):wallMat);
      const a=box(g,x,h+1.58,z,sw+.27,.09,sd+.23,tin);a.rotation.x=.055;
      box(g,x+sw*.13,h+.69,z+sd/2+.026,sw*.34,1.14,.041,rough("wood",0x736c55));
    }
    if(w>4&&r()<.40){
      const x=-w*.38,z=d*.23,wire=metal(0x5b5d52);
      tube(g,x,h+1.31,z,.032,2.4,wire,1,6);tube(g,x+w*.52,h+.89,z,.031,1.55,wire,1,6);
      branch(g,[x,h+1.85,z],[x+w*.52,h+1.58,z],.014,wire,1,4);
      for(let i=0;i<3;i++){
        const u=(i+1)/4,cloth=awningFabric((r()*5)|0);
        box(g,x+w*.52*u,h+1.55-u*.29,z,.35+r()*.18,.48+r()*.14,.045,cloth);
      }
    }
    if(w>4&&d>3&&r()<.13)flag(g,w*.30,h+.15,d*.34);
  }
  const storeyHeight=h=>Math.min(h,clamp(h*.28,2.75,3.55));
  function distantFront({w,h,seed,shop}){
    prepare();
    const front=new T.Group(),r=random(seed),base=storeyHeight(h);
    r(); // Match the detailed building's plaster colour draw before selecting the shop.
    if(Object.hasOwn(retailNames,shop))brandedStorefront(front,w,base,retailNames[shop],true);
    else storefront(front,w,base,r,shopInfo(shop,"shop",r),true);
    return front;
  }
  function building(options={}){
    prepare();
    const w=Math.max(.8,Number(options.w)||7),d=Math.max(.8,Number(options.d)||6),h=Math.max(1.4,Number(options.h)||10);
    const kind=String(options.kind||"mixed"),r=random(options.seed),n=new T.Group(),tone=r()*paint.length|0;
    const wall=rough("plaster",paint[tone]),ledge=rough("plaster",trim[tone]);
    const brand=Object.hasOwn(retailNames,options.shop)?retailNames[options.shop]:null;
    const info=brand?null:shopInfo(options.shop,kind,r),base=storeyHeight(h),top=h-base;
    n.name=brand?brand.en:info?(info.custom||shops[info.idx][0]):"Dhaka residence";
    box(n,0,h/2,0,w,h,d,wall);
    const faces=[[0,d/2,0,w],[w/2,0,Math.PI/2,d],[0,-d/2,Math.PI,w],[-w/2,0,-Math.PI/2,d]];
    faces.forEach(([x,z,yaw,span],i)=>{
      const side=sub(n,x,0,z,yaw);
      if(i===0){
        if(brand)brandedStorefront(side,w,base,brand);
        else if(info)storefront(side,w,base,r,info);
        else{
          const bw=Math.min(w*.49,3.75);
          shutter(side,-w*.12,bw,base,r);
          if(w>4)face(side,w*.29,1.59,.049,.48,.65,posterMaterial(),(r()*2)|0,2,1);
        }
      }else{
        box(side,0,.24,.04,span,.48,.095,ledge);
        if(span>3.6 && (i===2||r()<.55))shutter(side,(r()-.5)*span*.34,Math.min(span*.40,2.35),base*.90,r);
        if(i!==2 && span>4 && r()<.54)face(side,span*.24,1.47,.045,.41,.59,posterMaterial(),(r()*2)|0,2,1);
      }
      upperSide(side,span,top,base,r,ledge,i===0,i===2);
    });
    roof(n,w,d,h,r,kind,wall,ledge);
    return n;
  }

  function bench(g,seed) {
    const r=random(seed), boards=rough("wood",r()<.5?0x937955:0x859284), iron=metal(0x4a5953);
    for(const x of [-.76,.76]){
      branch(g,[x,.03,-.27],[x,.48,-.18],.046,iron);
      branch(g,[x,.03,.25],[x,.48,.14],.046,iron);
      box(g,x,.43,-.03,.09,.09,.56,iron);
      branch(g,[x,.43,-.22],[x,.91,-.32],.043,iron);
    }
    for(let i=0;i<3;i++)box(g,0,.51,-.16+i*.165,1.98,.065,.15,boards);
    for(let i=0;i<2;i++){const a=box(g,0,.72+i*.14,-.265-i*.034,1.98,.115,.052,boards);a.rotation.x=-.18;}
  }
  function crate(g,seed,filled=false){
    const boards=rough("wood",seed%2?0xba9a69:0xa38664);
    box(g,0,.045,0,.72,.075,.49,boards);
    for(const x of [-.32,.32])for(const z of [-.215,.215])box(g,x,.21,z,.060,.40,.055,boards);
    for(let i=0;i<3;i++){
      const y=.115+i*.108;for(const z of [-.24,.24])box(g,0,y,z,.74,.080,.034,boards);
      for(const x of [-.36,.36])box(g,x,y,0,.034,.080,.48,boards);
    }
    if(filled)box(g,0,.25,0,.63,.25,.39,rough("cloth",0xab9972));
  }
  function kettle(g,x,y,z,scale){
    const a=sub(g,x,y,z);a.scale.setScalar(scale);
    const tin=metal(0xa9aaa1),black=metal(0x424641);
    if(!geometry.has("kettle")){
      const profile=[[.06,0],[.235,.025],[.27,.10],[.27,.21],[.235,.31],[.16,.34],[.15,.37]];
      geometry.set("kettle",new T.LatheGeometry(profile.map(([u,v])=>new T.Vector2(u,v)),18));
    }
    mesh(a,geometry.get("kettle"),tin,0,0,0);
    tube(a,0,.373,0,.157,.038,tin,.68,14);oval(a,0,.407,0,.045,.030,.045,black);
    branch(a,[.20,.12,.01],[.36,.23,.015],.081,tin,.76,10);
    branch(a,[.36,.23,.015],[.44,.36,.025],.062,tin,.72,10);
    const handle=ring(a,-.032,.39,-.015,.186,.025,black,true);handle.scale.y*=1.22;
  }
  function glass(g,x,y,z,milk=false){
    const amber=solid(milk?0xb88750:0x884c28),rim=metal(0xcec1a7);
    tube(g,x,y+.058,z,.043,.116,amber,1.21,10);
    tube(g,x,y+.127,z,.051,.020,rim,1.04,10);
    tube(g,x,y+.140,z,.045,.005,solid(milk?0xce9f66:0xac6b30),1,10);
  }
  function teaStall(g,r,seed){
    const timber=rough("wood",0xa68b60),plank=rough("wood",0xa58c63),iron=metal(0x525c57);
    const sheet=rough("tin",r()<.5?0x739488:0xa68372);
    box(g,0,.89,-.98,3.58,1.74,.055,sheet);
    for(const x of [-1.77,1.77])for(const z of [-.98,.84])tube(g,x,1.21,z,.048,2.42,timber,.90,8);
    const cap=box(g,0,2.48,-.10,4.06,.095,2.30,rough("tin",0x919a98));cap.rotation.x=.091;
    const fascia=awningFabric(seed%2?1:0);
    box(g,0,2.29,1.00,4.03,.22,.05,fascia);
    face(g,0,2.485,1.025,2.02,.43,signMaterial(),0,4,4);
    box(g,-.1,.49,.18,2.84,.88,.68,sheet);box(g,-.10,.965,.18,3.01,.1,.78,plank);
    for(let i=0;i<4;i++)box(g,-1.30+i*.79,.51,.535,.045,.83,.035,timber);
    for(const x of [-1.24,-.44,.32])box(g,x,1.06,-.74,.051,1.34,.18,timber);
    for(const y of [1.19,1.61])box(g,-.46,y,-.71,1.76,.054,.34,plank);
    const pack=[0xbb974c,0x9b5649,0x819776,0xb9b49b,0x597c87];
    for(let row=0;row<2;row++)for(let i=0;i<8;i++){
      const col=pack[(r()*pack.length)|0];
      if(i%3)box(g,-1.15+i*.207,1.32+row*.42,-.72,.13,.20+r()*.06,.14,solid(col));
      else tube(g,-1.14+i*.207,1.31+row*.42,-.72,.071,.17,metal(col),1,10);
    }
    tube(g,.39,1.12,.19,.205,.20,metal(0x57574c),.92,14);
    tube(g,.39,1.236,.19,.156,.032,solid(0x976742),1,14);
    kettle(g,.39,1.25,.19,1.05);
    for(let i=0;i<5;i++)glass(g,-.76+i*.15,1.02,.39-(i%2)*.13,i%2===0);
    for(const [x,h] of [[-1.33,.33],[-1.08,.27],[-.88,.36]]){
      tube(g,x,1.02+h/2,.053,.105,h,solid(0xc1ac7a),1,12);
      for(let k=0;k<4;k++)tube(g,x,1.05+k*(h-.09)/4,.054,.106,.014,solid(0x977c52),1,12);
      tube(g,x,1.025+h,.053,.115,.032,metal(0x9a9f8e),1,12);
    }
    const seat=sub(g,.04,0,1.02);
    for(const x of [-.82,.82]){
      box(seat,x,.225,0,.09,.45,.17,timber);
      box(seat,x,.39,0,.12,.08,.38,timber);
    }
    for(const z of [-.095,.095])box(seat,0,.47,z,2.20,.075,.178,plank);
    const storage=sub(g,1.42,0,-.36);storage.rotation.y=-.07;crate(storage,seed,true);
    const teaCan=tube(g,1.27,.66,-.33,.155,.49,metal(0x919b92),1,12);teaCan.rotation.z=.013;
    tube(g,1.27,.93,-.33,.155,.055,iron,.86,12);
    g.userData.steamPoint=[.39,1.69,.19];
  }
  function banana(g,x,y,z,yaw,m){
    if(!geometry.has("banana")){
      const path=new T.QuadraticBezierCurve3(new T.Vector3(-.13,.055,0),new T.Vector3(.012,-.115,.025),new T.Vector3(.14,.095,0));
      geometry.set("banana",new T.TubeGeometry(path,7,.032,5,false));
    }
    const fruit=mesh(g,geometry.get("banana"),m,x,y,z);fruit.rotation.y=yaw;
  }
  function marketStall(g,r,seed){
    const bamboo=rough("wood",0xb69662),pale=rough("wood",0xc2a679),rust=metal(0x655f4c);
    const colors=[0xefb44b,0xc86844,0x8aa449,0x8f664f];
    for(const x of [-1.36,1.36])for(const z of [-.75,.75])tube(g,x,1.23,z,.044,2.46,bamboo,.83,7);
    for(const x of [-1.3,1.24]){
      const wheel=ring(g,x,.35,.51,.32,.045,metal(0x444a42),true);
      for(let i=0;i<4;i++){
        const angle=i*Math.PI/4,dx=Math.cos(angle)*.29,dy=Math.sin(angle)*.29;
        branch(g,[x-dx,.35-dy,.51],[x+dx,.35+dy,.51],.012,rust,1,5);
      }
      if(wheel)box(g,x,.46,-.50,.095,.91,.095,bamboo);
    }
    box(g,0,.69,0,3.18,.25,1.16,rough("wood",0x9a805b));box(g,0,.855,0,3.31,.084,1.32,pale);
    const canopy=awningFabric(seed%2?2:1),cloth=box(g,0,2.50,-.06,3.85,.65*.1,2.12,canopy);cloth.rotation.x=.071;
    box(g,0,2.33,.99,3.85,.18,.035,canopy);
    face(g,.04,2.48,1.017,1.87,.36,signMaterial(),5,4,4);
    for(let i=0;i<4;i++){
      const bx=(i-1.5)*.78;
      box(g,bx,.94,.012,.75,.11,1.09,rough("wood",0x998668));
      for(const edge of [-1,1])box(g,bx+edge*.371,1.003,.012,.033,.20,1.10,pale);
      for(const edge of [-1,1])box(g,bx,1.003,.012+edge*.54,.75,.20,.038,pale);
      const fruit=solid(colors[i]);
      for(let j=0;j<12;j++){
        const x=bx+(j%3-1)*.19+(r()-.5)*.09,z=(Math.floor(j/3)-1.5)*.205+(r()-.5)*.09;
        const y=1.075+r()*.08;
        if(i===0&&j%3===1)banana(g,x,y+.075,z,r()*TAU,fruit);
        else{
          const a=oval(g,x,y,z,.081+r()*.044,i===2?.079:.09+r()*.038,i===3?.13:.09+r()*.035,fruit);
          a.rotation.x=r()*.8;a.rotation.y=r()*TAU;
        }
      }
    }
    const bag=rough("cloth",0xb3a279);
    oval(g,-1.53,.23,-.62,.28,.27,.30,bag);oval(g,1.53,.23,-.71,.24,.27,.28,bag);
    tube(g,-1.53,.48,-.62,.07,.10,bag,.6,9);
  }
  function pole(g,r,seed){
    const concrete=rough("plaster",0xa7a492),dark=metal(0x555b54),ceramic=metal(0x83968a),wire=metal(0x3f463f);
    tube(g,0,3.075,0,.145,6.15,concrete,.60,10);
    tube(g,0,.21,0,.15,.42,rough("plaster",0x8b7462),.99,10);
    for(const y of [.57,.76])tube(g,0,y,0,.143,.076,rough("plaster",0xa4725a),.98,10);
    box(g,0,5.83,0,1.93,.12,.105,dark);box(g,0,5.32,-.03,1.37,.085,.096,dark);
    for(const x of [-.78,-.35,.35,.78]){
      tube(g,x,5.94,0,.042,.21,dark,1,7);
      for(const y of [5.96,6.02])tube(g,x,y,0,.092,.04,ceramic,.79,9);
    }
    branch(g,[-.73,5.81,0],[0,5.37,0],.024,dark);
    branch(g,[.73,5.81,0],[0,5.37,0],.024,dark);
    const loop=ring(g,.18,4.33,.075,.245,.024,wire,true);loop.scale.y*=1.46;
    branch(g,[.12,4.7,.03],[.14,1.86,.07],.023,wire,1,5);
    for(let i=0;i<3;i++)face(g,(i%2-.5)*.025,1.26+.34*i,.144,.194,.28,posterMaterial(),(i+seed)%2,2,1);
    if(r()<.35){
      box(g,-.32,4.12,0,.70,.12,.51,dark);
      tube(g,-.49,4.54,0,.25,.74,rough("tin",0x86968b),1,14);
      tube(g,-.49,4.97,0,.269,.10,metal(0x788979),.90,14);
      for(const dx of [-.10,.11]){tube(g,-.49+dx,5.085,0,.052,.17,ceramic,.73,9);branch(g,[-.49+dx,5.16,0],[dx,5.33,-.03],.017,wire,1,5);}
    }
    g.userData.cableAnchor=[0,5.95,0];
  }
  function warningPaint(){
    if(materials.has("hazard"))return materials.get("hazard");
    const [c,p]=surface(256,64);
    p.fillStyle="#cda456";p.fillRect(0,0,256,64);p.fillStyle="#4d5149";
    for(let x=-74;x<300;x+=62){p.beginPath();p.moveTo(x,64);p.lineTo(x+28,64);p.lineTo(x+65,0);p.lineTo(x+37,0);p.fill();}
    p.globalAlpha=.27;p.drawImage(pattern("plaster").image,0,0,256,64);
    return finish("hazard",0xfff6db,{map:tex(c,false)});
  }
  function barrier(g){
    const stone=rough("plaster",0xb3ac94);
    box(g,0,.145,0,1.75,.29,.57,stone);box(g,0,.44,0,1.68,.36,.39,stone);
    box(g,0,.675,0,1.59,.13,.28,stone);
    for(const s of [-1,1]){
      const f=face(g,0,.455,s*.198,1.60,.267,warningPaint());if(s<0)f.rotation.y=Math.PI;
    }
    const h=ring(g,0,.753,0,.075,.014,metal(0x62665b),true);h.scale.y*=.8;
  }
  function foliage(){
    if(materials.has("leaves"))return materials.get("leaves");
    const [c,p]=surface(384,320),r=random(579),clusters=[];
    for(let i=0;i<16;i++){
      const a=i*2.40,rad=Math.sqrt(i/15);
      clusters.push([191+Math.cos(a)*rad*110,162+Math.sin(a)*rad*79,44+r()*28,33+r()*24]);
    }
    p.lineCap="round";
    for(const [x,y] of clusters){
      p.beginPath();p.moveTo(181,252);p.quadraticCurveTo(181+(x-181)*.35,178+(y-178)*.16,x,y);
      p.strokeStyle="#5b5a40";p.lineWidth=1+r()*2;p.stroke();
    }
    const colors=["#344e35","#48613d","#526a42","#647d4c","#799052","#879a5c","#93a265","#a4ac6b"];
    clusters.sort((a,b)=>b[1]-a[1]);
    for(const [x,y,rx,ry] of clusters)for(let i=0;i<93;i++){
      const a=r()*TAU,k=Math.sqrt(r()),px=x+Math.cos(a)*rx*k,py=y+Math.sin(a)*ry*k;
      const light=clamp(3.7-(py-y)/ry*1.8-(px-x)/rx*.7+(r()-.5)*3.7,0,7)|0;
      const len=2.8+r()*6.2,w=1.45+r()*2.9,turn=r()*TAU;
      p.save();p.translate(px,py);p.rotate(turn);p.fillStyle=colors[light];p.beginPath();
      p.moveTo(-len,0);p.quadraticCurveTo(-len*.1,-w*1.33,len,w*.08);p.quadraticCurveTo(0,w*1.36,-len,0);p.fill();p.restore();
    }
    return finish("leaves",0xffffea,{map:tex(c,false),alphaTest:.36,side:T.DoubleSide,roughness:1,emissive:0x10170c});
  }
  function tree(g,r){
    const bark=rough("bark",0x8b7d69),leaves=foliage(),angle=r()*TAU;
    const foot=[0,.04,0],knee=[.11,1.34,-.055],fork=[-.03,2.63,.09];
    branch(g,foot,knee,.224,bark,.79,10);branch(g,knee,fork,.184,bark,.78,10);
    for(let i=0;i<5;i++){
      const a=angle+i*TAU/5,dx=Math.cos(a),dz=Math.sin(a);
      branch(g,[dx*.44,.035,dz*.44],[0,.55,0],.064,bark,1.72,7);
    }
    for(let i=0;i<8;i++){
      const a=angle+i*2.399,dir=[Math.cos(a),Math.sin(a)],out=.82+r()*.64,high=3.15+r()*.8;
      const start=[fork[0],1.95+(i%3)*.27,fork[2]],middle=[dir[0]*out*.47,high-.57,dir[1]*out*.50],end=[dir[0]*out,high,dir[1]*out];
      branch(g,start,middle,.104,bark,.7,7);branch(g,middle,end,.075,bark,.5,7);
      for(let q=0;q<3;q++){
        const x=end[0]+(r()-.5)*.73,y=end[1]+.25+r()*.51,z=end[2]+(r()-.5)*.72,s=.84+r()*.48;
        branch(g,end,[x,y,z],.041,bark,.42,5);
        for(let k=0;k<2;k++){
          const f=face(g,x,y,z,1.52*s,1.21*s,leaves);
          f.rotation.y=a+k*Math.PI/2;f.rotation.x=(r()-.5)*.58;f.rotation.z=(r()-.5)*.47;
        }
      }
    }
    for(let i=0;i<4;i++){
      const f=face(g,(r()-.5)*.73,4.60+r()*.35,(r()-.5)*.75,1.63,1.27,leaves);
      f.rotation.y=i*1.65;f.rotation.x=-.16;
    }
  }
  function bollard(g,seed){
    const base=rough("plaster",0xaca594),body=metal(seed%2?0x777663:0x797669);
    tube(g,0,.045,0,.165,.09,base,1,10);tube(g,0,.395,0,.119,.61,body,.90,12);
    for(const y of [.48,.64])tube(g,0,y,0,.115,.077,solid(0xb8a461),1,12);
    tube(g,0,.722,0,.128,.074,body,.80,12);
  }
  function prop(type,seed=0) {
    prepare();seed=numberSeed(seed)>>>0;
    const g=new T.Group(),r=random(seed);g.name=String(type);
    switch(type){
      case "tea": teaStall(g,r,seed);break;
      case "market": marketStall(g,r,seed);break;
      case "pole": pole(g,r,seed);break;
      case "bench": bench(g,seed);break;
      case "barrier": barrier(g);break;
      case "tree": tree(g,r);break;
      case "crate": crate(g,seed,seed%3===0);break;
      case "bollard": bollard(g,seed);break;
    }
    return g;
  }

  window.C72District=Object.freeze({building,distantFront,prop,retailNames});
})();
