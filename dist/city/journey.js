/* Offline guidebook: help for every level, available before playing. */
window.C72Journey={create(api){
  const host=document.createElement('div');host.id='journey-overlay';host.className='city-veil';host.hidden=true;
  host.innerHTML='<section class="journey-card guidebook" role="dialog" aria-modal="true" aria-labelledby="journey-title"><header class="guide-header"><div class="journey-kicker" id="guide-kicker"></div><h2 id="journey-title" tabindex="-1"></h2><p id="journey-description"></p></header><div id="journey-content"></div><footer class="journey-footer"><span id="guide-reminder"></span><button type="button" id="journey-close" class="mission-primary"></button></footer></section>';
  document.getElementById('city-view').append(host);
  const el=id=>document.getElementById(id);let mode='',lang=api.prefs.language==='bn'?1:0;
  const text=(en,bn)=>lang?bn:en,num=n=>lang?String(n).replace(/\d/g,d=>'০১২৩৪৫৬৭৮৯'[d]):String(n);
  const guides=[
    [['Help a neighbour decide what to do with a lottery-prize message.','লটারির পুরস্কারের মেসেজ নিয়ে কী করবেন, প্রতিবেশীকে বুঝতে সাহায্য করো।'],['An unknown sender and a lottery they never entered.','অচেনা নম্বর, আর যে লটারিতে নামই দেননি তার পুরস্কার।']],
    [['Help verify an urgent request for money from a familiar Messenger account.','পরিচিত মেসেঞ্জার আইডি থেকে জরুরি টাকা চাওয়ার ঘটনা যাচাই করতে সাহায্য করো।'],['A familiar photo does not prove who is using the account.','পরিচিত ছবি দেখেই বোঝা যায় না আইডি কে চালাচ্ছে।']],
    [['Help decide whether a quick-loan app is worth downloading.','দ্রুত লোনের অ্যাপ নামানো ঠিক হবে কি না বুঝতে সাহায্য করো।'],['Easy-money promises and access to photos and contacts.','সহজে টাকা পাওয়ার প্রতিশ্রুতি এবং ছবি ও কন্টাক্টের অনুমতি চাওয়া।']],
    [['Help a worried neighbour respond to a caller threatening to block their account.','অ্যাকাউন্ট বন্ধের হুমকি দেওয়া ফোনের জবাব কী হবে, বুঝতে সাহায্য করো।'],['Pressure, threats and requests for a PIN or OTP.','তাড়া, হুমকি এবং পিন বা ওটিপি চাওয়া।']],
    [['Help a gamer choose what to do about a free-diamonds offer.','ফ্রি ডায়মন্ডের অফার নিয়ে একজন গেমারকে সিদ্ধান্ত নিতে সাহায্য করো।'],['An unofficial download and a request to allow every permission.','অচেনা সাইটের অ্যাপ নামানো এবং সব অনুমতি চাওয়া।']],
    [['Help a shopper assess a very cheap phone listing before paying.','খুব কম দামের ফোনের বিজ্ঞাপনে টাকা দেওয়ার আগে যাচাই করতে সাহায্য করো।'],['An unusually low price, advance booking money and a seller rushing the buyer.','অস্বাভাবিক কম দাম, অগ্রিম বুকিংয়ের টাকা এবং বিক্রেতার তাড়া।']],
    [['Help a job seeker assess an easy online earning offer.','সহজ অনলাইন আয়ের অফার যাচাই করতে চাকরিপ্রার্থীকে সাহায্য করো।'],['Paying a joining fee before work starts.','কাজ শুরু হওয়ার আগেই যোগদানের ফি চাওয়া।']],
    [['Help decide whether to order from a new social-media shop.','নতুন অনলাইন দোকান থেকে অর্ডার করা ঠিক হবে কি না বুঝতে সাহায্য করো।'],['Attractive photos and discounts, but little history or reliable feedback.','সুন্দর ছবি ও ছাড় আছে, কিন্তু পুরোনো তথ্য বা নির্ভরযোগ্য রিভিউ কম।']],
    [['Help a neighbour decide whether a login page is genuine.','লগইন পেজটি আসল কি না বুঝতে প্রতিবেশীকে সাহায্য করো।'],['Extra letters or words in the address; logos can be copied.','ঠিকানায় বাড়তি অক্ষর বা শব্দ; লোগো নকল করা যায়।']],
    [['Help a neighbour think clearly about a countdown bicycle offer.','কাউন্টডাউন সাইকেল অফার নিয়ে ঠান্ডা মাথায় ভাবতে সাহায্য করো।'],['An unrealistic price, a ticking timer and claims that everyone is buying.','অবিশ্বাস্য কম দাম, কমতে থাকা সময় এবং সবাই কিনছে এমন দাবি।']]
  ];
  function paragraph(parent,label,value){const p=document.createElement('p'),strong=document.createElement('strong');strong.textContent=label+' ';p.append(strong,document.createTextNode(value));parent.append(p);}
  function render(){
    const state=api.campaign.snapshot(),intro=mode==='briefing';
    el('guide-kicker').textContent=text('CYBER 72 / FIELD GUIDE','সাইবার ৭২ / সহায়িকা');
    el('journey-title').textContent=text('Your Dhaka guidebook','ঢাকার পথে তোমার গাইডবুক');
    el('journey-description').textContent=intro?text('Before you step outside: learn the controls and get a hint for every level.','রাস্তায় নামার আগে নিয়ন্ত্রণ শিখে নাও, প্রতিটি লেভেলের জন্য সাহায্য দেখে নাও।'):text('Stuck on a case? Open any level below. All ten guides are available from the start.','কোনো কেসে আটকে গেছ? নিচে যেকোনো লেভেল খোলো। শুরু থেকেই দশটি গাইড পড়তে পারবে।');
    const content=el('journey-content');content.replaceChildren();
    const steps=document.createElement('div');steps.className='guide-steps';
    for(const [i,title,body] of [
      [1,text('Find','খুঁজে নাও'),text('Follow the amber NPC marker. Walk with WASD / arrows or the touch pad.','সোনালি এনপিসি চিহ্ন অনুসরণ করো। WASD / তির বোতাম বা টাচ প্যাডে হাঁটো।')],
      [2,text('Listen','কথা শোনো'),text('Get close and press E or Talk. Listen in Bangla; replay whenever you need.','কাছে গিয়ে E বা কথা বোতাম চাপো। বাংলায় শোনো, চাইলে আবার শোনো।')],
      [3,text('Choose','বেছে নাও'),text('Tap a reply or press 1–3. A safe choice unlocks the next level.','উত্তরে ট্যাপ করো বা ১–৩ চাপো। সঠিক পরামর্শে পরের লেভেল খুলবে।')]
    ]){const card=document.createElement('article'),h=document.createElement('h3'),p=document.createElement('p');h.textContent=num(i)+' · '+title;p.textContent=body;card.append(h,p);steps.append(card);}content.append(steps);
    const rules=document.createElement('p');rules.className='guide-rules';rules.textContent=text('Start with 100 Health. A wrong reply costs 40. At zero, restart from level 1. Pause → Restart game also starts a new run with full Health.','১০০ স্বাস্থ্য নিয়ে শুরু। ভুল উত্তরে ৪০ কমে। শূন্য হলে প্রথম লেভেল থেকে আবার শুরু। বিরতি → নতুন করে শুরু-তেও পূর্ণ স্বাস্থ্য নিয়ে নতুন অভিযান শুরু হবে।');content.append(rules);
    const heading=document.createElement('h3');heading.className='guide-section-title';heading.textContent=text('10 levels. A little help for each.','১০টি লেভেল। প্রতিটির জন্য একটু সাহায্য।');content.append(heading);
    C72Cases.forEach((entry,i)=>{
      const card=document.createElement('details'),summary=document.createElement('summary'),badge=document.createElement('span'),title=document.createElement('span'),marker=document.createElement('span'),body=document.createElement('div');
      card.className='guide-level';card.dataset.level=String(i+1);card.open=i===Math.min(state.level,9);
      badge.className='guide-number';badge.textContent=num(i+1);title.textContent=entry.title[lang];marker.className='guide-marker';marker.textContent=i===state.level?text('YOU ARE HERE','তুমি এখানে'):i<state.level?'✓':'+';
      summary.append(badge,title,marker);body.className='guide-level-body';
      paragraph(body,text('Your task:','তোমার কাজ:'),guides[i][0][lang]);paragraph(body,text('Watch for:','খেয়াল করো:'),guides[i][1][lang]);paragraph(body,text('Helpful habit:','মনে রাখো:'),entry.lesson[lang]);card.append(summary,body);content.append(card);
    });
    el('guide-reminder').textContent=text('Open again from Pause → Guidebook.','আবার পড়তে বিরতি → গাইডবুক খোলো।');
    el('journey-close').textContent=intro?text('Ready. Let’s play →','চলো, শুরু করি →'):text('Back to the game →','খেলায় ফিরে যাও →');
    content.scrollTop=0;
  }
  function close(){if(mode==='briefing')api.campaign.briefing();mode='';host.hidden=true;api.panel('play');}
  el('journey-close').addEventListener('click',close);
  return {active:()=>!!mode,show(value){mode=value;render();api.panel('journey');host.hidden=false;el('journey-title').focus();},leave(){mode='';host.hidden=true;},preferences(p){lang=p.language==='bn'?1:0;if(mode)render();},key(event){if(!mode)return false;if(event.code==='Escape'){event.preventDefault();close();return true;}if(event.key==='Tab'){const controls=Array.from(host.querySelectorAll('button,summary')).filter(b=>!b.hidden&&b.getClientRects().length),first=controls[0],last=controls.at(-1);if(first&&(event.shiftKey&&(document.activeElement===first||document.activeElement===el('journey-title'))||!event.shiftKey&&document.activeElement===last)){event.preventDefault();(event.shiftKey?last:first).focus();}}return true;}};
}};
