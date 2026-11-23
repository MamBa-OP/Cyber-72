/* Pick a clear third-person view instead of forcing the lens into Rakib. */
window.C72CameraRig={solve(yaw,pitch,distance,clear){
  const direct=clear(yaw,pitch,distance);
  if(direct>=Math.min(distance,1.75))return {yaw,pitch,distance:direct};
  let best={yaw,pitch,distance:direct},score=direct;
  for(const lift of [pitch,Math.max(pitch,.48),Math.max(pitch,.85),1.18])for(const offset of [0,.42,-.42,.85,-.85,1.35,-1.35,2.1,-2.1,Math.PI]){
    const length=clear(yaw+offset,lift,distance),value=Math.min(length,2.8)-Math.abs(offset)*.18-(lift-pitch)*.22;
    if(value>score){score=value;best={yaw:yaw+offset,pitch:lift,distance:length};}
  }
  return best;
}};
