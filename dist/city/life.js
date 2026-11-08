"use strict";

// Routes are measured in metres so wheels and footsteps keep time with travel.
window.C72Life = (() => {
  const T=window.THREE, S=window.C72Streets;
  const clamp=T.MathUtils.clamp;
  function path(points,radius) {
    const curve=new T.CurvePath();
    const v=points.map(([x,z])=>new T.Vector2(x,z));
    const corners=v.map((v1,i)=>{
      const v0=v[(i+v.length-1)%v.length],v2=v[(i+1)%v.length];
      const r=Math.min(radius,v0.distanceTo(v1)*.30,v2.distanceTo(v1)*.30);
      return [v1.clone().addScaledVector(v0.clone().sub(v1).normalize(),r),v1,
        v1.clone().addScaledVector(v2.clone().sub(v1).normalize(),r)];
    });
    corners.forEach(([before,corner,after],i)=>{
      curve.add(new T.QuadraticBezierCurve(before,corner,after));
      curve.add(new T.LineCurve(after,corners[(i+1)%corners.length][0]));
    });
    const length=curve.getLength(), n=Math.ceil(length/.75);
    const samples=Array.from({length:n},(_,i)=>{const p=curve.getPoint(i/n),w=C72Terrain.routePoint(p.x,p.y);return new T.Vector2(w.x,w.z);});
    // An approach owns the intersection until its rear wheel clears the far kerb.
    const crossings=[],spacing=length/n;
    const junction=samples.map(p=>{
      const xi=S.xs.findIndex(x=>Math.abs(p.x-x)<S.halfX(x)+.18),zi=S.zs.findIndex(z=>Math.abs(p.y-z)<S.halfZ(z)+.18);
      return xi<0||zi<0?-1:zi*S.xs.length+xi;
    });
    for(let i=0;i<n;i++)if(junction[i]>=0&&junction[(i+n-1)%n]!==junction[i]){
      let j=i+1;while(j<n+i&&junction[j%n]===junction[i])j++;
      crossings.push({id:junction[i],entry:i*spacing,exit:j*spacing});
    }
    return {length,crossings,sample(distance,out={}) {
      const part=(((distance%length)+length)%length)*n/length,index=Math.floor(part),f=part-index;
      const a=samples[index],b=samples[(index+1)%n],c=samples[(index+2)%n];
      out.x=a.x+(b.x-a.x)*f;out.z=a.y+(b.y-a.y)*f;
      out.yaw=Math.atan2((b.x-a.x)*(1-f)+(c.x-b.x)*f,(b.y-a.y)*(1-f)+(c.y-b.y)*f);
      return out;
    }, nearest(x,z){
      let index=0,best=Infinity;
      samples.forEach((p,i)=>{const d=(p.x-x)**2+(p.y-z)**2;if(d<best){best=d;index=i;}});
      return index*length/n;
    }};
  }
  function streetLoop(x0,z0,x1,z1,reverse=false) {
    const lane=reverse?-2.0:2.0;
    // Clockwise circulation's left-hand lane is on the outside of the rectangle.
    const points=[[x0-lane,z0-lane],[x1+lane,z0-lane],[x1+lane,z1+lane],[x0-lane,z1+lane]];
    return path(reverse?points.reverse():points,4.3);
  }
  function blocked(world,x,z,r=.25) {
    return world.near(x,z).some(b=>b.top>.45&&b.bottom<1.6&&x+r>b.x0&&x-r<b.x1&&z+r>b.z0&&z-r<b.z1);
  }
  class Neighbours {
    constructor(size){this.size=size;this.cells=new Map();}
    rebuild(actors){
      for(const bin of this.cells.values())bin.length=0;
      for(const a of actors){
        const key=Math.floor(a.x/this.size)*1024+Math.floor(a.z/this.size);
        let bin=this.cells.get(key);if(!bin){bin=[];this.cells.set(key,bin);}
        bin.push(a);
      }
    }
    near(x,z,r,out){
      out.length=0;
      const i0=Math.floor((x-r)/this.size),i1=Math.floor((x+r)/this.size),j0=Math.floor((z-r)/this.size),j1=Math.floor((z+r)/this.size);
      for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){
        const bin=this.cells.get(i*1024+j);if(bin)for(const a of bin)out.push(a);
      }
      return out;
    }
  }
  function groundShadowTexture() {
    return S.canvasMap(96,96,(c,w,h)=>{
      const grad=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);
      grad.addColorStop(0,"rgba(38,30,23,.54)");grad.addColorStop(.5,"rgba(47,37,29,.24)");grad.addColorStop(1,"rgba(50,41,33,0)");
      c.fillStyle=grad;c.fillRect(0,0,w,h);
    });
  }
  async function create(scene,world,report) {
    const rng=S.random(7255),drivers=[],people=[],shadowTexture=groundShadowTexture();
    const shadowGeo=new T.PlaneGeometry(1,1);shadowGeo.rotateX(-Math.PI/2);
    const shadowMat=new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
    function shadow(root,w,d) {
      const s=new T.Mesh(shadowGeo,shadowMat);s.position.y=.018;s.scale.set(w,1,d);s.renderOrder=1;root.add(s);return s;
    }
    const pedestrianGrid=new Neighbours(3.5),vehicleGrid=new Neighbours(9);
    const laneCars=[],laneWalkers=[],neighbours=[],bumperCars=[],nextPos={};
    const routes=[streetLoop(0,15,66,65),streetLoop(-68,-34,0,65),streetLoop(0,-83,132,65,true),
      streetLoop(-134,-83,0,15,true),streetLoop(-68,-132,66,-34),streetLoop(66,-132,132,15),
      streetLoop(-134,15,-68,65,true),streetLoop(-134,-132,0,-83),streetLoop(-68,15,132,65)];
    const junctions=Array.from({length:S.xs.length*S.zs.length},()=>({owner:null,candidate:null}));
    function findCrossing(d) {
      let first=Infinity;
      for(const c of d.route.crossings){
        let lap=Math.floor((d.distance-c.entry)/d.route.length)*d.route.length;
        if(lap+c.exit+d.length*.5+.65<d.distance)lap+=d.route.length;
        if(lap+c.entry<first){first=lap+c.entry;d.cross=c;d.entry=first;d.exit=lap+c.exit;}
      }
      d.ticket=Infinity;
    }
    function placeVehicle(route,kind,preferred){
      const k=C72Vehicles.create(kind,drivers.length+7);
      let best=-Infinity,distance=0;
      for(let i=0;i<92;i++){
        const at=i?route.length*(i-.5)/91:preferred??rng()*route.length,pos=route.sample(at);
        // Start off the junction and leave space on overlapping routes from the first frame.
        if(route.crossings.some(c=>{
          const dx=(at-c.entry+route.length)%route.length;
          return dx<c.exit-c.entry+k.length*.5+1||dx>route.length-k.length*.5-1;
        }))continue;
        let gap=70;
        for(const o of drivers){
          const ax=pos.x-o.x,az=pos.z-o.z;
          const lateral=Math.abs(ax*Math.cos(pos.yaw)-az*Math.sin(pos.yaw));
          if(lateral>(k.width+o.width)/2+.3)continue;
          gap=Math.min(gap,Math.abs(ax*Math.sin(pos.yaw)+az*Math.cos(pos.yaw))-(k.length+o.length)/2);
        }
        if(gap>2.45&&i===0){distance=at;break;}
        const score=Math.min(24,gap)+rng()*.3;
        if(score>best){best=score;distance=at;}
      }
      const cruise=({bus:5.2,van:5.4,cng:4.9,rickshaw:2.66,cyclevan:2.43,motorcycle:5.6})[kind]*(.88+rng()*.25);
      const d={...k,...route.sample(distance),id:drivers.length,route,kind,distance,cruise,speed:cruise,dwell:0,stopAt:Infinity,detailAt:0};
      findCrossing(d);
      if(kind==="bus"){
        const stop=route.nearest(42,67),p=route.sample(stop);
        if(Math.abs(p.z-(67+C72Terrain.bendZ(65,42)))<.7&&Math.abs(p.x-42)<1.1&&Math.sin(p.yaw)<-.9)
          d.stopAt=stop+(stop<distance+2?route.length:0);
      }
      k.root.position.set(d.x,S.groundAt(d.x,d.z)+.014,d.z);k.root.rotation.y=d.yaw;shadow(k.root,k.width*1.55,k.length*1.17);scene.add(k.root);
      drivers.push(d);
    }
    // Several lines serve the commercial crossing. The rest also cover the perimeter and workshops.
    const departures=[
      [0,"rickshaw",-2,34],[1,"cng",2,28],[0,"bus",34,67],[1,"cyclevan",2,48],
      [0,"cng",-2,53],[2,"van",2,0],[0,"rickshaw",27,13],[1,"bus",2,-14],
      [0,"motorcycle",-2,42],[1,"motorcycle",2,36],[8,"cyclevan",18,67],[8,"bus",76,67],[3,"cng",-47,13],[5,"rickshaw",83,-134]
    ];
    for(const [index,kind,x,z] of departures)placeVehicle(routes[index],kind,routes[index].nearest(x,z));
    const kinds=["rickshaw","cng","motorcycle","rickshaw","van","motorcycle","bus","rickshaw","cng"];
    for(let i=0;i<46;i++){
      placeVehicle(routes[i%routes.length],kinds[(Math.floor(i/9)*3+i)%kinds.length]);
      if(i%7===0){report(.63+i/46*.19);await new Promise(resolve=>setTimeout(resolve,0));}
    }
    vehicleGrid.rebuild(drivers);
    function person(x,z,activity,yaw,seed,route=null,role="npc") {
      // Find a clear pavement footprint, including along newly planted and furnished streets.
      const startX=x,startZ=z;
      let found=false;
      for(let ring=0;ring<=10&&!found;ring++){
        const count=ring?12:1;
        for(let i=0;i<count;i++){
          const a=(i/count+seed*.011)*2*Math.PI;
          x=startX+ring*.43*Math.sin(a);z=startZ+ring*.43*Math.cos(a);
          if(x<S.limits.left+.35||x>S.limits.right-.35||z<S.limits.north+.35||z>S.limits.south-.35||
             S.onRoad(x,z,.12)||blocked(world,x,z,.32)||(x-S.spawn.x)**2+(z-S.spawn.z)**2<6.25||
             people.some(p=>(p.x-x)**2+(p.z-z)**2<.65**2))continue;
          found=true;break;
        }
      }
      if(!found)return;
      const actor={role,x,z,homeX:x,homeZ:z,yaw,activity,currentAction:activity,seed,route,kit:null,goal:1,
        rest:route?rng()*.6:0,restAction:activity,speed:.82+rng()*.54,offset:rng()*10,side:seed%2?1:-1,
        pace:0,retry:0,surprised:0,cooldown:5+rng()*20,poseAt:0};
      people.push(actor);return actor;
    }
    const pi=Math.PI;
    const posts=[
      [-11.65,25.0,"work",pi/2],[-8.85,24.9,"tea",-pi/2],[-8.5,27.6,"tea",.68],
      [-8.0,28.7,"talk",-2.67],[11.9,24.2,"work",-pi/2],[8.7,24.0,"scroll",1.6],
      [-7.8,19.9,"argue",.67],[-7.0,21.0,"argue",-2.47],[8.5,23.7,"phone",-.62],
      [17.9,5.6,"tea",1.5],[20.4,5.4,"work",pi],[27,1.3,"work",pi],[23,4.3,"talk",-.8],
      [22.2,5.2,"talk",2.38],[12.5,-1.2,"photo",1.85],[16.9,-3,"scroll",-.70],
      [-48,-39.8,"work",pi],[-46.6,-39.3,"tea",-2.0],[-73.8,7.2,"work",pi/2],
      [85,-51.7,"tea",1.4],[83.2,-56.8,"work",-1.52],[87.5,-55.0,"phone",1.74],
      [-97,54.7,"photo",pi],[-91,53.9,"talk",-.80],[-92.2,55,"talk",2.32],
      [-3.4,80.6,"photo",0],[16.8,78.9,"phone",-.71],[-15,76.1,"tea",-1.37],
      [-75,-96,"scroll",-1.9],[-45,-90,"talk",.71],[-44.3,-89.2,"talk",-2.41],[52,-92.6,"phone",.4],[109,-105,"work",-.7],[123,33.2,"phone",.4],
      [-120,-105,"work",1.2],[-122,-102,"phone",2.1],[97,-120,"photo",.4],[5.9,-102,"phone",.9]
    ];
    posts.forEach(([x,z,a,y],i)=>person(x,z,a,y,7+i));
    for(const [i,[x,z,yaw]] of [[-7.25,55.9,1.8],[7.6,22.0,-1.8],[-74.6,-75.8,1.2],[59,57.3,-1.0],[7.3,-91,2.2]].entries())person(x,z,"traffic",yaw,710+i,null,"police");
    function walker(points,seed,activity=["idle","tote","scroll","books","phone","parcel"][seed%6]) {
      const [x,z]=points[0];return person(x,z,activity,Math.atan2(points[1][0]-x,points[1][1]-z),seed,points);
    }
    // Pavement loops hug each side of the road. Crossings link selected blocks.
    for(let i=0;i<4;i++) for(let j=0;j<4;j++) {
      const x0=S.xs[i]+S.halfX(S.xs[i])+2.45,x1=S.xs[i+1]-S.halfX(S.xs[i+1])-2.45;
      const z0=S.zs[j]+S.halfZ(S.zs[j])+1.5,z1=S.zs[j+1]-S.halfZ(S.zs[j+1])-1.5;
      for(let k=0;k<5;k++){
        const offset=(k%3-1)*.47;
        const corners=[[x0+offset,z0+offset],[x1-offset,z0+offset],[x1-offset,z1-offset],[x0+offset,z1-offset]];
        if(k%2)corners.reverse();
        const n=(i+j+k)%4,a=corners[n],b=corners[(n+1)%4],f=.2+rng()*.6;
        walker([[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f],...corners.slice(n+1),...corners.slice(0,n+1)],61+i*20+j*5+k);
      }
    }
    [[[-7.3,32],[-7.3,54],[-7.6,56],[-7.6,29]],[[7.1,39],[7.3,50],[7.3,55],[7.2,25]],
      [[-8.3,45],[-8.2,54],[-8.2,31]],[[6.8,7.9],[-7.6,7.9],[-7.5,7.1],[6.9,7.1]],
      [[-42,77],[-12,76],[25,76],[32,80],[-42,80]],[[35,74],[58,75],[90,75],[40,78]],
      [[-94,78],[-120,78],[-115,74],[-63,75]],[[14.3,2.3],[21,1.4],[32,4.5],[15.7,6.9]]
    ].forEach((points,i)=>walker(points,145+i));
    // Each shop has its own pavement routine. The till, window and delivery
    // points are relative to the actual shop front, including on rotated lots.
    for(const [index,b] of world.branches.entries()){
      const face=b.yaw+pi,fx=Math.sin(b.yaw),fz=Math.cos(b.yaw);
      const spot=(side,forward)=>[b.doorX+fz*side+fx*forward,b.doorZ-fx*side+fz*forward];
      const base=180+index*8;
      const financial=b.key==="bkash"||b.key==="dbbl";
      person(...spot(-1.2,-.20),financial?"pay":b.key==="starkabab"?"tea":"browse",face,base);
      person(...spot(1.7,.03),financial?"scroll":"tote",face-.24,base+1);
      for(let j=0;j<3;j++){
        const along=j%2?1:-1,at=spot(along*(3.2+j*.63),.30+j*.31);
        const activity=[financial?"pay":"tote","parcel","books"][j];
        const p=walker([at,spot(along*1.6,.42),spot(.4,-.19),spot(along*4.85,.8)],base+j+2,activity);
        if(p){p.shopFacing=face;p.restAction=activity==="parcel"||activity==="pay"?activity:"browse";}
      }
      if(index%2===0)person(...spot(-3.8,-.10),"sweep",face+pi*.72,base+5);
    }
    // Passengers watch the arriving bus. Neighbouring groups talk over tea,
    // take photos and browse the market while foot traffic passes behind them.
    for(let j=0;j<7;j++){
      const p=person(38.1+j*1.15,72.8+(j%2)*.48,["hail","scroll","tote","talk","books","phone","talk"][j],pi,270+j);
      if(p)p.busStop=true;
    }
    const gatherings=[[-8.5,37.0,"tea"],[7.8,49.4,"books"],[-36,77.8,"talk"],[18,76.6,"photo"],
      [-111,53.3,"talk"],[31,1.7,"tea"],[96,-54,"work"],[92,-93,"talk"]];
    gatherings.forEach(([x,z,activity],i)=>{
      person(x,z,activity,pi*.45,302+i*3);
      person(x+1.12,z+.24,i%2?"talk":"scroll",-pi*.55,303+i*3);
      if(i%2===0)person(x+.55,z+1.07,"talk",pi,304+i*3);
    });
    for(let i=0;i<15;i++){
      const x=-126+i*17.4,z=75.2+(i%3)*.8;
      walker([[x,z],[x+5,z+.8],[Math.min(133,x+18),z-.2],[x+3,z-.65]],340+i);
    }
    // Give the quieter lanes their own neighbours. Count people already present
    // so a busy commercial block does not attract another overlapping group.
    function populateLane(road,half,alongZ,from,to,block){
      const mid=(from+to)/2,cx=alongZ?road:mid,cz=alongZ?mid:road;
      const present=people.filter(p=>(p.x-cx)**2+(p.z-cz)**2<27**2).length;
      const count=Math.max(0,8-present);
      for(let i=0;i<count;i++){
        const side=(i<4?1:-1)*(block%2?1:-1),member=i%4,station=side*5.3;
        const spot=(along,setback)=>{
          const across=road+side*(half+setback);
          return alongZ?[across,mid+along]:[mid+along,across];
        };
        const seed=400+block*8+i;
        if(member<2){
          const pos=spot(station+member*1.14,2.30+member*.25);
          const peer=spot(station+(1-member)*1.14,2.30+(1-member)*.25);
          person(...pos,member&&block%3===0?"books":"talk",Math.atan2(peer[0]-pos[0],peer[1]-pos[1]),seed);
        }else if(member===2){
          walker([spot(-station,.99),spot(-11,1.37),spot(10,1.74),spot(3,1.16)],seed,["parcel","tote","books"][block%3]);
        }else{
          person(...spot(-station-2.4,2.48),["sweep","scroll","photo","phone"][block%4],alongZ?side*Math.PI/2:side*Math.PI,seed);
        }
      }
    }
    for(let i=0;i<S.xs.length;i++)for(let j=0;j<S.zs.length-1;j++)
      populateLane(S.xs[i],S.halfX(S.xs[i]),true,S.zs[j],S.zs[j+1],i*4+j);
    for(let j=0;j<S.zs.length;j++)for(let i=0;i<S.xs.length-1;i++)
      populateLane(S.zs[j],S.halfZ(S.zs[j]),false,S.xs[i],S.xs[i+1],20+j*4+i);
    // Each side of every street gets its own coverage target. A busy shop
    // around the corner no longer counts as residents on an empty lane.
    const densityAreas=[];
    function coverStreet(road,half,alongZ,from,to,index){
      const area={road,half,alongZ,from:from+7,to:to-7,index};densityAreas.push(area);
      const acrossAt=along=>road+(alongZ?C72Terrain.bendX(road,along):C72Terrain.bendZ(road,along));
      const place=(f,side,inset)=>{const along=area.from+(area.to-area.from)*f,across=acrossAt(along)+side*(half+inset);return alongZ?[across,along]:[along,across];};
      function residents(side){return people.filter(p=>{
        const along=alongZ?p.z:p.x,across=alongZ?p.x:p.z;
        return along>=area.from&&along<=area.to&&side*(across-acrossAt(along))>half+.15&&side*(across-acrossAt(along))<half+4.5;
      }).length;}
      for(const side of [-1,1])for(let attempt=0;residents(side)<8&&attempt<32;attempt++){
        const f=.04+((attempt*.381966+.15+index*.071)%1)*.92,seed=5000+index*80+(side+1)*20+attempt;
        const inset=1.25+(attempt%3)*.62,pos=place(f,side,inset);
        if(attempt%3===0){
          const end=clamp(f+(f<.5?.25:-.25),.04,.96),middle=(end+f)*.5;
          walker([pos,place(middle,side,1.45),place(end,side,1.65),place(middle,side,1.8)],seed,["tote","parcel","books","phone"][attempt%4]);
        }else{
          const activity=["talk","scroll","tea","phone","browse","sweep"][attempt%6];
          const at=person(...pos,activity,alongZ?-side*Math.PI/2:side>0?Math.PI:0,seed);
          if(at)at.neighbourhood=index;
        }
      }
    }
    for(let i=0;i<S.xs.length;i++)for(let j=0;j<4;j++)coverStreet(S.xs[i],S.halfX(S.xs[i]),true,S.zs[j],S.zs[j+1],i*4+j);
    for(let j=0;j<S.zs.length;j++)for(let i=0;i<4;i++)coverStreet(S.zs[j],S.halfZ(S.zs[j]),false,S.xs[i],S.xs[i+1],20+j*4+i);
    // Courtyards and the backs of the workshop blocks are explorable too.
    for(let ix=0;ix<4;ix++)for(let iz=0;iz<4;iz++){
      const x=(S.xs[ix]+S.xs[ix+1])*.5,z=(S.zs[iz]+S.zs[iz+1])*.5,seed=9000+ix*80+iz*16;
      for(let n=0;n<8;n++){
        const a=n*Math.PI/4,px=x+Math.sin(a)*(3.2+n%2),pz=z+Math.cos(a)*(2.1+n%3);
        const personHere=person(px,pz,["talk","phone","scroll","work","tea","books","photo","talk"][n],a+Math.PI,seed+n);
        if(personHere)personHere.courtyard=ix*4+iz;
      }
    }
    pedestrianGrid.rebuild(people);
    function cast(p,distance) {
      p.kit=C72People.create({role:p.role,seed:p.seed,activity:p.activity,distant:distance>34});shadow(p.kit.root,.67,.49);scene.add(p.kit.root);
    }
    function drive(dt,time,player) {
      // Reserve a junction for the first approaching vehicle. Straight and
      // turning routes share the same physical junction ID.
      for(const j of junctions)j.candidate=null;
      for(const d of drivers){
        if(!d.cross)continue;
        if(d.distance>d.exit+d.length*.5+.65){
          const old=junctions[d.cross.id];if(old.owner===d)old.owner=null;
          findCrossing(d);
        }
        const gap=d.entry-d.length*.5-d.distance,j=junctions[d.cross.id];
        if(gap>8||d.dwell>0)continue;
        if(j.owner===d)continue;
        // Vehicles on different routes can join the same queue. A trailing
        // vehicle cannot claim the crossing while its leader is waiting.
        const fx=Math.sin(d.yaw),fz=Math.cos(d.yaw);
        const queuedBehind=vehicleGrid.near(d.x,d.z,17,laneCars).some(o=>{
          if(o===d||Math.cos(o.yaw-d.yaw)<.65)return false;
          const dx=o.x-d.x,dz=o.z-d.z,ahead=dx*fx+dz*fz;
          return ahead>.25&&ahead<d.entry-d.distance+o.length/2+1.5&&Math.abs(dx*fz-dz*fx)<(d.width+o.width)/2+.12;
        });
        if(queuedBehind){d.ticket=Infinity;continue;}
        if(!Number.isFinite(d.ticket))d.ticket=time+Math.max(0,gap)/Math.max(1,d.speed);
        if(!j.owner&&(!j.candidate||d.ticket<j.candidate.ticket))j.candidate=d;
      }
      for(const j of junctions)if(!j.owner&&j.candidate)j.owner=j.candidate;
      for(const d of drivers) {
        let target=d.cruise;
        const braking=gap=>Math.sqrt(5.0*Math.max(0,gap));
        if(d.cross&&junctions[d.cross.id].owner!==d)
          target=Math.min(target,braking(d.entry-d.length*.5-.6-d.distance));
        if(d.stopAt<Infinity){
          const remaining=d.stopAt-d.distance;
          if(remaining<.12){d.dwell=3.4;d.stopAt+=d.route.length;}
          else target=Math.min(target,braking(remaining));
        }
        if(d.dwell>0){target=0;d.dwell=Math.max(0,d.dwell-dt);}
        const fx=Math.sin(d.yaw),fz=Math.cos(d.yaw);
        function ahead(x,z,halfWidth,halfLength,margin) {
          const dx=x-d.x,dz=z-d.z,long=dx*fx+dz*fz,side=Math.abs(dx*fz-dz*fx);
          if(long<=0||long>19||side>d.width/2+halfWidth+.18) return;
          const gap=long-d.length/2-halfLength-margin;
          target=Math.min(target,Math.sqrt(4.5*Math.max(0,gap)));
        }
        ahead(player.x,player.z,.32,.32,1.05);
        for(const o of vehicleGrid.near(d.x,d.z,21,laneCars))if(o!==d){
          const align=Math.cos(o.yaw-d.yaw);
          if(align>.7)ahead(o.x,o.z,o.width/2,o.length/2,1.1);
        }
        for(const p of pedestrianGrid.near(d.x,d.z,20,laneWalkers))if(p.route)ahead(p.x,p.z,.27,.25,.7);
        d.speed+=clamp(target-d.speed,-7*dt,1.6*dt);d.distance+=d.speed*dt;
        Object.assign(d,d.route.sample(d.distance,nextPos));
        const wheelbase=Math.max(1.25,d.length*.64),half=wheelbase/2;
        const front=S.groundAt(d.x+Math.sin(d.yaw)*half,d.z+Math.cos(d.yaw)*half),back=S.groundAt(d.x-Math.sin(d.yaw)*half,d.z-Math.cos(d.yaw)*half);
        const left=S.groundAt(d.x+Math.cos(d.yaw)*d.width*.36,d.z-Math.sin(d.yaw)*d.width*.36),right=S.groundAt(d.x-Math.cos(d.yaw)*d.width*.36,d.z+Math.sin(d.yaw)*d.width*.36);
        const settle=dt?1-Math.exp(-dt*13):1,oldYaw=d.root.rotation.y;
        d.root.position.set(d.x,d.root.position.y+((front+back)*.5+.014-d.root.position.y)*settle,d.z);
        d.root.rotation.order="YXZ";d.root.rotation.y=d.yaw;
        d.root.rotation.x+=(-Math.atan2(front-back,wheelbase)-d.root.rotation.x)*settle;
        const lean=d.kind==="motorcycle"?clamp(Math.atan2(Math.sin(d.yaw-oldYaw),Math.cos(d.yaw-oldYaw))/Math.max(.016,dt)*d.speed*.06,-.20,.20):0;
        d.root.rotation.z+=(Math.atan2(left-right,d.width*.72)-lean-d.root.rotation.z)*settle;
        const range=Math.hypot(d.x-player.x,d.z-player.z);
        d.root.visible=range<96;
        if(d.root.visible&&time>=d.detailAt){d.update(d.distance,time,d.speed);d.detailAt=time+(range>34?.13:0);}
      }
      vehicleGrid.rebuild(drivers);
    }
    function contact(x,z,r=.28) {
      return vehicleGrid.near(x,z,7+r,bumperCars).some(d=>{
        const dx=x-d.x,dz=z-d.z,fx=Math.sin(d.yaw),fz=Math.cos(d.yaw);
        return Math.abs(dx*fx+dz*fz)<d.length/2+r && Math.abs(dx*fz-dz*fx)<d.width/2+r;
      });
    }
    function step(p,dt,player) {
      p.cooldown-=dt;
      if(p.surprised>0){p.surprised-=dt;p.pace*=Math.exp(-dt*12);return false;}
      if(p.rest>0){p.rest-=dt;p.pace*=Math.exp(-dt*12);return false;}
      const goal=p.route[p.goal],dx=goal[0]-p.x,dz=goal[1]-p.z,len=Math.hypot(dx,dz);
      if(len<.4||p.retry>4) {
        if(p.shopFacing!==undefined&&p.goal===2){p.yaw=p.shopFacing;p.rest=2.5+rng()*3.5;}
        else p.rest=.4+rng()*2.5;
        p.goal=(p.goal+1)%p.route.length;p.retry=0;return false;
      }
      let vx=dx/len,vz=dz/len;
      function steer(x,z,min) {
        const ex=p.x-x,ez=p.z-z,l=Math.hypot(ex,ez);
        if(l>0.001&&l<min){const f=(min-l)/(min*l);vx+=ex*f*1.7;vz+=ez*f*1.7;}
      }
      steer(player.x,player.z,1.12);
      for(const o of pedestrianGrid.near(p.x,p.z,1.15,neighbours))if(o!==p){
        const gap=Math.hypot(o.x-p.x,o.z-p.z);
        if(gap<.85&&o.route&&p.cooldown<0&&o.cooldown<0&&Math.cos(p.yaw-o.yaw)<-.5){
          // Two walkers meet shoulder-to-shoulder, turn, exchange gestures, then pass.
          p.surprised=o.surprised=1.65+rng()*.85;p.cooldown=o.cooldown=24;
          p.yaw=Math.atan2(o.x-p.x,o.z-p.z);o.yaw=p.yaw+Math.PI;p.side=-1;o.side=1;return false;
        }
        if(gap<.82)steer(o.x,o.z,.82);
      }
      const heading=Math.atan2(vx,vz);
      for(const angle of [0,.54*p.side,-.54*p.side,1.1*p.side,-1.1*p.side]){
        const turn=Math.atan2(Math.sin(heading+angle-p.yaw),Math.cos(heading+angle-p.yaw));
        const nextYaw=p.yaw+turn*Math.min(1,dt*8),fx=Math.sin(nextYaw),fz=Math.cos(nextYaw);
        if(blocked(world,p.x+fx*.44,p.z+fz*.44)||contact(p.x+fx*.85,p.z+fz*.85,.38))continue;
        p.pace+=(p.speed*(Math.abs(turn)>1?.42:1)-p.pace)*(1-Math.exp(-dt*6));
        p.x+=fx*p.pace*dt;p.z+=fz*p.pace*dt;p.yaw=nextYaw;
        p.retry=0;return true;
      }
      p.pace*=Math.exp(-dt*12);p.retry+=dt;return false;
    }
    const dustTexture=S.canvasMap(32,32,c=>{
      const grad=c.createRadialGradient(16,16,0,16,16,16);grad.addColorStop(0,"#e7d7b4");grad.addColorStop(1,"#dfd3bc00");c.fillStyle=grad;c.fillRect(0,0,32,32);
    });
    const grains=new Float32Array(130*3),specks=new T.BufferGeometry();
    for(let i=0;i<grains.length;i+=3){grains[i]=(rng()-.5)*30;grains[i+1]=rng()**2*5;grains[i+2]=(rng()-.5)*30;}
    specks.setAttribute("position",new T.BufferAttribute(grains,3));
    const dust=new T.Points(specks,new T.PointsMaterial({color:0xf3d7a0,size:.065,map:dustTexture,transparent:true,opacity:.36,depthWrite:false}));
    dust.frustumCulled=false;scene.add(dust);
    const wakes=new Float32Array(drivers.length*4*3),wakeGeo=new T.BufferGeometry();
    wakeGeo.setAttribute("position",new T.BufferAttribute(wakes,3));
    const wake=new T.Points(wakeGeo,new T.PointsMaterial({map:dustTexture,color:0xd0b28a,size:.72,transparent:true,opacity:.19,depthWrite:false}));
    wake.frustumCulled=false;scene.add(wake);
    const stalls=[[-10.37,25.35],[20.4,3.8],[-49.4,-40.85],[85.7,-52.8]];
    const wisps=new Float32Array(stalls.length*9*3),steamGeo=new T.BufferGeometry();steamGeo.setAttribute("position",new T.BufferAttribute(wisps,3));
    const steam=new T.Points(steamGeo,new T.PointsMaterial({map:dustTexture,color:0xfff3d9,size:.17,transparent:true,opacity:.36,depthWrite:false}));steam.frustumCulled=false;scene.add(steam);
    function update(dt,time,player){
      drive(dt,time,player);
      const busArriving=drivers.some(d=>d.kind==="bus"&&d.z>65&&d.z<70&&d.x>39&&d.x<54);
      for(const p of people) {
        const dist=Math.hypot(p.x-player.x,p.z-player.z),visible=dist<56;
        if(visible&&!p.kit)cast(p,dist);
        if(p.kit)p.kit.root.visible=visible;
        const walking=p.route && step(p,dt,player);
        const engaged=(time+p.offset)%12<9;
        let action=p.surprised>0?"argue":walking?"walk":p.shopFacing!==undefined&&p.goal===3?p.restAction:p.activity;
        if(p.busStop&&p.seed%3===0)action=busArriving?"hail":"idle";
        if(action==="argue"&&!engaged)action="talk";
        else if(!p.route&&!engaged&&["work","phone","photo","sweep","pay"].includes(action))action="idle";
        p.currentAction=action;
        if(!visible)continue;
        const root=p.kit.root;
        root.position.set(p.x,S.groundAt(p.x,p.z),p.z);root.rotation.y=p.yaw;
        if(dist>34&&time<p.poseAt)continue;
        if(dist<32||dist>36)p.kit.setDetail(dist<32);
        p.kit.pose(action,time+p.offset,walking?p.pace:0);
        p.poseAt=time+(dist>34?.04:0);
      }
      pedestrianGrid.rebuild(people);
      specks.attributes.position.needsUpdate=true;
      for(let i=0;i<grains.length;i+=3){grains[i]+=dt*.27;if(grains[i]>15)grains[i]-=30;}
      dust.position.set(player.x,0,player.z);
      drivers.forEach((d,i)=>{
        const fx=Math.sin(d.yaw),fz=Math.cos(d.yaw);
        for(let n=0;n<4;n++){
          const j=(i*4+n)*3,f=(time*.68+n*.25+i*.15)%1,back=d.length*.45+f*1.9,side=(n%2?1:-1)*d.width*.41;
          wakes[j]=d.x-fx*back+fz*side+.22*f;wakes[j+1]=d.speed>.95?d.root.position.y+.14+f*.44:-2;wakes[j+2]=d.z-fz*back-fx*side;
        }
      });
      wakeGeo.attributes.position.needsUpdate=true;
      stalls.forEach(([x,z],i)=>{for(let n=0;n<9;n++){
        const j=(i*9+n)*3,f=(time*.59+n/9+i*.23)%1;
        wisps[j]=x+.14*f+Math.sin(f*8+i)*f*.12;wisps[j+1]=1.22+.62*f;wisps[j+2]=z+Math.cos(n+time*.7)*.055*f;
      }});steamGeo.attributes.position.needsUpdate=true;
    }
    const initialPeople=people.map(p=>({x:p.x,z:p.z,yaw:p.yaw,goal:p.goal,rest:p.rest,cooldown:p.cooldown}));
    const initialDrivers=drivers.map(d=>({distance:d.distance,stopAt:d.stopAt,speed:d.cruise}));
    function reset(){
      junctions.forEach(j=>{j.owner=j.candidate=null;});
      drivers.forEach((d,i)=>{Object.assign(d,initialDrivers[i],{dwell:0,detailAt:0,ticket:Infinity});Object.assign(d,d.route.sample(d.distance));findCrossing(d);});
      people.forEach((p,i)=>{Object.assign(p,initialPeople[i],{pace:0,retry:0,surprised:0,poseAt:0,currentAction:p.activity});p.kit?.reset();});
      vehicleGrid.rebuild(drivers);pedestrianGrid.rebuild(people);
    }
    const playerNeighbours=[];
    const nearbyPeople=(x,z)=>pedestrianGrid.near(x,z,.7,playerNeighbours);
    return {people,drivers,densityAreas,nearbyPeople,contact,shadow,update,reset};
  }
  return {create,blocked};
})();
