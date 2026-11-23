/* A damaged or incomplete extracted folder should explain recovery, not freeze. */
window.addEventListener('load',()=>{
  if(window.C72Game&&document.title!=='Cyber 72 | Welcome')return;
  const panel=document.createElement('section');panel.className='startup-recovery';panel.setAttribute('role','alert');
  const title=document.createElement('h1'),message=document.createElement('p'),button=document.createElement('button');
  title.textContent='The game files could not open';
  message.textContent='Reload to try again. If you extracted the project ZIP, keep all files together and open dist/index.html. গেম চালু হয়নি। সব ফাইল একসঙ্গে রেখে আবার লোড করো।';
  button.textContent='Reload / আবার লোড';button.type='button';button.addEventListener('click',()=>location.reload());
  panel.append(title,message,button);document.body.append(panel);button.focus();
});
