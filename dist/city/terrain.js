/* A shared height field for Dhaka's worn streets, feet and tyre contacts. */
window.C72Terrain = (() => {
  "use strict";
  const T=THREE,S=C72Streets,clamp=T.MathUtils.clamp,step=.25;
  const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
  function bend(at,axes,phase) {
    for(let i=0;i<axes.length-1;i++)if(at>=axes[i]&&at<=axes[i+1]){
      const u=(at-axes[i])/(axes[i+1]-axes[i]);
      // Straight approaches leave junctions clear; the middle of each lane meanders.
      const t=clamp((u-.16)/.68,0,1);
      return 1.38*Math.sin(Math.PI*t)**2*Math.sin(Math.PI*t+phase+i*1.9);
    }
    return 0;
  }
  const bendX=(road,z)=>bend(z,S.zs,road*.037+.5);
  const bendZ=(road,x)=>bend(x,S.xs,road*.049+1.2);
  function roadDistance(x,z) {
    let distance=Infinity;
    if(z>=-166&&z<=71)for(const r of S.xs)distance=Math.min(distance,Math.abs(x-r-bendX(r,z))-S.halfX(r));
    if(x>=-161&&x<=161)for(const r of S.zs)distance=Math.min(distance,Math.abs(z-r-bendZ(r,x))-S.halfZ(r));
    return distance;
  }
  function routePoint(x,z) {
    let dx=0,dz=0;
    for(const r of S.xs)if(Math.abs(x-r)<S.halfX(r)){dx=bendX(r,z);break;}
    for(const r of S.zs)if(Math.abs(z-r)<S.halfZ(r)){dz=bendZ(r,x);break;}
    return {x:x+dx,z:z+dz};
  }
  const holes=[],bins=new Map(),rng=S.random(720420);
  function addHole(x,z,rx,rz,depth,wet=true){
    const h={x,z,rx,rz,depth,wet,seed:rng()*20};holes.push(h);
    for(let i=Math.floor((x-rx*1.6)/6);i<=Math.floor((x+rx*1.6)/6);i++)for(let j=Math.floor((z-rz*1.6)/6);j<=Math.floor((z+rz*1.6)/6);j++){
      const key=i+"/"+j;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(h);
    }
  }
  for(const x of S.xs)for(let j=0;j<4;j++)for(let n=0;n<4;n++){
    const z=S.zs[j]+10+rng()*(S.zs[j+1]-S.zs[j]-20),xx=x+bendX(x,z)+(rng()-.5)*(S.halfX(x)*1.25);
    addHole(xx,z,.55+rng()*.75,.65+rng()*1.3,.13+rng()*.17,n%4!==3);
  }
  for(const z of S.zs)for(let j=0;j<4;j++)for(let n=0;n<3;n++){
    const x=S.xs[j]+11+rng()*(S.xs[j+1]-S.xs[j]-22);
    addHole(x,z+bendZ(z,x)+(rng()-.5)*S.halfZ(z),.8+rng()*1.5,.55+rng()*.68,.14+rng()*.17,n%3!==2);
  }
  addHole(-2.7,43.8,1.25,1.65,.29);addHole(1.8,34.5,.91,1.39,.24);
  function holeRadius(h,x,z) {
    const dx=(x-h.x)/h.rx,dz=(z-h.z)/h.rz,a=Math.atan2(dz,dx);
    return Math.hypot(dx,dz)/(1+.12*Math.sin(a*5+h.seed)+.065*Math.sin(a*9-h.seed));
  }
  function baseHeight(x,z) {
    const edge=roadDistance(x,z),blend=1-smooth((edge+.45)/.85);
    const undulation=.052*Math.sin(z*.18+x*.075)+.047*Math.sin(x*.31-z*.11)+.025*Math.sin(x*.83+z*.61);
    const crown=.065*smooth(-edge/3),rut=.038*Math.sin(x*2.1+z*.19)*Math.sin(z*.52-x*.2);
    return .19*(1-blend)+(.005+undulation+crown+rut)*blend;
  }
  function rawHeight(x,z) {
    let y=baseHeight(x,z);
    for(const h of bins.get(Math.floor(x/6)+"/"+Math.floor(z/6))||[]){
      const r=holeRadius(h,x,z);
      if(r<1.3){y-=h.depth*(1-smooth((r-.20)/.84));y+=.025*Math.exp(-(((r-1.05)*9)**2));}
    }
    return y;
  }
  let heightGrid=null;
  const originX=-168-step,originZ=-168-step,columns=Math.round(336/step)+3,rows=Math.round(264/step)+3;
  function gridHeight(x,z){
    const i=Math.round((x-originX)/step),j=Math.round((z-originZ)/step);
    return heightGrid&&i>=0&&i<columns&&j>=0&&j<rows?heightGrid[j*columns+i]:rawHeight(x,z);
  }
  // Rendering and feet sample the same finer, continuous height field.
  function heightAt(x,z) {
    if(roadDistance(x,z)>.8)return .19;
    const ax=Math.floor(x/step)*step,az=Math.floor(z/step)*step,u=(x-ax)/step,v=(z-az)/step;
    const a=gridHeight(ax,az),b=gridHeight(ax+step,az),c=gridHeight(ax,az+step),d=gridHeight(ax+step,az+step);
    return u+v<=1?a+(b-a)*u+(c-a)*v:d+(c-d)*(1-u)+(b-d)*(1-v);
  }
  function asphaltTexture(){
    const texture=S.canvasMap(2048,2048,(c,w,h)=>{
      const r=S.random(10172),data=c.createImageData(w,h),tau=Math.PI*2;
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const at=(y*w+x)*4,u=x/w*tau,v=y/h*tau,grain=(r()-.5)*30;
        // Integer-frequency waves and wrapped strokes meet at every tile edge.
        const weather=4*Math.sin(2*u+v)+3*Math.cos(3*v-u)+2*Math.sin(5*u+7*v);
        data.data[at]=72+grain+weather;data.data[at+1]=69+grain+weather;data.data[at+2]=62+grain+weather;data.data[at+3]=255;
      }
      c.putImageData(data,0,0);
      for(let i=0;i<21000;i++){
        const x=r()*w,y=r()*h,sz=.8+r()*2.8;c.fillStyle=i%3?'#c2b69c45':'#22292370';
        c.beginPath();c.ellipse(x,y,sz,sz*.6,r()*tau,0,tau);c.fill();
      }
      function stroke(points,width){
        for(const dx of [-w,0,w])for(const dy of [-h,0,h]){
          c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x+dx,y+dy):c.moveTo(x+dx,y+dy));
          c.lineWidth=width+2.3;c.strokeStyle='#a1937544';c.stroke();c.lineWidth=width;c.strokeStyle='#292d28b0';c.stroke();
        }
      }
      for(let i=0;i<30;i++){
        let x=r()*w,y=r()*h,angle=r()*tau;const points=[[x,y]],length=12+Math.floor(r()*23);
        for(let j=0;j<length;j++){angle+=(r()-.5)*.6;x+=Math.cos(angle)*11;y+=Math.sin(angle)*11;points.push([x,y]);}
        stroke(points,.9+r()*1.5);
        if(i%2===0){const a=points[Math.floor(length*.55)],branch=[a];for(let j=0;j<8;j++)branch.push([a[0]+j*8,a[1]+j*6+Math.sin(j)*4]);stroke(branch,.7);}
      }
    },true);
    texture.anisotropy=8;return texture;
  }
  function whiteDividers(scene){
    const paint=S.canvasMap(128,512,(c,w,h)=>{
      const bytes=c.createImageData(w,h),r=S.random(720422);
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const at=(y*w+x)*4,edge=Math.min(x,w-1-x),worn=r(),fade=smooth((edge-2-Math.sin(y*.23)*2)/7);
        const tone=226+worn*23;bytes.data[at]=tone;bytes.data[at+1]=tone;bytes.data[at+2]=tone*.94;
        bytes.data[at+3]=(worn<.055?0:205+worn*50)*fade*smooth(Math.min(y,h-1-y)/9);
      }
      c.putImageData(bytes,0,0);
    });paint.anisotropy=8;
    const positions=[],uv=[],indices=[],marks=[];
    function segment(vertical,road,from,to){
      const dash=2.8,gap=3.0;
      for(let start=from+.8;start<to-.8;start+=dash+gap){
        const end=Math.min(start+dash,to-.6),samples=Math.max(2,Math.ceil((end-start)/.125));
        if(end-start<.7)continue;
        const mark={vertical,road,from:start,to:end,points:[]};marks.push(mark);
        let previous=null;
        for(let i=0;i<=samples;i++){
          const along=mix(start,end,i/samples),across=road+(vertical?bendX(road,along):bendZ(road,along));
          const x=vertical?across:along,z=vertical?along:across;
          // Missing paint on broken asphalt and puddles, rather than floating over them.
          if(baseHeight(x,z)-heightAt(x,z)>.065){previous=null;continue;}
          const derivative=vertical?(bendX(road,along+.05)-bendX(road,along-.05))/.10:(bendZ(road,along+.05)-bendZ(road,along-.05))/.10;
          const width=.085+.004*Math.sin(along*6.3+road),norm=Math.hypot(1,derivative),nx=(vertical?1:-derivative)/norm,nz=(vertical?-derivative:1)/norm;
          const base=positions.length/3;
          for(const side of [-1,1]){const xx=x+side*nx*width,zz=z+side*nz*width;positions.push(xx,heightAt(xx,zz)+.008,zz);uv.push((side+1)/2,i/samples);}
          mark.points.push({x,z});
          if(previous!==null){if(vertical)indices.push(previous,base,previous+1,previous+1,base,base+1);else indices.push(previous,previous+1,base,previous+1,base+1,base);}
          previous=base;
        }
      }
    }
    function mix(a,b,t){return a+(b-a)*t;}
    for(const x of S.xs)for(let j=0;j<S.zs.length-1;j++)segment(true,x,S.zs[j]+S.halfZ(S.zs[j])+1.5,S.zs[j+1]-S.halfZ(S.zs[j+1])-1.5);
    for(const z of S.zs)for(let i=0;i<S.xs.length-1;i++)segment(false,z,S.xs[i]+S.halfX(S.xs[i])+1.5,S.xs[i+1]-S.halfX(S.xs[i+1])-1.5);
    const geometry=new T.BufferGeometry();geometry.setAttribute("position",new T.Float32BufferAttribute(positions,3));geometry.setAttribute("uv",new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
    const material=new T.MeshStandardMaterial({map:paint,roughness:1,transparent:true,alphaTest:.20,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,side:T.DoubleSide});
    const mesh=new T.Mesh(geometry,material);mesh.name="Worn white road dividers";mesh.receiveShadow=true;scene.add(mesh);
    return marks;
  }
  async function build(scene,paving,report=()=>{}){
    heightGrid=new Float32Array(columns*rows);
    for(let j=0;j<rows;j++){
      for(let i=0;i<columns;i++)heightGrid[j*columns+i]=rawHeight(originX+i*step,originZ+j*step);
      if(j%96===0){report(.22+j/rows*.07);await new Promise(resolve=>setTimeout(resolve,0));}
    }
    const map=asphaltTexture(),road=new T.MeshStandardMaterial({map,bumpMap:map,bumpScale:.018,roughness:.98,vertexColors:true});
    // Blend pavement at the actual curved boundary, rather than selecting a
    // square grid cell's material (which leaves a stair-step road silhouette).
    road.onBeforeCompile=shader=>{
      shader.uniforms.pavement={value:paving.map};
      shader.vertexShader="attribute float roadEdge; varying float vRoadEdge;\n"+shader.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\nvRoadEdge=roadEdge;");
      shader.fragmentShader="uniform sampler2D pavement; varying float vRoadEdge;\n"+shader.fragmentShader.replace("#include <map_fragment>","vec2 alternate=vec2(-vMapUv.y*.731,vMapUv.x*.731)+vec2(.23,.61); vec4 asphalt=mix(texture2D(map,vMapUv),texture2D(map,alternate),.24); diffuseColor *= mix(asphalt,texture2D(pavement,vMapUv*1.13636),smoothstep(-.07,.14,vRoadEdge));");
    };
    const reflectionBytes=new Uint8Array(256*128*4);
    for(let y=0;y<128;y++)for(let x=0;x<256;x++){
      const h=y/127,a=(y*256+x)*4,sky=h>.48,t=smooth((h-.48)/.52);
      const rgb=sky?[166-86*t,190-44*t,190+24*t]:[68,65,44];
      const cloud=sky?Math.max(0,Math.sin(x*.047+y*.11)*Math.cos(y*.19))*18:0;
      for(let k=0;k<3;k++)reflectionBytes[a+k]=rgb[k]+cloud;reflectionBytes[a+3]=255;
    }
    const reflection=new T.DataTexture(reflectionBytes,256,128,T.RGBAFormat);reflection.mapping=T.EquirectangularReflectionMapping;reflection.colorSpace=T.SRGBColorSpace;reflection.needsUpdate=true;
    const water=new T.MeshStandardMaterial({color:0x71633d,roughness:.23,metalness:.15,envMap:reflection,envMapIntensity:.72,side:T.DoubleSide});
    const waterNormal=S.canvasMap(128,128,(c,w,h)=>{
      const d=c.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const i=(y*w+x)*4;d.data[i]=128+5*Math.sin(x*.35+y*.13);d.data[i+1]=128+4*Math.sin(y*.31-x*.17);d.data[i+2]=255;d.data[i+3]=255;
      }c.putImageData(d,0,0);
    },true);water.normalMap=waterNormal;water.normalScale=new T.Vector2(.23,.23);
    const terrain=new T.Group();terrain.name="Uneven Dhaka streets";scene.add(terrain);
    // Tiles are culled independently. Their identical edge samples cannot crack.
    for(let tz=-168;tz<96;tz+=24)for(let tx=-168;tx<168;tx+=24){
      const p=[],uv=[],colors=[],edges=[],normals=[],ids=[],n=Math.round(24/step)+1;
      for(let z=0;z<n;z++)for(let x=0;x<n;x++){
        const xx=tx+x*step,zz=tz+z*step,edge=roadDistance(xx,zz),y=gridHeight(xx,zz);
        p.push(xx,y,zz);uv.push(xx/5,zz/5);edges.push(edge);
        const nx=gridHeight(xx-step,zz)-gridHeight(xx+step,zz),nz=gridHeight(xx,zz-step)-gridHeight(xx,zz+step),ny=step*2,len=Math.hypot(nx,ny,nz);
        normals.push(nx/len,ny/len,nz/len);
        const dust=smooth((edge+1.3)/1.9),tone=new T.Color().setRGB(1+.31*dust,1+.17*dust,1);
        for(const h of bins.get(Math.floor(xx/6)+"/"+Math.floor(zz/6))||[]){const r=holeRadius(h,xx,zz);if(r<1.15)tone.multiplyScalar(.54+.46*smooth(r));}
        colors.push(tone.r,tone.g,tone.b);
        if(x<n-1&&z<n-1){const i=z*n+x;ids.push(i,i+n,i+1,i+1,i+n,i+n+1);}
      }
      const geo=new T.BufferGeometry();geo.setAttribute("position",new T.Float32BufferAttribute(p,3));geo.setAttribute("uv",new T.Float32BufferAttribute(uv,2));
      geo.setAttribute("color",new T.Float32BufferAttribute(colors,3));geo.setAttribute("roadEdge",new T.Float32BufferAttribute(edges,1));geo.setIndex(ids);geo.setAttribute("normal",new T.Float32BufferAttribute(normals,3));
      const mesh=new T.Mesh(geo,road);mesh.receiveShadow=true;terrain.add(mesh);
      if(tx===144){report(.29+(tz+168)/264*.12);await new Promise(resolve=>setTimeout(resolve,0));}
    }
    const dividers=whiteDividers(scene);
    // Rainwater follows each depression's irregular contour and sits below its lip.
    const wetP=[],wetUV=[],wetI=[];
    for(const h of holes.filter(h=>h.wet)){
      const waterY=baseHeight(h.x,h.z)-h.depth*.50,base=wetP.length/3;
      wetP.push(h.x,waterY,h.z);wetUV.push(h.x/2,h.z/2);
      for(let i=0;i<=64;i++){
        const a=i/64*Math.PI*2;let lo=0,hi=1.4;
        for(let it=0;it<12;it++){const mid=(lo+hi)/2,x=h.x+Math.cos(a)*h.rx*mid,z=h.z+Math.sin(a)*h.rz*mid;if(heightAt(x,z)<waterY)lo=mid;else hi=mid;}
        const x=h.x+Math.cos(a)*h.rx*lo,z=h.z+Math.sin(a)*h.rz*lo;
        wetP.push(x,waterY+.003,z);wetUV.push(x/2,z/2);if(i<64)wetI.push(base,base+i+2,base+i+1);
      }
    }
    const wg=new T.BufferGeometry();wg.setAttribute("position",new T.Float32BufferAttribute(wetP,3));wg.setAttribute("uv",new T.Float32BufferAttribute(wetUV,2));wg.setIndex(wetI);wg.computeVertexNormals();
    const pools=new T.Mesh(wg,water);pools.name="Stagnant rainwater";scene.add(pools);
    // Low-poly debris keeps geometric silhouettes without hundreds of draw calls.
    const debris=new T.Group();debris.name="Roadside rubbish and brick rubble";
    const random=S.random(726022),materials=new Map(),unit=new T.BoxGeometry(1,1,1),rock=new T.DodecahedronGeometry(1,0);
    const paper=new T.PlaneGeometry(1,1,2,2);paper.rotateX(-Math.PI/2);paper.attributes.position.setY(4,.13);paper.computeVertexNormals();
    const bottle=new T.CylinderGeometry(.045,.055,.24,7);
    function piece(geo,x,z,sx,sy,sz,col,yaw=0){
      if(!materials.has(col))materials.set(col,new T.MeshStandardMaterial({color:col,roughness:.94,side:T.DoubleSide}));
      const m=new T.Mesh(geo,materials.get(col));m.position.set(x,heightAt(x,z)+sy*.42+.01,z);m.scale.set(sx,sy,sz);m.rotation.set((random()-.5)*.19,yaw,(random()-.5)*.16);debris.add(m);return m;
    }
    for(let i=0;i<740;i++){
      const vertical=i%2===0,r=(vertical?S.xs:S.zs)[i%5],along=vertical?-130+random()*198:-141+random()*282,side=random()>.5?1:-1;
      const x=vertical?r+bendX(r,along)+side*(S.halfX(r)-.15+random()*.9):along;
      const z=vertical?along:r+bendZ(r,along)+side*(S.halfZ(r)-.15+random()*.9);
      if(roadDistance(x,z)<-1||roadDistance(x,z)>1.8)continue;
      const kind=i%7;
      if(kind<2){const a=.035+random()*.08;piece(rock,x,z,a,a*.7,a,[0x817662,0x756e5b,0xaaa089][i%3],random()*6);}
      else if(kind<4)piece(paper,x,z,.16+random()*.18,.11,.14+random()*.15,[0xd9d1b5,0x487e7d,0xa14c32,0xc1a656][i%4],random()*6);
      else if(kind===4){const m=piece(bottle,x,z,1,.13,1,0x67928a,random()*6);m.scale.set(1,1,1);m.rotation.z=Math.PI/2;}
      else piece(unit,x,z,.12+random()*.14,.07+random()*.04,.10,[0x9e5940,0xb47952,0x7d6250][i%3],random()*6);
    }
    // Broken brick heaps beside workshops, never across the walking route.
    for(const [x,z] of [[-5.5,38],[5.4,54],[70.5,-60],[-64,-68],[12,69],[-72,7]])for(let j=0;j<21;j++){
      const dx=(random()-.5)*1.65,dz=(random()-.5)*1.2;
      piece(unit,x+dx,z+dz,.18+random()*.12,.09,.13,[0xa45c40,0xbb7950,0x835b41][j%3],random()*6);
    }
    for(const h of holes)for(let j=0;j<15;j++){
      const a=random()*Math.PI*2,r=.96+random()*.28;
      const x=h.x+Math.cos(a)*h.rx*r,z=h.z+Math.sin(a)*h.rz*r,size=.025+random()*.055;
      piece(rock,x,z,size*1.6,size*.6,size,[0x4b4b43,0x626153,0x827a64][j%3],random()*6);
    }
    C72Batch.staticGroup(debris);scene.add(debris);
    return {holes,dividers,update(dt){waterNormal.offset.x+=dt*.003;waterNormal.offset.y+=dt*.002;}};
  }
  return {build,heightAt,roadDistance,bendX,bendZ,routePoint,holes,step};
})();
