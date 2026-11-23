/* Authored collapse: weight gives way, knees fold, one arm braces, then settles. */
window.C72DeathMotion=(()=>{
  const pose=(spine,head,leftHip,leftKnee,rightHip,rightKnee,leftArm,leftElbow,rightArm,rightElbow)=>[
    [0,0,0],spine,[.02,0,0],head,leftHip,[leftKnee,0,0],[-.08,0,0],rightHip,[rightKnee,0,0],[-.06,0,0],leftArm,[leftElbow,0,0],[0,0,0],rightArm,[rightElbow,0,0],[0,0,0]
  ];
  // time, hip height, lateral drift, forward drift, roll, pitch, local joint pose.
  const frames=[
    [0,.872,0,0,0,0,pose([.01,0,0],[-.02,0,0],[0,0,0],.05,[0,0,0],.05,[.02,0,.08],-.16,[-.02,0,-.08],-.18)],
    [.28,.84,0,-.015,.025,-.025,pose([-.07,0,-.02],[.10,.05,0],[-.12,0,.02],.22,[-.08,0,-.02],.16,[-.18,0,.16],-.45,[-.11,0,-.22],-.35)],
    [.72,.57,-.025,.08,.08,.07,pose([.26,0,-.04],[.19,.04,.04],[-.90,0,.08],1.56,[-.68,0,-.07],1.27,[-.58,0,.22],-.56,[-.70,0,-.35],-.30)],
    [1.12,.39,-.07,.19,.24,.16,pose([.31,.04,-.08],[.24,.08,.04],[-.30,0,.12],1.92,[-.18,0,-.12],2.04,[-.72,0,.15],-.73,[-.90,0,-.78],-.20)],
    [1.53,.29,-.20,.24,.92,.16,pose([.18,.08,.09],[.13,.09,.06],[-.36,0,.16],1.66,[-.64,0,-.12],1.78,[-.60,0,.16],-.90,[-.62,0,-1.12],-.36)],
    [1.84,.18,-.32,.26,1.51,.10,pose([.11,.07,.06],[.08,.12,.10],[-.76,0,.10],1.54,[-.98,0,.04],1.77,[-.58,0,-.24],-1.10,[-.88,0,-.16],-.48)],
    [2.12,.19,-.34,.27,1.46,.08,pose([.07,.06,.05],[.04,.15,.14],[-.89,0,.07],1.62,[-1.06,0,.08],1.74,[-.56,0,-.32],-1.22,[-.98,0,.11],-.56)],
    [2.65,.18,-.35,.27,1.51,.08,pose([.065,.06,.05],[.07,.16,.16],[-.90,0,.07],1.63,[-1.08,0,.08],1.72,[-.55,0,-.35],-1.25,[-1.0,0,.15],-.60)],
    [3.15,.18,-.35,.27,1.51,.08,pose([.065,.06,.05],[.07,.16,.16],[-.90,0,.07],1.63,[-1.08,0,.08],1.72,[-.55,0,-.35],-1.25,[-1.0,0,.15],-.60)]
  ];
  // Shape-preserving Hermite interpolation keeps continuous motion without overshooting joints.
  const rows=frames.map(f=>[...f.slice(0,6),...f[6].flat()]);
  function sample(time){
    const t=Math.max(0,Math.min(3.15,time));let i=0;
    while(i<rows.length-2&&rows[i+1][0]<t)i++;
    const a=rows[i],b=rows[i+1],dt=b[0]-a[0],u=(t-a[0])/dt;
    function slope(k,j){if(k===0||k===rows.length-1)return 0;const p=rows[k-1],c=rows[k],n=rows[k+1],l=(c[j]-p[j])/(c[0]-p[0]),r=(n[j]-c[j])/(n[0]-c[0]);return l*r<=0?0:2*l*r/(l+r);}
    const out=a.slice(1).map((_,k)=>{const j=k+1;return (2*u*u*u-3*u*u+1)*a[j]+(u*u*u-2*u*u+u)*dt*slope(i,j)+(-2*u*u*u+3*u*u)*b[j]+(u*u*u-u*u)*dt*slope(i+1,j);});
    return {height:out[0],x:out[1],z:out[2],roll:out[3],pitch:out[4],joints:Array.from({length:16},(_,j)=>out.slice(5+j*3,8+j*3))};
  }
  return {sample,duration:3.15};
})();
