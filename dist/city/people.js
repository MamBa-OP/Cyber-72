/* Cyber 72 street actors. +Z faces forward; all dimensions are metres. */
(function () {
  "use strict";
  const T = window.THREE;
  const TAU = Math.PI * 2;
  const smoothstep=t=>t*t*(3-2*t);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const V = (x=0, y=0, z=0) => new T.Vector3(x, y, z);
  function randomFrom(seed) {
    let value = seed >>> 0;
    return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; };
  }
  const cloth = ["#327b7b", "#c48952", "#8e4d52", "#bfc2aa", "#627c99", "#7f9386", "#cdbb91", "#906a87", "#417788", "#ece0c2"];
  const sari = ["#ab514d", "#bd7636", "#596e87", "#287f76", "#925475"];
  const darks = ["#384853", "#4b514c", "#51556b", "#695c4d", "#333d48"];
  const skin = ["#ae7655", "#996347", "#bd8763", "#976447", "#ba8159", "#8f5c43", "#a96f4d"];
  const palette = new Map();
  function color(value) {
    if (!palette.has(value)) palette.set(value, new T.Color(value));
    return palette.get(value);
  }
  function fabricAtlas() {
    const size = 1024, cell = 256, bytes = new Uint8Array(size*size*4), relief=new Uint8Array(size*size*4);
    const rand = randomFrom(7201);
    for (let y=0; y<size; y++) for (let x=0; x<size; x++) {
      const tile = Math.floor(x/cell) + 4*Math.floor(y/cell), u=(x%cell)/4, v=(y%cell)/4;
      const weave = (x%2 ? 1 : -1) * (y%2 ? 1 : -1);
      let shade = 248 + 2*weave + 3*(rand()-.5), red=1, green=1, blue=1;
      switch(tile) {
        case 1: { // Fold shadows collect along the hem and beneath the sleeves.
          const crease=Math.max(0,Math.cos(u*.31+1.9*Math.sin(v*.071)+.8*Math.sin(u*.77+v*.13)))**10;
          shade = 242 + 2*weave + 5*(rand()-.5) - crease*(7+10*(1-v/64)) + 3*Math.sin(u*.28+v*.045); break;
        }
        case 2: // lungi and gamcha checks, with contrasting selvage lines
          shade = 247 + 3*weave + 4*(rand()-.5);
          if (u%16<5) { shade *= .71; blue=.91; }
          if (v%18<5) { shade *= .77; green=.91; }
          if (u%16===9 || v%18===9) { shade=193; green=.90; blue=.74; }
          break;
        case 3: shade=235+5*Math.sin((u+v)*1.68)+8*(rand()-.5)-11*(.5+.5*Math.cos(v*.51+1.9*Math.sin(u*.12)))**6; break; // denim twill
        case 4: case 10: {
          const repeat=tile===4?8:16,m=repeat/2,motif=Math.hypot((u%repeat)-m,(v%repeat)-m);
          shade=241+3*weave+4*(rand()-.5);
          if(motif<repeat*.19&&motif>repeat*.085||Math.abs(u%repeat-m)<repeat*.025&&Math.abs(v%repeat-m)<repeat*.29){shade*=.83;green=.92;blue=.79;}
          if(v<1.2||v>62.8){shade*=.81;blue=.74;}break;
        }
        case 5: shade=237+14*(rand()-.5)+3*Math.sin(u*.55+Math.sin(v*.51)); break; // leather
        case 6: shade=210+30*Math.sin(u*1.7+v*.13)+14*rand(); break; // hair
        case 7: shade=237+5*(u%3-1)+4*weave+8*(rand()-.5); break; // canvas
        case 8: shade = v%15<2 ? 175 : 242+3*weave+5*rand(); break;
        case 9: { // Long, narrow orna: motifs keep their proportions along the drape.
          shade=242+2*weave+3*(rand()-.5);
          const motif=Math.hypot(((u+8)%32-16)/9,((v+1)%3.2-1.6)/.8);
          if(motif<1&&motif>.48){shade*=.81;green=.92;blue=.72;}
          if(u<2.5||u>61.5){shade*=.77;green=.86;blue=.66;}
          break;
        }
      }
      const i=(y*size+x)*4;
      bytes[i]=clamp(shade*red,0,255); bytes[i+1]=clamp(shade*green,0,255); bytes[i+2]=clamp(shade*blue,0,255); bytes[i+3]=255;
      // Printed colours are not dents in the cloth. Only the fine weave affects relief.
      const height=127+7*weave+3*Math.sin(x*.63+y*.21);
      relief[i]=relief[i+1]=relief[i+2]=height;relief[i+3]=255;
    }
    const map = new T.DataTexture(bytes,size,size,T.RGBAFormat);
    map.colorSpace = T.SRGBColorSpace; map.minFilter=T.LinearMipmapLinearFilter; map.magFilter=T.LinearFilter;
    map.generateMipmaps=true; map.anisotropy=8; map.needsUpdate=true;
    const bump=new T.DataTexture(relief,size,size,T.RGBAFormat);
    bump.minFilter=T.LinearMipmapLinearFilter;bump.magFilter=T.LinearFilter;
    bump.generateMipmaps=true;bump.anisotropy=8;bump.needsUpdate=true;
    return {map,bump};
  }
  let surface;
  function sharedMaterial() {
    if(surface)return surface;
    const fabric=fabricAtlas();
    surface=new T.MeshStandardMaterial({map:fabric.map,bumpMap:fabric.bump,bumpScale:.00035,vertexColors:true,roughness:.91,metalness:0,side:T.DoubleSide});
    const skinMap=C72Atlases.get("face");
    const ref=anatomy().reference;const neutral=new T.Color().setRGB(ref[0]/255,ref[1]/255,ref[2]/255,T.SRGBColorSpace);
    surface.onBeforeCompile=shader=>{
      shader.uniforms.faceDetail={value:skinMap};shader.uniforms.skinBalance={value:new T.Vector3(1/neutral.r,1/neutral.g,1/neutral.b)};
      shader.vertexShader="attribute vec3 faceCoord; varying vec3 vFaceCoord;\n"+shader.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\nvFaceCoord=faceCoord;");
      shader.fragmentShader="uniform sampler2D faceDetail; uniform vec3 skinBalance; varying vec3 vFaceCoord;\n"+
        shader.fragmentShader.replace("#include <map_fragment>","#include <map_fragment>\ndiffuseColor.rgb*=mix(vec3(1.),texture2D(faceDetail,vFaceCoord.xy).rgb*skinBalance,vFaceCoord.z);");
    };
    return surface;
  }

  // Geometries, clothes, hair and their detail share one skinned draw per actor.
  class Tailor {
    constructor(distant=false) {
      this.distant=distant;
      this.p=[]; this.c=[]; this.u=[]; this.j=[]; this.w=[]; this.i=[]; this.seams=[]; this.face=[]; this.parts=[];
    }
    part(name,build) {
      const start=this.p.length/3,first=this.i.length;build();
      this.parts.push({name,start,count:this.p.length/3-start,first,indices:this.i.length-first});
    }
    vertex(x,y,z,col,skinWeight,tile=0,u=.5,v=.5) {
      const idx=this.p.length/3;
      this.p.push(x,y,z);
      this.face.push(0,0,0);
      const c=typeof col==="string"?color(col):col;
      this.c.push(c.r,c.g,c.b);
      this.u.push(((tile%4)+.019+.962*u)/4, ((tile>>2)+.019+.962*v)/4);
      if (typeof skinWeight==="number") { this.j.push(skinWeight,0,0,0); this.w.push(1,0,0,0); }
      else if(skinWeight.j){this.j.push(...skinWeight.j);this.w.push(...skinWeight.w);}
      else { this.j.push(skinWeight[0],skinWeight[1],0,0); this.w.push(1-skinWeight[2],skinWeight[2],0,0); }
      return idx;
    }
    // Rings run bottom to top and describe elliptical cross sections of tailored pieces.
    rings(rows,col,weight,tile=1,segments=16,waves=0,profile=1,caps=true,lodSegments=8) {
      if(this.distant){
        segments=Math.min(lodSegments,segments);
        // Keep joint rings at every distance; removing knee/ankle rings made
        // the low-detail trousers collapse when their wearer bent a leg.
      }
      const base=this.p.length/3;
      rows.forEach((r,k) => {
        const [y,cx,cz,rx,rz]=r, t=(y-rows[0][0])/Math.max(.001,rows[rows.length-1][0]-rows[0][0]);
        for(let a=0;a<=segments;a++) {
          const theta=a/segments*TAU;
          const fold = 1 + waves * (Math.sin(7*theta+.4*t)+.45*Math.sin(11*theta-3*t));
          const sx=Math.sin(theta),cz0=Math.cos(theta);
          const x=cx+rx*Math.sign(sx)*Math.abs(sx)**profile*fold,z=cz+rz*Math.sign(cz0)*Math.abs(cz0)**profile*fold;
          this.vertex(x,y,z,col, typeof weight==="function"?weight(y,x,z):weight,tile,a/segments,t);
          if(k<rows.length-1&&a<segments) {
            const i=base+k*(segments+1)+a, j=i+segments+1;
            this.i.push(i,i+1,j+1,i,j+1,j);
          }
        }
        this.seams.push([base+k*(segments+1),base+k*(segments+1)+segments]);
      });
      // The flat closing disks are normally hidden by adjacent cloth/skin.
      for(const k of caps?[0,rows.length-1]:[]){
        const [y,cx,cz]=rows[k], first=base+k*(segments+1);
        const center=this.vertex(cx,y,cz,col,typeof weight==="function"?weight(y,cx,cz):weight,tile,.5,.5);
        for(let a=0;a<segments;a++) {
          if (k===0) this.i.push(center,first+a+1,first+a); else this.i.push(center,first+a,first+a+1);
        }
      }
    }
    // Front and back kameez panels meet at the upper side seams. Below the
    // hip, real side vents let the fabric follow a stride without a closing disk.
    tunic(rows,col,weight,tile) {
      // Retain the drape's deformation loops even when faces/hands use a lower LOD.
      const segments=24,starts=[];
      for(let panel=0;panel<2;panel++){
        const base=this.p.length/3;starts.push(base);
        rows.forEach(([y,cx,cz,rx,rz],k)=>{
          const t=(y-rows[0][0])/(rows[rows.length-1][0]-rows[0][0]);
          const gap=.065*smoothstep(clamp((.79-y)/.055,0,1));
          for(let a=0;a<=segments;a++){
            const theta=-Math.PI/2+panel*Math.PI+gap+a/segments*(Math.PI-2*gap);
            const fold=1+.009*Math.sin(8*theta+.5*t),x=cx+rx*Math.sin(theta)*fold,z=cz+rz*Math.cos(theta)*fold;
            this.vertex(x,y,z,col,weight(y,x,z),tile,panel*.5+a/segments*.5,t);
            if(k<rows.length-1&&a<segments){const i=base+k*(segments+1)+a,j=i+segments+1;this.i.push(i,i+1,j+1,i,j+1,j);}
          }
        });
      }
      rows.forEach((r,k)=>{if(r[0]>=.79){
        this.seams.push([starts[0]+k*(segments+1),starts[1]+k*(segments+1)+segments],
          [starts[0]+k*(segments+1)+segments,starts[1]+k*(segments+1)]);
      }});
    }
    blob(center,radii,col,bone,tile=0,segments=12,levels=6) {
      const rows=[];
      for(let i=0;i<=levels;i++) {
        const lat=-Math.PI*.5+Math.PI*i/levels;
        rows.push([center[1]+radii[1]*Math.sin(lat),center[0],center[2],radii[0]*Math.max(.015,Math.cos(lat)),radii[2]*Math.max(.015,Math.cos(lat))]);
      }
      this.rings(rows,col,bone,tile,segments);
    }
    strap(points,width,col,bone,tile=7) {
      const start=this.p.length/3;
      points.forEach(([x,y,z],i)=>{
        const binding=typeof bone==="function"?bone(y,x,z):bone;
        this.vertex(x-width/2,y,z,col,binding,tile,0,i/(points.length-1));
        this.vertex(x+width/2,y,z,col,binding,tile,1,i/(points.length-1));
        if(i){const a=start+2*i;this.i.push(a-2,a,a-1,a-1,a,a+1);}
      });
    }
    finish() {
      const g=new T.BufferGeometry();
      g.setAttribute("position",new T.Float32BufferAttribute(this.p,3));
      g.setAttribute("color",new T.Float32BufferAttribute(this.c,3));
      g.setAttribute("uv",new T.Float32BufferAttribute(this.u,2));
      g.setAttribute("faceCoord",new T.Float32BufferAttribute(this.face,3));
      g.setAttribute("skinIndex",new T.Uint16BufferAttribute(this.j,4));
      g.setAttribute("skinWeight",new T.Float32BufferAttribute(this.w,4));
      g.setIndex(this.i); g.computeVertexNormals();
      const n=g.attributes.normal;
      for(const [a,b] of this.seams){
        const x=n.getX(a)+n.getX(b),y=n.getY(a)+n.getY(b),z=n.getZ(a)+n.getZ(b);
        const len=Math.hypot(x,y,z)||1;
        n.setXYZ(a,x/len,y/len,z/len); n.setXYZ(b,x/len,y/len,z/len);
      }
      g.boundingSphere=new T.Sphere(V(0,.92,0),1.15);
      g.userData.parts=this.parts;
      return g;
    }
  }

  // Positions are in the bind pose, with the shoulders and elbows pointing down.
  const joints = [
    ["hip",-1,0,.872,0],["spine",0,0,1.05,0],["chest",1,0,1.265,0],["head",2,0,1.443,0],
    ["lThigh",0,.092,.867,0],["lKnee",4,.092,.466,0],["lAnkle",5,.092,.075,0],
    ["rThigh",0,-.092,.867,0],["rKnee",7,-.092,.466,0],["rAnkle",8,-.092,.075,0],
    ["lShoulder",2,.193,1.389,0],["lElbow",10,.193,1.106,0],["lHand",11,.193,.85,0],
    ["rShoulder",2,-.193,1.389,0],["rElbow",13,-.193,1.106,0],["rHand",14,-.193,.85,0]
  ];
  const torsoWeight = y => y<1.06 ? [0,1,clamp((y-.90)/.16,0,1)] : [1,2,clamp((y-1.06)/.22,0,1)];
  function kneeWeight(y,leg){
    if(y<.19)return [leg+2,leg+1,smoothstep(clamp((y-.09)/.10,0,1))];
    if(y>.77)return [leg,0,smoothstep(clamp((y-.77)/.14,0,1))];
    return [leg,leg+1,smoothstep(clamp((.545-y)/.16,0,1))];
  }
  function lowerWeight(y,x) {
    if(y<.70)return kneeWeight(y,x>=0?4:7);
    const hip=smoothstep(clamp((y-.74)/.17,0,1)),left=smoothstep(clamp((x+.055)/.11,0,1));
    return {j:[0,4,7,0],w:[hip,(1-hip)*left,(1-hip)*(1-left),0]};
  }
  function drapeWeight(y,x) {
    if(y>=.57){
      // Loose cloth bends over the whole upper thigh. A tight hip-only blend
      // turns a lifted thigh into an inverted fold at the waist during a run.
      const leg=smoothstep(clamp((.92-y)/.35,0,1)),left=smoothstep(clamp((x+.055)/.11,0,1));
      return {j:[0,4,7,0],w:[1-leg,leg*left,leg*(1-left),0]};
    }
    const left=smoothstep(clamp((x+.055)/.11,0,1)),a=kneeWeight(y,4),b=kneeWeight(y,7);
    return {j:[a[0],a[1],b[0],b[1]],w:[left*(1-a[2]),left*a[2],(1-left)*(1-b[2]),(1-left)*b[2]]};
  }
  const armWeight = (y,arm) => [arm,arm+1,clamp((1.16-y)/.108,0,1)];
  function makeBones() {
    const bones=[];
    for (const [name,parent,x,y,z] of joints) {
      const b=new T.Bone(); b.name=name;
      if(parent<0) b.position.set(x,y,z);
      else {const p=joints[parent];b.position.set(x-p[2],y-p[3],z-p[4]);bones[parent].add(b);}
      bones.push(b);
    }
    return bones;
  }
  function unpack(base64,Type) {
    const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));
    return new Type(bytes.buffer);
  }
  let decoded;
  function anatomy() {
    if(decoded) return decoded;
    const data=window.C72HumanAnatomy;
    decoded={reference:data.meanSkin};
    for(const name of ["head","hand","headLow","handLow"]) {
      const g=data[name];
      if(g) decoded[name]={p:unpack(g.p,Int16Array),rgb:unpack(g.rgb,Uint8Array),i:unpack(g.i,Uint16Array),uv:g.uv?unpack(g.uv,Uint16Array):null};
    }
    decoded.lowerBody={p:unpack(data.lowerBody.p,Int16Array),i:unpack(data.lowerBody.i,Uint16Array)};
    return decoded;
  }

  function addTrousers(builder,col,tunic) {
    const src=anatomy().lowerBody,base=builder.p.length/3;
    for(let i=0;i<src.p.length;i+=3){
      const x=src.p[i]/10000,y=src.p[i+1]/10000,z=src.p[i+2]/10000;
      builder.vertex(x,y,z,col,lowerWeight(y,x),tunic?1:3,(x+.20)/.40,(y-.095)/.83);
    }
    for(let i=0;i<src.i.length;i+=3){
      const tri=[src.i[i],src.i[i+1],src.i[i+2]];
      // Hidden waistband faces cannot poke through the fitted kameez waist.
      if(tunic&&tri.every(n=>src.p[n*3+1]>8200))continue;
      builder.i.push(...tri.map(n=>base+n));
    }
  }

  function addScarf(builder,rows,col,weight) {
    function section(y){
      let n=1;while(n<rows.length-1&&rows[n][0]<y)n++;
      const a=rows[n-1],b=rows[n],t=clamp((y-a[0])/(b[0]-a[0]),0,1);
      return a.map((v,i)=>T.MathUtils.lerp(v,b[i],t));
    }
    const path=[];
    // A short front end and longer back drape keep the orna clear of the
    // hip crease while leaving the kameez free to open at its side vents.
    for(let y=.965;y<1.405;y+=.025)path.push([y,1]);
    path.push([1.405,1],[1.425,.75],[1.449,.26],[1.452,-.22],[1.43,-.75],[1.405,-1]);
    for(let y=1.38;y>.73;y-=.025)path.push([y,-1]);
    const columns=builder.distant?4:8,base=builder.p.length/3;
    path.forEach(([y,front],k)=>{
      const [,cx,cz,rx,rz]=section(y),centre=.048+.049*smoothstep(clamp((y-.72)/.68,0,1));
      for(let a=0;a<=columns;a++){
        const u=a/columns,x=centre+(u-.5)*.066;
        const depth=rz*Math.sqrt(Math.max(.055,1-((x-cx)/rx)**2));
        const z=cz+front*(depth+.016+.002*Math.sin(u*Math.PI));
        builder.vertex(x,y,z,col,weight(y,x,z),9,u,k/(path.length-1));
        if(k&&a<columns){const i=base+k*(columns+1)+a,j=i-columns-1;builder.i.push(j,j+1,i+1,j,i+1,i);}
      }
    });
  }

  function clothClearance(geometry) {
    // Corrective cloth shapes, not joint animation: a raised thigh needs a
    // little extra room inside a loose kameez, especially beside the side vent.
    const p=geometry.attributes.position,parts=geometry.userData.parts;
    const targets=Array.from({length:4},()=>new Float32Array(p.count*3));
    for(const part of parts.filter(p=>p.name==="shirt"||p.name==="scarf")){
      for(let i=part.start;i<part.start+part.count;i++){
        const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
        const height=smoothstep(clamp((.93-y)/.15,0,1))*smoothstep(clamp((y-.49)/.16,0,1));
        const front=z>0,arc=smoothstep(clamp((Math.abs(z)-.015)/.10,0,1));
        const left=smoothstep(clamp((x+.10)/.20,0,1));
        for(let side=0;side<2;side++){
          const amount=height*arc*(side===0?left:1-left),target=targets[(front?0:2)+side];
          target[i*3+2]=(front?.170:-.050)*amount;
          target[i*3+1]=(front?.030:.008)*amount;
        }
      }
    }
    geometry.morphTargetsRelative=true;
    geometry.morphAttributes.position=targets.map((data,i)=>{
      const attribute=new T.Float32BufferAttribute(data,3);attribute.name=["left-front-cloth","right-front-cloth","left-back-cloth","right-back-cloth"][i];return attribute;
    });
  }
  function addAnatomy(builder,opt,head,side=1) {
    if(builder.distant){
      if(head){
        builder.rings([[1.461,0,.027,.043,.045],[1.500,0,.020,.071,.070],[1.56,0,.012,.085,.090],
          [1.626,0,.001,.090,.087],[1.686,0,-.006,.071,.063]],opt.skin,3,0,8);
        builder.rings([[1.598,0,-.022,.085,.072],[1.651,0,-.010,.093,.084],[1.691,0,-.008,.074,.071],[1.712,0,-.006,.038,.043]],opt.hair,3,6,8);
        if(opt.female)builder.blob([0,1.568,-.079],[.045,.052,.036],opt.hair,3,6,7,3);
      } else {
        const hand=side===1?12:15,[x,y,z]=joints[hand].slice(2);
        builder.blob([x,y-.06,z+.01],[.033,.078,.029],opt.skin,hand,0,6,3);
      }
      return;
    }
    const data=anatomy();
    const name=head?"head":"hand", src=(!opt.player&&data[name+"Low"])||data[name];
    const base=builder.p.length/3;
    const sk=color(opt.skin),ref=data.reference;
    const bone=head?3:(side===1?12:15);
    const hair=color(opt.hair);
    const curl=opt.haircut%3;
    const [ax,ay,az]=joints[bone].slice(2);
    const tmp=new T.Color();
    for(let i=0;i<src.p.length;i+=3) {
      let x=src.p[i]/4000, y=src.p[i+1]/4000, z=src.p[i+2]/4000;
      let tile=0, u=.5, v=.5, facial=head&&src.uv?1:0;
      tmp.setRGB(sk.r*Math.pow(src.rgb[i]/ref[0],2.05),sk.g*Math.pow(src.rgb[i+1]/ref[1],2.05),sk.b*Math.pow(src.rgb[i+2]/ref[2],2.05));
      if(head) {
        if(facial)tmp.copy(sk);
        x *= opt.faceWidth*(opt.female ? .95+.05*clamp((y-.045)/.12,0,1):1);
        z *= opt.faceDepth;
        const sideAngle = Math.atan2(x, z+.004);
        const front = (1+Math.cos(sideAngle))/2;
        const hairline = .075+.117*Math.pow(front,2.2) + .009*Math.sin(3*sideAngle+.4*curl)
          + (curl===1 ? .013*Math.sin(sideAngle*2-.7)*Math.pow(front,3) : 0);
        // The groom follows the anatomical scalp, with a swept hairline and a little crown lift.
        if(y>hairline && (y>.165 || Math.abs(x)>.055 || z<.013)) {
          const puff=clamp((y-hairline)/.025,0,1);
          x*=1+.052*puff; z=(z-.002)*(1+.065*puff)+.002; y+=(.007+.007*curl)*puff;
          const streak=.83+.22*Math.sin(sideAngle*38+y*33)+.07*Math.cos(sideAngle*55-y*16);
          tmp.copy(hair).multiplyScalar(streak); tile=6;facial=0;
          u=.5+sideAngle/TAU;v=clamp(y/.29,0,1);
        }
        if(opt.moustache && y>.084 && y<.098 && z>.095 && Math.abs(x)<.031 && Math.abs(x)>.004) {
          tmp.lerp(hair,.77);facial*=.23;
        }
      } else { x*=side; }
      const vertex=builder.vertex(ax+x,ay+y,az+z,tmp,bone,tile,u,v);
      if(head&&src.uv){
        const uv=(i/3)*2;builder.face[vertex*3]=src.uv[uv]/65535;builder.face[vertex*3+1]=src.uv[uv+1]/65535;builder.face[vertex*3+2]=facial;
      }
    }
    for(let i=0;i<src.i.length;i+=3) {
      const a=base+src.i[i],b=base+src.i[i+1],c=base+src.i[i+2];
      builder.i.push(a,head||side===1?b:c,head||side===1?c:b);
    }
    if(!head) return;
    // The eye shells sit just behind the open eyelids of the source mesh.
    for(const s of [-1,1]) {
      const ex=s*.0308*opt.faceWidth, ey=ay+.1384, ez=.0906*opt.faceDepth;
      builder.blob([ex,ey,ez],[.0137,.0135,.0137],"#cabba3",3,0,12,7);
      builder.blob([ex,ey,ez+.0128],[.0065,.0065,.0022],"#463526",3,0,10,6);
      builder.blob([ex,ey,ez+.0145],[.0031,.0034,.0014],"#231e1c",3,0,8,5);
      builder.blob([ex-.0021,ey+.0025,ez+.0153],[.00145,.00145,.0007],"#e8dbc6",3,0,6,4);
      builder.strap([[ex+s*.015,ey+.014,ez+.005],[ex+s*.005,ey+.018,ez+.012],[ex-s*.013,ey+.017,ez+.015]],.006,opt.hair,3,6);
    }
    if(opt.female && opt.haircut%3!==1) {
      builder.blob([0,ay+.129,-.076],[.048,.046,.042],opt.hair,3,6,15,9);
      if(opt.haircut%2===0) builder.blob([.01,ay+.054,-.089],[.028,.068,.025],opt.hair,3,6,12,9);
    }
  }

  const wardrobe = new Map();
  function outfit(seed,player,distant=false,police=false) {
    const key=player?"player":police?20:seed%27,storage=(distant?"distant":"")+(police?"police":key);
    if(wardrobe.has(storage)) return wardrobe.get(storage);
    const rand=randomFrom((player?72:key+1)*773);
    const female=!player && !police && [1,4,7,8,12,15,17].includes(key);
    const tunic=!player && !police && (female || key%5===2);
    const wrap=!player && !police && !female && key%3===0;
    const shirt=police?"#438f88":player?"#287f79":(female?sari:cloth)[Math.floor(rand()*(female?sari:cloth).length)];
    const trousers=police?"#24354c":player?"#344758":darks[Math.floor(rand()*darks.length)];
    const sk=player?"#aa7351":skin[Math.floor(rand()*skin.length)];
    const hair=["#241e1b","#302724","#242220"][Math.floor(rand()*3)];
    const opt={player,female,skin:sk,hair,haircut:Math.floor(rand()*5),moustache:!female&&!player&&key%4===0,
      faceWidth:.94+rand()*.11,faceDepth:.96+rand()*.08};
    const b=new Tailor(distant);
    addAnatomy(b,opt,true);
    b.rings([[1.39,0,-.008,.068,.053],[1.44,0,0,.054,.048],[1.53,0,.002,.050,.046]],sk,3,0);
    const waist=female?.145:.160,shoulder=female?.161:.180;
    const shirtRows=[...(tunic?[[.57,0,.002,.222,.174],[.64,0,.001,.218,.172],[.72,0,0,.213,.170],
      [.79,0,-.001,.207,.166],[.84,0,-.001,.201,.160],[.89,0,0,.180,.132]]:
      [[.874,0,.003,.189,.143],[.888,0,.002,.185,.139]]),
      [.95,0,0,waist,.109],[1.04,0,-.002,waist-.005,.102],[1.21,0,-.002,shoulder-.017,.123],
      [1.31,0,.004,shoulder+.005,.124],[1.375,0,0,shoulder+.012,.10],
      [1.415,0,0,shoulder*.70,.070],[1.432,0,0,.070,.054]];
    const shirtWeight=(y,x)=>tunic&&y<.94?drapeWeight(y,x):torsoWeight(y);
    if(tunic){
      for(let i=shirtRows.length-2;i>=0;i--){
        const a=shirtRows[i],next=shirtRows[i+1];if(a[0]>=.95)continue;
        const steps=Math.ceil((next[0]-a[0])/.025),extra=[];
        for(let n=1;n<steps;n++)extra.push(a.map((v,j)=>T.MathUtils.lerp(v,next[j],n/steps)));
        shirtRows.splice(i+1,0,...extra);
      }
    }
    b.part("shirt",()=>tunic?b.tunic(shirtRows,shirt,shirtWeight,female?4:1):
      b.rings(shirtRows,shirt,shirtWeight,1,28,.009,1,false,16));
    b.rings([[1.417,0,.004,.077,.060],[1.445,0,.005,.066,.052]],player?"#194b4c":shirt,2,1,16,0,1,false);
    if(!female) {
      for(const side of [-1,1]){
        // The two folded collar points flank the open neck of the shirt.
        const p=b.vertex(side*.059,1.444,.037,shirt,2,1),q=b.vertex(side*.099,1.414,.074,shirt,2,1),
          r=b.vertex(side*.036,1.355,.112,player?"#54918a":shirt,2,1),s=b.vertex(side*.011,1.412,.076,shirt,2,1);
        b.i.push(p,q,r,p,r,s);
      }
      if(!police){ // Shirt pockets and buttons are concealed beneath the duty vest.
      b.strap([[0,1.425,.057],[0,1.371,.103],[0,1.309,.130],[0,1.19,.119],[0,1.04,.105],[0,.907,.117]],
        player?.009:.006,player?"#c7bc91":"#7d8075",torsoWeight);
      for(const y of [1.34,1.265,1.18]) b.blob([0,y,.125],[.0028,.0032,.0028],"#cfbd91",2,0,6,3);
      b.strap([[.088,1.214,.111],[.088,1.236,.121],[.088,1.294,.122]],.065,shirt,2,1);
      b.strap([[.088,1.295,.124],[.088,1.287,.125]],.068,player?"#427d78":shirt,2,8);
      }
    }
    if(!wrap)b.part("trousers",()=>addTrousers(b,trousers,tunic));
    for(const side of [-1,1]) {
      const leg=side===1?4:7,arm=side===1?10:13,x=side*.092,ax=side*.193;
      if(wrap)b.rings([[.073,x,0,.036,.038],[.138,x,-.002,.034,.039],[.28,x,-.009,.052,.065],
        [.373,x,-.008,.053,.064],[.466,x,.008,.050,.055]],sk,y=>kneeWeight(y,leg),0,16);
      b.rings([[.012,x,.037,.057,.127],[.034,x,.041,.060,.133],[.061,x,.036,.060,.127],
        [.083,x,.018,.056,.103],[.115,x,-.013,.049,.063]],
        player?"#504b44":wrap?sk:"#423d36",leg+2,5,14);
      b.rings([[.008,x,.038,.058,.129],[.024,x,.041,.061,.135]],player?"#bfb49c":"#514c45",leg+2,7,14);
      if(wrap)b.strap([[x-.028,.051,.129],[x,.074,.082],[x+.019,.087,.041]],.019,"#725d40",leg+2,5);
      else for(const y of [.075,.082,.089])b.strap([[x,.071,.083],[x,y,.073]],.051,"#b6aa95",leg+2,7);
      const cuff=player||tunic||police?1.025:1.201;
      // Skin ends inside the cuff, so upper arms cannot poke through the cloth.
      const armRows=[[.841,ax,.008,.029,.032],[.905,ax,.005,.034,.039],[1.017,ax,0,.041,.044],[1.105,ax,-.002,.038,.041],[1.212,ax,0,.050,.051]].filter(row=>row[0]<cuff);
      armRows.push([cuff+.012,ax,0,cuff<1.1?.041:.048,cuff<1.1?.044:.052]);
      b.rings(armRows,sk,y=>armWeight(y,arm),0,16);
      b.part(side===1?"left-sleeve":"right-sleeve",()=>b.rings([[cuff,ax,0,cuff<1.1?.050:.058,cuff<1.1?.056:.065],[cuff+.033,ax,0,.055,.064],
        [1.28,ax,0,.061,.070],[1.350,ax-side*.007,0,.064,.073],[1.388,ax-side*.022,0,.057,.065],
        [1.405,ax-side*.040,0,.038,.050]],shirt,y=>armWeight(y,arm),female?10:1,20,.009,1,false));
      b.rings([[cuff-.004,ax,0,cuff<1.1?.051:.060,.066],[cuff+.021,ax,0,.055,.067]],shirt,y=>armWeight(y,arm),8,20,0,1,false);
      addAnatomy(b,opt,false,side);
    }
    if(wrap)b.part("lungi",()=>b.rings([[.235,0,0,.203,.153],[.32,0,0,.201,.150],[.41,0,0,.199,.148],
      [.49,0,0,.196,.145],[.57,0,0,.193,.142],[.65,0,0,.190,.138],[.73,0,-.001,.187,.135],
      [.81,0,-.002,.182,.130],[.895,0,-.002,.171,.118]],
      cloth[(key+3)%cloth.length],drapeWeight,2,32,.018,1,false,16));
    if(female) {
      const scarf=["#d0a154","#cca09a","#8bb1a0","#b6846b"][key%4];
      b.part("scarf",()=>addScarf(b,shirtRows,scarf,shirtWeight));
    }
    if(police){
      // Teal duty shirt, navy trousers, reflective traffic vest and peaked cap.
      const vestRows=[[1.02,0,-.003,.178,.125],[1.21,0,0,.198,.148],
        [1.31,0,.002,.207,.151],[1.38,0,0,.205,.125]];
      b.rings(vestRows,"#bad557",torsoWeight,7,24,.004,1,false,16);
      const vestEdge=y=>{
        let row=1;while(row<vestRows.length-1&&vestRows[row][0]<y)row++;
        const a=vestRows[row-1],next=vestRows[row],t=(y-a[0])/(next[0]-a[0]);
        return [y,0,T.MathUtils.lerp(a[2],next[2],t),T.MathUtils.lerp(a[3],next[3],t)+.0025,T.MathUtils.lerp(a[4],next[4],t)+.0025];
      };
      for(const y of [1.08,1.24])b.rings([vestEdge(y),vestEdge(y+.026)],"#e3e7cf",torsoWeight,7,24,0,1,false,16);
      b.rings([[1.652,0,-.009,.097,.093],[1.697,0,-.014,.106,.100],[1.715,0,-.02,.092,.088]],"#203947",3,7,22);
      b.blob([0,1.655,.090],[.087,.009,.073],"#263337",3,5,18,4);
      b.strap([[0,1.67,.087],[0,1.698,.084]],.021,"#d1b875",3,5);
      b.strap([[.085,1.26,.141],[.085,1.292,.141]],.047,"#213746",2,5);
      b.strap([[-.094,1.27,.142],[-.094,1.299,.139]],.038,"#f2ead1",2,5);
    }
    if(player) {
      // Rakib's canvas schoolbag, leather base, pocket flap and shoulder straps.
      for(const side of [-1,1]) b.strap([[side*.13,1.115,.098],[side*.142,1.23,.113],[side*.15,1.353,.092],
        [side*.125,1.422,0],[side*.135,1.367,-.095],[side*.110,1.14,-.145]],.041,"#755031",2);
      b.rings([[.971,0,-.143,.103,.056],[.990,0,-.155,.127,.072],[1.035,0,-.163,.137,.078],
        [1.179,0,-.163,.137,.079],[1.276,0,-.153,.128,.072],[1.316,0,-.139,.113,.065],[1.329,0,-.135,.090,.051]],"#ba8c53",2,7,24,.009,.51);
      b.rings([[.970,0,-.144,.104,.058],[.989,0,-.157,.128,.073],[1.016,0,-.161,.135,.079]],"#7b6247",2,5,24,0,.51);
      b.rings([[1.018,0,-.230,.099,.024],[1.029,0,-.238,.117,.035],[1.100,0,-.240,.118,.035],
        [1.137,0,-.235,.112,.033],[1.147,0,-.226,.096,.028]],"#a47c4c",2,7,20,.009,.43);
      b.strap([[0,1.112,-.276],[0,1.117,-.276]],.209,"#534936",2,5);
      b.strap([[-.078,1.116,-.278],[-.078,1.104,-.282],[-.084,1.092,-.284]],.006,"#c8b27f",2,5);
      b.strap([[0,1.282,-.225],[0,1.287,-.221]],.21,"#6e5942",2,5);
      b.strap([[-.052,1.321,-.147],[-.033,1.350,-.148],[.014,1.351,-.148],[.042,1.323,-.148]],.011,"#6c583e",2,7);
      b.strap([[.032,1.192,-.244],[.032,1.225,-.244]],.065,"#416957",2,7);
      b.blob([.035,1.209,-.246],[.011,.011,.0025],"#c05347",2,1,10,5);
    }
    const geometry=b.finish();if(tunic)clothClearance(geometry);
    const kit={geometry,wrap,tunic,scale:player?1.01:(female?.946:.99)+rand()*.07,bulk:.93+rand()*.14};
    wardrobe.set(storage,kit);return kit;
  }
  const objectMaterials=new Map();
  function surfaceFor(hex) {
    if(!objectMaterials.has(hex))objectMaterials.set(hex,new T.MeshStandardMaterial({color:hex,roughness:.66}));
    return objectMaterials.get(hex);
  }
  const phoneBody=new T.BoxGeometry(.061,.118,.010), screen=new T.BoxGeometry(.052,.091,.003);
  const cupGeo=new T.CylinderGeometry(.03,.023,.059,10),teaGeo=new T.CircleGeometry(.026,12);
  const toolsOfTrade=new Map(),up=V(0,1,0);
  function accessory(type,seed) {
    const key=type+seed%3;
    if(!toolsOfTrade.has(key)){
      const group=new T.Group();
      function box(x,y,z,w,h,d,col) {
        const m=new T.Mesh(new T.BoxGeometry(w,h,d),surfaceFor(col));m.position.set(x,y,z);group.add(m);
      }
      function stick(a,b,r,end,col){
        const delta=V(...b).sub(V(...a)),m=new T.Mesh(new T.CylinderGeometry(end,r,delta.length(),7),surfaceFor(col));
        m.position.copy(V(...a).lerp(V(...b),.5));m.quaternion.setFromUnitVectors(up,delta.normalize());group.add(m);
      }
      if(type==="parcel") {
        box(0,0,0,.35,.213,.265,0xb29468);box(.041,.001,0,.039,.218,.269,0xd9c092);
        box(0,.108,0,.35,.003,.009,0x846f51);box(-.084,.014,.134,.075,.049,.004,0xece4cd);
        for(let i=0;i<4;i++)box(-.107+.009*i,.015,.137,.004,.022,.002,0x414645);
      } else if(type==="tote"){
        const shade=[0xaf965e,0xbb6e52,0x649788][seed%3];
        box(0,-.27,0,.113,.238,.251,shade);box(0,-.364,0,.115,.035,.252,0x666346);
        for(const dx of [-.05,.05]){
          stick([dx,-.154,-.089],[dx,-.053,-.027],.008,.008,0xb5a17a);
          stick([dx,-.053,-.027],[dx,-.053,.028],.008,.008,0xb5a17a);
          stick([dx,-.053,.028],[dx,-.154,.089],.008,.008,0xb5a17a);
          box(dx*1.14,-.263,0,.004,.019,.235,0xc7ac79);
        }
      } else if(type==="sweep"){
        stick([0,.23,0],[0,-.62,.01],.011,.012,0xad8b53);
        for(let j=0;j<13;j++){
          const dx=(j%5-2)*.031,dz=(Math.floor(j/5)-1)*.035;
          stick([dx*.12,-.54,dz*.1],[dx+.035,-.91+.015*(j%3),dz+.09],.012,.008,j%2?0x998146:0xb99e65);
        }
        stick([0,-.55,.015],[.005,-.59,.021],.036,.038,0x855d3a);
      } else if(type==="books"){
        for(let i=0;i<3;i++){box(0,i*.027,0,.155,.022,.218,[0x41616d,0xb16e51,0x5f7156][i]);box(.001,i*.027+.001,.004,.152,.014,.21,0xcec4a3);}
      }
      C72Batch.staticGroup(group);toolsOfTrade.set(key,group);
    }
    return toolsOfTrade.get(key).clone();
  }
  function create({role="npc",seed=0,activity,distant=false}={}) {
    const player=role==="player", police=role==="police", kit=outfit(seed,player,distant,police),root=new T.Group(),bones=makeBones();
    const mesh=new T.SkinnedMesh(kit.geometry,sharedMaterial());
    mesh.add(bones[0]); mesh.bind(new T.Skeleton(bones));mesh.castShadow=!distant;mesh.receiveShadow=true;
    mesh.boundingSphere=new T.Sphere(V(0,.88,0),1.24);
    if(kit.tunic){
      mesh.onBeforeRender=mesh.onBeforeShadow=()=>{
        for(let side=0;side<2;side++){
          const angle=bones[side===0?4:7].rotation.x;
          mesh.morphTargetInfluences[side]=smoothstep(clamp((-angle-.08)/.85,0,1));
          mesh.morphTargetInfluences[side+2]=smoothstep(clamp((angle-.08)/.65,0,1));
        }
      };
    }
    root.add(mesh);mesh.scale.set(kit.bulk*kit.scale,kit.scale,kit.scale);
    if(role==="rider"){
      const helmet=new T.Mesh(new T.SphereGeometry(.111,20,12,0,TAU,0,Math.PI*.61),surfaceFor(seed%2?0x2a3339:0x9b3329));
      helmet.position.set(0,.158,-.008);bones[3].add(helmet);
      const visor=new T.Mesh(new T.SphereGeometry(.113,18,8,-.73,1.46,.75,1.0),new T.MeshStandardMaterial({color:0x344e55,roughness:.21,metalness:.2,transparent:true,opacity:.73,side:T.DoubleSide}));
      visor.rotation.y=Math.PI/2;visor.position.copy(helmet.position);bones[3].add(visor);
    }
    let phone,cup,handProp;
    if(["phone","photo","scroll","pay"].includes(activity)) {
      phone=new T.Mesh(phoneBody,surfaceFor(0x293337));phone.position.set(.005,-.043,.018);
      const light=new T.Mesh(screen,surfaceFor(0x86acb2));light.position.z=-.006;phone.add(light);
      bones[15].add(phone);
    }
    if(police){
      const baton=new T.Mesh(new T.CylinderGeometry(.012,.015,.37,8),surfaceFor(0xf0eee0));baton.position.set(0,-.19,.02);bones[15].add(baton);
    }
    if(activity==="tea") {
      cup=new T.Mesh(cupGeo,surfaceFor(0xc6ad86));cup.position.set(-.012,-.044,.023);
      const tea=new T.Mesh(teaGeo,surfaceFor(0x84542d));tea.rotation.x=-Math.PI/2;tea.position.y=.03;cup.add(tea);bones[15].add(cup);
    }
    if(["parcel","tote","sweep","books"].includes(activity)){
      handProp=accessory(activity,seed);
      if(activity==="parcel"){handProp.position.set(0,-.18,.225);bones[2].add(handProp);}
      else if(activity==="books"){handProp.position.set(.119,-.10,.17);bones[2].add(handProp);}
      else {handProp.position.set(activity==="tote"?-.025:.004,-.044,.018);bones[15].add(handProp);}
    }
    function setDetail(near) {
      if(player||distant===!near)return;
      distant=!near;mesh.geometry=outfit(seed,false,distant,police).geometry;mesh.castShadow=near;
    }
    let last=-1,airWeight=0,gestureWeight=0,gestureAction="idle",groundLift=0;
    const gait=C72Gait.create({scale:kit.scale,seed});
    const override=new T.Quaternion(),rotation=new T.Euler(),solePoint=V();
    function pose(action,time,speed=0,motion={}) {
      const fresh=last<0,dt=fresh?1/60:clamp(time-last,0,.10);last=time;
      const locomotion=gait.update(time,action,speed),beat=Math.sin(time*1.65+seed),step=Math.sin(locomotion.phase);
      const walk=locomotion.amount>.05;
      for(let i=0;i<16;i++)bones[i].quaternion.copy(locomotion.q[i]);
      bones[0].position.copy(locomotion.hip);
      // Idle, walking and running are complete authored poses. The
      // street activities below only overlay the joints needed for that action.
      function rotate(i,x=0,y=0,z=0,weight=1){
        override.setFromEuler(rotation.set(x,y,z,"XYZ"));bones[i].quaternion.slerp(override,clamp(weight,0,1));
      }
      const gesture=!["idle","walk","run","jump"].includes(action);
      if(gesture)gestureAction=action;
      gestureWeight+=((gesture?1:0)-gestureWeight)*(fresh?1:1-Math.exp(-dt*13));
      let leftArm=.075,rightArm=-.025,leftElbow=-.16,rightElbow=-.21,spread=.10,headX=-.019,headY=0,bend=.012;
      const acting=gestureAction,w=gestureWeight;
      if(w>.001){
        if(acting==="tea") {const sip=(1+Math.sin(time*1.05+seed))*.5;rightArm=-.39-sip*.61;rightElbow=-1.11-.90*sip;headX=-sip*.08;}
        else if(acting==="phone"){rightArm=-.49;rightElbow=-2.43;headX=.06;headY=-.17;}
        else if(acting==="scroll"||acting==="photo"){
          const photo=acting==="photo";leftArm=photo?-1.10:-.61;rightArm=leftArm-.05;leftElbow=photo?-1.37:-1.28;rightElbow=leftElbow+beat*.075;
          headX=photo?.02:.25;headY=.035*beat;spread=.018;
        }else if(acting==="work"){bend=.23+.19*beat;headX=.18;rightArm=-.65-.42*beat;leftArm=-.74+.19*beat;rightElbow=-.64-.24*beat;leftElbow=-.65;}
        else if(acting==="talk"||acting==="argue"){
          const big=acting==="argue";rightArm=-.17-(1+beat)*(big?.36:.21);rightElbow=-.77-.51*beat;
          leftArm=-.13+beat*.18;leftElbow=-.29+(big?.35:.15)*beat;spread=big?.28:.14;headY=.13*beat;
        }else if(acting==="sweep"){bend=.24+.11*beat;headX=.26;headY=-.18*beat;rightArm=-.17-.25*beat;rightElbow=-.27;spread=.29+.17*beat;}
        else if(acting==="hail"){rightArm=-1.68-.14*beat;rightElbow=-.87-.17*beat;spread=.27;headY=-.19;}
        else if(acting==="browse"){headX=.10;headY=.25*beat;leftArm=-.23-.28*(1+beat);leftElbow=-.65;}
        else if(acting==="pay"){headX=.22;rightArm=-.75-.28*beat;rightElbow=-1.12+.16*beat;leftElbow=-.65;spread=.06;}
        else if(acting==="traffic"){
          const cycle=(time+seed)%12;rightArm=cycle<5?-1.22:-.58;rightElbow=cycle<5?-.12:-1.38;
          leftArm=cycle<5?-.18:-.92;leftElbow=-.22;spread=.36;headY=.38*Math.sin(time*.48);
        }else if(acting==="ride"){
          rotate(4,-1.18,0,0,w);rotate(7,-1.18,0,0,w);rotate(5,1.87,0,0,w);rotate(8,1.87,0,0,w);
          rotate(6,-.57,0,0,w);rotate(9,-.57,0,0,w);bones[0].position.lerp(V(0,.85,0),w);
          leftArm=rightArm=-.87;leftElbow=rightElbow=-.45;spread=.19;headY=.025*beat;bend=.14;
        }
        rotate(1,bend,0,0,w);rotate(3,headX,headY,0,w);
        rotate(10,leftArm,0,spread,w);rotate(13,rightArm,0,-spread,w);rotate(11,leftElbow,0,0,w);rotate(14,rightElbow,0,0,w);
      }
      airWeight+=((action==="jump"?1:0)-airWeight)*(1-Math.exp(-dt*15));
      if(airWeight>.001){
        const rise=clamp((motion.vy||0)/5.85,-1,1),leftLeg=-.30-.20*Math.max(0,rise),leftKnee=.40+.25*Math.max(0,rise);
        rotate(4,leftLeg,0,0,airWeight);rotate(7,-.10,0,0,airWeight);rotate(5,leftKnee,0,0,airWeight);rotate(8,.30,0,0,airWeight);
        rotate(6,-leftKnee*.53-leftLeg*.36,0,0,airWeight);rotate(9,-.123,0,0,airWeight);
        rotate(10,-.48-.20*rise,0,.22,airWeight);rotate(13,-.43-.20*rise,0,-.22,airWeight);
        bones[0].position.y=T.MathUtils.lerp(bones[0].position.y,.85,airWeight);
      }
      bones[0].position.y-=(motion.landing||0)*.025;
      // Held props stay in the hands without replacing the lower-body clip.
      if(activity==="parcel"){
        rotate(10,-.28,0,-.06);rotate(13,-.29,0,.06);rotate(11,-1.52);rotate(14,-1.5);rotate(1,.06);
        if(!walk)rotate(3,.09+.035*beat);
      }else if(activity==="tote"){rightArm=.11+(walk?.08*step:.035*beat);rightElbow=-.10;spread=.16;rotate(13,rightArm,0,-spread);rotate(14,rightElbow);}
      else if(activity==="books"){rotate(10,-.20,0,-.015);rotate(11,-1.8);}
      if(phone){phone.visible=["phone","photo","scroll","pay"].includes(action);phone.rotation.set(action==="phone"?0:.4,action==="phone"?1.15:0,action==="photo"?Math.PI/2:0);}
      if(cup){cup.visible=action==="tea";cup.rotation.x=-(rightArm+rightElbow)*.85;}
      if(activity==="sweep")handProp.rotation.set(-(bend+rightArm+rightElbow)-.09,.28*beat,spread-.27*beat);
      if(activity==="tote")handProp.rotation.set(-(rightArm+rightElbow)*.78,0,spread);
      const ground=motion.ground||window.C72Streets?.groundAt;
      if(ground&&role!=="rider"&&action!=="ride"){
        // Cross-fading two valid poses can lower a sole between their contacts.
        // Correct only the body's height; never rewrite the animated knee/ankle angles.
        let needed=0;
        for(const ankle of [6,9])for(const tip of [-.085,.17]){
          solePoint.set(0,-.067,tip);
          for(let joint=ankle;joint>=0;joint=joints[joint][1])solePoint.applyQuaternion(bones[joint].quaternion).add(bones[joint].position);
          solePoint.multiply(mesh.scale).applyQuaternion(root.quaternion).add(root.position);
          needed=Math.max(needed,ground(solePoint.x,solePoint.z)+.004-solePoint.y);
        }
        needed=clamp(needed,0,.16);
        groundLift=needed>groundLift?needed:groundLift+(needed-groundLift)*(1-Math.exp(-dt*12));
        bones[0].position.y+=groundLift/kit.scale;
      }
    }
    pose("idle",0);gait.reset();last=-1;groundLift=0;
    return {root,pose,setDetail,reset(){last=-1;airWeight=gestureWeight=groundLift=0;gestureAction="idle";gait.reset();}};
  }
  const seatedHeads=new Map();
  function seatedHead(seed,skinTone){
    const key=seed%7+"/"+skinTone;
    if(!seatedHeads.has(key)){
      const builder=new Tailor();
      addAnatomy(builder,{player:true,female:false,skin:skinTone,hair:"#28221d",haircut:seed%3,faceWidth:.98,faceDepth:1,moustache:seed%4===0},true);
      const geometry=builder.finish();geometry.translate(0,-1.443,0);
      seatedHeads.set(key,{geometry,material:sharedMaterial()});
    }
    return seatedHeads.get(key);
  }
  window.C72People=Object.freeze({create,seatedHead});
})();
