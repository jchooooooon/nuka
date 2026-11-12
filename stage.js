/* Fixed kitchen plate + transparent, connected character cels. No limb assembly. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.NukaStage=factory();})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 const spriteBounds={"cucumber":[24,26,150,149],"carrot":[31,27,130,150],"daikon":[32,36,125,135],"eggplant":[15,28,143,146],"turnip":[30,27,149,142],"okra":[30,19,145,157],"tomato":[18,31,143,130],"zucchini":[27,12,125,155],"egg":[25,18,155,139],"mozzarella":[26,27,144,125],"camembert":[18,12,153,139],"avocado":[21,7,134,155],"natto":[17, 37, 149, 104],"chocolate":[22,8,157,135],"marshmallow":[27,10,145,133],"senbei":[15,3,156,144],"apple":[18,30,155,139],"pear":[19,32,153,133],"pineapple":[22,27,148,147],"kiwi":[28,31,134,137],"banana":[12,6,161,161],"watermelon-rind":[6,27,174,141],"dried-fig":[0,22,172,145],"dried-apricot":[15,27,155,126],"paprika":[14,0,159,160],"celery":[2,0,178,168],"cabbage":[0,0,174,162],"lotus":[5,11,166,143],"broccoli":[18,0,154,162],"pumpkin":[6,0,168,151],"tofu":[11,6,161,144],"quail-egg":[25,8,144,135],"kombu":[10,34,410,338],"chili":[8,4,336,321],"ginger":[80,90,499,464],"shiitake":[50,83,498,491],"bonito":[56,51,550,498],"sansho":[50,62,528,472],"apple-cut":[30,0,108,160],"avocado-cut":[38,0,106,160],"carrot-cut":[40,63,100,97],"chocolate-cut":[30,0,121,155],"daikon-cut":[35,59,103,100],"eggplant-cut":[30,66,110,94],"kiwi-cut":[41,27,104,119],"lotus-cut":[37,16,118,107],"paprika-cut":[25,0,107,144],"pear-cut":[25,0,110,160],"pineapple-cut":[39,28,110,120],"pumpkin-cut":[37,8,114,115],"turnip-cut":[24,67,107,92],"watermelon-rind-cut":[35,0,109,146],"carrot-cut-v2":[47,52,267,250],"daikon-cut-v2":[0,45,304,262],"eggplant-cut-v2":[38,36,273,264],"turnip-cut-v2":[53,80,235,217],"avocado-cut-v2":[38,28,276,261],"chocolate-cut-v2":[0,56,310,221],"apple-cut-v2":[28,34,274,257],"pear-cut-v2":[35,24,255,265],"pineapple-cut-v2":[35,34,273,251],"kiwi-cut-v2":[13,50,283,221],"watermelon-rind-cut-v2":[28,37,276,249],"paprika-cut-v2":[35,31,255,259],"lotus-cut-v2":[33,26,274,247],"pumpkin-cut-v2":[36,12,274,253]};
 let cam=0,camAt=0;
 const bed=[[299,1052],[822,1052],[869,1144],[267,1144]],ease=t=>t*t*(3-2*t),clamp=t=>Math.max(0,Math.min(1,t));
 function segmentFor(kind,p){const split=kind==='taste-food' ? .28 : .42;if(kind==='taste-food')return p<split?{kind:'takeout',t:p/split}:{kind:'eat',t:(p-split)/(1-split)};if(kind==='prepare-food')return p<split?{kind:'chop',t:p/split}:{kind:'place',t:(p-split)/(1-split)};if(kind==='blend'){const q=Math.min(p,1-Number.EPSILON)*3,cycle=Math.floor(q),u=q-cycle;return u<split?{kind:'pour',t:u/split,cycle}:{kind:'stir',t:(u-split)/(1-split),cycle};}return {kind,t:p};}
 const tasteOffsets=[[0,0],[11,0],[21,-8],[18,-6],[0,0],[7,9],[8,6],[8,10]];
 const tasteTips=[[191,702],[178,509],[191,344],[221,281],[240,280],[201,339],[222,484],[195,505]];
 function tastePose(p){const ends=[.10,.20,.30,.42,.54,.66,.82,1];let frame=ends.findIndex(end=>p<end);if(frame<0)frame=7;const shift=tasteOffsets[frame],tip=tasteTips[frame];return {frame,x:214.4+(tip[0]+shift[0])*1.35,y:85+(tip[1]+shift[1])*1.35,food:p>=.06&&p<.54,bite:frame===4,mouth:{x:551.9,y:463}};}
 function dropPose(i,total,t){const start=.22+i*.032,u=clamp((t-start)/.32),p=spot(i,total);return {u,x:550+(p.x-550)*u,y:802+(p.y-802)*u*u,landed:u>=1,visible:t>=start};}
 function fitBox(sw,sh,w,h){const scale=Math.min(w/sw,h/sh);return {w:sw*scale,h:sh*scale};}
 function spot(i,n){const positions=[[484,1091],[680,1091],[370,1097],[560,1097],[760,1097],[420,1123],[590,1123],[770,1123]];return n>1?{x:positions[i][0],y:positions[i][1],w:126,h:76}:{x:484,y:1098,w:310,h:150};}
 function inside(x,y){return y>=1052&&y<=1144&&x>=299-(y-1052)*32/92&&x<=822+(y-1052)*47/92;}
 function fillFor(s,view,kind,t){if(view==='food'||view==='pantry')return 1;if(['batch','ready'].includes(s.phase))return kind==='bran'?ease(clamp((t-.18)/.66)):0;return 1;}
 function create(canvas,read){
 const c=canvas.getContext('2d'),cache=new Map(),tiles=new Map();let action=null,previewMode=null,last=0,paint=0,raf=0,moisture=1;
 const image=id=>{if(!cache.has(id)||cache.get(id).failed){const im=new Image();im.ready=new Promise(resolve=>{im.onload=()=>resolve(true);im.onerror=()=>{im.failed=true;resolve(false);};});im.src='assets/'+(id==='natto'?'natto-v27':id==='actor-taste'?'actor-taste-v29':id)+'.webp';cache.set(id,im);}return cache.get(id);};
 function requiredImages(kind){const {s,M}=read(),actors={bran:['add'],starter:['add'],salt:['salt'],stir:['salt','stir'],blend:['pour','stir'],aroma:['add'],place:['add','taste'],'prepare-food':['chop','add'],'taste-food':['taste']};return ['fixed-kitchen','bran-dry','bran-surface',...(actors[kind]||['pick']).map(id=>'actor-'+id),...(kind==='prepare-food'?['prep-worktop']:[]),...(['stir','blend'].includes(kind)?['arm-cel-salt','arm-cel-stir']:[]),...(s.food?[s.food.id,...(M.cuts[s.food.id]?[s.food.id+'-cut-v2']:[])]:[]),...s.aromas];}
 function readyFor(kind){return new Promise(resolve=>{const timer=setTimeout(()=>resolve(false),12000);Promise.all(requiredImages(kind).map(id=>image(id).ready)).then(results=>{clearTimeout(timer);resolve(results.every(Boolean));});});}
 ['fixed-kitchen','prep-worktop','bran-surface','bran-dry','cutting-board','arm-cel-salt','arm-cel-stir',...['pick','pour','stir','chop','add','salt','taste'].map(x=>'actor-'+x)].forEach(image);
 function sprite(id,x,y,w,h,angle=0){const im=image(id);if(!im.complete||!im.naturalWidth)return;c.save();c.translate(x,y);c.rotate(angle);const b=spriteBounds[id]||[0,0,im.naturalWidth,im.naturalHeight];const fit=fitBox(b[2],b[3],w,h);c.drawImage(im,...b,-fit.w/2,-fit.h/2,fit.w,fit.h);c.restore();}
 function clipBed(){c.beginPath();bed.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();}
 function surface(fill=1){if(fill<=0)return;c.save();clipBed();const dry=image('bran-dry'),wet=image('bran-surface'),u=clamp(fill),alpha=c.globalAlpha;c.translate(565,1098);c.scale(.2+.8*u,.25+.75*u);c.globalAlpha=alpha*clamp(u*3);if(moisture<1&&dry.complete&&dry.naturalWidth)c.drawImage(dry,-300,-50,610,100);c.globalAlpha*=moisture;if(wet.complete&&wet.naturalWidth)c.drawImage(wet,-300,-50,610,100);c.restore();}
 function tile(id,n){const key=id+':'+n;if(tiles.has(key))return tiles.get(key);const im=image('actor-'+id);if(!im.complete||!im.naturalWidth)return null;const cols=id==='pick'?3:id==='taste'?4:2,sw=im.naturalWidth/cols,sh=im.naturalHeight/2,o=document.createElement('canvas');o.width=id==='taste'?512:Math.round(sw);o.height=id==='taste'?768:Math.round(sh);const top=id==='pick'&&n>=3?45:0;o.getContext('2d').drawImage(im,n%cols*sw,Math.floor(n/cols)*sh+top,sw,sh-top,0,top,o.width,o.height-top);if(id==='taste'&&n>=4)o.getContext('2d').clearRect(440,0,72,52);tiles.set(key,o);return o;}
 // The face, torso, fixed hand and vessel use the same base cel throughout stirring.
 // Only a connected shoulder-to-fingertip + rigid-tool region switches to its hand-drawn cel.
 const composed=new Map();
 function armRegion(g,id){g.beginPath();const points=id==='salt'?[[4,320],[76,260],[157,270],[174,334],[239,340],[244,441],[224,460],[238,650],[173,650],[176,459],[132,444],[16,451],[0,409]]:[[0,320],[44,271],[148,280],[159,397],[190,480],[234,532],[263,625],[350,752],[124,752],[70,631],[109,536],[4,480],[0,411]];points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();if(id==='salt')g.rect(175,305,70,100);g.clip();}
 function actor(id,n){
  const locked=id==='stir'||id==='salt'&&n>=2,base=locked?(id==='stir'?1:2):n,im=tile(id,base);if(!im)return;
  let drawn=im;
  if(locked&&((id==='stir'&&n===1)||(id==='salt'&&n===3))){
   const alternate=image('arm-cel-'+id);if(alternate.complete&&alternate.naturalWidth){
    if(!composed.has(id)){const o=document.createElement('canvas');o.width=im.width;o.height=im.height;const g=o.getContext('2d');g.drawImage(im,0,0);g.save();armRegion(g,id);g.clearRect(0,0,o.width,o.height);g.drawImage(alternate,0,0,o.width,o.height);g.restore();composed.set(id,o);}drawn=composed.get(id);
   }
  }
  const scale={stir:1.55,add:1.38,salt:1.46,pour:1.38,chop:1.48,pick:1.65,taste:1.35}[id],ox=560-im.width*scale/2-(id==='chop'?120:0),oy=id==='taste'?85:id==='pick'?55:id==='chop'?80:0;
  c.save();c.translate(ox,oy);c.scale(scale,scale);if(id==='taste')c.translate(...tasteOffsets[n]);
  // The original atlas has a neighboring fingertip at the far-left cell edge.
  if(id==='stir'){c.beginPath();c.rect(0,0,im.width,635);c.rect(18,635,im.width-18,im.height-635);c.clip();}
  c.drawImage(drawn,0,0);c.restore();
 }
 function buried(id,index,total,cover=1){const p=spot(index,total);c.save();clipBed();sprite(id,p.x,p.y,p.w,p.h,id==='cucumber'?.65:(index%3-1)*.1);c.beginPath();c.rect(p.x-p.w*.6,p.y-p.h*.65,p.w*1.2,p.h*1.3);c.clip();c.globalAlpha=.32*cover;surface();c.restore();}
 function stream(x,y,endX,endY,color,t){if(t<.2||t>.82)return;c.save();
  if(color!=='#bcd7df'){c.fillStyle=color;for(let i=0;i<22;i++){const u=(t*2.4+i*.071)%1,spread=Math.sin(i*2.4)*(2+u*10),px=x+(endX-x)*u+spread,py=y+(endY-y)*u*u;c.globalAlpha=.45+.5*u;c.beginPath();c.ellipse(px,py,color==='#fffcf3'?1.6:2.8,color==='#fffcf3'?2.1:2,0,0,Math.PI*2);c.fill();}}
  else{c.strokeStyle=color;c.lineCap='round';c.lineWidth=7;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+8,y+65,endX,endY);c.stroke();c.globalAlpha=.35;c.lineWidth=3;c.strokeStyle='#fff';c.stroke();}
  c.restore();}

 function render(){
 const {s,view,M,D}=read(),f=D.foods.find(x=>x.id===s.food?.id),fv=view==='food'&&f,work=view==='kitchen',job=previewMode||action,progress=job?clamp(job.elapsed/job.duration):0;
 const segment=segmentFor(job?.kind,progress);let a=job?{...job,kind:segment.kind}:null,t=segment.t;
 const preparing=fv&&s.food.stage==='prep'&&a?.kind!=='place';const handPlace=a?.kind==='place'&&fv&&!M.cuts[f.id]; // 통째 재료는 손으로 들고 와 내려놓는다
 const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),w=Math.round(r.width*dpr),h=Math.round(r.height*dpr);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,w,h);c.fillStyle='#e9c6b1';c.fillRect(0,0,w,h);const zoom=Math.min(w/1024,h/1536);const camNow=performance.now(),camTarget=fv&&s.food.stage==='taste'&&!job?1:0;cam=clamp(cam+(camTarget>cam?1:-1)*Math.min(120,camNow-(camAt||camNow))/650);camAt=camNow;const ce=ease(cam),cz=zoom*(1+.6*ce),cx=512+(568-512)*ce,cy=768+(1056-768)*ce;c.setTransform(cz,0,0,cz,w/2-cx*cz,h/2-cy*cz);
 const bg=image('fixed-kitchen');if(bg.complete&&bg.naturalWidth)c.drawImage(bg,0,0,1024,1536);if(preparing){const prep=image('prep-worktop');if(prep.complete&&prep.naturalWidth)c.drawImage(prep,0,970,1024,566,0,970,1024,566);}
 moisture=job?.kind==='blend'?(segment.cycle+(segment.kind==='pour'?clamp(segment.t):1))/3:view==='food'||view==='pantry'?1:['batch','ready','salt','dissolve'].includes(s.phase)?0:s.phase==='pour'?(s.round+(a?clamp((t-.18)/.66):0))/3:s.phase==='mix'?(s.round+1)/3:1;const fill=fillFor(s,view,a?.kind,t);if(!(preparing))surface(fill);let id='pick',n=5,pulse=0;
 if(work&&['ready','starter'].includes(s.phase)){id='add';n=a&&t>.18&&t<.84?1:3;}
 if(work&&s.phase==='salt'){id='salt';n=a&&t>.18?1:0;}
 if(work&&s.phase==='dissolve'){id='salt';n=2;if(a)n=2+Math.floor(a.elapsed/230)%2;}
 if(work&&(job?.kind==='blend'?a.kind==='pour':s.phase==='pour')){id='pour';n=a&&t>.16&&t<.84?1:3;}
 if(work&&(job?.kind==='blend'?a.kind==='stir':['mix','fold'].includes(s.phase))){id='stir';n=a?Math.floor(a.elapsed/240)%2:0;}
 if(preparing){id='chop';n=a?(t<.3?1:t<.64?2:3):0;}
 if(a?.kind==='aroma'||a?.kind==='place'){id='add';n=t>.18&&t<.9?1:3;}if(handPlace){id='taste';n=t<.42?1:0;}
 if(fv&&s.food.stage==='taste'&&!job){id='taste';n=0;}
 if(job?.kind==='taste-food'){id='taste';n=tastePose(progress).frame;}
 if(fv&&s.food.stage==='served'){id='taste';n=7;}
 if(fv&&!preparing){const total=M.cuts[f.id]||1,foodId=f.id+(M.cuts[f.id]?'-cut-v2':'');
  for(let i=0;i<s.food.placed;i++){if(i===0&&(s.food.stage==='served'||job?.kind==='taste-food'&&progress>=.06))continue;buried(foodId,i,total);}
  if(a?.kind==='place')for(let i=s.food.placed;i<total;i++){const d=handPlace?{landed:t>=.62}:dropPose(i,total,t);if(d.landed)buried(foodId,i,total,clamp((t-(handPlace?.62:.5))*3));}
 }
 if(work&&(['fold','ferment','maturing','done'].includes(s.phase)||a?.kind==='aroma')&&s.aromas.length){c.save();clipBed();s.aromas.forEach((id,j)=>{for(let i=0;i<5;i++){if(a?.kind==='aroma'&&(t-.22-i*.045-j*.025)/.36<1)continue;sprite(id,325+(j*51+i*107)%490,1065+(i*23+j*31)%65,25,17,i*.5);}});c.restore();}
 // Paint food before one complete character cel. No partial redraw across the apron.
 if(preparing){
  const total=M.cuts[f.id]||1,count=a?.kind==='chop'&&t>.34?total:s.food.cut?Math.min(total,s.food.cut+1):1;
  for(let i=0;i<count;i++)sprite(count>1?f.id+'-cut-v2':f.id,400+(i%4)*82,(count>1?1115:1140)+Math.floor(i/4)*65,count>1?100:260,count>1?82:190);
 }
 actor(id,n,pulse);
 if(a?.kind==='bran'||a?.kind==='starter')stream(550,796,590,1090,'#e3c592',t);
 if(a?.kind==='pour')stream(572,828,620,1090,'#bcd7df',t);
 if(a?.kind==='salt')stream(485,705,437,758,'#fffcf3',t);
 if(handPlace&&t<.62){const p=spot(0,1),k=t<.42?1:0,tip=tasteTips[k],off=tasteOffsets[k],hx=214.4+(tip[0]+off[0])*1.35+12,hy=85+(tip[1]+off[1])*1.35+(k===0?18:-5),u=k===0?ease(clamp((t-.42)/.2)):0,sc=.5+.5*u;sprite(f.id,hx+(p.x-hx)*u,hy+(p.y-hy)*u,p.w*sc,p.h*sc,f.id==='cucumber'?.65*u:0);}if(a?.kind==='place'&&fv&&!handPlace){const total=M.cuts[f.id]||1,foodId=f.id+(M.cuts[f.id]?'-cut-v2':'');for(let i=s.food.placed;i<total;i++){const d=dropPose(i,total,t);if(d.visible&&!d.landed){const p=spot(i,total);sprite(foodId,d.x,d.y,p.w,p.h,(1-d.u)*.2);}}}
 // A single morsel stays registered to the same finger contact in every complete cel.
 // The other pieces stay in the bed; there is no floating transfer of the entire batch.
 if(job?.kind==='taste-food'&&fv){const pose=tastePose(progress);if(pose.food){const foodId=f.id+(M.cuts[f.id]?'-cut-v2':'');let x=pose.x+12,y=pose.y-5;
  if(pose.frame===0)y+=18;
  if(pose.frame===3){x=pose.mouth.x-18;y=pose.mouth.y;}
  if(pose.bite){x=pose.mouth.x-18+46*clamp((progress-.42)/.12);y=pose.mouth.y;}
  c.save();if(pose.bite){c.beginPath();c.rect(0,0,pose.mouth.x,1536);c.clip();}
  sprite(foodId,x,y,48,42,['carrot','cucumber','paprika'].includes(f.id)?.65:0);c.restore();
 }}
 if(a?.kind==='aroma'){s.aromas.forEach((id,j)=>{for(let i=0;i<5;i++){const q=clamp((t-.22-i*.045-j*.025)/.36);if(q>0&&q<1)sprite(id,550+(325+(j*51+i*107)%490-550)*q,802+(1065+(i*23+j*31)%65-802)*q*q,27,20,i*.5);}});}
 canvas.dataset.action=job?.kind||'idle';canvas.dataset.motion=a?.kind||'idle';canvas.dataset.frame=id+':'+n;canvas.dataset.progress=String(Math.round(progress*100));canvas.dataset.branFill=fill.toFixed(3);canvas.dataset.background='fixed-kitchen';
 const progressBar=document.getElementById('progress-fill');if(progressBar&&a)progressBar.style.width=Math.round(progress*100)+'%';
 }
 function tick(ts){const dt=Math.min(60,ts-last||16);last=ts;if(!document.hidden){if(action&&!action.loading)action.elapsed+=dt;if(ts-paint>50){render();paint=ts;}if(action&&action.elapsed>=action.duration){const done=action.resolve;action=null;done(true);}}raf=requestAnimationFrame(tick);}
 raf=requestAnimationFrame(tick);
 return{play(kind,duration=1600){previewMode=null;if(action)return Promise.resolve(false);return new Promise(resolve=>{const job={kind,duration,elapsed:0,resolve,loading:true};action=job;readyFor(kind).then(ok=>{if(action!==job)return;if(!ok){action=null;resolve(false);return;}job.loading=false;});});},gesture(){},cancel(){if(action){const done=action.resolve;action=null;done(false);}},preview(kind,p){previewMode={kind,duration:1000,elapsed:clamp(p)*1000,resolve(){}};render();},draw:render,destroy(){cancelAnimationFrame(raf);this.cancel();}};
 }
 return{create,bed,spot,inside,fillFor,fitBox,spriteBounds,segmentFor,tastePose,dropPose};
});
