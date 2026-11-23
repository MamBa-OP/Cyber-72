// Verify authored playback on the real character skeleton, including slow frames.
const testFS=require('node:fs'),testPath=require('node:path'),testVM=require('node:vm');
const scaffold=testFS.readFileSync(testPath.join(__dirname,'check-city.cjs'),'utf8').split('let world,life;')[0];
const body=String.raw`
(async()=>{
  await C72Atlases.prepare(new THREE.WebGLRenderer(),()=>{});
  let samples=0,lowestSole=1,maxWalkKnee=0,maxJointStep=0;const summaries=[];
  for(const [role,seed,speed] of [['player',72,1.4],['npc',1,.82],['npc',3,1.05],['npc',19,1.35],['player',72,2.8],['player',72,4.4]]){
    for(const fps of [60,30,15]){
      const actor=C72People.create({role,seed}),mesh=actor.root.children[0],bones=mesh.skeleton.bones,previous=bones.map(b=>b.quaternion.clone());
      let time=0,z=0,steadyContacts=0,hipMin=Infinity,hipMax=-Infinity;
      for(let frame=0;frame<fps*8;frame++){
        const dt=1/fps;time=frame*dt;const pace=time<.3||time>6?0:speed;z+=pace*dt;
        actor.root.position.set(0,.19,z);actor.pose(pace?(pace>2.75?'run':'walk'):'idle',time,pace,{ground:()=>.19});actor.root.updateMatrixWorld(true);
        for(let j=0;j<bones.length;j++){
          const q=bones[j].quaternion;assert(q.toArray().every(Number.isFinite),'Invalid joint rotation');
          assert(Math.abs(q.length()-1)<.0001,'Non-unit rotation');
          if(frame>1){const change=previous[j].angleTo(q);maxJointStep=Math.max(maxJointStep,change*fps);
            assert(change<Math.min(1.7,dt*27),'Joint snaps or flips during playback '+JSON.stringify({role,seed,speed,fps,time,joint:bones[j].name,change}));}
          previous[j].copy(q);
        }
        const sole=[];
        for(const leg of [4,7]){
          const hip=bones[leg].getWorldPosition(new THREE.Vector3()),knee=bones[leg+1].getWorldPosition(new THREE.Vector3()),ankle=bones[leg+2];
          const foot=ankle.getWorldPosition(new THREE.Vector3());
          const bend=hip.clone().sub(knee).normalize().angleTo(knee.clone().sub(foot).normalize());
          if(speed<1.8){maxWalkKnee=Math.max(maxWalkKnee,bend);assert(bend<1.60,'Casual walk folds the knee too far');}
          for(const tip of [-.085,.17])sole.push(ankle.localToWorld(new THREE.Vector3(0,-.067,tip)).y-.19);
        }
        const low=Math.min(...sole);lowestSole=Math.min(lowestSole,low);
        assert(low>-.04,'Shoe penetrates the pavement '+JSON.stringify({role,seed,speed,fps,time,low}));
        if(time>1&&time<5.8){hipMin=Math.min(hipMin,bones[0].position.y);hipMax=Math.max(hipMax,bones[0].position.y);if(low<.075)steadyContacts++;}
        samples++;
      }
      assert(steadyContacts>fps*(speed<1.8?4.4:1.0),'Insufficient ground contacts');
      if(speed<1.8)assert(hipMax-hipMin<.075,'Excessive bouncing in casual walking');
      summaries.push({role,seed,speed,fps,hipTravel:+(hipMax-hipMin).toFixed(3)});
    }
  }
  // The relaxed idle must stand upright with quiet, planted feet for its full loop.
  let idleDrift=0,idleKnee=0;
  for(const [role,seed] of [['player',72],['npc',1],['npc',3]]){
    const still=C72People.create({role,seed}),rig=still.root.children[0].skeleton.bones,anchors=[];
    for(let frame=0;frame<=600;frame++){
      still.root.position.set(0,.19,0);still.pose('idle',frame/30,0,{ground:()=>.19});still.root.updateMatrixWorld(true);
      const soles=[];
      for(const [i,leg] of [4,7].entries()){
        const a=rig[leg].getWorldPosition(new THREE.Vector3()),b=rig[leg+1].getWorldPosition(new THREE.Vector3()),c=rig[leg+2].getWorldPosition(new THREE.Vector3());
        const knee=a.sub(b).normalize().angleTo(b.clone().sub(c).normalize());idleKnee=Math.max(idleKnee,knee);assert(knee<.28,'Idle knees remain crouched');
        const sole=rig[leg+2].localToWorld(new THREE.Vector3(0,-.067,0));soles.push(sole);
        if(!frame)anchors[i]=sole.clone();idleDrift=Math.max(idleDrift,sole.distanceTo(anchors[i]));
        assert(sole.distanceTo(anchors[i])<.001,'Idle feet shuffle or slide');assert(sole.y>.19,'Idle sole below pavement');
      }
      assert(Math.abs(soles[0].z-soles[1].z)<.09,'Idle feet are staggered too far apart');
    }
  }
  console.log(JSON.stringify({idleFootDriftMm:+(idleDrift*1000).toFixed(3),idleKneeDegrees:+(idleKnee*180/Math.PI).toFixed(1)}));
  // Turn and repeatedly change speed, stop, jump, resume and restart.
  const actor=C72People.create({role:'player',seed:72}),bones=actor.root.children[0].skeleton.bones;
  let x=0,z=0,yaw=0;
  for(let i=0;i<480;i++){
    const t=i/60,phase=i%90,speed=phase<12?0:phase<42?1.4:4.4,action=phase>70?'jump':speed>3?'run':speed?'walk':'idle';
    yaw+=.012;x+=Math.sin(yaw)*speed/60;z+=Math.cos(yaw)*speed/60;actor.root.position.set(x,.19,z);actor.root.rotation.y=yaw;
    actor.pose(action,t,speed,{ground:()=>.19,vy:action==='jump'?2:0});actor.root.updateMatrixWorld(true);
    assert(bones.every(b=>b.quaternion.toArray().every(Number.isFinite)),'Bad transition');
  }
  actor.reset();actor.root.position.set(0,.19,0);actor.root.rotation.y=0;actor.pose('idle',0,0,{ground:()=>.19});
  const first=bones.map(b=>b.quaternion.toArray());
  actor.pose('run',.1,4.4);actor.reset();actor.pose('idle',0,0,{ground:()=>.19});
  bones.forEach((b,i)=>assert(b.quaternion.toArray().every((v,j)=>Math.abs(v-first[i][j])<.000001),'Restart retains an old pose'));
  console.log(JSON.stringify({samples,lowestSoleMm:+(lowestSole*1000).toFixed(1),maxWalkingKneeDegrees:+(maxWalkKnee*180/Math.PI).toFixed(1),maxJointRadiansPerSecond:+maxJointStep.toFixed(1),transitions:'passed',restart:'passed',walks:summaries}));
})().catch(e=>{console.error(e);process.exitCode=1;});
`;
testVM.compileFunction(scaffold+body,['require','__dirname'],{filename:__filename})(require,__dirname);
