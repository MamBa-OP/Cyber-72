/* Authored locomotion playback. No foot locks, stride prediction or leg IK. */
window.C72Gait = (() => {
  "use strict";
  const T=THREE,clamp=T.MathUtils.clamp,bank=C72MotionData,keys=["idle","walk","run"];
  const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
  const clips=keys.map(key=>{
    const clip=bank.clips[key],bytes=Uint8Array.from(atob(clip.data),c=>c.charCodeAt(0));
    return {...clip,values:new Int16Array(bytes.buffer)};
  });
  function create({scale=1,seed=0}={}){
    const state={phase:0,amount:0,run:0,speed:0,hip:new T.Vector3(),q:Array.from({length:16},()=>new T.Quaternion()),weights:[1,0,0]};
    const pose=state.q.map(()=>new T.Quaternion()),hip=new T.Vector3(),next=new T.Quaternion();
    let last=-1,phase=(seed*.381966)%1;
    function sample(clip,fraction){
      const frame=((fraction%1+1)%1)*clip.count,a=Math.floor(frame),b=(a+1)%clip.count,t=frame-a;
      const offset=a*bank.stride,other=b*bank.stride,data=clip.values;
      hip.set(...[0,1,2].map(i=>T.MathUtils.lerp(data[offset+i],data[other+i],t)/10000));
      for(let i=0;i<16;i++){
        const j=offset+3+i*4,k=other+3+i*4;
        pose[i].set(data[j]/32767,data[j+1]/32767,data[j+2]/32767,data[j+3]/32767).normalize();
        next.set(data[k]/32767,data[k+1]/32767,data[k+2]/32767,data[k+3]/32767).normalize();
        pose[i].slerp(next,t);
      }
    }
    function update(time,action,speed=0){
      const fresh=last<0,dt=fresh?1/60:clamp(time-last,0,.10);last=time;
      const moving=action==="walk"||action==="run",pace=moving?Math.max(0,speed)/scale:0;
      state.speed+=(pace-state.speed)*(1-Math.exp(-dt*12));
      const amount=moving?smooth((pace-.04)/.27):0;
      const run=smooth((pace-1.8)/2.0);
      const wanted=[1-amount,amount*(1-run),amount*run];
      const fade=fresh?1:1-Math.exp(-dt*10);
      for(let i=0;i<3;i++)state.weights[i]+=(wanted[i]-state.weights[i])*fade;
      state.amount=1-state.weights[0];state.run=state.weights[2];
      const rates=[0,...clips.slice(1).map(clip=>clamp(state.speed/clip.speed,0,1.25)/clip.duration)];
      const cadence=state.weights.slice(1).reduce((sum,w,i)=>sum+w*rates[i+1],0)/Math.max(.001,state.amount);
      phase=(phase+dt*cadence)%1;state.phase=phase*Math.PI*2;
      let total=0;
      for(let i=0;i<3;i++){
        const weight=state.weights[i];if(weight<.00001)continue;
        sample(clips[i],i===0?time/clips[0].duration+seed*.13:phase);
        if(total===0){state.hip.copy(hip);state.q.forEach((q,j)=>q.copy(pose[j]));}
        else {const blend=weight/(total+weight);state.hip.lerp(hip,blend);state.q.forEach((q,j)=>q.slerp(pose[j],blend));}
        total+=weight;
      }
      return state;
    }
    function reset(){last=-1;phase=(seed*.381966)%1;state.speed=state.amount=state.run=0;state.weights.splice(0,3,1,0,0);}
    return {update,reset};
  }
  return {create};
})();
