// Connected clothing, skinning, UVs and cloth clearance across every outfit/LOD.
const fs0=require('node:fs'),path0=require('node:path'),vm0=require('node:vm');
const scaffold=fs0.readFileSync(path0.join(__dirname,'check-city.cjs'),'utf8').split('let world,life;')[0];
const body=String.raw`
(async()=>{await C72Atlases.prepare(new THREE.WebGLRenderer(),()=>{});
const preserved={
 'people/motion-data.js':'44DD61D39756F380179431A1BACFBC870F1DB5BBE2E41783C2AAC2F07391B2FA',
 'gait.js':'1BCCACEEBEBDA9D008DD63890492622024B5D3693ACB182ABE90D6A93934B14D'};
for(const [file,hash] of Object.entries(preserved))assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(base,file))).digest('hex').toUpperCase(),hash,'Approved movement changed: '+file);
const specs=[{role:'player',seed:72},...Array.from({length:27},(_,seed)=>({seed})),{role:'police',seed:20}];
const vec=new THREE.Vector3(),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),normal=new THREE.Vector3(),closest=new THREE.Vector3(),triangle=new THREE.Triangle();
const ray=new THREE.Ray(),hit=new THREE.Vector3();
const clips=Object.fromEntries(Object.entries(C72MotionData.clips).map(([key,clip])=>[key,{...clip,bytes:new Int16Array(Uint8Array.from(atob(clip.data),c=>c.charCodeAt(0)).buffer)}]));
let outfits=0,poses=0,scarfChecks=0,worstScarf=1;const issues=[],trouserIssues=[];
for(const distant of [false,true])for(const spec of specs){
 const actor=C72People.create({...spec,distant}),mesh=actor.root.children[0],g=mesh.geometry,p=g.attributes.position,j=g.attributes.skinIndex,w=g.attributes.skinWeight,uv=g.attributes.uv,parts=g.userData.parts;
 assert(mesh.material.map!==mesh.material.bumpMap,'Printed motifs must not become surface dents');
 const trousers=parts.find(p=>p.name==='trousers'),shirt=parts.find(p=>p.name==='shirt'),scarf=parts.find(p=>p.name==='scarf');
 for(let i=0;i<p.count;i++){
   let total=0;for(let k=0;k<4;k++){const value=w.array[i*4+k];assert(value>=0&&value<=1&&j.array[i*4+k]<16);total+=value;}
   assert(Math.abs(total-1)<1e-6,'Unnormalized skin weights');
   assert(Number.isFinite(p.getX(i)+p.getY(i)+p.getZ(i)+uv.getX(i)+uv.getY(i)),'Invalid geometry');
   assert(uv.getX(i)>=0&&uv.getX(i)<=1&&uv.getY(i)>=0&&uv.getY(i)<=1,'UV escaped fabric atlas');
 }
 if(trousers&&spec.role==='player'){
   const edges=new Map(),adj=new Map();
   for(let n=trousers.first;n<trousers.first+trousers.indices;n+=3){
     const ids=[g.index.array[n],g.index.array[n+1],g.index.array[n+2]];
     for(let k=0;k<3;k++){const u=ids[k],v=ids[(k+1)%3],key=Math.min(u,v)+':'+Math.max(u,v);edges.set(key,(edges.get(key)||0)+1);if(!adj.has(u))adj.set(u,new Set());adj.get(u).add(v);}
   }
   assert([...edges.values()].every(n=>n<=2),'Non-manifold trouser join');
   const seen=new Set(),queue=[adj.keys().next().value];while(queue.length){const n=queue.pop();if(seen.has(n))continue;seen.add(n);queue.push(...adj.get(n));}
   assert.equal(seen.size,adj.size,'Waist and trouser legs must be one connected surface');
   for(const [edge,count] of edges)if(count===1){const [u,v]=edge.split(':').map(Number),ya=p.getY(u),yb=p.getY(v);assert((Math.abs(ya-.095)<.0002&&Math.abs(yb-.095)<.0002)||(Math.abs(ya-.905)<.0002&&Math.abs(yb-.905)<.0002),'Unexpected hole in trousers at '+ya+'/'+yb);}
 }
 // The source mesh is shared at both detail levels, including knee and cuff loops.
 if(trousers){let cuffs=0;for(let i=trousers.start;i<trousers.start+trousers.count;i++)if(Math.abs(p.getY(i)-.095)<.0002){assert(w.getX(i)>.99&&(j.getX(i)===6||j.getX(i)===9));cuffs++;}assert(cuffs>12);}
 const nearGeometry=mesh.geometry;actor.setDetail(!distant);assert.equal(mesh.geometry,nearGeometry);
 const samples=process.argv.includes('--full')?24:8;
 for(const [key,clip] of Object.entries(clips))for(let sample=0;sample<samples;sample++){
   const offset=Math.floor(sample/samples*clip.count)*67;
   mesh.skeleton.bones[0].position.fromArray(Array.from(clip.bytes.slice(offset,offset+3),n=>n/10000));
   for(let n=0;n<16;n++)mesh.skeleton.bones[n].quaternion.fromArray(Array.from(clip.bytes.slice(offset+3+n*4,offset+7+n*4),n=>n/32767)).normalize();
   actor.root.updateMatrixWorld(true);mesh.skeleton.update();mesh.onBeforeRender();
   const positions=new Array(p.count);
   for(let i=0;i<p.count;i++){vec.fromBufferAttribute(p,i);
     for(let m=0;m<(g.morphAttributes.position?.length||0);m++)vec.addScaledVector(a.fromBufferAttribute(g.morphAttributes.position[m],i),mesh.morphTargetInfluences[m]);
     mesh.applyBoneTransform(i,vec);assert(Number.isFinite(vec.x+vec.y+vec.z)&&vec.length()<2.5,'Exploding skinning');positions[i]=vec.clone();}
   // The orna must remain outside its kameez throughout the authored clips.
   if(scarf){
     for(let i=scarf.start;i<scarf.start+scarf.count;i+=distant?2:4){
       if(p.getY(i)>1.38)continue; // shoulder turn sits above the open neckline
       const point=positions[i];let distance=Infinity,signed=0;
       for(let n=shirt.first;n<shirt.first+shirt.indices;n+=3){
         triangle.set(positions[g.index.array[n]],positions[g.index.array[n+1]],positions[g.index.array[n+2]]);
         triangle.closestPointToPoint(point,closest);const d=closest.distanceToSquared(point);
         if(d<distance){distance=d;triangle.getNormal(normal);signed=vec.copy(point).sub(closest).dot(normal);}
       }
       worstScarf=Math.min(worstScarf,signed);scarfChecks++;
       if(signed<-.0015)issues.push({seed:spec.seed,distant,key,sample,x:p.getX(i),y:p.getY(i),z:p.getZ(i),signed,distance:Math.sqrt(distance)});
     }
   }
   if(trousers&&g.morphAttributes.position){
     for(let i=trousers.start;i<trousers.start+trousers.count;i++){
       if(p.getY(i)<.68||p.getY(i)>.83||Math.abs(p.getX(i))>.13||Math.abs(p.getZ(i))<.055)continue;
       const point=positions[i],front=p.getZ(i)>0,sign=front?1:-1;let outer=-Infinity;
       ray.origin.set(point.x,point.y,sign*3);ray.direction.set(0,0,-sign);
       const first=shirt.first+(front?0:shirt.indices/2);
       for(let n=first;n<first+shirt.indices/2;n+=3){
         if(ray.intersectTriangle(positions[g.index.array[n]],positions[g.index.array[n+1]],positions[g.index.array[n+2]],false,hit))outer=Math.max(outer,hit.z*sign);
       }
       // No panel hit means the leg is legitimately visible below the hem or
       // through an open side vent. A hit behind the trousers is penetration.
       const signed=point.z*sign-outer;
       if(Number.isFinite(outer)&&signed>.0015)trouserIssues.push({seed:spec.seed,distant,key,sample,x:p.getX(i),y:p.getY(i),z:p.getZ(i),signed});
     }
   }
   poses++;
 }
 outfits++;
}
console.log(JSON.stringify({outfits,poses,scarfChecks,worstScarfMm:+(worstScarf*1000).toFixed(3),issues:issues.slice(0,4),issueCount:issues.length,trouserIssues:trouserIssues.sort((a,b)=>b.signed-a.signed).slice(0,8),trouserIssueCount:trouserIssues.length,movement:'unchanged'}));
assert.equal(issues.length,0,'Scarf penetrates kameez');
assert.equal(trouserIssues.length,0,'Trousers protrude through the kameez');
})().catch(e=>{console.error(e);process.exitCode=1;});
`;
vm0.compileFunction(scaffold+body,['require','__dirname'],{filename:__filename})(require,__dirname);
