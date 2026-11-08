/* Original Bengali street print. All candidates and advertising names are fictional. */
window.C72StreetArt=(()=>{
  "use strict";
  const T=THREE,S=C72Streets,materials=new Map(),portraits=new Map();
  function portrait(seed){
    if(portraits.has(seed))return portraits.get(seed);
    // Render the existing textured head into paper artwork without another GPU
    // context, file fetch, image decoder, or online font dependency.
    const canvas=document.createElement("canvas");canvas.width=240;canvas.height=300;
    const ctx=canvas.getContext("2d"),pixels=ctx.createImageData(240,300),depth=new Float32Array(240*300);depth.fill(-Infinity);
    const geo=C72People.seatedHead(seed,0xad7958).geometry,a=geo.attributes,tri=geo.index.array,face=C72Atlases.get("face").image;
    const projected=[];
    for(let i=0;i<a.position.count;i++){
      const x=a.position.getX(i),y=a.position.getY(i),z=a.position.getZ(i);
      projected.push([(x+.125)/.25*240,(.285-y)/.30*300,z]);
    }
    for(let t=0;t<tri.length;t+=3){
      const ids=[tri[t],tri[t+1],tri[t+2]],p=ids.map(i=>projected[i]),[a0,b,c]=p;
      const denom=(b[1]-c[1])*(a0[0]-c[0])+(c[0]-b[0])*(a0[1]-c[1]);if(Math.abs(denom)<.001)continue;
      const x0=Math.max(0,Math.floor(Math.min(...p.map(v=>v[0])))),x1=Math.min(239,Math.ceil(Math.max(...p.map(v=>v[0]))));
      const y0=Math.max(0,Math.floor(Math.min(...p.map(v=>v[1])))),y1=Math.min(299,Math.ceil(Math.max(...p.map(v=>v[1]))));
      for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
        const u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/denom,v=((c[1]-a0[1])*(x-c[0])+(a0[0]-c[0])*(y-c[1]))/denom,w=1-u-v;
        if(Math.min(u,v,w)<0)continue;const weights=[u,v,w],z=u*a0[2]+v*b[2]+w*c[2],index=y*240+x;if(z<depth[index])continue;depth[index]=z;
        const interp=(attr,k)=>ids.reduce((sum,id,j)=>sum+attr.array[id*attr.itemSize+k]*weights[j],0);
        const light=.56+.44*Math.max(0,interp(a.normal,0)*-.3+interp(a.normal,1)*.45+interp(a.normal,2)*.84);
        let rgb;
        if(interp(a.faceCoord,2)>.5){
          const tx=T.MathUtils.clamp(Math.round(interp(a.faceCoord,0)*(face.width-1)),0,face.width-1),ty=T.MathUtils.clamp(Math.round(interp(a.faceCoord,1)*(face.height-1)),0,face.height-1),i=(ty*face.width+tx)*4;
          rgb=[face.data[i],face.data[i+1],face.data[i+2]];
        }else rgb=[0,1,2].map(k=>Math.pow(Math.max(0,interp(a.color,k)),1/2.2)*255);
        const grey=(rgb[0]*.30+rgb[1]*.59+rgb[2]*.11)*light;
        for(let k=0;k<3;k++)pixels.data[index*4+k]=grey;pixels.data[index*4+3]=255;
      }
    }
    ctx.putImageData(pixels,0,0);portraits.set(seed,canvas);return canvas;
  }
  function print(type,billboard=false){
    const key=type+"/"+billboard;if(materials.has(key))return materials.get(key);
    const w=billboard?2048:512,h=billboard?1024:1024,rng=S.random(730+type);
    const texture=S.canvasMap(w,h,c=>{
      function label(text,x,y,size,color="#172e27",max=w*.89){c.fillStyle=color;c.font='bold '+size+'px "Nirmala UI","Noto Sans Bengali",sans-serif';c.textAlign="center";c.fillText(text,x,y,max);}
      c.fillStyle="#eee7cf";c.fillRect(0,0,w,h);
      if(billboard){
        const theme=type%3;
        c.fillStyle=["#154c3c","#c94326","#153f68"][theme];c.fillRect(0,0,w,h);
        if(theme===0){
          label("পুরান ঢাকার চা",w*.42,h*.35,205,"#ffe4a0",w*.72);
          label("এক কাপেই আড্ডা জমুক",w*.39,h*.57,96,"#fff5d7",w*.68);
          label("আসল স্বাদ • পাড়ার আড্ডা",w*.37,h*.78,69,"#d6deb7",w*.63);
          c.fillStyle="#e9c688";c.beginPath();c.ellipse(w*.81,h*.74,w*.12,h*.04,0,0,Math.PI*2);c.fill();
          c.fillStyle="#faf0ce";c.beginPath();c.moveTo(w*.72,h*.41);c.lineTo(w*.90,h*.41);c.lineTo(w*.90,h*.63);c.quadraticCurveTo(w*.90,h*.71,w*.85,h*.71);c.lineTo(w*.77,h*.71);c.quadraticCurveTo(w*.72,h*.71,w*.72,h*.63);c.closePath();c.fill();
          c.strokeStyle="#f5e6c3";c.lineWidth=23;c.beginPath();c.arc(w*.905,h*.53,51,-Math.PI/2,Math.PI/2);c.stroke();
          c.fillStyle="#713e22";c.beginPath();c.ellipse(w*.81,h*.42,w*.088,h*.023,0,0,Math.PI*2);c.fill();
          c.strokeStyle="#e9e3c091";c.lineWidth=12;for(const off of [-.04,0,.04]){c.beginPath();c.moveTo(w*(.81+off),h*.35);c.bezierCurveTo(w*(.76+off),h*.29,w*(.86+off),h*.23,w*(.81+off),h*.16);c.stroke();}
        }else if(theme===1){
          label("ঢাকা বই উৎসব",w*.5,h*.33,229,"#fff3c6");
          label("গল্পে গল্পে শহরকে জানি",w*.5,h*.54,103,"#fff7e7");
          c.fillStyle="#f3d6a0";c.fillRect(w*.18,h*.66,w*.64,h*.16);
          label("বই • গান • আড্ডা",w*.5,h*.775,82,"#7f2c26");
        }else{
          label("সাইবার নিরাপদ ঢাকা",w*.5,h*.31,180,"#fff3c6");
          label("OTP ও PIN কাউকে বলবেন না",w*.5,h*.55,113,"#f1f5e8");
          label("অচেনা লিংকে ক্লিক করার আগে ভাবুন",w*.5,h*.77,76,"#aed9d9");
        }
        c.fillStyle="#e3bc68";c.fillRect(0,h*.93,w,h*.07);label("পুরান ঢাকা  /  CYBER 72",w*.5,h*.983,39,"#243c35");
      }else if(type<2){
        c.fillStyle="#26352b";c.fillRect(15,17,w-30,113);label("মহল্লা পরিষদ নির্বাচন",w/2,71,35,"#fff6df");label("প্রার্থী পরিচিতি",w/2,111,27,"#eadbb5");
        // Printed bust and portrait, deliberately monochrome like pasted ward notices.
        c.fillStyle="#3a3a32";c.beginPath();c.moveTo(60,570);c.quadraticCurveTo(74,453,191,444);c.lineTo(321,444);c.quadraticCurveTo(437,456,452,570);c.closePath();c.fill();
        c.fillStyle="#dfdbc6";c.beginPath();c.moveTo(195,443);c.lineTo(255,556);c.lineTo(319,443);c.closePath();c.fill();
        c.drawImage(portrait(type===0?7:13),114,155,284,355);
        label(type===0?"সাইফুল করিম":"আনিস রহমান",w/2,646,51,"#142f27");
        label("পরিচ্ছন্ন মহল্লা",w/2,715,37);label("নিরাপদ পথ • নাগরিক সেবা",w/2,769,26);
        c.strokeStyle="#203329";c.lineWidth=4;c.strokeRect(24,813,w-48,105);label(type===0?"প্রতীক : লণ্ঠন":"প্রতীক : কলম",w/2,880,45);
        label("কাল্পনিক প্রার্থী • গেমের পোস্টার",w/2,971,21,"#64664f");
      }else if(type===2){
        c.fillStyle="#bd3d27";c.fillRect(0,0,w,260);label("ঢাকা",w/2,120,90,"#fff1c8");label("বই উৎসব",w/2,220,75,"#fff1c8");
        for(let i=0;i<5;i++){c.fillStyle=["#295b52","#c78236","#334e70"][i%3];c.fillRect(65+i*75,360+i%2*35,60,240-i%2*35);}
        label("পড়ি • জানি • স্বপ্ন দেখি",w/2,713,36);label("সবার জন্য বই",w/2,800,40);label("পুরান ঢাকার আড্ডা",w/2,920,28);
      }else{
        c.fillStyle="#215d59";c.fillRect(0,0,w,225);label("সতর্ক থাকুন",w/2,113,61,"#fff3d2");label("সাইবার প্রতারণা ঠেকান",w/2,184,31,"#dfecda");
        label("OTP / PIN",w/2,363,64,"#b53d29");label("গোপন রাখুন",w/2,456,65);
        label("পুরস্কারের লোভে",w/2,602,36);label("টাকা পাঠাবেন না",w/2,665,39);label("অচেনা লিংক?",w/2,791,40);label("আগে যাচাই করুন",w/2,853,39);label("সচেতন হোক আমাদের ঢাকা",w/2,967,24);
      }
      // Sun fading, paste stains and frayed paper are part of the print texture.
      for(let i=0;i<(billboard?1100:1800);i++){
        c.fillStyle=i%3?"#463b2220":"#fffae136";const x=rng()*w,y=rng()*h;c.fillRect(x,y,1+rng()*5,1+rng()*11);
      }
      c.strokeStyle="#a8956250";c.lineWidth=billboard?8:12;c.strokeRect(4,4,w-8,h-8);
    });texture.anisotropy=8;
    const material=new T.MeshStandardMaterial({map:texture,roughness:.96,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-3});
    materials.set(key,material);return material;
  }
  function build(scene,world){
    const groups=new Map(),posters=[],billboards=[],used=new Set(),rng=S.random(72081);
    function groupAt(x,z){const key=Math.floor(x/45)+"/"+Math.floor(z/45);if(!groups.has(key)){const g=new T.Group();g.name="Dhaka street print "+key;groups.set(key,g);scene.add(g);}return groups.get(key);}
    const steel=new T.MeshStandardMaterial({color:0x505d55,roughness:.78,metalness:.45});
    function bar(group,a,b,r=.045){const d=new T.Vector3(...b).sub(new T.Vector3(...a)),m=new T.Mesh(new T.CylinderGeometry(r,r,d.length(),8),steel);m.position.copy(new T.Vector3(...a).addScaledVector(d,.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());m.castShadow=true;group.add(m);}
    for(let ix=0;ix<4;ix++)for(let iz=0;iz<4;iz++){
      const x=(S.xs[ix]+S.xs[ix+1])*.5,z=(S.zs[iz]+S.zs[iz+1])*.5;
      const lot=world.lots.filter(b=>!used.has(b)&&b.h<13).sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z))[0];if(!lot)continue;used.add(lot);
      const g=new T.Group(),width=Math.min(lot.w-.5,8.0),height=width*.5,base=Math.min(lot.h+.2,8.4),face=lot.d/2+.18;
      const panel=new T.Mesh(new T.BoxGeometry(width+.17,height+.17,.15),steel);panel.position.set(0,base+height/2,face);g.add(panel);
      const ad=new T.Mesh(new T.PlaneGeometry(width,height),print((ix+iz)%3,true));ad.position.set(0,base+height/2,face+.084);g.add(ad);
      for(const side of [-1,1]){bar(g,[side*width*.34,base-2,face-.2],[side*width*.34,base+height+.04,face-.2],.063);bar(g,[side*width*.34,base-1.8,face-1.2],[side*width*.34,base+height*.7,face-.2],.035);}
      for(const y of [base-.2,base+height+.12])bar(g,[-width*.55,y,face-.13],[width*.55,y,face-.13],.035);
      g.position.set(lot.x,.19,lot.z);g.rotation.y=lot.r;groupAt(lot.x,lot.z).add(g);billboards.push({x:lot.x,z:lot.z,lot:lot.seed,width});
      const fx=Math.sin(lot.r),fz=Math.cos(lot.r),turned=Math.abs(fx)>.5;
      world.collision(lot.x+fx*face,lot.z+fz*face,turned?.20:width+.2,turned?width+.2:.20,base+height+.3,base+.1);
    }
    function sheet(x,y,z,yaw,w,h,type,tilt=0){
      const geo=new T.PlaneGeometry(w,h,4,6),p=geo.attributes.position;
      // A curled lower edge casts a small real shadow instead of floating paper.
      for(let i=0;i<p.count;i++)if(p.getY(i)<-h*.30)p.setZ(i,.012+Math.sin(i*1.7)*.009);
      geo.computeVertexNormals();const m=new T.Mesh(geo,print(type));m.position.set(x,y,z);m.rotation.set(0,yaw,tilt);groupAt(x,z).add(m);posters.push({x,z,type});
    }
    world.lots.forEach((lot,i)=>{
      if(i%2!==0)return;const fx=Math.sin(lot.r),fz=Math.cos(lot.r),sx=Math.cos(lot.r),sz=-Math.sin(lot.r);
      for(const side of [-1,1]){
        const along=side*(lot.w/2-.40),front=lot.d/2+.035;
        sheet(lot.x+fx*front+sx*along,1.31+(i%3)*.1,lot.z+fz*front+sz*along,lot.r,.60,.97,i%4,(rng()-.5)*.07);
        // A previous notice peeks out underneath the fresh pasted sheet.
        if(i%4===0)sheet(lot.x+fx*(front+.008)+sx*(along-.07),2.23,lot.z+fz*(front+.008)+sz*(along-.07),lot.r,.53,.83,(i+1)%4,-.025);
      }
    });
    for(const [i,p] of world.poles.entries()){
      const geo=new T.CylinderGeometry(.15,.15,.57,16,1,true,-.95,1.9),m=new T.Mesh(geo,print(i%4));
      m.position.set(p.x,p.y+1.9,p.z);m.rotation.y=p.yaw+Math.PI;groupAt(p.x,p.z).add(m);posters.push({x:p.x,z:p.z,type:i%4});
    }
    for(const group of groups.values())C72Batch.staticGroup(group);
    return {posters,billboards};
  }
  return {build};
})();
