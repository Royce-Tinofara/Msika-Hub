const $=s=>$q(s),$q=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])),m=n=>'$'+(+n).toFixed(2);
const S={get(k,d){try{const v=localStorage.getItem('msika_'+k);return v?JSON.parse(v):d}catch(e){return d}},
  set(k,v){try{localStorage.setItem('msika_'+k,JSON.stringify(v))}catch(e){}}};
const load=async n=>{try{const r=await fetch('data/'+n+'.json');if(!r.ok)throw 0;return await r.json()}catch(e){return window.MOCK[n]}};
const ORD=['Placed','Packed','Out for delivery','Delivered'],PR=['Pending','Accepted','Completed (both confirmed)'];
let D={},st={};
const sel=id=>D.sellers.find(s=>s.id==id),prod=id=>D.products.find(p=>p.id==id);
const hav=(a,b)=>{const r=x=>x*Math.PI/180,p=r(b.lat-a.lat),q=r(b.lng-a.lng);
  return 12742*Math.asin(Math.sqrt(Math.sin(p/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(q/2)**2))};
const quote=s=>{const km=hav(D.areas[st.area],s),b=s.bands.find(x=>km<=x[0]);return{km,fee:b?b[1]:null}};
function toast(msg){const t=$q('#toast');if(!t)return; t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1600)}
function cartInfo(){let sub=0,bad=false,fees={};
  const rows=st.cart.map(c=>{const p=prod(c.id),d=quote(sel(p.sid));sub+=p.price*c.q;d.fee===null?bad=true:fees[p.sid]=d.fee;
   return `<li>${c.q} × ${esc(p.name)} <button data-a="rm" data-id="${c.id}" aria-label="Remove ${esc(p.name)}">✕</button></li>`}).join('');
  const fee=Object.values(fees).reduce((a,b)=>a+b,0);return{sub,fee,bad,rows,total:sub+fee}}
function market(){
  $q('#area').innerHTML=D.areas.map((x,i)=>`<option value="${i}" ${i==st.area?'selected':''}>${esc(x.name)}</option>`).join('');
  const q=($q('#q').value||'').toLowerCase();
  $q('#products').innerHTML=D.products.filter(p=>p.name.toLowerCase().includes(q)).map(p=>{
   const s=sel(p.sid),d=quote(s),ok=d.fee!==null;
   return `<div class="card ${ok?'':'dim'}"><div class="em" aria-hidden="true">${p.emoji}</div><b>${esc(p.name)}</b><small>${esc(s.name)} · ${d.km.toFixed(1)} km away</small>
   <div>${m(p.price)} ${ok?`<small>+ ${m(d.fee)} delivery</small>`:''}</div>
   ${ok?`<button data-a="add" data-id="${p.id}">Add to cart</button>`:'<small>Outside delivery range</small>'}</div>`}).join('')||'<p>No products match your search.</p>';
  const c=cartInfo();
  $q('#cart').innerHTML=st.cart.length?`<ul>${c.rows}</ul><p>Items ${m(c.sub)}<br>Delivery ${m(c.fee)}<br><b>Total ${m(c.total)}</b></p>
   ${c.bad?'<p class="warn">Some items are outside range for this area.</p>':'<button data-a="checkout">Pay (held in escrow)</button>'}`:'<p>Cart is empty.</p>';
  $q('#orders').innerHTML=st.orders.map(o=>`<div class="row"><span><b>#${o.id}</b> ${m(o.total)} · ${ORD[o.s]}<br>
   <small>${o.s<3?'Payment held in escrow':'Released to seller'}</small></span>
   ${o.s<3?`<button data-a="adv" data-id="${o.id}">${o.s==2?'Confirm delivery':'Next step (demo)'}</button>`:''}</div>`).join('')||'<p>No orders yet.</p>'}
function mukando(){
  $q('#groups').innerHTML=st.groups.map(g=>{const paid=g.members.filter(x=>x.paid).length,all=paid==g.members.length,next=g.members[g.turn%g.members.length].n;
   const pct=Math.round((paid/g.members.length)*100);
   return `<div class="card wide"><h3>${esc(g.name)}</h3><small>${m(g.amount)} ${esc(g.freq)} · Round ${g.history.length+1} · Next payout: <b>${esc(next)}</b></small>
   <div><div style="height:6px;background:#eef2ee;border-radius:6px;overflow:hidden"><div style="height:6px;width:${pct}%;background:linear-gradient(90deg,var(--g),#16a34a)"></div></div><small>${paid}/${g.members.length} paid (${pct}%)</small></div>
   <table>${g.members.map((x,i)=>`<tr><td>${esc(x.n)}</td><td>${x.paid?'<span style="color:#166534">Paid</span>':'<span class="warn">Owing</span>'}</td>
   <td>${x.paid?'':`<button data-a="pay" data-g="${g.id}" data-i="${i}">Mark paid</button>`}</td></tr>`).join('')}</table>
   <p>Collected: <b>${m(paid*g.amount)}</b> of ${m(g.amount*g.members.length)}</p>
   <button data-a="close" data-g="${g.id}" ${all?'':'disabled'}>Close round and pay ${esc(next)}</button>
   <form data-f="member" data-g="${g.id}" class="inline"><input name="n" placeholder="New member name" required><button>Add</button></form>
   ${g.history.length?`<small>History: ${g.history.map(esc).join(' | ')}</small>`:''}</div>`}).join('')||'<p>No groups yet. Create one below.</p>'}
function barter(){
  $q('#offers').innerHTML=st.offers.map(o=>`<div class="card"><small>${esc(o.owner)}</small><div>Has: <b>${esc(o.have)}</b></div>
   <div>Wants: <b>${esc(o.want)}</b></div><small>Est. value ${m(o.val)}</small>
   ${o.owner==='You'?`<button data-a="del" data-id="${o.id}">Remove</button>`:`<button data-a="prop" data-id="${o.id}">Propose swap</button>`}</div>`).join('')||'<p>No offers yet.</p>';
  $q('#props').innerHTML=st.props.map(p=>{const d=p.gv-p.ov;
   const fair=d<0?`You add ${m(-d)} cash`:d>0?`${esc(p.who)} adds ${m(d)} cash`:'Even swap';
   const stLabel=PR[p.s]||'Pending';
   return `<div class="row"><span>${esc(p.give)} ⇄ ${esc(p.get)}<br><small>${esc(p.who)} · ${fair} · ${stLabel}</small></span>
   ${p.s<2?`<button data-a="padv" data-id="${p.id}">${p.s?'Both confirm':'Accept (demo)'}</button>`:''}</div>`}).join('')||'<p>No proposals yet.</p>'}
function mock(){
  const p=D.pos,a=D.ads,note=f=>`<div class="note">Mockup page: buttons and fields are disabled. Data comes from data/${f}.json.</div>`;
  $q('#v-pos').innerHTML=`<h2>POS &amp; Stock</h2>${note('pos')}<div class="stats"><div><small>Sales today</small><b>${m(p.today.sales)}</b></div>
   <div><small>Profit</small><b>${m(p.today.profit)}</b></div><div><small>Orders</small><b>${p.today.orders}</b></div></div>
   <div class="card"><table><thead><tr><th>Item</th><th>In stock</th><th>Price</th><th></th></tr></thead><tbody>${p.items.map(i=>`<tr><td>${esc(i.name)}</td>
   <td class="${i.qty<i.low?'low':''}">${i.qty}${i.qty<i.low?' (low)':''}</td><td>${m(i.price)}</td><td><button disabled>Sell</button> <button disabled>Restock</button></td></tr>`).join('')}</tbody></table>
   <div class="inline"><input disabled placeholder="Product name"><input disabled placeholder="Quantity"><button disabled>Add product</button></div></div>`;
  $q('#v-ads').innerHTML=`<h2>Paid Adverts</h2>${note('ads')}<div class="grid">${a.packages.map(k=>`<div class="card"><b>${esc(k.name)}</b><div>${esc(k.price)}</div>
   <small>${esc(k.desc)}</small><button disabled>Buy</button></div>`).join('')}</div><h3>Your campaigns</h3><div class="card"><table>
   <thead><tr><th>Product</th><th>Type</th><th>Status</th><th>Views</th><th>Clicks</th><th>Orders</th></tr></thead><tbody>${a.campaigns.map(c=>`<tr><td>${esc(c.product)}</td>
   <td>${esc(c.type)}</td><td>${esc(c.status)}</td><td>${c.views}</td><td>${c.clicks}</td><td>${c.orders}</td></tr>`).join('')}</tbody></table></div>`}
const all=()=>{
  ['area','cart','orders','groups','offers','props'].forEach(k=>S.set(k,st[k]));
  if (document.getElementById('area')) market();
  if (document.getElementById('groups')) mukando();
  if (document.getElementById('offers')) barter();
};
const A={add:d=>{const c=st.cart.find(x=>x.id==d.id);c?c.q++:st.cart.push({id:+d.id,q:1});toast('Added to cart')},
  rm:d=>{st.cart=st.cart.filter(x=>x.id!=d.id);toast('Removed from cart')},
  checkout:()=>{const c=cartInfo();st.orders.unshift({id:Math.floor(Math.random()*90000)+10000,total:c.total,s:0});st.cart=[];toast('Order placed (held in escrow)')},
  adv:d=>{const o=st.orders.find(x=>x.id==d.id);if(!o)return; o.s++;toast(o.s==2?'Marked out for delivery':'Delivery confirmed')},
  pay:d=>{const g=st.groups.find(x=>x.id==d.g);if(!g)return; g.members[d.i].paid=true;toast('Marked as paid')},
  close:d=>{const g=st.groups.find(x=>x.id==d.g);if(!g)return; const n=g.members[g.turn%g.members.length].n;
   g.history.push(`R${g.history.length+1}: ${n} received ${m(g.amount*g.members.length)}`);g.members.forEach(x=>x.paid=false);g.turn++;toast('Round closed')},
  del:d=>{st.offers=st.offers.filter(x=>x.id!=d.id);toast('Offer removed')},
  prop:d=>{const o=st.offers.find(x=>x.id==d.id);if(!o)return;const give=prompt('What will you offer in exchange for: '+o.have+'?');if(!give)return;
   const gv=parseFloat(prompt('Estimated value of your offer in USD?'));if(isNaN(gv))return;
   st.props.unshift({id:Date.now(),who:o.owner,get:o.have,give,gv,ov:o.val,s:0});toast('Proposal sent')},
  padv:d=>{const p=st.props.find(x=>x.id==d.id);if(!p)return; p.s++;toast(p.s==2?'Swap completed (confirmed)':'Proposal accepted')},
  reset:()=>{try{localStorage.clear()}catch(e){}location.reload()}};
const F={group:f=>{const v=Object.fromEntries(new FormData(f)),n=v.members.split(',').map(x=>x.trim()).filter(Boolean);if(!n.length){toast('Add at least one member');return}
   st.groups.push({id:Date.now(),name:v.name,amount:+v.amount,freq:v.freq,turn:0,history:[],members:n.map(x=>({n:x,paid:false}))});toast('Group created')},
  member:f=>{const g=st.groups.find(g=>g.id==f.dataset.g);if(!g)return;const name=new FormData(f).get('n'); if(!name)return; g.members.push({n:name,paid:false});toast('Member added')},
  offer:f=>{const v=Object.fromEntries(new FormData(f));st.offers.unshift({id:Date.now(),owner:'You',have:v.have,want:v.want,val:+v.val});toast('Offer posted')}};
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(b){e.preventDefault();A[b.dataset.a](b.dataset);all()}
  const n=e.target.closest('[data-nav]');if(n){show(n.dataset.nav);toast('Switched to '+n.textContent.replace(' (mockup)',''))}});
document.addEventListener('submit',e=>{e.preventDefault();const f=e.target.dataset.f;if(!f)return;F[f](e.target);e.target.reset();all()});
const areaEl=$q('#area');if(areaEl){areaEl.addEventListener('change',e=>{st.area=+e.target.value;all()});}
const qEl=$q('#q');if(qEl){qEl.addEventListener('input',market);}
function show(v){document.querySelectorAll('section').forEach(s=>s.hidden=s.id!=='v-'+v);
  document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.nav===v));location.hash=v}
async function initApp(){
  for(const n of ['sellers','products','areas','mukando','barter','pos','ads'])D[n]=await load(n);
  st={area:S.get('area',0),cart:S.get('cart',[]),orders:S.get('orders',[]),groups:S.get('groups',D.mukando),offers:S.get('offers',D.barter),props:S.get('props',[])};
  if (document.getElementById('v-pos') || document.getElementById('v-ads')) mock();
  all();
  if (document.querySelectorAll('section').length) show(location.hash.slice(1)||'market');
}
initApp();
