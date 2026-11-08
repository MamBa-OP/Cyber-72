/* Dhaka traffic for Cyber 72. Vehicle space is in metres, with +Z forward. */
(() => {
  "use strict";
  const PI = Math.PI;
  const steel = 0x899792, rubber = 0x292c2d, dark = 0x242d32, brass = 0xe5b251;
  const palettes = [
    { body: "#ddd1a2", blue: "#137b8b", red: "#b43d30", cloth: "#be392d" },
    { body: "#c6cda8", blue: "#235f55", red: "#bc502c", cloth: "#25845f" },
    { body: "#d4c9b3", blue: "#365b89", red: "#af394d", cloth: "#b64065" }
  ];
  const areas = {
    busSide: [0, 0, 1024, 128], route: [0, 128, 512, 64], rearRoute: [512, 128, 256, 64],
    cloth: [0, 192, 512, 128], landscape: [512, 192, 256, 128], cng: [768, 192, 256, 128],
    plate: [0, 320, 256, 64], lungi: [256, 320, 256, 64], parcel: [0, 384, 1024, 128]
  };
  let T, boxUnit, sphereUnit, cylinderUnit, matrix, normalMatrix;
  const materials = new Map(), rings = new Map(), colors = new Map();
  const paints = [0x23845d, 0x277554, 0x32855d], shirts = [0xb1c8b3, 0xb6ccd3, 0xe6d7b5, 0xc78969];
  const skinTones = [0xb7835c, 0xa16e4b, 0xbd8c63, 0x916345];

  function init() {
    if (T) return;
    T = window.THREE;
    if (!T) throw new Error("Load Three.js before creating traffic.");
    boxUnit = new T.BoxGeometry(1, 1, 1);
    sphereUnit = new T.SphereGeometry(1, 12, 8);
    cylinderUnit = new T.CylinderGeometry(1, 1, 1, 10);
    matrix = new T.Matrix4();
    normalMatrix = new T.Matrix3();
    materials.set("solid", new T.MeshStandardMaterial({ vertexColors: true, roughness: .74, metalness: .095, side: T.DoubleSide }));
    materials.set("glass", new T.MeshStandardMaterial({ vertexColors: true, roughness: .23, metalness: .08, side: T.DoubleSide, transparent: true, opacity: .39, depthWrite: false }));
  }
  function random(seed) {
    let state = (seed >>> 0) || 173;
    return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
  }
  function ink(hex) {
    if (!colors.has(hex)) colors.set(hex, new T.Color(hex));
    return colors.get(hex);
  }

  // Hand-painted panels, woven hood cloth, fictional route boards and road grime.
  // They occupy a single atlas per livery so every painted panel is one draw call.
  function atlas(index) {
    const key = "livery" + index;
    if (materials.has(key)) return key;
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d"), palette = palettes[index], rng = random(2087 + index);
    ctx.fillStyle = "#655b49";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    function region(slot, draw) {
      const [x,y,w,h] = areas[slot];
      ctx.save(); ctx.translate(x, y); ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();
      draw(w,h); ctx.restore();
    }
    function fill(color, w, h) { ctx.fillStyle = color; ctx.fillRect(0,0,w,h); }
    function text(str, x, y, size, maxWidth, color) {
      ctx.font = "bold " + size + "px 'Nirmala UI','Noto Sans Bengali',sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = color;
      ctx.fillText(str, x, y, maxWidth);
    }
    function dust(w,h,count) {
      const grime = ctx.createLinearGradient(0, 0, 0, h);
      grime.addColorStop(0, "rgba(77,61,40,.025)"); grime.addColorStop(.52, "rgba(122,107,77,.035)");
      grime.addColorStop(1, "rgba(103,83,53,.4)");
      ctx.fillStyle=grime;ctx.fillRect(0,0,w,h);
      for(let i=0;i<count;i++) {
        ctx.fillStyle = i%4 ? "rgba(58,55,45,.15)" : "rgba(245,235,189,.23)";
        ctx.fillRect(rng()*w, rng()*h, 1+rng()*3, 1+rng()*2);
      }
    }
    function flower(cx,cy,r) {
      ctx.fillStyle="#f2b44c";
      for(let j=0;j<6;j++) {
        const a=j*PI/3;
        ctx.beginPath();ctx.ellipse(cx+Math.cos(a)*r*.55,cy+Math.sin(a)*r*.55,r*.42,r*.23,a,0,2*PI);ctx.fill();
      }
      ctx.fillStyle="#f2e6a9";ctx.beginPath();ctx.arc(cx,cy,r*.22,0,PI*2);ctx.fill();
    }
    region("busSide",(w,h)=>{
      fill(palette.body,w,h);
      ctx.fillStyle=palette.blue;ctx.beginPath();ctx.moveTo(0,74);ctx.bezierCurveTo(284,71,345,119,570,65);
      ctx.bezierCurveTo(685,40,864,38,w,45);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.fill();
      ctx.strokeStyle=palette.red;ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(-5,59);ctx.bezierCurveTo(260,55,371,99,539,57);ctx.bezierCurveTo(697,13,873,29,w,23);ctx.stroke();
      text(["ঢাকা পরিবহন","নগর যাত্রী","বংশাল পরিবহন"][index],440,24,37,295,"#243b40");
      for(let x=53;x<w;x+=132) {
        ctx.fillStyle="rgba(47,51,41,.27)";ctx.fillRect(x,69,1,59);
        for(const y of [72,115]) {ctx.fillStyle="#645e50";ctx.fillRect(x+4,y,2,2);}
      }
      dust(w,h,1750);
    });
    region("route",(w,h)=>{
      fill("#1f4241",w,h);ctx.strokeStyle="#e9b747";ctx.lineWidth=3;ctx.strokeRect(4,4,w-8,h-8);
      text(["ইসলামপুর  •  গুলিস্তান","মতিঝিল  •  ইসলামপুর","গুলিস্তান  •  চকবাজার"][index],w/2,h/2,40,w-28,"#f9ebb5");dust(w,h,280);
    });
    region("rearRoute",(w,h)=>{fill("#973e32",w,h);text("নগর পরিবহন",w/2,h/2,38,w-18,"#ffedba");dust(w,h,170);});
    region("cloth",(w,h)=>{
      fill(palette.cloth,w,h);
      for(let x=-40;x<w+40;x+=48)for(let y=-25;y<h+32;y+=42) {
        const dx=x+((Math.round((y+25)/42)%2)*24);
        ctx.strokeStyle="#e5b55b";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(dx,y-17);ctx.lineTo(dx+20,y);ctx.lineTo(dx,y+17);ctx.lineTo(dx-20,y);ctx.closePath();ctx.stroke();
        flower(dx,y,10);
      }
      for(let y=2;y<h;y+=9){ctx.fillStyle="rgba(250,221,160,.1)";ctx.fillRect(0,y,w,1);}
      ctx.strokeStyle="#edc272";ctx.lineWidth=4;ctx.strokeRect(2,2,w-4,h-4);
    });
    region("landscape",(w,h)=>{
      fill("#d79b4e",w,h);const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,"#f89d62");sky.addColorStop(.67,"#f6d87b");sky.addColorStop(.68,"#327b86");sky.addColorStop(1,"#246575");ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
      ctx.fillStyle="#fff2a5";ctx.beginPath();ctx.arc(149,45,19,0,PI*2);ctx.fill();
      for(let x=0;x<w;x+=10){const top=69+Math.sin(x*.07)*5+rng()*7;ctx.fillStyle="#446c60";ctx.fillRect(x,top,11,88-top);}
      ctx.fillStyle="#f7e3b8";ctx.beginPath();ctx.moveTo(69,97);ctx.lineTo(72,57);ctx.lineTo(96,97);ctx.fill();
      ctx.fillStyle="#593c36";ctx.beginPath();ctx.moveTo(45,93);ctx.quadraticCurveTo(71,107,104,92);ctx.quadraticCurveTo(83,119,55,103);ctx.fill();
      ctx.lineWidth=5;ctx.strokeStyle="#344d41";ctx.beginPath();ctx.moveTo(212,84);ctx.quadraticCurveTo(210,54,201,38);ctx.stroke();
      for(let i=0;i<6;i++){ctx.strokeStyle=i%2?"#365b45":"#4d6e43";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(201,38);ctx.quadraticCurveTo(173+i*10,17+(i%3)*4,172+i*12,42+(i%2)*9);ctx.stroke();}
      ctx.strokeStyle="#eec65f";ctx.lineWidth=6;ctx.strokeRect(3,3,w-6,h-6);
      ctx.strokeStyle="#b83836";ctx.lineWidth=3;ctx.strokeRect(8,8,w-16,h-16);
    });
    region("cng",(w,h)=>{
      fill("#2d8159",w,h);ctx.strokeStyle="#dfc674";ctx.lineWidth=3;ctx.strokeRect(6,5,w-12,h-10);
      text("ঢাকা মহানগর",w/2,45,37,w-28,"#f6ead1");text("সি এন জি",w/2,92,24,w-35,"#edce7d");dust(w,h,195);
    });
    region("plate",(w,h)=>{
      fill("#d6dfbd",w,h);ctx.strokeStyle="#435043";ctx.lineWidth=3;ctx.strokeRect(3,3,w-6,h-6);
      text("ঢাকা মেট্রো",w/2,17,23,w-18,"#233b38");text(["১১-৭২০৪","১৬-৭২০৮","১৮-৭২০২"][index],w/2,46,26,w-18,"#233b38");
    });
    region("lungi",(w,h)=>{fill("#697d72",w,h);for(let x=0;x<w;x+=19){ctx.fillStyle="rgba(38,52,49,.52)";ctx.fillRect(x,0,5,h);ctx.fillStyle="#adc2ab";ctx.fillRect(x+7,0,1,h);}for(let y=0;y<h;y+=14){ctx.fillStyle="rgba(29,45,43,.43)";ctx.fillRect(0,y,w,3);ctx.fillStyle="#bdc9ac";ctx.fillRect(0,y+5,w,1);}});
    region("parcel",(w,h)=>{
      fill("#68868b",w,h);for(let x=0;x<w;x+=23){ctx.fillStyle="#526f74";ctx.fillRect(x+2,0,5,h);ctx.fillStyle="#92a4a0";ctx.fillRect(x+9,0,3,h);}
      ctx.fillStyle="#dcc98c";ctx.fillRect(w*.23,22,w*.54,78);
      text("নবাবপুর পণ্য পরিবহন",w/2,62,47,w*.49,"#304c53");dust(w,h,1300);
    });
    const map = new T.CanvasTexture(canvas); map.colorSpace=T.SRGBColorSpace;map.anisotropy=2;
    materials.set(key,new T.MeshStandardMaterial({map,vertexColors:true,roughness:.78,metalness:.035,side:T.DoubleSide}));
    return key;
  }

  // Accumulate indexed triangles while modelling. Each rigid part emits at most one
  // mesh per material, including all its differently coloured rods, bolts and people.
  class Parts {
    constructor(root, livery) { this.root=root;this.livery=livery;this.buffers=new Map(); }
    buffer(material) {
      if(!this.buffers.has(material))this.buffers.set(material,{p:[],n:[],c:[],u:[],f:[],i:[]});
      return this.buffers.get(material);
    }
    mesh(geometry,color,position,scale,rotation=null,material="solid") {
      const quaternion=rotation instanceof T.Quaternion ? rotation : new T.Quaternion();
      if(Array.isArray(rotation))quaternion.setFromEuler(new T.Euler(...rotation));
      matrix.compose(new T.Vector3(...position),quaternion,new T.Vector3(...scale));
      normalMatrix.getNormalMatrix(matrix);
      const m=matrix.elements,nm=normalMatrix.elements,g=geometry.attributes,buf=this.buffer(material),offset=buf.p.length/3,tint=ink(color);
      for(let i=0;i<g.position.count;i++){
        const x=g.position.getX(i),y=g.position.getY(i),z=g.position.getZ(i);
        buf.p.push(m[0]*x+m[4]*y+m[8]*z+m[12],m[1]*x+m[5]*y+m[9]*z+m[13],m[2]*x+m[6]*y+m[10]*z+m[14]);
        const nx=g.normal.getX(i),ny=g.normal.getY(i),nz=g.normal.getZ(i);
        const a=nm[0]*nx+nm[3]*ny+nm[6]*nz,b=nm[1]*nx+nm[4]*ny+nm[7]*nz,c=nm[2]*nx+nm[5]*ny+nm[8]*nz;
        const len=Math.hypot(a,b,c)||1;buf.n.push(a/len,b/len,c/len);buf.c.push(tint.r*(g.color?g.color.getX(i):1),tint.g*(g.color?g.color.getY(i):1),tint.b*(g.color?g.color.getZ(i):1));
        buf.u.push(g.uv?g.uv.getX(i):0,g.uv?g.uv.getY(i):0);
        buf.f.push(g.faceCoord?g.faceCoord.getX(i):0,g.faceCoord?g.faceCoord.getY(i):0,g.faceCoord?g.faceCoord.getZ(i):0);
      }
      if(geometry.index){for(const i of geometry.index.array)buf.i.push(offset+i);}
      else for(let i=0;i<g.position.count;i++)buf.i.push(offset+i);
    }
    box(x,y,z,w,h,d,color,rot=null) {this.mesh(boxUnit,color,[x,y,z],[w,h,d],rot);}
    round(x,y,z,w,h,d,color,rot=null) {this.mesh(sphereUnit,color,[x,y,z],[w/2,h/2,d/2],rot);}
    rod(a,b,r,color) {
      const delta=new T.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]);const len=delta.length();
      if(len<.00001)return;
      const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.multiplyScalar(1/len));
      this.mesh(cylinderUnit,color,[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2],[r,len,r],q);
    }
    rail(points,r,color) {for(let i=1;i<points.length;i++)this.rod(points[i-1],points[i],r,color);}
    torus(x,y,z,outer,tube,color,width=1) {
      const major=outer-tube,ratio=tube/major,key=ratio.toFixed(3);
      if(!rings.has(key))rings.set(key,new T.TorusGeometry(1,ratio,7,28));
      this.mesh(rings.get(key),color,[x,y,z],[major,major,major*width],[0,PI/2,0]);
    }
    polygon(points,color,material="solid",uv=null) {
      const buf=this.buffer(material),start=buf.p.length/3,tint=ink(color);
      const A=new T.Vector3(...points[0]),B=new T.Vector3(...points[1]).sub(A),C=new T.Vector3(...points[2]).sub(A);
      const norm=B.cross(C).normalize();
      points.forEach((v,i)=>{buf.p.push(...v);buf.n.push(norm.x,norm.y,norm.z);buf.c.push(tint.r,tint.g,tint.b);buf.u.push(...(uv?uv[i]:[0,0]));buf.f.push(0,0,0);});
      for(let i=1;i<points.length-1;i++)buf.i.push(start,start+i,start+i+1);
    }
    art(points,slot,coordinates=[[0,0],[1,0],[1,1],[0,1]]) {
      const [x,y,w,h]=areas[slot];
      const uv=coordinates.map(([u,v])=>[(x+1+u*(w-2))/1024,1-(y+1+(1-v)*(h-2))/512]);
      this.polygon(points,0xffffff,this.livery,uv);
    }
    finish() {
      for(const [key,b] of this.buffers){
        const geom=new T.BufferGeometry();
        geom.setAttribute("position",new T.Float32BufferAttribute(b.p,3));geom.setAttribute("normal",new T.Float32BufferAttribute(b.n,3));
        geom.setAttribute("color",new T.Float32BufferAttribute(b.c,3));geom.setAttribute("uv",new T.Float32BufferAttribute(b.u,2));geom.setIndex(b.i);
        geom.setAttribute("faceCoord",new T.Float32BufferAttribute(b.f,3));
        geom.computeBoundingSphere();
        const mesh=new T.Mesh(geom,materials.get(key));mesh.castShadow=key!=="glass";mesh.receiveShadow=true;this.root.add(mesh);
      }
      this.buffers.clear();
    }
  }
  function sideArt(body,x,z0,z1,y0,y1,slot) {
    const a=x>0?z1:z0,b=x>0?z0:z1;
    body.art([[x,y0,a],[x,y0,b],[x,y1,b],[x,y1,a]],slot);
  }
  function endArt(body,z,x0,x1,y0,y1,slot,back=false) {
    const a=back?x1:x0,b=back?x0:x1;
    body.art([[a,y0,z],[b,y0,z],[b,y1,z],[a,y1,z]],slot);
  }
  function child(root,x,y,z) {const group=new T.Group();group.position.set(x,y,z);root.add(group);return group;}
  function axles(root,livery,z,y,xPositions,radius,spoked) {
    const group=child(root,0,y,z),b=new Parts(group,livery);
    for(const x of xPositions) {
      const tube=radius*(spoked?.082:.176);
      b.torus(x,0,0,radius,tube,rubber,spoked?1.06:1.42);
      b.torus(x,0,0,radius-1.55*tube,spoked?.011:.019,spoked?steel:0x9a9b86);
      b.rod([x-tube,0,0],[x+tube,0,0],radius*(spoked?.11:.54),spoked?steel:0x626863);
      const face=x+(x<0?-1:1)*tube*1.03;
      if(spoked) {
        for(let i=0;i<12;i++){
          const a=i*PI/6, rim=radius-tube*1.68;
          const from=[x+((i%2)*2-1)*.019,Math.cos(a+.8)*.03,Math.sin(a+.8)*.03];
          b.rod(from,[x,Math.cos(a)*rim,Math.sin(a)*rim],.0053,0x9ea59a);
        }
      } else {
        b.torus(face,0,0,radius*.49,.014,0x93978c,.82);
        b.rod([face-.012,0,0],[face+.012,0,0],radius*.245,0x71766c);
        for(let i=0;i<6;i++){const a=PI*i/3; b.box(face,radius*.345*Math.cos(a),radius*.345*Math.sin(a),.02,.03,.03,0x343a39);}
      }
    }
    b.finish();return {group,radius};
  }
  function seat(b,x,y,z,w,shade=0x654b3b) {
    b.round(x,y,z,w,.13,.43,shade);b.round(x,y+.21,z-.18,w,.48,.125,shade,[-.09,0,0]);
  }
  function person(b,x,hipY,z,seed,options={}) {
    const skin=skinTones[seed%skinTones.length],shirt=options.shirt||shirts[seed%shirts.length];
    const cap=options.cap,lean=options.lean||0,shz=z+lean*.27;
    b.round(x,hipY+.225,z+lean*.14,.325,.48,.215,shirt,[lean,0,0]);
    b.rod([x,hipY+.418,shz],[x,hipY+.508,shz+.012],.058,skin);
    const face=C72People.seatedHead(seed,skin);materials.set("people",face.material);
    b.mesh(face.geometry,0xffffff,[x,hipY+.435,shz],[1,1,1],null,"people");
    if(cap)b.round(x,hipY+.723,shz,.159,.045,.149,0xe3e0cb);
    for(const sx of [-1,1]){
      const elbow=[x+sx*.204,hipY+.189,shz+.036], hand=options.hands?options.hands[sx<0?0:1]:[x+sx*.143,hipY+.09,z+.23];
      b.rod([x+sx*.13,hipY+.365,shz],elbow,.051,shirt);b.round(...elbow,.087,.087,.082,skin);
      b.rod(elbow,hand,.034,skin);b.round(...hand,.06,.057,.083,skin);
      if(!options.pedal){
        const knee=[x+sx*.108,hipY-.035,z+.29],foot=[x+sx*.11,hipY-.34,z+.28];
        b.rod([x+sx*.094,hipY,z],knee,.073,0x50594f);b.rod(knee,foot,.056,0x50594f);b.round(foot[0],foot[1],foot[2]+.04,.11,.072,.191,0x333435);
      }
    }
  }
  function mudguard(b,x,z,height,radius,width,color,from=-1.36,to=1.36) {
    for(let j=0;j<10;j++){
      const a=from+(to-from)*j/10, d=from+(to-from)*(j+1)/10;
      const v=(side,theta)=>[x+side*width/2,height+Math.cos(theta)*radius,z+Math.sin(theta)*radius];
      b.polygon([v(-1,a),v(1,a),v(1,d),v(-1,d)],color);
    }
  }
  function modelBus(b,root,livery,seed,idx) {
    const main=palettes[idx].body, trim=palettes[idx].blue;
    const wheels=[axles(root,livery,-2.53,.48,[-1.045,1.045],.48,false),axles(root,livery,2.60,.48,[-1.045,1.045],.48,false)];
    b.box(0,.53,0,1.79,.23,7.71,0x353c39);b.box(0,1.05,0,2.13,.18,7.93,0x4a4d42);
    // Lower side sheets stop over both wheel wells.
    const wells=[-2.53,2.60];
    for(const sign of [-1,1]) {
      const x=sign*1.105;
      // Make the continuous panel with UVs assigned as if the entire side was painted once.
      const stations=[[-4.04,.59]];
      for(const wz of wells){
        stations.push([wz-.57,.59]);
        for(let n=0;n<=10;n++){const theta=PI*(1-n/10);stations.push([wz+.57*Math.cos(theta),.59+.47*Math.sin(theta)]);}
      }
      stations.push([4.02,.59]);
      for(let j=1;j<stations.length;j++) {
        const [za,ya]=stations[j-1],[zb,yb]=stations[j];if(zb-za<.0001)continue;
        const u=k=>sign>0?(4.02-k)/8.06:(k+4.04)/8.06;
        b.art([[x,ya,za],[x,yb,zb],[x,1.68,zb],[x,1.68,za]],"busSide",[[u(za),(ya-.59)/1.09],[u(zb),(yb-.59)/1.09],[u(zb),1],[u(za),1]]);
      }
      for(const wz of wells)mudguard(b,x-sign*.064,wz,.52,.572,.161,0x474e44);
      b.box(x,1.66,-.02,.078,.064,8.04,0x354f51); b.box(x,2.60,-.12,.075,.104,7.83,main);
      const gaps=7,step=7.64/gaps;
      for(let j=0;j<=gaps;j++){
        const zz=-3.92+j*step;b.box(x,2.118,zz,.074,.91,.074,0x3d4749);
        if(j===gaps)continue;
        b.polygon([[x,1.72,zz+.04],[x,1.72,zz+step-.04],[x,2.53,zz+step-.04],[x,2.53,zz+.04]],0x83a3a2,"glass");
        b.box(x+sign*.008,2.31,zz+step*.5,.035,.023,step-.055,0x687772);
        b.box(x+sign*.007,2.42,zz+step*.49,.029,.22,.023,0x7c8880);
      }
      for(let n=0;n<4;n++){const zz=-3.13+n*1.42;seat(b,sign*.712,1.39,zz,.56,0x4c6764);if((seed+n+(sign>0?1:0))%4!==0)person(b,sign*.715,1.44,zz,seed+n+(sign>0?3:0),{shirt:[0xcb9762,0x8d6978,0x99ad91,0xafb6a5][n]});}
      // Dusty pressed-metal roof gutter and the corner pillars.
      b.rod([x,2.70,-3.96],[x,2.68,3.72],.029,steel);
      b.rail([[x,1.65,3.98],[x,2.55,3.74],[x*.91,2.75,3.58]],.055,main);
      b.rail([[x,1.65,-4.01],[x,2.58,-3.93],[x*.9,2.77,-3.82]],.063,main);
    }
    b.box(0,2.18,-3.965,2.16,.94,.083,main);
    b.box(0,2.15,-4.011,1.73,.62,.026,0x364646);b.box(0,2.13,-4.034,.04,.61,.036,steel);
    b.box(0,1.105,-4.03,2.18,1.05,.18,main);endArt(b,-4.124,-.58,.58,1.13,1.42,"rearRoute",true);
    endArt(b,-4.126,-.29,.29,.7,.852,"plate",true);
    for(const s of [-1,1]){
      b.box(s*.92,.93,-4.135,.15,.37,.052,0x4b3b35);b.box(s*.92,1.015,-4.165,.1,.14,.025,0xaa4338);b.box(s*.92,.87,-4.164,.10,.079,.026,0xdb9e41);
    }
    for(let n=0;n<6;n++)b.box(-.59,.86+n*.051,-4.137,.37,.021,.021,0x4b5149);
    b.box(0,.599,-4.14,2.23,.14,.14,0x585f57);
    // Shallow curved ferry-bus roof; convex frame stations under the white paint.
    for(let n=0;n<8;n++){
      const a=-PI/2+PI*n/8,d=-PI/2+PI*(n+1)/8;
      const v=(theta,z)=>[1.13*Math.sin(theta),2.635+.248*Math.cos(theta),z];
      b.polygon([v(a,-3.98),v(d,-3.98),v(d,3.70),v(a,3.70)],0xc4c8b7);
    }
    b.box(0,2.85,-1.50,1.27,.12,.98,0x909c90);
    for(let n=0;n<5;n++)b.box(-.45+n*.225,2.917,-1.49,.098,.025,.62,0x64736d);
    b.box(0,1.13,3.973,2.19,1.08,.178,main);b.box(0,1.12,4.071,1.22,.47,.032,0x384344);
    for(let n=0;n<5;n++)b.box(0,.960+n*.074,4.096,1.15,.022,.019,steel);
    b.box(0,.644,4.106,2.24,.16,.131,0x63716a);endArt(b,4.182,-.273,.273,.661,.809,"plate");
    for(const s of [-1,1]){
      b.box(s*.873,1.10,4.086,.35,.305,.044,0x555c57);
      b.round(s*.84,1.11,4.122,.194,.189,.058,0xe7ddbb);b.box(s*1.001,1.116,4.124,.061,.155,.038,0xe9a339);
      b.polygon([[s*.024,1.705,4.025],[s*1.04,1.705,4.025],[s*1.04,2.52,3.805],[s*.024,2.52,3.805]],0x89a5a0,"glass");
      b.rod([s*.76,1.78,4.026],[s*.51,1.948,3.984],.012,0x323739);
      b.rail([[s*1.04,2.27,3.79],[s*1.18,2.30,3.88],[s*1.20,2.10,3.93]],.019,0x464c49);
      b.box(s*1.2,2.01,3.923,.085,.215,.083,dark);
    }
    b.rod([0,1.68,4.05],[0,2.55,3.812],.021,0x5c6d65);
    b.box(0,2.651,3.712,2.105,.242,.165,main);
    endArt(b,3.80,-.89,.89,2.555,2.742,"route");
    b.box(0,1.64,3.708,1.99,.15,.514,0x434b44);
    seat(b,-.62,1.37,3.12,.53);person(b,-.62,1.42,3.10,seed+3,{shirt:0xb7c2ac,hands:[[-.79,1.65,3.54],[-.47,1.68,3.54]]});
    return {length:8.40,width:2.50,wheels};
  }

  // Pressed sheet-metal cowl, with a chamfered cross-section between each station.
  function hull(b,stations,color) {
    const outline=([z,w,lo,hi])=>{
      const edge=Math.min(.074,w*.25,(hi-lo)*.22);
      return [[-w+edge,lo,z],[w-edge,lo,z],[w,lo+edge,z],[w,hi-edge,z],
        [w-edge,hi,z],[-w+edge,hi,z],[-w,hi-edge,z],[-w,lo+edge,z]];
    };
    let prev=outline(stations[0]);b.polygon(prev.slice().reverse(),color);
    for(let i=1;i<stations.length;i++){
      const next=outline(stations[i]);
      for(let j=0;j<8;j++){const k=(j+1)%8;b.polygon([prev[j],prev[k],next[k],next[j]],color);}
      prev=next;
    }
    b.polygon(prev,color);
  }
  function modelCng(b,root,livery,seed,idx) {
    const green=paints[idx], trim=0xb9c1a2;
    const wheels=[axles(root,livery,-.86,.285,[-.566,.566],.285,false),axles(root,livery,.99,.285,[0],.285,false)];
    hull(b,[[-1.36,.505,.38,1.13],[-1.28,.627,.34,1.17],[-1.02,.649,.36,1.16],[-.49,.64,.395,.96]],green);
    hull(b,[[-.63,.637,.325,.55],[.40,.621,.30,.52],[.71,.52,.35,.62]],green);
    hull(b,[[.49,.56,.48,.91],[.70,.574,.50,1.06],[.93,.481,.55,1.075],[1.17,.30,.56,.877],[1.24,.18,.58,.79]],green);
    b.box(0,.558,.02,1.15,.054,1.01,0x42483e);
    b.round(0,1.758,-.275,1.36,.28,2.03,0x393c36);
    // Canvas hood has a straight drip rail along both sides, with a flattened crown.
    for(let j=0;j<8;j++){
      const a=-PI/2+PI*j/8,d=-PI/2+PI*(j+1)/8;
      const v=(u,z,h)=>[.672*Math.sin(u),h+.159*Math.cos(u),z];
      b.polygon([v(a,-1.254,1.723),v(d,-1.254,1.723),v(d,.676,1.742),v(a,.676,1.742)],j%2?0x40443c:0x45483f);
    }
    b.box(0,1.42,-1.27,1.195,.695,.064,0x3b4038);
    b.box(0,1.477,-1.307,.757,.314,.029,0x737e72);b.box(0,1.48,-1.324,.69,.25,.015,0x354443);
    b.rail([[-.605,1.043,.888],[-.559,1.741,.658],[.559,1.741,.658],[.605,1.043,.888],[-.605,1.043,.888]],.033,0x46544a);
    b.polygon([[-.569,1.074,.887],[.569,1.074,.887],[.531,1.708,.674],[-.531,1.708,.674]],0x9cbcb0,"glass");
    b.rod([.11,1.087,.89],[.35,1.215,.85],.014,0x343939);
    b.box(0,1.743,.666,1.13,.075,.056,green);
    for(const s of [-1,1]){
      b.rail([[s*.629,.475,-.41],[s*.645,1.70,-.56],[s*.644,1.74,-1.235],[s*.62,1.07,-1.30]],.033,0x344d3f);
      b.rod([s*.641,1.72,-1.23],[s*.617,1.74,.655],.027,trim);
      b.rail([[s*.648,.525,-.44],[s*.648,.525,.379],[s*.613,1.603,.56]],.022,0x95a294);
      // Dhaka CNGs have a hinged green mesh passenger gate.
      for(let n=0;n<=4;n++){
        const z=-.43+n*.215;
        b.rod([s*.647,.59,z],[s*.647,1.434,z-.026],.013,0x465e4b);
      }
      for(let n=0;n<4;n++)b.rod([s*.651,.64+n*.244,-.463],[s*.651,.64+n*.244,.431],n===0||n===3?.017:.01,0x627964);
      b.box(s*.658,1.10,.332,.029,.055,.149,trim);
      for(let n=0;n<3;n++) b.rod([s*.634,1.25+n*.16,-1.19],[s*.647,1.25+n*.16,-.572],.012,0x647262);
      sideArt(b,s*.651,-1.197,-.591,.696,1.001,"cng");mudguard(b,s*.572,-.86,.285,.347,.181,green);
      b.round(s*.347,.854,1.11,.19,.168,.098,0xa5b2a1);b.round(s*.347,.856,1.153,.149,.124,.041,0xeadfba);
      b.box(s*.513,.953,.957,.091,.061,.055,0xd99d47);
      b.rail([[s*.486,1.108,.841],[s*.672,1.275,.906],[s*.704,1.326,.92]],.012,steel);
      b.round(s*.708,1.363,.931,.094,.124,.055,0x38413d);
      b.box(s*.461,.785,-1.366,.118,.175,.031,0xad4536);
    }
    b.rod([-.252,1.035,.602],[.252,1.035,.602],.018,0x434b46);b.rod([0,.679,.573],[0,1.034,.602],.032,0x626d62);
    seat(b,0,.664,.32,.492);person(b,0,.705,.305,seed,{cap:seed%4===0,lean:.08,hands:[[-.20,1.04,.591],[.20,1.04,.591]]});
    seat(b,0,.697,-.746,.99,0x704d3f);
    if(seed%3!==1)person(b,-.195,.748,-.762,seed+1,{shirt:0x9e7475});
    mudguard(b,0,1.005,.285,.346,.204,green);
    b.rail([[-.528,.593,1.011],[-.36,.535,1.206],[0,.515,1.269],[.36,.535,1.206],[.528,.593,1.011]],.023,trim);
    endArt(b,1.247,-.162,.162,.637,.745,"plate");
    endArt(b,-1.366,-.186,.186,.924,1.044,"plate",true);
    for(let n=0;n<5;n++)b.box(0,.557+n*.048,-1.366,.542,.019,.017,0x324f40);
    b.rod([-.551,.416,-1.349],[.551,.416,-1.349],.028,trim);
    return {length:2.76,width:1.52,wheels};
  }
  function rickshawLegs(root,livery) {
    const crankY=.473,crankZ=.468,hipY=.995,hipZ=.227,crankR=.127,upperLen=.361,lowerLen=.361;
    const crank=child(root,0,crankY,crankZ),crankParts=new Parts(crank,livery);
    crank.name="crank";
    for(const s of [-1,1]){
      const x=s*.128,up=child(root,x,hipY,hipZ),low=child(root,x,0,0),shoe=child(root,x,0,0);
      const u=new Parts(up,livery),l=new Parts(low,livery),f=new Parts(shoe,livery),skin=0xb88760;
      u.round(0,-upperLen*.43,.005,.149,upperLen*1.14,.167,0x60796d);u.round(0,-upperLen*.88,0,.102,.135,.11,skin);u.finish();
      l.round(0,-.02,0,.104,.113,.108,skin);l.round(0,-lowerLen*.49,0,.095,lowerLen*1.05,.108,skin);l.finish();
      f.round(0,-.021,.041,.105,.054,.185,0x5b4532);f.round(0,-.001,.045,.091,.054,.149,skin);
      f.box(0,.014,.067,.104,.018,.06,0x594a36);f.box(0,-.061,.035,.131,.029,.072,0x383d38);f.finish();
      crankParts.rod([s*.082,0,0],[s*.104,s*crankR,0],.012,steel);
      up.name="thigh"+s;low.name="shin"+s;shoe.name="pedal"+s;
    }
    crankParts.finish();
  }
  function riderAnimation(root) {
    const crank=root.getObjectByName("crank");
    if(!crank)return null;
    const crankY=.473,crankZ=.468,hipY=.995,hipZ=.227,crankR=.127,upperLen=.361,lowerLen=.361;
    const legs=[-1,1].map(s=>({s,x:s*.128,up:root.getObjectByName("thigh"+s),low:root.getObjectByName("shin"+s),shoe:root.getObjectByName("pedal"+s)}));
    return distance=>{
      const a=(distance*2*PI/2.55)%(PI*2);crank.rotation.x=a;
      for(const leg of legs){
        const fy=crankY+leg.s*Math.cos(a)*crankR+.055,fz=crankZ+leg.s*Math.sin(a)*crankR-.035;
        const dy=fy-hipY,dz=fz-hipZ,len=Math.hypot(dy,dz);
        const along=(upperLen*upperLen-lowerLen*lowerLen+len*len)/(2*len);
        const away=Math.sqrt(Math.max(0,upperLen*upperLen-along*along));
        const ky=hipY+(dy*along+dz*away)/len,kz=hipZ+(dz*along-dy*away)/len;
        leg.up.rotation.x=-Math.atan2(kz-hipZ,hipY-ky);
        leg.low.position.set(leg.x,ky,kz);leg.low.rotation.x=-Math.atan2(fz-kz,ky-fy);leg.shoe.position.set(leg.x,fy,fz);
      }
    };
  }
  function cycleChassis(b,root,livery,seed,idx) {
    const front=1.002,rear=-.808,r=.355,frame=[0x337560,0x97483e,0x367086][idx];
    const wheels=[axles(root,livery,rear,.374,[-.539,.539],.374,true),axles(root,livery,front,r,[0],r,true)];
    b.rod([-.564,.374,rear],[.564,.374,rear],.027,0x525f59);
    for(const s of [-1,1]) {
      b.rail([[s*.493,.376,rear],[s*.324,.537,-.24],[s*.08,.475,.467]],.027,frame);
      b.rod([s*.471,.373,rear],[s*.40,.755,-.548],.022,frame);
      b.rail([[s*.07,.954,.70],[s*.083,.406,front-.054],[s*.083,.355,front]],.021,steel);
      b.rod([s*.069,.488,.473],[s*.396,.752,-.571],.022,frame);
    }
    b.rail([[0,.475,.468],[0,.925,.245],[0,.954,.701],[0,.475,.468]],.030,frame);
    b.rod([0,.856,.77],[0,1.162,.685],.032,steel);
    b.rail([[-.224,1.224,.658],[-.193,1.18,.725],[0,1.156,.688],[.193,1.18,.725],[.224,1.224,.658]],.017,steel);
    for(const s of [-1,1])b.rod([s*.18,1.21,.675],[s*.237,1.225,.648],.023,0x3b3833);
    b.round(.119,1.178,.71,.063,.038,.071,brass);
    b.rod([0,.865,.25],[0,.983,.218],.023,steel);b.round(0,.979,.215,.205,.068,.279,0x514831);
    b.torus(.075,.473,.468,.113,.012,steel);b.rail([[.081,.36,.462],[.082,.342,rear],[.081,.405,rear],[.081,.583,.462]],.007,0x4d5851);
    mudguard(b,0,front,r,.402,.097,0x8d9a90,-1.52,.68);
    for(const s of [-1,1])mudguard(b,s*.539,rear,.374,.428,.114,frame);
    person(b,0,.994,.227,seed,{shirt:shirts[seed%4],lean:.26,pedal:true,cap:seed%4===1,hands:[[-.208,1.222,.652],[.208,1.222,.652]]});
    for(let j=0;j<12;j++){
      const a=j*PI/6,d=(j+1)*PI/6;const rim=(angle,y,hw,hd)=>[hw*Math.cos(angle),y,.223+hd*Math.sin(angle)];
      b.art([rim(a,.909,.171,.12),rim(d,.909,.171,.12),rim(d,1.082,.158,.119),rim(a,1.082,.158,.119)],"lungi",[[j/12,0],[(j+1)/12,0],[(j+1)/12,1],[j/12,1]]);
    }
    rickshawLegs(root,livery);
    return wheels;
  }
  function modelRickshaw(b,root,livery,seed,idx) {
    const wheels=cycleChassis(b,root,livery,seed,idx);
    hull(b,[[-1.244,.486,.60,.878],[-1.172,.531,.574,.899],[-.499,.524,.59,.864],[-.171,.469,.639,.748]],0x82563c);
    b.box(0,.579,-.483,.865,.06,.751,0x77674b);
    endArt(b,-1.246,-.456,.456,.617,.855,"landscape",true);
    b.round(0,.907,-.71,.927,.149,.425,0x8b443d);b.round(0,1.118,-.993,.923,.477,.145,0x804339,[-.16,0,0]);
    for(const s of [-1,1]) {
      b.rail([[s*.475,.796,-.376],[s*.489,1.03,-.413],[s*.491,1.111,-1.081]],.024,brass);
      b.rod([s*.466,.785,-.378],[s*.541,1.925,-.266],.019,steel);
      b.rod([s*.477,.974,-.697],[s*.546,1.828,-1.024],.016,brass);
      b.rod([s*.484,1.03,-.704],[s*.553,1.944,-.563],.016,brass);
      sideArt(b,s*.532,-1.136,-.507,.678,.827,"cloth");
    }
    // Laminated folding hood: front faces +Z, leaving the passenger seat open.
    const hood=[[1.054,-1.176,.50],[1.311,-1.268,.537],[1.546,-1.272,.555],[1.755,-1.156,.575],[1.891,-.982,.581],[1.958,-.745,.588],[1.991,-.496,.581],[1.951,-.223,.572]];
    function hoodVertex(station,f) {
      const [y,z,half]=hood[station],rise=station<2?.024:.109;
      return [f*half,y+rise*(1-f*f),z-.025*(1-f*f)];
    }
    for(let j=1;j<hood.length;j++)for(let k=0;k<6;k++){
      const a=k/3-1,d=(k+1)/3-1,uvA=k/6,uvB=(k+1)/6,vA=(j-1)/(hood.length-1),vB=j/(hood.length-1);
      b.art([hoodVertex(j-1,a),hoodVertex(j-1,d),hoodVertex(j,d),hoodVertex(j,a)],"cloth",[[uvA,vA],[uvB,vA],[uvB,vB],[uvA,vB]]);
    }
    for(const s of [-1,1]){
      for(let j=2;j<hood.length;j++){
        const p=[s*.505,1.08,-.776],h1=hoodVertex(j-1,s),h2=hoodVertex(j,s);
        b.polygon([p,h1,h2],j%2?palettes[idx].cloth:0xb27338);
        b.rod(p,h2,.009,0xd9a448);
      }
      b.rail(hood.map((_,i)=>hoodVertex(i,s)),.015,brass);
    }
    const edge=hood.length-1;
    for(let k=0;k<12;k++){
      const l=hoodVertex(edge,-1+k/6),rr=hoodVertex(edge,-1+(k+1)/6);
      b.rod(l,rr,.018,brass);
      b.polygon([l,rr,[(l[0]+rr[0])/2,(l[1]+rr[1])/2-.067,(l[2]+rr[2])/2]],k%2?0xe8b541:0xa63632);
    }
    b.art([[-.46,1.10,-1.204],[.46,1.10,-1.204],[.48,1.48,-1.275],[-.48,1.48,-1.275]].reverse(),"landscape");
    if(seed%3!==2)person(b,-.139,.942,-.705,seed+2,{shirt:[0xb27969,0x8c8799,0x4b797a][idx]});
    return {length:2.76,width:1.21,wheels};
  }
  function modelCycleVan(b,root,livery,seed,idx) {
    const wheels=cycleChassis(b,root,livery,seed,idx);
    const wood=[0xb18e5e,0x98754a,0xb49a6d,0x9b825c];
    for(const x of [-.48,.48])b.box(x,.76,-.84,.065,.095,1.70,0x535547);
    for(let j=0;j<9;j++)b.box(0,.835,-.13-j*.183,1.27,.062,.177,wood[(j+idx)%4]);
    for(const x of [-.64,.64])b.box(x,.895,-.86,.035,.13,1.65,0x877043);
    for(const [x,z] of [[-.28,-.46],[.28,-.48],[-.26,-1.16],[.28,-1.16]]) {
      const green=(x*z+idx)>.7,plastic=green?0x497751:0xa65c3b;
      b.box(x,.897,z,.47,.057,.56,plastic);
      for(const side of [-1,1]){
        for(const y of [.939,1.032]) {
          b.box(x+side*.224,y,z,.032,.057,.55,plastic);
          b.box(x,y,z+side*.262,.45,.057,.034,plastic);
        }
        for(const end of [-1,1])b.box(x+side*.211,.989,z+end*.242,.051,.19,.052,plastic);
      }
      for(let j=0;j<6;j++)b.round(x+(j%2-.5)*.168,1.03+(j%3)*.016,z+(Math.floor(j/2)-1)*.145,
        .14,.14,.13,green?0xa4a14f:(j%2?0xd49e48:0xb7833b));
    }
    for(const z of [-.49,-1.19])b.rail([[-.63,.87,z],[-.49,1.13,z+.05],[.48,1.13,z-.03],[.63,.88,z]],.011,0xb7a06f);
    b.rod([-.57,.738,-1.66],[.57,.738,-1.66],.022,steel);
    return {length:3.03,width:1.34,wheels};
  }
  function modelVan(b,root,livery,seed,idx) {
    const blue=[0x486f87,0x467e76,0xb99652][idx],wheels=[axles(root,livery,-1.428,.347,[-.754,.754],.347,false),axles(root,livery,1.407,.347,[-.754,.754],.347,false)];
    b.box(0,.449,-.01,1.284,.20,4.18,0x434b49);
    b.box(0,1.327,-.702,1.68,1.46,2.91,0x687f7e);
    for(const s of [-1,1]){
      sideArt(b,s*.846,-2.143,.722,.649,2.019,"parcel");
      b.box(s*.848,.634,-.707,.054,.077,2.938,0x565c51);b.box(s*.849,2.044,-.707,.049,.063,2.935,0x929b8b);
      for(const z of [-2.143,-.72,.728])b.box(s*.858,1.335,z,.042,1.442,.045,steel);
      mudguard(b,s*.767,-1.428,.347,.421,.149,0x4a5350);
    }
    b.box(0,2.063,-.71,1.748,.062,2.956,0x989f91);
    b.box(0,1.304,-2.171,1.55,1.293,.039,0x8b9790);
    for(const s of [-1,1]){
      b.rod([s*.332,.742,-2.204],[s*.332,1.926,-2.204],.015,steel);
      b.box(s*.453,1.074,-2.221,.207,.025,.032,dark);b.box(s*.69,.633,-2.197,.145,.097,.049,0x9f4439);
    }
    endArt(b,-2.197,-.239,.239,.722,.888,"plate",true);
    hull(b,[[.796,.797,.581,1.261],[1.69,.802,.51,1.268],[1.987,.76,.535,1.13],[2.115,.661,.546,.99]],blue);
    b.box(0,1.587,.837,1.561,.684,.055,blue);
    for(const s of [-1,1]){
      b.rail([[s*.803,1.242,.827],[s*.753,1.921,.853],[s*.702,1.93,1.48],[s*.778,1.258,1.824]],.043,blue);
      b.polygon([[s*.788,1.286,.889],[s*.786,1.286,1.775],[s*.702,1.883,1.467],[s*.744,1.882,.891]],0x94b4bc,"glass");
      b.box(s*.813,1.012,1.144,.022,.042,.153,0x383e3d);
      b.rod([s*.774,1.38,1.69],[s*.916,1.5,1.734],.012,steel);b.box(s*.922,1.54,1.728,.078,.123,.065,0x384344);
      mudguard(b,s*.757,1.407,.347,.413,.14,blue);
      b.box(s*.53,.897,2.063,.234,.126,.089,0xe0dfc0);b.box(s*.709,.905,2.013,.07,.102,.068,0xe4a342);
    }
    b.polygon([[-.738,1.284,1.818],[.738,1.284,1.818],[.668,1.879,1.51],[-.668,1.879,1.51]],0x8fb3b8,"glass");
    b.box(0,1.943,1.166,1.527,.079,.765,blue);
    seat(b,-.37,.938,1.113,.49);person(b,-.37,.977,1.123,seed,{hands:[[-.514,1.248,1.534],[-.226,1.248,1.534]]});
    b.box(0,.80,2.132,.717,.295,.041,dark);
    for(let j=0;j<4;j++)b.box(0,.707+.061*j,2.155,.701,.018,.013,steel);
    b.box(0,.521,2.095,1.523,.136,.149,0x59665e);endArt(b,2.174,-.205,.205,.547,.655,"plate");
    return {length:4.50,width:1.94,wheels};
  }

  function modelMotorcycle(b,root,livery,seed,idx) {
    const paint=[0xa52d24,0x254f79,0x2f3936][idx],wheels=[axles(root,livery,-.69,.315,[0],.315,false),axles(root,livery,.72,.315,[0],.315,false)];
    b.rail([[0,.32,-.68],[0,.68,-.40],[0,.72,.38],[0,.38,.42],[0,.31,-.45]],.035,0x323b3c);
    for(const s of [-1,1]){
      b.rod([s*.085,.34,.72],[s*.085,1.01,.50],.025,steel);
      b.rod([s*.085,.31,.72],[s*.085,.60,.63],.037,dark);
      b.rod([s*.12,.35,-.65],[s*.13,.74,-.38],.026,0xaab1aa);
      for(let k=0;k<6;k++)b.round(s*.13,.46+k*.036,-.58+k*.024,.072,.021,.072,0x3d4544);
      b.rod([s*.06,.41,-.10],[s*.24,.41,-.10],.023,dark);
      b.box(s*.25,.41,-.10,.12,.027,.065,rubber);
      b.rod([s*.24,1.03,.55],[s*.29,1.26,.58],.011,steel);
      b.round(s*.30,1.27,.59,.15,.09,.045,0x232d30);
      b.round(s*.30,1.27,.613,.13,.073,.013,0x9cbbb9);
      b.round(s*.12,.42,.02,.105,.23,.24,0x8c938a);
      for(let j=0;j<6;j++)b.box(s*.10,.44+j*.022,.12,.15,.009,.19,0x4b5551);
    }
    b.round(0,.77,.19,.39,.34,.56,paint,[-.15,0,0]);
    b.round(0,.909,.20,.075,.013,.09,steel);
    b.round(0,.814,-.29,.33,.115,.54,0x252c2c);
    b.round(0,.78,-.61,.32,.15,.23,paint);
    b.box(0,.758,-.744,.20,.075,.034,0xa7251f);
    b.box(0,.57,-.793,.17,.13,.018,0xd8dbc3);
    endArt(b,-.805,-.085,.085,.51,.62,"plate",true);
    b.rail([[.14,.42,.20],[.18,.28,.07],[.18,.27,-.33],[.18,.32,-.73]],.026,0x969b91);
    b.round(.18,.32,-.50,.112,.117,.52,0x515c58,[.08,0,0]);
    b.rod([-.31,1.02,.55],[.31,1.02,.55],.022,steel);
    for(const s of [-1,1])b.rod([s*.22,1.02,.55],[s*.34,1.02,.55],.030,rubber);
    b.round(0,.99,.62,.25,.23,.15,0x253137);
    b.round(0,.99,.70,.207,.178,.034,0xeee3b6);
    for(const s of [-1,1])b.round(s*.17,.95,.62,.07,.055,.07,0xd69b3a);
    b.round(0,1.08,.52,.13,.035,.11,0x344f55,[-.35,0,0]);
    mudguard(b,0,.72,.315,.34,.15,paint);mudguard(b,0,-.69,.315,.34,.18,0x323b3c);
    return {length:2.15,width:.76,wheels};
  }
  const fleet=new Map();
  function create(kind,seed=0) {
    init();
    const variant=Math.abs(Math.trunc(Number(seed)||0)),idx=variant%palettes.length,key=kind+"/"+idx;
    let kit=fleet.get(key);
    if(!kit){
      const livery=atlas(idx),model=new T.Group();model.name="Dhaka "+kind;
      const chassis=child(model,0,0,0),parts=new Parts(chassis,livery);
      const build={rickshaw:modelRickshaw,cyclevan:modelCycleVan,cng:modelCng,bus:modelBus,van:modelVan,motorcycle:modelMotorcycle}[kind];
      if(!build)throw new Error("Unknown Dhaka vehicle: "+kind);
      const details=build(parts,model,livery,variant,idx);parts.finish();
      const radii=details.wheels.map((axle,i)=>{axle.group.name="axle"+i;return axle.radius;});
      kit={model,radii,width:details.width,length:details.length};fleet.set(key,kit);
    }
    // Frames, paint and spokes share GPU buffers; each driver keeps their own wheels and crank.
    const root=kit.model.clone(),chassis=root.children[0],pedal=riderAnimation(root);
    const rider=kind==="motorcycle"?C72People.create({role:"rider",seed:[5,10,11,13,14,16,19][variant%7]}):null;
    if(rider){rider.root.position.set(0,.04,-.23);root.add(rider.root);}
    const axles=kit.radii.map((radius,i)=>({group:root.getObjectByName("axle"+i),radius}));
    function update(distanceMetres=0,timeSeconds=0,speedMps=0) {
      for(const axle of axles)axle.group.rotation.x=(distanceMetres/axle.radius)%(2*PI);
      if(pedal)pedal(distanceMetres);
      if(rider)rider.pose("ride",timeSeconds,speedMps);
      const vibration=Math.min(1,Math.abs(speedMps)/3);
      chassis.position.y=.005*vibration*Math.sin(distanceMetres*5.5+variant);
      chassis.rotation.z=.003*vibration*Math.sin(timeSeconds*3+variant);
    }
    update();
    return {root,length:kit.length,width:kit.width,update};
  }
  window.C72Vehicles=Object.freeze({create});
})();
