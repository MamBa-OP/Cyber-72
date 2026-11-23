const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'../dist/city'),nodes=new Map();let count=0,panel='play';global.window=global;
function node(id){if(nodes.has(id))return nodes.get(id);const events={};let key=id;const n={hidden:false,children:[],dataset:{},textContent:'',get id(){return key;},set id(v){key=v;nodes.set(v,n);},append(...c){this.children.push(...c)},replaceChildren(...c){this.children=c},addEventListener(k,fn){events[k]=fn},click(){events.click?.()},focus(){document.activeElement=n},querySelectorAll(){return[]}};nodes.set(id,n);return n;}
global.document={getElementById:node,createElement:tag=>node(tag+count++),createTextNode:text=>({textContent:text})};
for(const file of ['missions-data','campaign','journey'])vm.runInThisContext(fs.readFileSync(path.join(base,file+'.js'),'utf8'));
const data=new Map(),campaign=C72Campaign.create({getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)});
const guide=C72Journey.create({campaign,prefs:{language:'en'},panel:p=>panel=p});
const cards=()=>node('journey-content').children.filter(c=>c.className==='guide-level');
const words=n=>[n.textContent||'',...(n.children||[]).map(words)].join(' ');
guide.show('briefing');assert.equal(panel,'journey');assert(guide.active());assert.equal(cards().length,10);assert.equal(cards().filter(c=>c.open).length,1);assert(cards()[0].open);
for(let i=0;i<10;i++){assert(words(cards()[i]).includes(C72Cases[i].title[0]));assert(words(cards()[i]).includes(C72Cases[i].lesson[0]),'Future level help is locked');}
assert(!node('journey-overlay').innerHTML.includes('journey-export'));assert.equal(campaign.snapshot().briefed,false);
node('journey-close').click();assert.equal(campaign.snapshot().briefed,true);assert.equal(panel,'play');assert(!guide.active());
campaign.answer(1);campaign.acknowledge();campaign.answer(0);campaign.acknowledge();const before=JSON.stringify(campaign.snapshot());
guide.show('guidebook');assert(cards()[1].open);assert.equal(JSON.stringify(campaign.snapshot()),before,'Opening help changed progress');
guide.preferences({language:'bn'});for(let i=0;i<10;i++)assert(words(cards()[i]).includes(C72Cases[i].lesson[1]));
guide.key({code:'Escape',preventDefault(){}});assert.equal(panel,'play');assert.equal(JSON.stringify(campaign.snapshot()),before,'Reading help changed progress');
campaign.replay();guide.show('briefing');assert(cards()[0].open);assert.equal(campaign.snapshot().health,100);assert.equal(campaign.snapshot().briefed,false);node('journey-close').click();assert(campaign.snapshot().briefed);
console.log('Guidebook passed: ten unlocked guides, English/Bangla hints, current-level selection, fresh-run introduction and unchanged progress when reading help.');
