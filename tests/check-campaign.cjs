const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../dist/city'),scope={window:{}};
for(const file of ['missions-data.js','campaign.js'])vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),scope,{filename:file});
const {C72Cases:cases,C72Campaign:core}=scope.window;
const memory=()=>{const values=new Map();return {getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)}};
assert.equal(cases.length,10);assert.equal(new Set(cases.map(c=>c.id)).size,10);
for(const c of cases){assert.equal(c.options.length,3);assert.equal(c.options.filter(o=>o.safe).length,1);for(const pair of [c.title,c.story,c.lesson,...c.options.map(o=>o.text)])assert(pair.length===2&&pair.every(s=>s.length>5));}
const store=memory();let game=core.create(store),answerPositions=new Set();
for(let level=0;level<10;level++){
  assert.equal(game.snapshot().level,level);assert.equal(game.snapshot().health,100);
  game.target(500+level);const right=cases[level].options.findIndex(o=>o.safe),order=game.order();answerPositions.add(order.indexOf(right));assert.equal(new Set(order).size,3);
  let s=game.answer(right);assert.equal(s.level,level+1);assert.equal(s.health,100);assert.equal(game.answer(0),null,'Double answer must be ignored');
  game=core.create(store);assert.equal(game.snapshot().level,level+1,'Completed level must survive reload');
  if(level<9){assert.equal(game.snapshot().phase,'feedback');game.acknowledge();}else assert.equal(game.snapshot().phase,'complete');
}
assert.equal(answerPositions.size,3,'Correct option must not always have the same letter');
assert.equal(game.retry(),null);game.replay();assert.equal(game.snapshot().level,0);
game.target(77);game.answer(1);game.acknowledge();assert.equal(game.snapshot().level,1);
for(const life of [60,20,0]){
  game.target(80+life);let s=game.answer(0);assert.equal(s.health,life);assert.equal(s.level,1);assert.equal(s.retrying,true);assert.equal(s.targetSeed,null);assert.equal(game.answer(0),null);
  game=core.create(store);assert.equal(game.snapshot().health,life,'Damage must survive reload');
  if(life){assert.equal(game.retry(),null);game.acknowledge();}else{assert.equal(game.snapshot().phase,'attacked');assert.equal(game.acknowledge(),null);}
}
game.retry();assert.equal(game.snapshot().level,0);assert.equal(core.create(store).snapshot().level,0);game.answer(1);game.acknowledge();assert.equal(game.snapshot().health,100);assert.equal(game.snapshot().phase,'explore');
game.target(99);game.answer(0);game.acknowledge();game.target(100);game.answer(1);assert.equal(game.snapshot().health,60,'Advancing must not erase damage');assert.equal(game.snapshot().level,2);assert.equal(game.snapshot().retrying,false);
assert.equal(core.create({getItem:()=>'{bad',setItem(){}}).snapshot().level,0);
const broken=core.create({getItem(){throw Error('blocked')},setItem(){throw Error('full')}});broken.target(3);assert.equal(broken.snapshot().saved,false);assert.equal(broken.answer(1).level,1);
for(const value of [-1,3,NaN,'1'])assert.equal(core.create(memory()).answer(value),null);
console.log('Campaign verified: all 10 bilingual cases, varied answer positions, exactly 40 damage, same-level retries, zero-health full restart, save/reload, completion/replay and blocked storage.');
