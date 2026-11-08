/* Lightweight, offline title ambience and real-progress district presentation. */
window.C72Presentation=(()=>{
  "use strict";
  const body=document.body,canvas=document.getElementById("menu-atmosphere"),ctx=canvas.getContext("2d");
  const reduced=matchMedia("(prefers-reduced-motion: reduce)"),fine=matchMedia("(pointer: fine)");
  const steps=Array.from(document.querySelectorAll("[data-load-step]"));
  const route=document.getElementById("loading-route"),dot=document.getElementById("loading-dot"),loader=document.getElementById("city-loading");
  const points=[[28,224],[110,224],[110,145],[230,145],[230,44],[292,44]];
  const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));
  const total=lengths.reduce((a,b)=>a+b,0),motes=[];
  let view="menu",frame=0,last=0,width=0,height=0,elapsed=0;
  for(let i=0;i<38;i++)motes.push({x:(i*.61803398875)%1,y:(i*.41421356)%1,r:.6+(i%4)*.45,speed:.007+(i%5)*.002,phase:i*2.39});
  function resize(){
    width=innerWidth;height=innerHeight;const ratio=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx?.setTransform(ratio,0,0,ratio,0,0);
    if(ctx&&reduced.matches)ctx.clearRect(0,0,width,height);
  }
  function wanted(){return !!ctx&&view==="menu"&&!document.hidden&&!reduced.matches;}
  function draw(now){
    frame=0;if(!wanted())return;
    const dt=last?Math.min((now-last)/1000,.05):0;last=now;elapsed+=dt;
    ctx.clearRect(0,0,width,height);
    for(const p of motes){
      const x=((p.x+elapsed*p.speed*.12)%1)*width,y=((p.y-elapsed*p.speed)%1+1)%1*height;
      const alpha=.15+.23*(.5+.5*Math.sin(elapsed*.62+p.phase));
      ctx.fillStyle=`rgba(255,218,153,${alpha})`;ctx.beginPath();ctx.arc(x+Math.sin(elapsed*.24+p.phase)*12,y,p.r,0,Math.PI*2);ctx.fill();
    }
    frame=requestAnimationFrame(draw);
  }
  function sync(){
    cancelAnimationFrame(frame);frame=0;last=0;body.classList.toggle("presentation-paused",document.hidden);
    if(wanted())frame=requestAnimationFrame(draw);else ctx?.clearRect(0,0,width,height);
  }
  function neutral(){body.style.setProperty("--look-x","0px");body.style.setProperty("--look-y","0px");body.style.setProperty("--title-x","0deg");body.style.setProperty("--title-y","0deg");}
  document.addEventListener("pointermove",event=>{
    if(view!=="menu"||!fine.matches||reduced.matches)return;
    const x=event.clientX/Math.max(1,width)-.5,y=event.clientY/Math.max(1,height)-.5;
    body.style.setProperty("--look-x",(-x*15).toFixed(2)+"px");body.style.setProperty("--look-y",(-y*10).toFixed(2)+"px");
    body.style.setProperty("--title-x",(-y*3).toFixed(2)+"deg");body.style.setProperty("--title-y",(x*4).toFixed(2)+"deg");
  },{passive:true});
  document.addEventListener("pointerleave",neutral);document.addEventListener("visibilitychange",sync);
  addEventListener("resize",resize,{passive:true});addEventListener("pagehide",()=>{cancelAnimationFrame(frame);frame=0;});addEventListener("pageshow",sync);
  reduced.addEventListener("change",()=>{neutral();sync();});
  function show(next){view=next;body.dataset.screen=next;neutral();sync();}
  function progress(value){
    const fraction=Math.max(0,Math.min(1,value)),stage=fraction<.18?0:fraction<.63?1:fraction<.90?2:3;
    loader.classList.remove("is-error");
    for(const [i,step] of steps.entries()){step.classList.toggle("is-current",i===stage&&fraction<1);step.classList.toggle("is-done",i<stage||fraction===1);}
    route.style.strokeDashoffset=String(100-fraction*100);
    let length=fraction*total;
    for(let i=0;i<lengths.length;i++){
      if(length<=lengths[i]||i===lengths.length-1){const t=Math.min(1,length/lengths[i]),a=points[i],b=points[i+1];dot.setAttribute("cx",a[0]+(b[0]-a[0])*t);dot.setAttribute("cy",a[1]+(b[1]-a[1])*t);break;}
      length-=lengths[i];
    }
  }
  resize();return Object.freeze({show,progress,error(){loader.classList.add("is-error");}});
})();
