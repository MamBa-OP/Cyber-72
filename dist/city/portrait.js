/* A separate actor shares the city's assets and renderer, never its live pose. */
window.C72Portrait={start(renderer,person,output,energy){
  if(!person||!renderer?.getRenderTarget)return ()=>{};
  const T=THREE,actor=C72People.create({seed:person.seed,role:person.role||'npc'}),stage=new T.Scene();
  // Portrait-only expressions leave shared city clothing and locomotion untouched.
  const mesh=actor.root.children[0],geometry=mesh.geometry.clone(),positions=geometry.attributes.position;
  mesh.geometry=geometry;
  const mouth=new Float32Array(positions.count*3),blink=new Float32Array(positions.count*3),joints=geometry.attributes.skinIndex,face=geometry.attributes.faceCoord;
  const clamp=T.MathUtils.clamp;
  for(let i=0;i<positions.count;i++){
    if(joints.getX(i)!==3)continue;
    const x=positions.getX(i),y=positions.getY(i)-1.443,z=positions.getZ(i);
    if(z>.07&&face.getZ(i)>.5&&y>.025&&y<.093){const weight=clamp((y-.025)/.035,0,1)*clamp((.05-Math.abs(x))/.024,0,1);mouth[i*3+1]=-.006*weight;}
    const eyeDistance=Math.abs(Math.abs(x)-.0308);
    if(z>.082&&eyeDistance<.018&&Math.abs(y-.1384)<.014)blink[i*3+1]=(.1384-y)*.94*clamp((.018-eyeDistance)/.005,0,1);
  }
  const targets=geometry.morphAttributes.position||[],mouthIndex=targets.length;
  geometry.morphTargetsRelative=true;geometry.morphAttributes.position=[...targets,new T.BufferAttribute(mouth,3),new T.BufferAttribute(blink,3)];mesh.updateMorphTargets();
  const width=output.width,height=output.height,target=new T.WebGLRenderTarget(width,height,{depthBuffer:true});
  target.texture.colorSpace=T.SRGBColorSpace;
  stage.add(new T.HemisphereLight(0xfff4dc,0x586959,2.1));
  const key=new T.DirectionalLight(0xffe2bd,2.5);key.position.set(-2,3,4);stage.add(key);
  const rim=new T.DirectionalLight(0xd9efdd,1.8);rim.position.set(2,2,-2);stage.add(rim,actor.root);
  actor.root.rotation.y=-.12;actor.pose('idle',0);
  const top=new T.Box3().setFromObject(actor.root).max.y,eye=new T.PerspectiveCamera(34,width/height,.1,10);
  eye.position.set(0,top-.25,2.15);eye.lookAt(0,top-.43,0);
  const pixels=new Uint8Array(width*height*4),ctx=output.getContext('2d'),picture=ctx.createImageData(width,height);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let frame=0,last=-Infinity,stopped=false,opening=0;
  function stop(){if(stopped)return;stopped=true;cancelAnimationFrame(frame);target.dispose();geometry.dispose();actor.root.traverse(n=>{if(n.isSkinnedMesh)n.skeleton.dispose();});}
  function draw(now){
    if(stopped)return;frame=requestAnimationFrame(draw);
    if(document.hidden||now-last<(reduced?250:80))return;last=now;
    const strength=energy(),time=now/1000;
    opening+=(strength-opening)*.55;
    mesh.morphTargetInfluences[mouthIndex]=reduced?0:opening;
    const phase=(time+person.seed*.31)%4.7;
    mesh.morphTargetInfluences[mouthIndex+1]=reduced?0:Math.max(0,1-Math.abs(phase-.12)/.12);
    actor.pose(!reduced&&strength>.05?'talk':'idle',time,0,{ground:()=>-10});
    const previous=renderer.getRenderTarget(),clear=renderer.getClearColor(new T.Color()),alpha=renderer.getClearAlpha();
    try{
      renderer.setRenderTarget(target);renderer.setClearColor(0x000000,0);renderer.clear();renderer.render(stage,eye);
      renderer.readRenderTargetPixels(target,0,0,width,height,pixels);
      for(let y=0;y<height;y++)picture.data.set(pixels.subarray((height-y-1)*width*4,(height-y)*width*4),y*width*4);
      ctx.putImageData(picture,0,0);
    }catch{stop();}finally{renderer.setRenderTarget(previous);renderer.setClearColor(clear,alpha);}
  }
  frame=requestAnimationFrame(draw);return stop;
}};
