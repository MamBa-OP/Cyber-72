const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'../dist/city');global.window=global;
for(const name of ['missions-data','choices','dialogue-copy','camera-rig','campaign'])vm.runInThisContext(fs.readFileSync(path.join(base,name+'.js'),'utf8'));
// Length must no longer reveal every safe choice; both languages have varied lengths.
for(let lang=0;lang<2;lang++){
 const longest=C72Cases.filter(c=>c.options[1].text[lang].length===Math.max(...c.options.map(o=>o.text[lang].length))).length;
 assert(longest<=5,`Correct answer is disproportionately longest: ${longest}`);
 assert(C72Cases.every(c=>c.options.filter(o=>o.safe).length===1));
}
const free=C72CameraRig.solve(.2,.16,4,()=>4);assert.equal(free.yaw,.2);assert.equal(free.distance,4);
const above=C72CameraRig.solve(0,.16,4,(yaw,pitch)=>pitch>.8?4:.3);assert(above.distance>1.75&&above.pitch>.8);
const shoulder=C72CameraRig.solve(0,.16,4,(yaw,pitch)=>Math.abs(yaw)>.4?3:.4);assert(shoulder.distance>1.75&&Math.abs(shoulder.yaw)>.4);
const enclosed=C72CameraRig.solve(0,.16,4,()=>.1);assert(Number.isFinite(enclosed.distance)&&enclosed.distance===.1);
const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
let c=C72Campaign.create(storage);c.briefing();c.inspect([0,1,1,88]);c.answer(1,5.4);
assert.deepEqual(c.snapshot().records,[{level:0,choice:1,correct:true,checks:2,seconds:5}]);assert.deepEqual(c.snapshot().checked,[]);
c=C72Campaign.create(storage);assert(c.snapshot().briefed);assert.equal(c.snapshot().records.length,1);
const old=c.snapshot();delete old.briefed;delete old.checked;old.records=[null,{},old.records[0]];storage.setItem(C72Campaign.key,JSON.stringify(old));
c=C72Campaign.create(storage);assert(c.snapshot().briefed);assert.equal(c.snapshot().records.length,1);c.replay();assert.equal(c.snapshot().records.length,0);assert.equal(c.snapshot().level,0);assert.equal(c.snapshot().health,100);
console.log('Release checks passed: balanced choices, camera recovery, historical records, old/corrupt saves and full journal reset.');

// Conversation regression: no evidence gate or redundant instruction panels.
const missionSource=fs.readFileSync(path.join(base,'missions.js'),'utf8');
for(const removed of ['YOUR ADVICE MATTERS','What is the safest next step?','Inspect at least two','mission-evidence','mission-cost','mission-question','C72Investigations'])assert(!missionSource.includes(removed),removed);
assert(!fs.existsSync(path.join(base,'investigations.js')));
const page=fs.readFileSync(path.join(base,'../index.html'),'utf8');
assert(page.includes('conversation.css')&&page.includes('dialogue-copy.js'));
assert.equal(C72Cases.length,10);assert(C72Cases.every(c=>c.story[1].length>60));
console.log('Conversation checks passed: removed inspection UI, immediate replies and matching Bangla copy loaded.');
