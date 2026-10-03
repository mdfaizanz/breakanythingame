'use strict';
/* HIT & BREAK — static HTML5 game, zero dependencies.
   Systems: Save · Data · Snd · Shapes/Render · FX · Combat · UI · Loop */
const $=i=>document.getElementById(i),R=(a,b)=>a+Math.random()*(b-a),C=(v,a,b)=>Math.max(a,Math.min(b,v));
const fmt=n=>n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e4?(n/1e3).toFixed(1)+'K':Math.floor(n)+'';
const rand=i=>{const v=Math.sin(i*127.1+311.7)*43758.5453;return v-Math.floor(v)};
const FONT='"Arial Black",Impact,system-ui,sans-serif';

/* ---------- Save (localStorage; CrazyGames SDK would be wired here, isolated) ---------- */
const S={coins:0,idx:0,wpn:0,up:[0,0,0,0],best:0,snd:1,mus:1,total:0,name:'',rec:{},ms:null,day:0,streak:0,loot:{},own:[1],v:2};
const Save={k:'hitbreak_v1',
 load(){try{Object.assign(S,JSON.parse(localStorage.getItem(this.k))||{})}catch(e){}},
 save(){try{localStorage.setItem(this.k,JSON.stringify(S))}catch(e){}},
 reset(){try{localStorage.removeItem(this.k)}catch(e){}}};

/* ---------- Data ---------- */
// c = [light, base, dark]; k = fragment style; s = sound family
const MAT={
 fruit:{c:['#ff9a8a','#e63a2a','#8a1414'],k:'chunk',s:'wood'},
 wood:{c:['#f5c088','#c07e3e','#6a3d1a'],k:'plank',s:'wood'},
 glass:{c:['#f0ffff','#8fdcef','#3b8ba8'],k:'glass',s:'glass'},
 brick:{c:['#e8967a','#c25a3c','#6e2c1c'],k:'chunk',s:'stone'},
 ceramic:{c:['#fff4e0','#e9a86a','#9c5a2c'],k:'shard',s:'glass'},
 metal:{c:['#eef2f7','#93a0b0','#48525f'],k:'chunk',s:'metal'},
 red:{c:['#ff9080','#d63a30','#7a1a18'],k:'chunk',s:'metal'},
 stone:{c:['#e2dccf','#a29a8a','#585246'],k:'chunk',s:'stone'},
 gold:{c:['#fff2a0','#f0b429','#9a6208'],k:'chunk',s:'metal',glow:1},
 crystal:{c:['#e8ffff','#5fe0ff','#2a6fd0'],k:'gem',s:'glass',glow:1},
 meteor:{c:['#ffb070','#8a5a4a','#2a1a1a'],k:'chunk',s:'stone'},
 moon:{c:['#ffffff','#c8ccd8','#6c7088'],k:'chunk',s:'stone'},
 energy:{c:['#ffffff','#ff5ad9','#7a1fd0'],k:'gem',s:'glass',glow:1},
 star:{c:['#ffffff','#ffe14a','#ff8a1a'],k:'gem',s:'glass',glow:1},
 oak:{c:['#c9936a','#8a5a36','#4a2c18'],k:'plank',s:'wood'},white:{c:['#ffffff','#e3e9ef','#9aa7b5'],k:'chunk',s:'metal'},dark:{c:['#7a8490','#313840','#0d1014'],k:'chunk',s:'metal'},
 green:{c:['#c8ffd0','#4fc46a','#1a6a34'],k:'glass',s:'glass'},card:{c:['#f0d8a8','#c49a5e','#7a5a30'],k:'plank',s:'wood'},
 lime:{c:['#e2ffa8','#7fd13b','#2f6b12'],k:'chunk',s:'wood'},orange:{c:['#ffd08a','#ff9a1f','#a54a00'],k:'chunk',s:'wood'},
 blue:{c:['#c4deff','#4a86e0','#1c3f86'],k:'shard',s:'glass'}};
// 5 worlds x 5 objects; the 5th is always a boss
// WORLD 1 = HOME. Each room is a level; objects go small & easy -> big & hard, last one is the boss.
const WORLDS=[
 {n:'BEDROOM',d:'b',bg:['#5a5a9a','#2b2a52'],fl:['#9a7048','#3a2a1c'],it:[['Perfume Bottle','bot','glass'],['Alarm Clock','sph','red'],['Table Lamp','bot','ceramic'],['Bedside Drawer','box','wood'],['GIANT WARDROBE','box','oak']]},
 {n:'KITCHEN',d:'k',bg:['#efe9d8','#b3a684'],fl:['#d9d4c8','#6a655a'],it:[['Tomato','sph','fruit'],['Coffee Mug','cyl','ceramic'],['Glass Jar','bot','glass'],['Cooking Pot','cyl','metal'],['Toaster','box','red'],['Microwave','tv','metal'],['REFRIGERATOR','box','white']]},
 {n:'DRAWING ROOM',d:'d',bg:['#a65f4e','#3c1e1c'],fl:['#80502f','#2e1a10'],it:[['Flower Vase','bot','ceramic'],['Photo Frame','tv','wood'],['Globe','sph','blue'],['Wine Bottle','bot','green'],['Side Table','box','wood'],['Television','tv','dark'],['Armchair','box','orange'],['GRAND PIANO','box','dark']]},
 {n:'BASEMENT',d:'m',bg:['#4f4f58','#15151a'],fl:['#5a5a5e','#202024'],it:[['Paint Can','cyl','red'],['Cardboard Box','box','card'],['Old Bottle','bot','green'],['Toolbox','box','red'],['Spare Tire','sph','dark'],['Old Radio','tv','wood'],['Wooden Barrel','cyl','wood'],['Oil Drum','cyl','metal'],['Washing Machine','tv','white'],['BOILER TANK','cyl','metal']]},
 {n:'HALL',d:'h',bg:['#cdbd98','#5a4a32'],fl:['#e3dccd','#6a6050'],it:[['Key Bowl','cyl','ceramic'],['Crystal Vase','bot','crystal'],['Wall Clock','sph','gold'],['Hall Mirror','tv','glass'],['Umbrella Stand','cyl','green'],['Marble Bust','sph','moon'],['Antique Chest','box','oak'],['Grandfather Clock','cyl','oak'],['Marble Statue','cyl','stone'],['Chandelier','sph','crystal'],['Iron Safe','box','metal'],['GRAND MAIN DOOR','box','oak']]}];
const ORDER=[];WORLDS.forEach((w,wi)=>{let k=0;(w.lv||[w.it.length]).forEach((len,li)=>{for(let n=0;n<len;n++)ORDER.push({it:w.it[k++],wi,li,n,len})})});
const GC=['#dfe6ee','#9aa6b6','#4b5563'],GO=['#fff2a0','#f0b429','#9a6208'];
const WPN=[ // k = draw style, L = reach, p = gameplay perk, t = perk text
 {n:'STONE',ic:'🪨',m:1,k:'rock',L:50,c:['#d8d4cc','#8f8a80','#4a463e'],cost:0,t:'Free starter'},
 {n:'KNIFE',ic:'🔪',m:1.6,k:'knife',sc:.9,L:125,c:GC,cost:200,p:{cr:1},t:'Crit +10%'},
 {n:'STEEL ROD',ic:'🔩',m:2.4,k:'rod',L:112,c:GC,cost:800,p:{cb:1},t:'Longer combo'},
 {n:'WOOD HAMMER',ic:'🔨',m:3.3,k:'ham',sc:.9,L:42,c:['#e0a868','#a06a30','#5a3414'],cost:3000,p:{big:1},t:'Bigger target'},
 {n:'STEEL HAMMER',ic:'⚒️',m:4.6,k:'ham',sc:1.05,L:42,c:['#d6e4f0','#6b8099','#2b3a4a'],cost:10000,p:{fg:1},t:'4th miss is free'},
 {n:'PISTOL',ic:'🔫',m:6.5,k:'gun',g:'p',sc:.95,L:95,ay:70,c:['#9aa3ad','#4a525c','#1a1e24'],cost:30000,p:{fast:1},t:'Fast attacks'},
 {n:'RIFLE',ic:'🎯',m:10,k:'gun',g:'r',L:150,ay:90,c:['#aab2bb','#59616b','#1d2127'],cost:90000,p:{bs:1},t:'+30% vs bosses'},
 {n:'AK-47',ic:'🔫',m:15,k:'gun',g:'a',L:150,ay:85,c:['#9aa3ad','#3e454e','#14171b'],cost:250000,p:{fast:1,cb:1},t:'Fast + long combo'},
 {n:'BOMB',ic:'💣',m:24,k:'bomb',sc:1.1,L:0,c:['#6a6f78','#2a2d33','#0a0b0d'],cost:700000,p:{met:1},t:'Perfect hits x4'},
 {n:'GOLDEN HAMMER',ic:'🏅',m:36,k:'ham',sc:1.2,L:42,c:GO,cost:2e6,p:{gold:1},t:'Coins x1.5'},
 {n:"THOR'S HAMMER",ic:'⚡',m:56,k:'ham',sc:1.35,L:42,c:['#d4ecff','#4a8fe0','#1a3a8a'],cost:6e6,p:{thor:1},t:'Thunder every 5th'},
 {n:'ROCKET LAUNCHER',ic:'🚀',m:90,k:'gun',g:'rl',sc:1.1,L:120,ay:100,c:['#8a9a6a','#4a5a34','#1e2a12'],cost:2e7,p:{slow:1},t:'Slow target + blast'}];
const UP=[{n:'POWER',b:25,g:1.55},{n:'CRIT',b:50,g:1.7,max:15},{n:'COMBO',b:50,g:1.7,max:20},{n:'COINS',b:75,g:1.75}];
const upCost=i=>Math.round(UP[i].b*Math.pow(UP[i].g,S.up[i]));
const power=()=>Math.round((8+S.up[0]*4)*WPN[S.wpn].m);
const PK=()=>WPN[S.wpn].p||{},cm=()=>(1+.25*S.up[3]+.1*sets())*(PK().gold?1.5:1);
const earn=n=>{S.coins+=n;S.total+=n};

/* ---------- Audio (all synthesized, no assets) ---------- */
const Snd={x:null,nb:null,
 init(){if(this.x){if(this.x.state=='suspended')this.x.resume();return}
  try{this.x=new(window.AudioContext||window.webkitAudioContext)();const n=this.x.sampleRate;this.nb=this.x.createBuffer(1,n,n);
   const d=this.nb.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;this.music()}catch(e){}},
 tone(f,d,ty='sine',v=.2,sl=0,dl=0,mu=0){if(!this.x||!(mu?S.mus:S.snd))return;const t=this.x.currentTime+dl,o=this.x.createOscillator(),g=this.x.createGain();
  o.type=ty;o.frequency.setValueAtTime(f,t);if(sl)o.frequency.exponentialRampToValueAtTime(Math.max(20,f+sl),t+d);
  g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(this.x.destination);o.start(t);o.stop(t+d+.02)},
 noise(d,v,fc,ty='lowpass',dl=0){if(!this.x||!S.snd)return;const t=this.x.currentTime+dl,s=this.x.createBufferSource(),f=this.x.createBiquadFilter(),g=this.x.createGain();
  s.buffer=this.nb;f.type=ty;f.frequency.value=fc;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);s.connect(f);f.connect(g);g.connect(this.x.destination);s.start(t,0,d+.05)},
 hit(h,c){this.tone(h?90:150,.14,'sine',h?.7:.45,-60);this.noise(.06,.25,h?1800:3000);if(h)this.tone(55,.3,'sine',.8,-25);if(c)this.tone(500,.18,'sawtooth',.12,500)},
 brk(s,b){this.tone(48,.6,'sine',.9,-20);
  if(s=='wood'){this.noise(.4,.6,1400);this.tone(140,.2,'square',.1,-80)}
  else if(s=='glass'){this.noise(.5,.4,5000,'highpass');for(let i=0;i<6;i++)this.tone(R(1800,4200),.15,'sine',.08,0,i*.04)}
  else if(s=='metal'){this.noise(.4,.5,900,'bandpass');this.tone(320,.35,'square',.12,-100)}
  else{this.noise(.5,.7,700);this.tone(70,.4,'sawtooth',.2,-30)}
  if(b){this.tone(35,1,'sine',1,-10);this.noise(1,.6,500)}},
 coin(){this.tone(1200,.08,'square',.07);this.tone(1700,.16,'square',.07,0,.07)},
 up(){[520,660,780,1040].forEach((f,i)=>this.tone(f,.14,'triangle',.2,0,i*.07))},
 perfect(){this.tone(880,.1,'triangle',.25);this.tone(1320,.22,'triangle',.25,0,.08)},
 music(){const N=[110,110,131,110,147,110,131,98];let i=0;
  setInterval(()=>{if(!this.x||!S.mus||G.paused)return;this.tone(N[i%8],.25,'triangle',.09,0,0,1);if(i%4==0)this.tone(N[i%8]*2,.2,'sine',.04,0,.1,1);i++},240)}};

/* ---------- Game state ---------- */
const cv=$('c'),ctx=cv.getContext('2d');
const G={W:0,H:0,cx:0,cy:0,s:200,o:null,combo:0,comboT:0,freeze:0,shake:0,zoom:0,flash:0,swing:null,pend:0,px:0,py:0,goneT:0,paused:true,nw:null,fren:0,mega:0,gift:null,giftT:15,nextFz:20,rage:0,daily:0,tg:null,tgT:.5,miss:0,vh:0,lvT:0,intro:null,ev:null,evT:30,lp:{x:0,y:0},t:0,fx:[],tx:[],rg:[]};
function resize(){const d=Math.min(2,devicePixelRatio||1);G.W=innerWidth;G.H=innerHeight;cv.width=G.W*d;cv.height=G.H*d;ctx.setTransform(d,0,0,d,0,0);
 G.s=Math.min(G.W*.52,G.H*.34);G.cx=G.W/2;G.cy=G.H*.4;if(G.o)shape(G.o)}

/* ---------- Objects: silhouette (Path2D) + 3/4 geometry ---------- */
function shape(o){o.s=G.s*C(.62+.38*o.n/Math.max(1,o.len-1)+.04*o.wi,.6,1.3);const s=o.s,p=new Path2D(),h=o.sh;
 if(h=='sph'){o.g={w:s,h:s};p.arc(0,0,s*.5,0,7)}
 else if(h=='box'||h=='tv'){const w=s*(h=='tv'?.95:.8),t=s*(h=='tv'?.7:.75),d=s*.34,x0=-w/2-d/2,y0=-t/2+d/2;o.g={w,h:t,d,x0,y0};
  [[x0,y0],[x0+d,y0-d],[x0+w+d,y0-d],[x0+w+d,y0+t-d],[x0+w,y0+t],[x0,y0+t]].forEach((q,i)=>i?p.lineTo(q[0],q[1]):p.moveTo(q[0],q[1]));p.closePath()}
 else if(h=='cyl'){const w=s*.7,t=s*.85,e=s*.19;o.g={w,h:t,e};p.moveTo(-w/2,-t/2);p.ellipse(0,-t/2,w/2,e,0,Math.PI,0);p.lineTo(w/2,t/2);p.ellipse(0,t/2,w/2,e,0,0,Math.PI);p.closePath()}
 else{o.g={w:s*.6,h:s*.98};p.moveTo(-.3*s,.48*s);p.lineTo(-.3*s,0);p.quadraticCurveTo(-.3*s,-.2*s,-.11*s,-.27*s);p.lineTo(-.1*s,-.5*s);p.lineTo(.1*s,-.5*s);p.lineTo(.11*s,-.27*s);
  p.quadraticCurveTo(.3*s,-.2*s,.3*s,0);p.lineTo(.3*s,.48*s);p.quadraticCurveTo(0,.56*s,-.3*s,.48*s);p.closePath()}
 o.path=p;o.bh=(h=='box'||h=='tv')?o.g.h/2+o.g.d/2:h=='cyl'?o.g.h/2+o.g.e:s*.5}
function mkCracks(){const a=[];for(let i=0;i<16;i++){let x=R(-.2,.2),y=R(-.2,.2),an=R(0,6.3);const pts=[[x,y]];
 for(let j=0;j<5;j++){an+=R(-.8,.8);x+=Math.cos(an)*.09;y+=Math.sin(an)*.09;pts.push([x,y])}a.push({pts,th:.05+i/16*.85})}return a}
function spawn(){const i=S.idx,e=ORDER[i%ORDER.length],it=e.it,b=e.n==e.len-1,m=MAT[it[2]],hp=Math.round((45+i*12)*Math.pow(1.2,i)*(b?2.5:1));
 const o={name:it[0],sh:it[1],mk:it[2],m,boss:b,hp,max:hp,i,wi:e.wi,li:e.li,n:e.n,len:e.len,cr:mkCracks(),dn:[],sq:0,sv:0,rot:0,rv:0,oy:-G.H*.8,vy:0,st:0,dead:false};
 shape(o);G.o=o;G.tg=null;G.tgT=.6;G.miss=0;if(e.n==0)G.lvT=0;
 if(!G.paused){if(b)T('BOSS!',G.W/2,G.H*.2,'#ff5a3c',54,1,1.3);else if(e.n==0)T('LEVEL '+(e.wi+1)+': '+WORLDS[e.wi].n,G.W/2,G.H*.2,'#ffd54a',38,1,1.8)}
 ui()}
/* ---------- Rendering ---------- */
function decor(d,hy){const x=ctx,{W}=G;let g;
 if(d=='b'){g=x.createLinearGradient(0,hy*.1,0,hy*.8);g.addColorStop(0,'#1a2a5a');g.addColorStop(1,'#5a6aaa');x.fillStyle=g;x.fillRect(W*.08,hy*.12,W*.3,hy*.62);
  x.fillStyle='#fff';for(let i=0;i<14;i++)x.fillRect(W*.08+rand(i)*W*.3,hy*.12+rand(i+9)*hy*.6,2,2);x.fillStyle='#fff6c8';x.beginPath();x.arc(W*.28,hy*.3,hy*.09,0,7);x.fill();
  x.strokeStyle='#e8dcc8';x.lineWidth=5;x.strokeRect(W*.08,hy*.12,W*.3,hy*.62);x.beginPath();x.moveTo(W*.23,hy*.12);x.lineTo(W*.23,hy*.74);x.stroke();
  x.fillStyle='#d86a8a';x.fillRect(W*.04,hy*.06,W*.07,hy*.74);x.fillRect(W*.35,hy*.06,W*.07,hy*.74);
  x.fillStyle='#3a2a5a';rr(W*.56,hy*.18,W*.36,hy*.5,10);x.fill();x.fillStyle='#e8c07a';x.fillRect(W*.6,hy*.26,W*.12,hy*.3);x.fillStyle='#7ac0e8';x.fillRect(W*.76,hy*.26,W*.12,hy*.3)}
 else if(d=='k'){x.fillStyle='#b8793a';x.fillRect(0,0,W,hy*.3);x.strokeStyle='rgba(0,0,0,.35)';x.lineWidth=2;for(let i=0;i<4;i++){x.strokeRect(i*W/4+4,6,W/4-8,hy*.3-12);x.fillStyle='#ffd54a';x.fillRect(i*W/4+W/8-3,hy*.3-28,6,16)}
  x.strokeStyle='rgba(255,255,255,.4)';x.beginPath();for(let i=0;i<W/40;i++){x.moveTo(i*40,hy*.3);x.lineTo(i*40,hy)}for(let j=0;hy*.3+j*40<hy;j++){x.moveTo(0,hy*.3+j*40);x.lineTo(W,hy*.3+j*40)}x.stroke();
  x.fillStyle='#444';x.beginPath();x.arc(W*.8,hy*.62,hy*.12,0,7);x.fill();x.fillRect(W*.8,hy*.57,W*.09,8)}
 else if(d=='d'){g=x.createLinearGradient(0,0,0,hy);g.addColorStop(0,'#ffe9a8');g.addColorStop(1,'#d89a4a');x.fillStyle=g;x.fillRect(W*.62,hy*.1,W*.3,hy*.6);x.strokeStyle='#4a2c18';x.lineWidth=6;x.strokeRect(W*.62,hy*.1,W*.3,hy*.6);
  x.fillStyle='#f0c14a';x.fillRect(W*.1,hy*.14,W*.34,hy*.5);x.fillStyle='#2f5a4a';x.fillRect(W*.12,hy*.2,W*.3,hy*.38);x.fillStyle='#c8e0a0';x.beginPath();x.arc(W*.27,hy*.4,hy*.1,0,7);x.fill();
  x.fillStyle='#fff3c0';for(const px of[W*.5,W*.56]){x.beginPath();x.arc(px,hy*.35,6,0,7);x.fill()}}
 else if(d=='m'){x.strokeStyle='rgba(0,0,0,.4)';x.lineWidth=2;for(let j=0;j*22<hy;j++){x.beginPath();x.moveTo(0,j*22);x.lineTo(W,j*22);for(let i=0;i<W/50+1;i++){x.moveTo(i*50+(j%2)*25,j*22);x.lineTo(i*50+(j%2)*25,j*22+22)}x.stroke()}
  g=x.createLinearGradient(0,hy*.16,0,hy*.3);g.addColorStop(0,'#9aa5b0');g.addColorStop(.5,'#5a6570');g.addColorStop(1,'#2a3038');x.fillStyle=g;x.fillRect(0,hy*.16,W,hy*.14);
  x.strokeStyle='#222';x.lineWidth=2;x.beginPath();x.moveTo(W*.72,0);x.lineTo(W*.72,hy*.4);x.stroke();g=x.createRadialGradient(W*.72,hy*.45,2,W*.72,hy*.45,hy*.9);g.addColorStop(0,'rgba(255,225,130,.7)');g.addColorStop(1,'rgba(255,225,130,0)');x.fillStyle=g;x.fillRect(0,0,W,hy*1.4);x.fillStyle='#fff3b0';x.beginPath();x.arc(W*.72,hy*.45,9,0,7);x.fill()}
 else{for(const px of[W*.03,W*.85]){g=x.createLinearGradient(px,0,px+W*.12,0);g.addColorStop(0,'#fff');g.addColorStop(1,'#a8a090');x.fillStyle=g;x.fillRect(px,0,W*.12,hy);x.fillStyle='#d8d0c0';x.fillRect(px-5,0,W*.12+10,16)}
  x.fillStyle='#4a2c18';x.beginPath();x.moveTo(W*.34,hy);x.lineTo(W*.34,hy*.4);x.arc(W*.5,hy*.4,W*.16,Math.PI,0);x.lineTo(W*.66,hy);x.fill();x.fillStyle='#e0b040';x.beginPath();x.arc(W*.6,hy*.7,5,0,7);x.fill();
  g=x.createRadialGradient(W/2,0,2,W/2,0,hy*1.1);g.addColorStop(0,'rgba(255,240,180,.8)');g.addColorStop(1,'rgba(255,240,180,0)');x.fillStyle=g;x.fillRect(0,0,W,hy*1.2)}}
function bg(){const x=ctx,{W,H,cx,cy}=G,o=G.o,w=WORLDS[o.wi],hy=H*.27;
 let g=x.createLinearGradient(0,0,0,hy);g.addColorStop(0,w.bg[0]);g.addColorStop(1,w.bg[1]);x.fillStyle=g;x.fillRect(-60,-60,W+120,H+120);
 decor(w.d,hy);
 g=x.createLinearGradient(0,hy,0,H);g.addColorStop(0,w.fl[0]);g.addColorStop(1,w.fl[1]);x.fillStyle=g;x.fillRect(-60,hy,W+120,H);
 x.strokeStyle='rgba(255,255,255,.07)';x.lineWidth=2;x.beginPath();
 for(let i=-8;i<=8;i++){x.moveTo(cx+i*W*.05,hy);x.lineTo(cx+i*W*.28,H+20)}
 for(let j=1;j<7;j++){const y=hy+(H-hy)*Math.pow(j/7,1.8);x.moveTo(0,y);x.lineTo(W,y)}x.stroke();
 g=x.createRadialGradient(cx,cy,10,cx,cy,G.s*1.6);g.addColorStop(0,'rgba(255,240,200,.34)');g.addColorStop(1,'rgba(255,240,200,0)');x.fillStyle=g;x.fillRect(0,0,W,H)}
function poly(pts,fill){const x=ctx;x.beginPath();pts.forEach((q,i)=>i?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1]));x.closePath();x.fillStyle=fill;x.fill()}
function drawObj(o){const x=ctx,s=o.s,m=o.m.c,g=o.g,h=o.sh;let gr;
 x.shadowBlur=o.m.glow?36:0;x.shadowColor=m[1];
 if(h=='sph'){gr=x.createRadialGradient(-.16*s,-.2*s,.04*s,0,0,.62*s);gr.addColorStop(0,m[0]);gr.addColorStop(.5,m[1]);gr.addColorStop(1,m[2]);x.fillStyle=gr;x.fill(o.path);x.shadowBlur=0;
  if(o.mk=='fruit'){x.strokeStyle='#4a2a10';x.lineWidth=s*.03;x.beginPath();x.moveTo(0,-.46*s);x.quadraticCurveTo(.03*s,-.6*s,.1*s,-.62*s);x.stroke();x.fillStyle='#4caf50';x.beginPath();x.ellipse(.14*s,-.55*s,.09*s,.045*s,-.5,0,7);x.fill()}
  if(o.mk=='stone'||o.mk=='moon'||o.mk=='meteor'){x.fillStyle='rgba(0,0,0,.18)';for(let i=0;i<7;i++){x.beginPath();x.arc((rand(i)-.5)*.6*s,(rand(i+7)-.5)*.6*s,s*(.02+rand(i+3)*.05),0,7);x.fill()}}}
 else if(h=='box'||h=='tv'){const{w,h:t,d,x0,y0}=g;
  poly([[x0,y0],[x0+d,y0-d],[x0+w+d,y0-d],[x0+w,y0]],m[0]);
  poly([[x0+w,y0],[x0+w+d,y0-d],[x0+w+d,y0+t-d],[x0+w,y0+t]],m[2]);x.shadowBlur=0;
  gr=x.createLinearGradient(0,y0,0,y0+t);gr.addColorStop(0,m[1]);gr.addColorStop(1,m[2]);x.fillStyle=gr;x.fillRect(x0,y0,w,t);
  x.lineWidth=s*.02;x.strokeStyle='rgba(0,0,0,.35)';
  if(o.mk=='wood'){x.strokeRect(x0+w*.07,y0+t*.07,w*.86,t*.86);x.beginPath();x.moveTo(x0+w*.07,y0+t*.07);x.lineTo(x0+w*.93,y0+t*.93);x.moveTo(x0+w*.33,y0);x.lineTo(x0+w*.33,y0+t);x.moveTo(x0+w*.66,y0);x.lineTo(x0+w*.66,y0+t);x.stroke()}
  else if(o.mk=='brick'){x.beginPath();for(let r=1;r<3;r++){x.moveTo(x0,y0+t*r/3);x.lineTo(x0+w,y0+t*r/3)}x.moveTo(x0+w*.5,y0);x.lineTo(x0+w*.5,y0+t/3);x.moveTo(x0+w*.25,y0+t/3);x.lineTo(x0+w*.25,y0+t*2/3);x.moveTo(x0+w*.75,y0+t/3);x.lineTo(x0+w*.75,y0+t*2/3);x.stroke()}
  else if(h=='tv'){gr=x.createLinearGradient(0,y0,0,y0+t);gr.addColorStop(0,'#7be8ff');gr.addColorStop(1,'#1a4a8a');x.fillStyle='#1c222b';x.fillRect(x0+w*.06,y0+t*.08,w*.88,t*.84);x.fillStyle=gr;x.fillRect(x0+w*.1,y0+t*.14,w*.8,t*.66);
   x.fillStyle='rgba(255,255,255,.25)';x.beginPath();x.moveTo(x0+w*.1,y0+t*.14);x.lineTo(x0+w*.5,y0+t*.14);x.lineTo(x0+w*.25,y0+t*.8);x.lineTo(x0+w*.1,y0+t*.8);x.fill()}
  else{x.strokeRect(x0+w*.06,y0+t*.06,w*.88,t*.88);x.fillStyle='#f0b429';x.beginPath();x.arc(x0+w/2,y0+t/2,t*.2,0,7);x.fill();x.stroke();x.fillStyle='#2a2f36';x.fillRect(x0+w/2-3,y0+t/2-t*.14,6,t*.28);
   x.fillStyle='rgba(0,0,0,.4)';for(const q of[[.1,.1],[.9,.1],[.1,.9],[.9,.9]]){x.beginPath();x.arc(x0+w*q[0],y0+t*q[1],s*.02,0,7);x.fill()}}}
 else{const w=g.w,t=g.h;gr=x.createLinearGradient(-w/2,0,w/2,0);gr.addColorStop(0,m[2]);gr.addColorStop(.28,m[1]);gr.addColorStop(.42,m[0]);gr.addColorStop(.75,m[1]);gr.addColorStop(1,m[2]);
  x.globalAlpha=o.mk=='glass'?.88:1;x.fillStyle=gr;x.fill(o.path);x.globalAlpha=1;x.shadowBlur=0;
  if(h=='cyl'){const e=g.e;x.beginPath();x.ellipse(0,-t/2,w/2,e,0,0,7);x.fillStyle=m[0];x.fill();x.strokeStyle='rgba(0,0,0,.3)';x.lineWidth=s*.015;x.stroke();
   x.strokeStyle=o.mk=='wood'?'#3a3f47':'rgba(0,0,0,.28)';x.lineWidth=s*.03;for(const yy of[-.28,.28]){x.beginPath();x.ellipse(0,yy*t,w/2,e,0,0,Math.PI);x.stroke()}}
  else{x.beginPath();x.ellipse(0,-.5*s,.1*s,.03*s,0,0,7);x.fillStyle='rgba(0,0,0,.45)';x.fill()}}
 x.shadowBlur=0;gr=x.createLinearGradient(-.5*s,-.5*s,.3*s,.3*s);gr.addColorStop(0,'rgba(255,255,255,.32)');gr.addColorStop(.45,'rgba(255,255,255,0)');x.fillStyle=gr;x.fill(o.path);
 // damage overlays, clipped to silhouette
 const f=1-o.hp/o.max;x.save();x.clip(o.path);
 x.fillStyle='rgba(0,0,0,'+f*.3+')';x.fillRect(-s,-s,2*s,2*s);
 for(const d of o.dn){gr=x.createRadialGradient(d.x,d.y,0,d.x,d.y,d.r);gr.addColorStop(0,'rgba(0,0,0,.45)');gr.addColorStop(.75,'rgba(0,0,0,.18)');gr.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=gr;x.beginPath();x.arc(d.x,d.y,d.r,0,7);x.fill();
  x.strokeStyle='rgba(255,255,255,.25)';x.lineWidth=2;x.beginPath();x.arc(d.x,d.y,d.r*.6,3.6,5.4);x.stroke()}
 x.lineCap='round';x.lineJoin='round';
 for(const c of o.cr)if(c.th<=f){const n=Math.min(6,2+Math.floor((f-c.th)*24));const line=(dx,col,w)=>{x.strokeStyle=col;x.lineWidth=w;x.beginPath();c.pts.slice(0,n).forEach((q,i)=>i?x.lineTo(q[0]*s+dx,q[1]*s+dx):x.moveTo(q[0]*s+dx,q[1]*s+dx));x.stroke()};
  line(1.5,o.mk=='glass'?'rgba(255,255,255,.7)':'rgba(255,255,255,.35)',2);line(0,o.mk=='glass'?'#1d5570':'#1a0d05',2.6)}
 x.restore();x.strokeStyle='rgba(255,255,255,.25)';x.lineWidth=2;x.stroke(o.path)}
function rr(a,b,w,h,r){ctx.beginPath();ctx.roundRect?ctx.roundRect(a,b,w,h,r):ctx.rect(a,b,w,h)}
const muscle=()=>Math.min(1,(S.up[0]+S.wpn*3)/45);   // arm grows with power
function arm(m){const x=ctx,w=34+m*34,sk=['#ffdcbc','#e9a877','#a5673f'];let g;
 g=x.createLinearGradient(-w,0,w,0);g.addColorStop(0,sk[2]);g.addColorStop(.3,sk[0]);g.addColorStop(.65,sk[1]);g.addColorStop(1,sk[2]);x.fillStyle=g;
 x.beginPath();x.moveTo(-w*.55,20);x.bezierCurveTo(-w*(.7+m*.5),80,-w*(.7+m*.6),120,-w*.6,175);x.lineTo(w*.6,175);x.bezierCurveTo(w*(.7+m*.6),120,w*(.7+m*.5),80,w*.55,20);x.closePath();x.fill();
 x.lineCap='round';x.strokeStyle=`rgba(90,40,15,${.12+m*.3})`;x.lineWidth=2+m*2;x.beginPath();x.moveTo(-w*.05,45);x.quadraticCurveTo(-w*.25,100,-w*.05,150);x.stroke();
 if(m>.2){x.strokeStyle=`rgba(80,90,150,${m*.55})`;x.lineWidth=2.5;x.beginPath();x.moveTo(w*.25,40);x.bezierCurveTo(w*.5,75,w*.1,105,w*.3,150);x.stroke()}
 const fw=w*1.15,fh=64;for(let i=0;i<4;i++){const fx=-fw/2+i*fw/4;g=x.createLinearGradient(0,-fh/2,0,fh/2);g.addColorStop(0,sk[0]);g.addColorStop(.6,sk[1]);g.addColorStop(1,sk[2]);
  x.fillStyle=g;rr(fx,-fh/2,fw/4+1,fh,fw/8);x.fill();x.strokeStyle='rgba(60,25,8,.45)';x.lineWidth=2;x.stroke();x.fillStyle='rgba(255,255,255,.35)';x.beginPath();x.arc(fx+fw/8,-fh/2+8,fw/12,0,7);x.fill()}
 x.fillStyle=sk[1];x.strokeStyle='rgba(60,25,8,.5)';x.lineWidth=2;x.beginPath();x.ellipse(-fw*.05,fh*.32,fw*.42,fh*.16,-.08,0,7);x.fill();x.stroke()}
function weapon(wi,tl){const w=WPN[wi],x=ctx,c=w.c,k=w.k;x.save();x.rotate(Math.PI+tl);x.scale(w.sc||1,w.sc||1);let g;   // rotated 180deg: tool points DOWN, arm comes from above
 const handle=len=>{g=x.createLinearGradient(-9,0,9,0);g.addColorStop(0,'#5a3418');g.addColorStop(.4,'#b07a44');g.addColorStop(1,'#5a3418');x.fillStyle=g;rr(-9,10,18,len,6);x.fill()};
 const metal=(a,b,cw,ch)=>{g=x.createLinearGradient(a,0,a+cw,0);g.addColorStop(0,c[2]);g.addColorStop(.4,c[0]);g.addColorStop(1,c[2]);x.fillStyle=g;rr(a,b,cw,ch,4);x.fill()};
 if(k=='rock'){arm(muscle());g=x.createRadialGradient(-12,-14,3,0,0,50);g.addColorStop(0,c[0]);g.addColorStop(.6,c[1]);g.addColorStop(1,c[2]);x.fillStyle=g;x.beginPath();
  [[-40,-8],[-24,-40],[10,-46],[38,-20],[42,16],[16,40],[-26,34]].forEach((q,i)=>i?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1]));x.closePath();x.fill();x.strokeStyle='rgba(0,0,0,.4)';x.lineWidth=3;x.stroke()}
 else if(k=='bomb'){g=x.createRadialGradient(-14,-14,4,0,0,50);g.addColorStop(0,c[0]);g.addColorStop(.5,c[1]);g.addColorStop(1,c[2]);x.fillStyle=g;x.beginPath();x.arc(0,0,48,0,7);x.fill();x.fillStyle=c[1];rr(-12,38,24,16,4);x.fill();
  x.strokeStyle='#caa05a';x.lineWidth=4;x.beginPath();x.moveTo(0,54);x.quadraticCurveTo(16,72,6,96);x.stroke();x.shadowBlur=20;x.shadowColor='#ffb02e';x.fillStyle='#ffd54a';x.beginPath();x.arc(6,98,7,0,7);x.fill()}
 else{
  if(k=='ham'){handle(150);g=x.createLinearGradient(0,-40,0,26);g.addColorStop(0,c[0]);g.addColorStop(.5,c[1]);g.addColorStop(1,c[2]);x.fillStyle=g;rr(-56,-42,112,70,10);x.fill();x.fillStyle='rgba(255,255,255,.4)';rr(-50,-38,100,10,5);x.fill();x.fillStyle=c[2];x.fillRect(-56,-42,12,70);x.fillRect(44,-42,12,70);
   if(w.p&&w.p.thor){x.strokeStyle='#fff';x.lineWidth=4;x.beginPath();x.moveTo(-8,-30);x.lineTo(6,-12);x.lineTo(-4,-8);x.lineTo(10,12);x.stroke()}}
  else if(k=='knife'){handle(110);g=x.createLinearGradient(-14,0,14,0);g.addColorStop(0,c[2]);g.addColorStop(.5,c[0]);g.addColorStop(1,c[1]);x.fillStyle=g;x.beginPath();x.moveTo(-14,10);x.lineTo(-12,-80);x.quadraticCurveTo(0,-128,16,-88);x.lineTo(14,10);x.closePath();x.fill();x.fillStyle='#3a2a1a';x.fillRect(-24,4,48,10)}
  else if(k=='rod'){metal(-8,-112,16,262);metal(-11,-116,22,10)}
  else if(w.g=='p'){metal(-9,-95,18,70);metal(-15,-35,30,70);x.fillStyle=c[2];rr(-11,30,22,56,5);x.fill()}
  else if(w.g=='r'){metal(-6,-150,12,115);metal(-14,-38,28,90);x.fillStyle='#2a3a4a';rr(-7,-70,14,40,5);x.fill();x.fillStyle='#8a5a30';rr(-12,50,24,70,6);x.fill()}
  else if(w.g=='a'){metal(-6,-150,12,100);x.fillStyle='#8a4f22';rr(-12,-80,24,48,6);x.fill();metal(-14,-34,28,72);x.strokeStyle=c[2];x.lineWidth=11;x.lineCap='round';x.beginPath();x.moveTo(12,10);x.quadraticCurveTo(34,30,28,66);x.stroke();x.fillStyle='#8a4f22';rr(-12,46,24,72,6);x.fill()}
  else{g=x.createLinearGradient(-26,0,26,0);g.addColorStop(0,c[2]);g.addColorStop(.4,c[0]);g.addColorStop(1,c[2]);x.fillStyle=g;rr(-26,-130,52,220,10);x.fill();x.fillStyle=c[2];rr(-30,-134,60,16,6);x.fill();x.fillStyle='#ffb02e';x.fillRect(-26,-100,52,8)}
  x.save();x.translate(0,w.ay||112);x.scale(.75,.75);arm(muscle());x.restore()}
 x.restore()}
/* World intro: a man with a hammer on the road, ready to break the city */
function scene(){const x=ctx,{W,H}=G,n=G.intro,w=WORLDS[n.w];let g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#ff9a5a');g.addColorStop(.55,'#4a3a7a');g.addColorStop(1,'#14101f');x.fillStyle=g;x.fillRect(0,0,W,H);
 for(let i=0;i<9;i++){const bw=W/9,bh=H*(.2+.3*rand(i+n.w*9));x.fillStyle='#1a1530';x.fillRect(i*bw,H*.62-bh,bw-3,bh);x.fillStyle='rgba(255,225,130,.6)';for(let j=0;j<6;j++)if(rand(i*7+j)>.45)x.fillRect(i*bw+8+(j%2)*bw*.4,H*.62-bh+12+Math.floor(j/2)*28,bw*.18,12)}
 x.fillStyle='#2a2a33';x.beginPath();x.moveTo(W*.38,H*.62);x.lineTo(W*.62,H*.62);x.lineTo(W*1.1,H);x.lineTo(-W*.1,H);x.fill();
 x.strokeStyle='#ffd54a';x.lineWidth=5;x.setLineDash([22,26]);x.beginPath();x.moveTo(W/2,H*.62);x.lineTo(W/2,H);x.stroke();x.setLineDash([]);
 const u=Math.min(W/420,H/820)*1.5,sk='#f0b98c',sw=Math.sin(n.t*3)*.12;x.save();x.translate(W/2,H*.9);x.scale(u,u);
 x.fillStyle='rgba(0,0,0,.4)';x.beginPath();x.ellipse(0,0,90,16,0,0,7);x.fill();x.translate(0,Math.sin(n.t*4)*4);
 x.fillStyle='#2b3a6b';rr(-46,-150,40,150,10);x.fill();rr(6,-150,40,150,10);x.fill();x.fillStyle='#16161c';x.fillRect(-52,-12,50,12);x.fillRect(4,-12,50,12);
 g=x.createLinearGradient(-78,0,78,0);g.addColorStop(0,'#b87848');g.addColorStop(.5,sk);g.addColorStop(1,'#b87848');x.fillStyle=g;x.beginPath();x.moveTo(-80,-292);x.lineTo(80,-292);x.lineTo(46,-140);x.lineTo(-46,-140);x.closePath();x.fill();
 x.strokeStyle='rgba(90,40,15,.4)';x.lineWidth=3;x.beginPath();x.moveTo(0,-270);x.lineTo(0,-150);x.moveTo(-30,-235);x.lineTo(30,-235);x.moveTo(-26,-195);x.lineTo(26,-195);x.stroke();
 x.fillStyle=sk;x.beginPath();x.arc(0,-326,28,0,7);x.fill();x.fillStyle='#d8362b';x.fillRect(-28,-340,56,10);
 x.fillStyle=sk;x.save();x.translate(-72,-282);x.rotate(.25);rr(-20,0,40,100,18);x.fill();rr(-17,95,34,80,16);x.fill();x.restore();
 x.save();x.translate(72,-282);x.rotate(-1.2+sw);rr(-20,0,40,95,18);x.fill();x.translate(0,90);x.rotate(-1.94);rr(-17,0,34,90,16);x.fill();
 x.translate(0,88);x.fillStyle='#8a5a30';rr(-8,-30,16,200,6);x.fill();x.fillStyle='#9aa8b8';rr(-54,160,108,58,10);x.fill();x.fillStyle='rgba(255,255,255,.45)';rr(-48,164,96,9,4);x.fill();x.restore();x.restore();
 x.textAlign='center';x.textBaseline='middle';x.lineJoin='round';x.strokeStyle='#1a0d05';x.lineWidth=10;
 x.font=`900 ${Math.min(64,W*.15)}px ${FONT}`;x.strokeText('WORLD '+(n.w+1),W/2,H*.1);x.fillStyle='#ffd54a';x.fillText('WORLD '+(n.w+1),W/2,H*.1);
 x.font=`900 ${Math.min(40,W*.1)}px ${FONT}`;x.strokeText(w.n,W/2,H*.18);x.fillStyle='#fff';x.fillText(w.n,W/2,H*.18);
 x.font=`900 ${Math.min(16,W*.04)}px ${FONT}`;x.lineWidth=5;x.strokeText('One man. One hammer. Break everything around you.',W/2,H*.25);x.fillText('One man. One hammer. Break everything around you.',W/2,H*.25);
 if(n.t>.8&&Math.sin(n.t*6)>0){x.strokeText('TAP TO START',W/2,H*.96);x.fillStyle='#ffd54a';x.fillText('TAP TO START',W/2,H*.96)}}
function wpPos(){const s=G.s,rx=Math.min(G.W-40,G.cx+s*.4),ry=Math.max(80,G.cy-s*1.05),sw=G.swing;let px=rx,py=ry+Math.sin(G.t*3)*4,e=0,tl=.15;
 if(sw){const t=sw.t;let k;   // 1) wind-up: lift up  2) slam DOWN onto the target  3) recoil back up
  if(t<.25){k=t/.25;py=ry-40*k;tl=.15+.6*k}
  else if(t<.45){k=(t-.25)/.2;k*=k;const y0=ry-40;px=rx+(sw.x-rx)*k;py=y0+(sw.y-y0)*k;tl=.75-.75*k;e=k}
  else{k=Math.min(1,(t-.45)/.55);k=1-Math.pow(1-k,2);px=sw.x+(rx-sw.x)*k;py=sw.y+(ry-sw.y)*k;tl=.15*k-.1*(1-k);e=1-k}}
 return[px,py,e,tl]}
function drawP(p){const x=ctx,k=p.life/p.max,age=1-k;x.save();x.globalAlpha=Math.min(1,k*2.2)*(p.a??1);x.translate(p.x,p.y);
 if(p.t=='dust'){x.globalAlpha*=.45;x.fillStyle=p.c;x.beginPath();x.arc(0,0,p.sz*(1+age*1.8),0,7);x.fill()}
 else if(p.t=='spark'){x.globalCompositeOperation='lighter';x.strokeStyle=p.c;x.lineWidth=2.5;x.beginPath();x.moveTo(0,0);x.lineTo(-p.vx*.04,-p.vy*.04);x.stroke()}
 else if(p.t=='coin'){x.scale(Math.cos(p.rot),1);x.fillStyle='#ffcf33';x.strokeStyle='#a5670a';x.lineWidth=2;x.beginPath();x.arc(0,0,p.sz,0,7);x.fill();x.stroke();x.strokeStyle='#ffee99';x.beginPath();x.arc(0,0,p.sz*.6,0,7);x.stroke()}
 else{x.rotate(p.rot);const sc=1+p.grow*age;x.scale(sc,sc);x.fillStyle=p.c;x.strokeStyle=p.gl?'rgba(255,255,255,.8)':'rgba(0,0,0,.4)';x.lineWidth=1.5;
  if(p.gl){x.shadowBlur=14;x.shadowColor=p.c}x.beginPath();p.pts.forEach((q,i)=>i?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1]));x.closePath();x.fill();x.stroke()}
 x.restore()}

/* ---------- FX: particles, rings, floating text ---------- */
function P(o){if(G.fx.length>450)G.fx.splice(0,50);G.fx.push(Object.assign({x:0,y:0,vx:0,vy:0,g:900,life:.8,max:.8,sz:8,rot:0,vr:0,t:'dust',c:'#fff',grow:0,bn:0},o,{max:o.life||.8}))}
function T(txt,x,y,c,sz,big,life=.9){G.tx.push({txt,x,y,c,sz,big,life,max:life})}
function ring(x,y,r,c,life=.3){G.rg.push({x,y,r:6,mr:r,c,life,max:life})}
function pts(k,z){if(k=='plank')return[[-2.4*z,-.5*z],[2.4*z,-.4*z],[2.3*z,.5*z],[-2.4*z,.4*z]];
 if(k=='glass')return[[0,-1.4*z],[z,.8*z],[-.8*z,z]];if(k=='gem')return[[0,-1.3*z],[.8*z,0],[0,1.3*z],[-.8*z,0]];
 const n=k=='shard'?4:6;return Array.from({length:n},(_,i)=>{const a=i/n*6.283,r=z*R(.6,1.1);return[Math.cos(a)*r,Math.sin(a)*r]})}
function frags(n,x,y,spd,size,dir){const m=G.o.m,z=G.s/200;
 for(let i=0;i<n;i++){const a=dir?R(-Math.PI,0):R(0,6.283),v=R(.4,1)*spd;
  P({x:x+R(-.2,.2)*G.s*(dir?0:1),y:y+R(-.2,.2)*G.s*(dir?0:1),vx:Math.cos(a)*v,vy:Math.sin(a)*v-(dir?100:200),life:R(.7,1.3),t:'shard',c:m.c[Math.floor(R(0,3))],pts:pts(m.k,size*R(.6,1.4)*z),rot:R(0,6),vr:R(-12,12),grow:dir?0:R(0,1.6),bn:1,gl:m.glow&&Math.random()<.5})}}
function dustpuff(x,y,n,c='rgba(220,200,170,1)'){for(let i=0;i<n;i++)P({x:x+R(-30,30),y:y+R(-10,10),vx:R(-90,90),vy:R(-90,-10),g:-20,life:R(.5,.9),sz:R(10,24)*G.s/200,c})}
function sparks(x,y,n,c='#ffd27a'){for(let i=0;i<n;i++){const a=R(0,6.283),v=R(200,650);P({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,g:700,life:R(.25,.5),t:'spark',c})}}

/* ---------- Combat ---------- */
function attack(rx,ry){if(G.paused)return;if(G.intro){if(G.intro.t>.8)G.intro=null;return}if(G.nw){if(G.nw.t>.7)G.nw=null;return}
 const o=G.o;if(!o||o.dead||Math.hypot(rx-G.cx,ry-G.cy)>o.s*.62)return;   // taps off the object are ignored
 if(G.swing){G.pend=1;G.px=rx;G.py=ry;return}
 const tg=G.tg,d=tg?Math.hypot(rx-tg.x,ry-tg.y):1e9;
 G.swing={t:0,x:C(rx,G.cx-o.s*.45,G.cx+o.s*.45),y:C(ry,G.cy-o.s*.4,G.cy+o.s*.4),hit:false,ok:!!tg&&d<=tg.r*1.25,pf:!!tg&&d<=tg.r*.45}}
function miss(x,y){const o=G.o,lim=3+(PK().fg?1:0);G.miss++;G.combo=0;G.nextFz=20;G.tg=null;G.tgT=.15;
 T('MISS!',x,y-30,'#ff6a5c',32,0,.7);sparks(x,y,6,'#999');dustpuff(x,y,2);G.shake=Math.max(G.shake,3);Snd.tone(130,.2,'sawtooth',.2,-70);
 if(G.miss>=lim){G.miss=0;o.hp=o.max;o.dn=[];o.st=0;G.shake=16;G.flash=.5;T('ALL DAMAGE RESET!',G.cx,G.cy-o.s*.2,'#ff6a5c',40,1,1.5);dustpuff(G.cx,G.cy,14);Snd.tone(320,.6,'sawtooth',.25,-250);ui()}}
function hit(x,y,pf){const o=G.o;if(o.dead)return;const z=G.s/200,pk=PK();
 G.miss=0;G.vh++;G.combo+=pf?3:1;G.comboT=1.5+(pk.cb?1:0);S.best=Math.max(S.best,G.combo);mis('combo',G.combo,true);evProg('hit');
 if(G.combo>=G.nextFz&&G.fren<=0){G.fren=6;G.nextFz=G.combo+20;T('FRENZY! x2',G.cx,G.H*.2,'#ff8a3c',50,1,1.2);G.flash=.5;Snd.up()}
 evProg('combo',G.combo);
 const crit=Math.random()<.05+.04*S.up[1]+(pk.cr?.1:0);
 let dmg=power()*(1+Math.min(G.combo,60)*.02*(1+S.up[2]*.35))*R(.9,1.1);if(crit)dmg*=3;if(pf)dmg*=pk.met?4:2.5;if(G.fren>0)dmg*=2;if(G.mega>0){dmg*=4;G.mega--}if(crit)mis('crit');if(pf)mis('perfect');
 const th=pk.thor&&G.vh%5==0;if(th)dmg*=2.5;if(o.boss&&pk.bs)dmg*=1.3;dmg=Math.max(1,Math.round(dmg));
 o.hp-=dmg;G.rage=Math.min(100,G.rage+(pf?15:crit?8:4));const heavy=S.wpn>=3||crit||pf,f=1-Math.max(0,o.hp)/o.max;
 o.dn.push({x:x-G.cx,y:y-G.cy,r:R(.09,.15)*o.s});if(o.dn.length>9)o.dn.shift();
 o.sq=.12+(crit?.06:0)+Math.min(.05,S.wpn*.006);o.sv=0;o.rv=-(x-G.cx)/o.s*6;
 ring(x,y,(60+S.wpn*7+(crit?40:0))*z,crit||pf?'#ffd54a':'#fff');
 frags(8+Math.min(10,G.combo/2)|0,x,y,340+S.wpn*30,7,1);dustpuff(x,y,3);
 if(o.m.s=='metal'||crit||o.m.glow)sparks(x,y,crit?22:10);
 T((crit?'CRIT ':'')+fmt(dmg),x+R(-20,20),y-30,crit?'#ffd54a':'#fff',(crit?38:26)+Math.min(14,G.combo/3),0,.75);
 if(pf){T('PERFECT!',G.cx,G.cy-o.s*.7,'#7dffb0',40,1,.9);const b=Math.round(5*cm()*(1+o.i/3));earn(b);T('+'+b,x,y-70,'#ffd54a',26,0,.9);Snd.perfect()}
 if(th){ring(G.cx,G.cy,260,'#7ad0ff',.5);sparks(G.cx,G.cy,40,'#9fdcff');G.flash=.35;T('THUNDER!',G.cx,G.cy-o.s*.85,'#9fdcff',40,1,.9);Snd.tone(60,.5,'sawtooth',.4,-30)}
 G.shake=Math.max(G.shake,4+Math.min(G.combo,30)*.25+S.wpn*.9+(crit?6:0));G.freeze=crit?.075:.04;Snd.hit(heavy,crit);G.zoom=Math.max(G.zoom,.025);const wp=WPN[S.wpn];
 if(wp.k=='gun'){Snd.noise(.12,.6,2500);Snd.tone(220,.1,'square',.2,-160)}
 if(wp.k=='bomb'||wp.g=='rl'){sparks(x,y,40,'#ff8a1a');ring(x,y,220*z,'#ff8a1a',.5);dustpuff(x,y,8,'rgba(70,70,70,1)');G.shake+=8;Snd.noise(.5,.8,500);Snd.tone(45,.5,'sine',1,-20)}
 const st=Math.min(3,Math.floor(f*4));if(st>o.st&&o.hp>0){o.st=st;frags(14,G.cx,G.cy,420,10,0);dustpuff(G.cx,G.cy,6);G.shake+=4;Snd.tone(200,.2,'square',.1,-120)}
 if([5,10,20,40].includes(G.combo))T(G.combo+' HIT!',G.cx,G.cy+o.s*.75,'#ff8a5c',34,1,.8);
 G.tg=null;G.tgT=.12;if(o.hp<=0)destroy(x,y);ui()}
function destroy(x,y){const o=G.o,z=G.s/200,b=o.boss;o.dead=true;G.tg=null;
 frags(b?70:36,G.cx,G.cy,b?900:640,b?15:12,0);dustpuff(G.cx,G.cy+o.bh*.5,b?26:16);
 if(o.m.s=='metal'||o.m.glow)sparks(G.cx,G.cy,b?60:30,o.m.c[1]);
 const rew=Math.round(10*Math.pow(1.21,o.i)*(b?6:1)*cm()*(G.fren>0?2:1)*(1+Math.min(G.combo,50)*.01));earn(rew);
 for(let i=0;i<Math.min(28,8+o.i/2+(b?12:0));i++){const a=R(-Math.PI*.95,-Math.PI*.05),v=R(250,700);P({x:G.cx,y:G.cy,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:R(1,1.6),t:'coin',sz:R(9,13)*z,rot:R(0,6),vr:R(8,16),bn:1})}
 ring(G.cx,G.cy,220*z*(b?1.6:1),'#fff',.5);G.shake=b?26:16;G.zoom=b?.2:.1;G.flash=b?1:.45;G.freeze=b?.22:.12;G.goneT=b?1.5:.85;
 T('+'+fmt(rew)+' COINS',G.cx,G.cy-o.s*.2,'#ffd54a',44,1,1.2);
 if(b)T('BOSS DESTROYED',G.cx,G.H*.2,'#ff5a3c',44,1,1.6);else if(S.idx==0)T('NEXT OBJECT',G.cx,G.H*.2,'#fff',34,1,1);
 Snd.brk(o.m.s,b);Snd.coin();evProg('speed');drop(o);mis('break');if(b)mis('boss');
 S.idx++;Save.save()}
/* ---------- Timed events ---------- */
const EV=[{k:'speed',txt:'SPEED BREAK: smash this object',g:1,t:20},{k:'hit',txt:'PRECISION: land target hits',g:12,t:25},{k:'combo',txt:'COMBO RUSH: reach combo',g:10,t:25}];
function startEv(){const e=EV[Math.floor(R(0,3))];G.ev=Object.assign({p:0,left:e.t,r:Math.round(10*Math.pow(1.21,G.o.i)*8*cm())},e);T('EVENT!',G.cx,G.H*.2,'#ff8a3c',50,1,1.2);Snd.up()}
function evProg(k,v=1){const e=G.ev;if(!e||e.k!=k)return;e.p=k=='combo'?Math.max(e.p,v):e.p+1;
 if(e.p>=e.g){earn(e.r);T('EVENT WON +'+fmt(e.r),G.cx,G.H*.27,'#7dffb0',34,1,2);Snd.up();ring(G.cx,G.cy,240,'#7dffb0',.6);G.ev=null;G.evT=40}}
/* ---------- Missions, loot, gift crate, SMASH ---------- */
const MP=[['break','Break {g} objects',[5,8,12],200],['combo','Reach a {g}-hit combo',[10,20,30],300],['perfect','Land {g} perfect hits',[3,5,8],250],['crit','Land {g} critical hits',[5,10,15],250],['boss','Destroy a boss',[1],600]];
function newMis(avoid){let q;do{q=MP[Math.floor(R(0,MP.length))]}while(avoid.includes(q[0]));const g=q[2][Math.floor(R(0,q[2].length))];
 return{k:q[0],n:q[1].replace('{g}',g),g,p:0,r:Math.round(q[3]*(1+S.idx*.25)*(g/q[2][0]))}}
function initMis(){if(S.ms&&S.ms.length==3)return;S.ms=[];for(let i=0;i<3;i++)S.ms.push(newMis(S.ms.map(m=>m.k)))}
function mis(k,v=1,set){S.ms.forEach((m,i)=>{if(m.k!=k)return;m.p=set?Math.max(m.p,v):m.p+v;
 if(m.p>=m.g){earn(m.r);T('MISSION COMPLETE +'+fmt(m.r),G.cx,G.H*.27,'#7dffb0',28,1,1.6);Snd.up();ring(G.cx,G.cy,200,'#7dffb0',.5);S.ms[i]=newMis(S.ms.map(q=>q.k));ui()}})}
const LOOT=[['Old Button','Hair Pin','Silver Ring','Gold Watch','Pearl Necklace','Secret Diary'],['Bottle Cap','Spoon','Silver Fork','Golden Ladle','Chef Medal','Master Knife'],
 ['Playing Card','Dice','Chess Knight','Gold Trophy','Crystal Glass','Royal Crown'],['Rusty Nail','Old Key','Lucky Bolt','Brass Gear','Golden Wrench','Master Toolbox'],['Brass Tag','Wax Seal','Antique Coin','Gold Key','Ruby Brooch','Hall Crown']];
const RAR=[['COMMON','#cfd8e3'],['RARE','#4aa3ff'],['LEGENDARY','#ffb02e']];
const sets=()=>LOOT.filter(w=>w.every(n=>S.loot[n])).length;
function drop(o){const L=LOOT[o.wi],r=Math.random(),t=o.boss?(r<.25?2:1):(r<.04?2:r<.25?1:0),n=t==0?L[Math.floor(R(0,3))]:t==1?L[3+Math.floor(R(0,2))]:L[5];
 const was=sets(),isNew=!S.loot[n];S.loot[n]=(S.loot[n]||0)+1;
 setTimeout(()=>{T((isNew?'NEW! ':'')+n.toUpperCase(),G.cx,G.cy+G.o.s*.6,RAR[t][1],28,1,2.2);T(RAR[t][0],G.cx,G.cy+G.o.s*.6+32,RAR[t][1],16,0,2.2);
  if(sets()>was)T('SET COMPLETE! +10% COINS FOREVER',G.cx,G.H*.33,'#7dffb0',26,1,3);if(t==2)Snd.up()},500)}
function openGift(){const g=G.gift,r=Math.random();G.gift=null;ring(g.x,g.y,160,'#ffd54a',.5);sparks(g.x,g.y,30);Snd.up();
 if(r<.4){const c=Math.round((40+S.idx*30)*cm());earn(c);T('+'+fmt(c)+' COINS!',g.x,g.y+60,'#ffd54a',34,1,1.2)}
 else if(r<.75){G.fren=8;T('FRENZY!',G.cx,G.H*.2,'#ff8a3c',50,1,1.3)}else{G.mega=6;T('6 MEGA HITS!',G.cx,G.H*.2,'#7dffb0',44,1,1.3)}
 Save.save();ui()}
function smash(){const o=G.o;if(G.rage<100||o.dead||G.paused||G.intro)return;G.rage=0;const dmg=Math.max(Math.round(o.max*.35),power()*10);o.hp-=dmg;
 o.sq=.22;G.shake=30;G.freeze=.15;G.flash=.8;G.zoom=.12;ring(G.cx,G.cy,320,'#ffd54a',.6);ring(G.cx,G.cy,200,'#fff',.4);
 frags(30,G.cx,G.cy,700,12,0);sparks(G.cx,G.cy,50);dustpuff(G.cx,G.cy+o.bh,14);
 for(let i=0;i<6;i++)o.dn.push({x:R(-.3,.3)*o.s,y:R(-.3,.3)*o.s,r:R(.1,.2)*o.s});o.dn=o.dn.slice(-9);
 T('SMASH! '+fmt(dmg),G.cx,G.cy-o.s*.6,'#ffd54a',52,1,1.1);Snd.hit(true,true);Snd.tone(40,.9,'sine',1,-10);
 if(o.hp<=0)destroy(G.cx,G.cy);ui()}
/* ---------- UI ---------- */
function ui(){const o=G.o;$('coins').textContent=fmt(S.coins);$('pow').textContent=fmt(power());$('oname').textContent=o?`${WORLDS[o.wi].n} · ${o.name.toUpperCase()}`:'';
 document.querySelectorAll('.up').forEach(b=>{const i=+b.dataset.i,mx=UP[i].max,lv=S.up[i],c=upCost(i),at=mx&&lv>=mx;b.className='btn up '+(at?'max':S.coins>=c?'can':'');b.innerHTML=`<b>${UP[i].n}</b><em>Lv ${lv+1}</em><span>${at?'MAX':'🪙'+fmt(c)}</span>`});
 const nx=WPN.find((w,i)=>!S.own[i]);$('wp').className='btn '+(nx&&S.coins>=nx.cost?'can':'');$('wp').innerHTML=`<b>🧰 TOOLS</b><em>${WPN[S.wpn].n}</em><span>${nx?(S.coins>=nx.cost?'NEW!':'🪙'+fmt(nx.cost)):'ALL OWNED'}</span>`;
 $('pips').innerHTML=Array.from({length:o.len},(_,i)=>`<i class="${i<o.n?'on':''} ${i==o.len-1?'boss':''}"></i>`).join('');
 $('hint').textContent=S.idx%2==0&&nx?(S.coins>=nx.cost?'New tool ready!':`${fmt(nx.cost-S.coins)} coins until ${nx.n}`):(o.n<o.len-1?`${o.len-1-o.n} objects until the boss`:'BOSS FIGHT!');
 $('sndB').textContent='SOUND '+(S.snd?'ON':'OFF');$('musB').textContent='MUSIC '+(S.mus?'ON':'OFF');
 const mm=S.ms.slice().sort((a,b)=>b.p/b.g-a.p/a.g)[0];$('mis').textContent='🎯 '+mm.n+'  '+mm.p+'/'+mm.g;
 $('album').innerHTML=LOOT.map((L,i)=>`${WORLDS[i].n} ${L.filter(n=>S.loot[n]).length}/6`).join(' | ')+`<br>Sets done: ${sets()}/5 (+10% coins each)`}
function buyUp(i){const c=upCost(i);if((UP[i].max&&S.up[i]>=UP[i].max)||S.coins<c)return;S.coins-=c;S.up[i]++;Snd.up();
 ring(G.cx,G.cy,120,'#ffd54a',.4);T(UP[i].n+' UP!',G.cx,G.cy+G.s*.7,'#7dffb0',34,1,.8);Save.save();ui()}
function buyW(){const nx=WPN[S.wpn+1];if(!nx||S.coins<nx.cost)return;S.coins-=nx.cost;S.wpn++;G.nw={t:0};Snd.up();Snd.tone(70,.6,'sine',.9,-20);Save.save();ui()}

/* ---------- Loop ---------- */
function mkTarget(){const o=G.o,a=R(0,6.283),d=R(.05,.26)*o.s,r=o.s*(.15-Math.min(.06,o.i*.0015))*(PK().big?1.3:1),life=Math.max(.9,2.8-o.i*.04)*(PK().slow?2:1);
 G.tg={x:G.cx+Math.cos(a)*d,y:G.cy+Math.sin(a)*d*.8,r,t:life,max:life}}
function step(dt){G.t+=dt;const o=G.o;if(G.paused){o.rot=Math.sin(G.t*.9)*.06;o.oy=0;return}
 if(G.intro){G.intro.t+=dt;if(G.intro.t>4.5)G.intro=null}
 if(G.nw){G.nw.t+=dt;if(G.nw.t>2)G.nw=null}
 let d=dt;if(G.freeze>0){G.freeze-=dt;d=0}
 if(!G.intro&&!G.o.dead)G.lvT+=dt;
 G.shake*=Math.exp(-dt*12);G.zoom*=Math.exp(-dt*6);G.flash=Math.max(0,G.flash-dt*2.5);
 if(G.combo&&(G.comboT-=d)<=0){G.combo=0;G.nextFz=20}
 if(G.fren>0)G.fren-=d;
 if(!G.gift){if((G.giftT-=d)<=0&&!o.dead&&o.oy==0&&!G.intro){const l=Math.random()<.5;G.gift={x:l?-40:G.W+40,y:G.H*R(.2,.3),vx:l?130:-130,t:0};G.giftT=R(25,40)}}
 else{const gf=G.gift;gf.t+=d;gf.x+=gf.vx*d;gf.y+=Math.sin(gf.t*3)*50*d;if(gf.x<-80||gf.x>G.W+80)G.gift=null}
 if(!o.dead){
  if(G.tg){if((G.tg.t-=d)<=0){G.tg=null;G.tgT=.15}}else if(o.oy==0&&!G.intro&&(G.tgT-=d)<=0)mkTarget()}
 else if((G.goneT-=d)<=0)spawn();
 if(G.ev){G.ev.left-=d;if(G.ev.left<=0){T('EVENT FAILED',G.cx,G.H*.27,'#ff6a5c',28,1,1.2);G.ev=null;G.evT=35}}else if(!o.dead&&!G.intro&&o.oy==0&&(G.evT-=d)<=0)startEv();
 $('ev').textContent=G.ev?`⚡ ${G.ev.txt} ${G.ev.k=='speed'?'':G.ev.p+'/'+G.ev.g}  ${Math.ceil(G.ev.left)}s  🪙${fmt(G.ev.r)}`:'';
 if(o.oy<0||o.vy<0){o.vy+=2600*d;o.oy+=o.vy*d;if(o.oy>=0){o.oy=0;if(o.vy>300){o.vy*=-.28;o.sq=.12;G.shake=Math.max(G.shake,5);dustpuff(G.cx,G.cy+o.bh,8)}else o.vy=0}}
 o.sv+=(-o.sq*420-o.sv*16)*d;o.sq+=o.sv*d;o.rv+=(-o.rot*300-o.rv*14)*d;o.rot+=o.rv*d;
 const sw=G.swing;if(sw){sw.t+=d/(PK().fast?.12:.2);if(!sw.hit&&sw.t>=.45){sw.hit=true;sw.ok?hit(sw.x,sw.y,sw.pf):miss(sw.x,sw.y)}if(sw.t>=1){G.swing=null;if(G.pend){G.pend=0;attack(G.px,G.py)}}}
 for(const p of G.fx){p.life-=d;p.vy+=p.g*d;p.x+=p.vx*d;p.y+=p.vy*d;p.rot+=p.vr*d;const fy=G.cy+o.bh+G.s*.25;if(p.bn&&p.y>fy&&p.vy>0){p.y=fy;p.vy*=-.35;p.vx*=.7;p.vr*=.6}}
 G.fx=G.fx.filter(p=>p.life>0);
 for(const t of G.tx){t.life-=d;t.y-=(t.big?18:45)*d}G.tx=G.tx.filter(t=>t.life>0);
 for(const r of G.rg){r.life-=d;r.r+=(r.mr-r.r)*Math.min(1,d*14)}G.rg=G.rg.filter(r=>r.life>0)}
function render(){const x=ctx,{W,H,cx,cy}=G,o=G.o;x.save();
 const z=1+G.zoom;x.translate(cx,cy);x.scale(z,z);x.translate(-cx,-cy);if(G.shake>.3)x.translate(R(-.5,.5)*G.shake,R(-1,1)*G.shake);
 bg();
 $('smash').classList.toggle('on',G.rage>=100&&!G.paused&&!o.dead&&!G.intro);
 if(!o.dead){x.fillStyle='rgba(0,0,0,.5)';rr(cx-70,cy+o.s*.72,140,12,6);x.fill();x.fillStyle=G.rage>=100?'#ffd54a':'#ff8a3c';rr(cx-70,cy+o.s*.72,Math.max(8,1.4*G.rage),12,6);x.fill()}
 if(!o.dead){const k=1-C(-o.oy/H,0,1)*.6;x.fillStyle='rgba(0,0,0,.35)';x.beginPath();x.ellipse(cx,cy+o.bh,o.s*.5*k*(1+o.sq),o.s*.11*k,0,0,7);x.fill();
  x.save();x.translate(cx,cy+o.oy);x.rotate(o.rot);x.translate(0,o.bh);x.scale(1+o.sq,1-o.sq);x.translate(0,-o.bh);drawObj(o);x.restore();
  const bw=o.s*.9,by=cy-o.s*.74;x.fillStyle='rgba(0,0,0,.5)';rr(cx-bw/2-3,by-3,bw+6,16,8);x.fill();x.fillStyle=o.hp/o.max>.5?'#5fe07a':o.hp/o.max>.25?'#ffd54a':'#ff5a3c';rr(cx-bw/2,by,Math.max(8,bw*o.hp/o.max),10,5);x.fill();
  if(G.tg&&!G.paused&&!G.intro){const p=G.tg,k=p.t/p.max,pl=1+Math.sin(G.t*12)*.08;x.shadowBlur=16;x.shadowColor='#ffd54a';x.strokeStyle='#ffd54a';x.lineWidth=4;x.beginPath();x.arc(p.x,p.y,p.r*pl,0,7);x.stroke();
   x.strokeStyle='rgba(255,255,255,.9)';x.lineWidth=3;x.beginPath();x.arc(p.x,p.y,p.r*(1.15+.7*k),-1.57,-1.57+6.283*k);x.stroke();x.fillStyle='rgba(255,213,74,.22)';x.beginPath();x.arc(p.x,p.y,p.r,0,7);x.fill();
   x.fillStyle='#fff';x.beginPath();x.arc(p.x,p.y,p.r*.14,0,7);x.fill();x.shadowBlur=0}
  {const lim=3+(PK().fg?1:0),t='MISSES '+'✖'.repeat(G.miss)+'·'.repeat(Math.max(0,lim-G.miss));x.textAlign='center';x.font=`900 12px ${FONT}`;x.lineWidth=4;x.strokeStyle='#1a0d05';x.strokeText(t,cx,by+30);x.fillStyle=G.miss?'#ff6a5c':'#fff';x.fillText(t,cx,by+30);
   if(S.idx<2){x.font=`900 16px ${FONT}`;const h='TAP THE GOLDEN TARGET';x.strokeText(h,cx,cy+o.s*.85);x.fillStyle='#ffd54a';x.fillText(h,cx,cy+o.s*.85)}}
  }
 for(const r of G.rg){x.globalAlpha=r.life/r.max;x.strokeStyle=r.c;x.lineWidth=6*r.life/r.max+1;x.beginPath();x.arc(r.x,r.y,r.r,0,7);x.stroke()}x.globalAlpha=1;
 for(const p of G.fx)drawP(p);
 const[wx,wy,e,tl]=wpPos(),wp=WPN[S.wpn],sc=wp.sc||1,sw=G.swing;
 if(sw&&sw.t>.22&&sw.t<.5){const g=x.createLinearGradient(0,wy-170,0,wy);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(255,255,255,.35)');x.fillStyle=g;x.fillRect(wx-50*sc,wy-170,100*sc,170)}   // motion blur
 x.save();x.translate(wx,wy-(wp.L||0)*sc);weapon(S.wpn,tl);x.restore();
 if(wp.k=='gun'&&sw&&sw.t>.44&&sw.t<.62){const k=1-(sw.t-.44)/.18;x.save();x.translate(wx,wy);x.globalCompositeOperation='lighter';x.fillStyle=`rgba(255,${180+60*k|0},80,${k})`;x.beginPath();for(let i=0;i<12;i++){const a=i/12*6.283,r=(i%2?16:46)*sc*k+6;x.lineTo(Math.cos(a)*r,Math.sin(a)*r)}x.closePath();x.fill();x.restore()}
 x.restore();
 if(G.flash>0){x.fillStyle=`rgba(255,255,255,${G.flash*.7})`;x.fillRect(0,0,W,H)}
 const v=x.createRadialGradient(cx,H*.45,H*.3,cx,H*.45,H*.8);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.5)');x.fillStyle=v;x.fillRect(0,0,W,H);
 if(G.fren>0){x.strokeStyle=`rgba(255,120,40,${.55+.3*Math.sin(G.t*14)})`;x.lineWidth=16;x.strokeRect(0,0,W,H)}
 if(G.gift&&!G.paused){const g=G.gift;x.save();x.translate(g.x,g.y);x.rotate(Math.sin(g.t*6)*.2);x.shadowBlur=24;x.shadowColor='#ffd54a';x.fillStyle='#ff5a3c';rr(-28,-24,56,48,8);x.fill();x.fillStyle='#ffd54a';x.fillRect(-6,-24,12,48);x.fillRect(-28,-4,56,10);x.beginPath();x.arc(-10,-30,9,0,7);x.arc(10,-30,9,0,7);x.fill();x.restore()}
 x.textAlign='center';x.lineJoin='round';x.textBaseline='middle';
 for(const t of G.tx){const a=t.max-t.life,sc=t.big?(a<.18?a/.18*1.25:1.25-Math.min(.25,(a-.18)*1.5)):1;x.globalAlpha=Math.min(1,t.life/t.max*3);x.font=`900 ${t.sz*sc}px ${FONT}`;x.lineWidth=t.sz*.22;x.strokeStyle='#1a0d05';x.strokeText(t.txt,t.x,t.y);x.fillStyle=t.c;x.fillText(t.txt,t.x,t.y)}x.globalAlpha=1;
 if(G.combo>=2&&!G.paused){const sz=22+Math.min(G.combo,40)*.6;x.font=`900 ${sz}px ${FONT}`;x.lineWidth=5;x.strokeStyle='#1a0d05';const s='🔥 '+G.combo+' HIT COMBO';x.strokeText(s,cx,142);x.fillStyle=G.combo>15?'#ff6a3c':'#ffd54a';x.fillText(s,cx,142);
  x.fillStyle='rgba(0,0,0,.5)';x.fillRect(cx-50,160,100,6);x.fillStyle='#fff';x.fillRect(cx-50,160,100*C(G.comboT/1.5,0,1),6)}
 if(G.nw){const n=G.nw,a=Math.min(1,n.t*4);x.fillStyle=`rgba(10,5,25,${.8*a})`;x.fillRect(0,0,W,H);
  const g=x.createRadialGradient(cx,H*.45,10,cx,H*.45,G.s);g.addColorStop(0,WPN[S.wpn].c[1]+'aa');g.addColorStop(1,'transparent');x.fillStyle=g;x.fillRect(0,0,W,H);
  x.save();x.translate(cx,H*.5);x.scale(1.7*a,1.7*a);x.rotate(Math.sin(n.t*3)*.5);weapon(S.wpn,.5);x.restore();
  x.font=`900 ${Math.min(52,W*.12)}px ${FONT}`;x.lineWidth=9;x.strokeStyle='#1a0d05';x.strokeText('NEW TOOL',cx,H*.2);x.fillStyle='#ffd54a';x.fillText('NEW TOOL',cx,H*.2);
  x.font=`900 ${Math.min(34,W*.08)}px ${FONT}`;x.strokeText(WPN[S.wpn].n,cx,H*.78);x.fillStyle='#fff';x.fillText(WPN[S.wpn].n,cx,H*.78)}if(G.intro)scene();}
let last=0;function loop(t){const dt=Math.min(.033,(t-last)/1000||0);last=t;step(dt);render();requestAnimationFrame(loop)}

/* ---------- Boot & input ---------- */
Save.load();if(S.v!=2){S.v=2;S.own=[1];S.wpn=0}while(S.own.length<WPN.length)S.own.push(0);S.own[S.wpn]=1;initMis();resize();
{const today=Math.floor(Date.now()/864e5);if(S.day!=today){S.streak=S.day==today-1?S.streak+1:1;S.day=today;G.daily=Math.round(100*Math.min(S.streak,7)*(1+S.idx*.3));earn(G.daily);Save.save()}}addEventListener('resize',resize);spawn();G.demo=1;G.o.oy=0;G.o.hp=Math.round(G.o.max*.35);
G.o.dn=[{x:-G.s*.1,y:-G.s*.05,r:G.s*.12},{x:G.s*.12,y:G.s*.1,r:G.s*.1}];
cv.addEventListener('pointerdown',e=>{Snd.init();G.lp={x:e.clientX,y:e.clientY};const g=G.gift;if(g&&!G.paused&&Math.hypot(e.clientX-g.x,e.clientY-g.y)<55){openGift();return}attack(e.clientX,e.clientY)});
$('smash').addEventListener('pointerdown',e=>{e.preventDefault();smash()});
cv.addEventListener('pointermove',e=>{G.lp={x:e.clientX,y:e.clientY}});
addEventListener('keydown',e=>{if(e.code=='Space'){e.preventDefault();Snd.init();attack(G.lp.x,G.lp.y)}});
document.querySelectorAll('.up').forEach(b=>b.addEventListener('click',()=>buyUp(+b.dataset.i)));
$('wp').addEventListener('click',buyW);
$('play').addEventListener('click',()=>{Snd.init();$('menu').classList.add('off');const o=G.o;if(G.demo){G.demo=0;o.hp=o.max;o.dn=[];o.st=0}G.paused=false;G.pzT=1.5;
 if(G.daily){T('DAY '+S.streak+' STREAK  +'+fmt(G.daily),G.cx,G.H*.3,'#ffd54a',34,1,2);G.daily=0}
 if(S.idx==0)T('BREAK IT.',G.cx,G.H*.2,'#fff',56,1,1.4);ui()});
$('menuBtn').addEventListener('click',()=>{G.paused=true;$('menu').classList.remove('off')});
$('sndB').addEventListener('click',()=>{S.snd^=1;Save.save();ui()});
$('musB').addEventListener('click',()=>{S.mus^=1;Save.save();ui()});
$('rstB').addEventListener('click',()=>{if(confirm('Erase all progress?')){Save.reset();location.reload()}});
/* Tools panel: every tool visible, locked or owned, with price + gameplay advantage */
function toolsUI(){
 const owned=S.own.filter(Boolean).length;
 $('toolCoins').textContent=fmt(S.coins);
 $('toolOwned').textContent=`${owned} / ${WPN.length} UNLOCKED`;
 $('toolProgress').style.width=`${owned/WPN.length*100}%`;
 $('tl').innerHTML=WPN.map((w,i)=>{const own=S.own[i],eq=S.wpn==i,can=S.coins>=w.cost;
  const costProgress=w.cost?Math.min(100,S.coins/w.cost*100):100;
  const action=eq?'EQUIPPED':own?'EQUIP':can?'UNLOCK':'🪙 '+fmt(w.cost);
  return `<div class="tr ${eq?'eq':own?'owned':'lk'} ${!own&&can?'affordable':''}">
   <div class="tool-icon">${own?`<i>${w.ic}</i>`:`<i>${w.ic}</i><span aria-label="Locked">🔒</span>`}</div>
   <div class="tool-info"><div class="tool-name">${w.n}${eq?'<span class="equipped-tag">IN USE</span>':''}</div>
    <small>${w.t}</small><div class="tool-damage"><span>DAMAGE</span><b>×${w.m}</b></div>
    ${!own?`<div class="tool-cost-track"><i style="width:${costProgress}%"></i></div>`:''}
   </div>
   <button data-i="${i}" class="sm tool-action ${eq?'selected':own?'owned-action':can?'can':'locked-action'}" ${eq?'disabled aria-current="true"':''}>${action}</button>
  </div>`}).join('');
}
function toolAct(i){const w=WPN[i];if(S.own[i])S.wpn=i;else if(S.coins>=w.cost){S.coins-=w.cost;S.own[i]=1;S.wpn=i;G.nw={t:0};Snd.up();Snd.tone(70,.6,'sine',.9,-20);$('tp').classList.add('off');G.paused=false}
 else{Snd.tone(130,.2,'sawtooth',.2,-70);return}Save.save();ui();toolsUI()}
$('wp').addEventListener('click',()=>{toolsUI();G.paused=true;$('tp').classList.remove('off')});
$('tx').addEventListener('click',()=>{$('tp').classList.add('off');G.paused=false});
$('tl').addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('button');if(b)toolAct(+b.dataset.i)});
/* Worlds: only Home is playable; City and Space are "coming soon" screens (inline SVG) */
const CITY=`<svg viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a5a"/><stop offset=".5" stop-color="#6a4a8a"/><stop offset="1" stop-color="#14101f"/></linearGradient><pattern id="wn" width="16" height="22" patternUnits="userSpaceOnUse"><rect x="4" y="5" width="8" height="11" fill="#ffe08a" opacity=".75"/></pattern></defs>
<rect width="400" height="800" fill="url(#cg)"/><circle cx="310" cy="190" r="52" fill="#ffd9a0" opacity=".85"/>${[[0,300,70],[60,240,60],[115,330,75],[185,200,70],[250,290,65],[310,230,60],[360,320,60]].map(b=>`<rect x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${540-b[1]}" fill="#1c1636"/><rect x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${540-b[1]}" fill="url(#wn)"/>`).join('')}
<polygon points="175,540 225,540 420,800 -20,800" fill="#2a2a33"/><path d="M200 545V800" stroke="#ffd54a" stroke-width="6" stroke-dasharray="22 26"/><ellipse cx="200" cy="742" rx="62" ry="12" fill="#000" opacity=".45"/>
<g transform="translate(200 742)"><rect x="-26" y="-112" width="22" height="108" rx="8" fill="#2b3a6b"/><rect x="4" y="-112" width="22" height="108" rx="8" fill="#2b3a6b"/><rect x="-30" y="-10" width="28" height="10" fill="#16161c"/><rect x="2" y="-10" width="28" height="10" fill="#16161c"/>
<path d="M-48-224H48L28-108H-28Z" fill="#f0b98c"/><circle cx="0" cy="-248" r="20" fill="#f0b98c"/><rect x="-20" y="-262" width="40" height="8" fill="#d8362b"/><rect x="-70" y="-222" width="24" height="94" rx="12" fill="#f0b98c"/><rect x="46" y="-222" width="24" height="94" rx="12" fill="#f0b98c"/>
<rect x="52" y="-330" width="12" height="200" rx="5" fill="#8a5a30"/><rect x="24" y="-352" width="68" height="40" rx="8" fill="#9aa8b8"/></g></svg>`;
const SPACE=`<svg viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="sg" cx=".3" cy=".2" r="1"><stop offset="0" stop-color="#3a1a7a"/><stop offset="1" stop-color="#05030f"/></radialGradient><radialGradient id="p1" cx=".35" cy=".3"><stop offset="0" stop-color="#ffd9a0"/><stop offset="1" stop-color="#b0561e"/></radialGradient><radialGradient id="p2" cx=".35" cy=".3"><stop offset="0" stop-color="#b8f0ff"/><stop offset="1" stop-color="#1c4f9a"/></radialGradient><radialGradient id="p3" cx=".35" cy=".3"><stop offset="0" stop-color="#ffb0a0"/><stop offset="1" stop-color="#8a1c20"/></radialGradient></defs>
<rect width="400" height="800" fill="url(#sg)"/>${Array.from({length:80},(_,i)=>`<circle cx="${rand(i)*400}" cy="${rand(i+99)*800}" r="${.5+rand(i+7)*1.6}" fill="#fff" opacity="${.3+rand(i+3)*.7}"/>`).join('')}
<circle cx="110" cy="210" r="82" fill="url(#p1)"/><ellipse cx="110" cy="210" rx="140" ry="26" fill="none" stroke="#f3d9a8" stroke-width="8" opacity=".8" transform="rotate(-18 110 210)"/><circle cx="320" cy="470" r="52" fill="url(#p2)"/><circle cx="90" cy="640" r="34" fill="url(#p3)"/><circle cx="300" cy="690" r="14" fill="#ccd"/><path d="M30 40L360 120" stroke="#fff" stroke-width="2" opacity=".7"/></svg>`;
$('wBtn').addEventListener('click',()=>{G.paused=true;$('wl').classList.remove('off')});
$('wx').addEventListener('click',()=>{$('wl').classList.add('off');G.paused=false});
document.querySelectorAll('.wc').forEach(c=>c.addEventListener('click',()=>{const w=+c.dataset.w;if(!w){$('wx').click();return}$('sbg').innerHTML=w==1?CITY:SPACE;$('sh').textContent=w==1?'CITY':'SPACE';$('soon').classList.remove('off')}));
$('sb').addEventListener('click',()=>$('soon').classList.add('off'));
ui();requestAnimationFrame(loop);