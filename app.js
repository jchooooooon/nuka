(()=>{'use strict';
const D=window.NUKA_DATA,M=window.NukaModel,$=q=>document.querySelector(q),$$=q=>Array.from(document.querySelectorAll(q));
const URL=location.origin+location.pathname; // 어디에 배포해도 지금 주소를 공유
let s=M.initial();
let view='home',group='veg',page=0,modal='',foodPreview=null,busy=false,activeAction="",pointer=null,holdRAF=0,toastTimer=0,audio=null,progressSave=0;
const stageEl=$('#scene'),art=$('#scene-art'),canvas=$('#effects'),ctx=canvas.getContext('2d'),piece=$('#food-piece'),sheet=$('#sheet'),images=new Map();
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const grams=n=>{const v=M.amount(n,s.kg);return (v>=10?Math.round(v):v).toLocaleString('ko-KR',{maximumFractionDigits:1})+' g';}; // 10 g 이상은 집 저울로 잴 수 있게 정수로
const objectName=name=>name+((name.charCodeAt(name.length-1)-44032)%28?'을':'를');
const findFood=id=>D.foods.find(f=>f.id===id),food=()=>findFood(s.food?.id),aroma=id=>D.aromas.find(a=>a.id===id);
const foodsPerPage=()=>innerHeight>=760?12:innerHeight>=600?9:6; // 화면 높이에 맞춰 4·3·2줄 (인스타 안 브라우저는 더 낮다)
const isCold=f=>/냉장/.test(f.time+' '+f.condition);
const prepText=f=>f.prep.replace(/원문에는/g,'확인된 정보에는').replace(/원문은/g,'확인된 정보는').replace(/일본 /g,'').replace(/사례/g,'방법');
const time=f=>f.time.replace(/^냉장 /,'').replace(/^시간 미기재$/,'미기재');
// 진행 상황은 이 기기 브라우저에만 저장해 새로고침해도 이어서 한다
const SAVE_KEY='nuka-kitchen-v1';let resumeView=null;
function save(){if(view!=='home')resumeView=view;try{localStorage.setItem(SAVE_KEY,JSON.stringify({s,view:resumeView}));}catch{}}
try{const v=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');if(v&&v.s){s=M.restore(v.s,D);resumeView=['kitchen','pantry','food'].includes(v.view)?v.view:null;}}catch{}
const canResume=()=>!!resumeView&&(s.phase!=='batch'||!!s.food);
function toast(text){clearTimeout(toastTimer);$('#scene-toast').textContent=text;$('#scene-toast').hidden=false;toastTimer=setTimeout(()=>$('#scene-toast').hidden=true,2300);}
function frame(n,extra=false){art.classList.toggle('extra',extra===true);art.classList.toggle('preparation',extra==='prep');art.style.backgroundPosition=(n%2?'100%':'0%')+' '+(n>1?'100%':'0%');}
function motion(){}
function sound(kind='tap'){if(!s.sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime;o.type='sine';o.frequency.setValueAtTime(kind==='chop'?230:520,t);o.frequency.exponentialRampToValueAtTime(kind==='chop'?85:680,t+.07);g.gain.setValueAtTime(.035,t);g.gain.exponentialRampToValueAtTime(.001,t+.12);o.connect(g);g.connect(audio.destination);o.start();o.stop(t+.13);}catch{}}
const sheetPages=NukaSheets.create(sheet);
function open(title,html,type){if(busy)return;stopGesture();modal=type;if(!sheet.open)sheet.showModal();sheetPages.open(title,html,type);}
function close(){sheet.close();modal='';}
function primary(text,action,extra=''){return `<button class="primary" data-action="${action}" ${extra}>${text}</button>`;}
function setText(line,sub='',guide=''){ $('#line').textContent=line;$('#subline').textContent=sub;$('#gesture-guide').textContent=guide;$('#gesture-guide').hidden=!guide;}
const configs={
 ready:()=>['깨끗한 도구와 쌀겨를 준비해요.',`볶은 쌀겨 ${grams(439)}`,'쌀겨 담기','add'],
 salt:()=>['식힌 물에 소금을 넣어요.',`물 ${grams(439)} + 소금 ${grams(52.9)}`,'소금 넣기','add'],
 dissolve:()=>['바닥의 소금까지 충분히 녹여요.','바닥에 남은 소금까지 고르게 녹여요.','저어 녹이기','stir'],
 pour:()=>['소금물을 넣고 고르게 섞어요.','세 번 나누어 붓고 매번 골고루 섞어요.','소금물 넣고 섞기','mix-batch'],
 mix:()=>['바닥부터 부드럽게 섞어요.','마른 쌀겨가 없도록 고르게','이어서 섞기','mix-batch'],
 starter:()=>['숙성 누카를 더해줄게요.',`숙성 누카 ${grams(66.1)} · 없으면 빼도 돼요 (요령 참고)`,'숙성 누카 넣기','add'],
 aroma:()=>['어떤 풍미로 만들어볼까요?','다시마·건고추도 선택 재료예요.','풍미 고르기','aromas'],
 fold:()=>['취향을 담아 마지막으로 섞어요.',s.aromas.length?s.aromas.map(id=>aroma(id).name).join(' · '):'향미를 넣지 않은 기본 누카','고르게 섞기','stir'],
 ferment:()=>['이제 누카를 길들일 시간이에요.','초기 발효 참고 10일–3주 · 날짜만으로 완성 판단은 하지 않아요.','발효 방법 보기','ferment'],
 maturing:()=>['누카를 천천히 길들여요.','초기 발효 약 10일–3주 · 매일 섞고 상태를 관찰해요.','숙성 후로 넘어가기','maturity'],
 done:()=>['이제 좋아하는 재료를 담가볼까요?','담그기 → 절임 기다리기 → 꺼내 먹기','담글 재료 고르기','foods']
};
function render(){
 const isHome=view==='home',hasFood=view==='food'&&food();
 stageEl.dataset.view=view;$('#app').classList.toggle('is-home',isHome);$('#landing-title').hidden=!isHome;$('#quantity').textContent=isHome?'':`${s.kg} kg 기준`;
 $('#detail').hidden=isHome;$('#progress-track').hidden=true;piece.hidden=true;
 const served=hasFood&&s.food.stage==='served';$('#app').classList.toggle('is-result',!!served);$('#taste-note').hidden=!served;$('#taste-note').textContent=served?food().experience.cue:'';$('#detail').textContent=served?'직접 담그는 법':'? 요령';$('#detail').setAttribute('aria-label',served?'직접 담그는 법':'현재 단계 자세히 보기');
 $('#controls').innerHTML='';
 if(isHome){frame(0);$('#chapter').textContent='작은 발효 공방';setText('오늘, 나만의 누카를 만들어볼까요?','누카는 쌀겨에 소금물을 섞어 발효시킨 절임 바닥이에요. 채소를 묻어 두면 누카 절임이 돼요.');$('#controls').innerHTML=canResume()?primary('이어서 하기','resume')+'<div class="home-links"><button class="resume-button" data-action="new-game">처음부터 새로</button><button class="resume-button" data-action="quick-foods">재료부터 체험하기 →</button></div>':primary('새로 만들어 보기','new-game')+'<button class="resume-button" data-action="quick-foods">재료부터 체험하기 →</button>';}
 else if(hasFood){renderFood();}
 else if(view==='pantry'){frame(0);$('#chapter').textContent='취향을 담그는 시간';setText('어떤 재료를 담가볼까요?',`채소·과일·별미·실험, ${D.foods.length}가지 재료.`);$('#controls').innerHTML=primary('재료 고르기','foods');}
 else if(s.phase==='batch'){frame(0);$('#chapter').textContent='첫 번째 · 나의 한 통';setText('얼마나 만들어볼까요?','양에 맞춰 모든 재료를 계량해드릴게요.');$('#controls').innerHTML=`<div class="control-row"><select id="kg" aria-label="만들 누카 양"><option value="1">1 kg</option><option value="5">5 kg</option><option value="10">10 kg</option></select>${primary('재료 준비하기','begin')}</div>`;$('#kg').value=s.kg;}
 else{const p=s.phase,c=configs[p]();const steps=['ready','salt','dissolve','pour','starter','aroma','fold','ferment','maturing','done'],si=steps.indexOf(p==='mix'?'pour':p);if(si>=0)$('#quantity').textContent=`${si+1}/${steps.length}단계 · ${s.kg} kg`;$('#chapter').textContent=p==='done'?'숙성 다음 · 재료 담그기':['ferment','maturing'].includes(p)?'발효를 기다리며':p==='aroma'?'내 취향 더하기':'오늘의 누카 만들기';setText(c[0],c[1]);$('#controls').innerHTML=primary(c[2],c[3],c[3]==='hold'?'id="hold-pour"':'');
   if(p==='pour')frame(1);else if(['mix','fold'].includes(p))frame(2);else if(['ferment','maturing','done'].includes(p))frame(3,true);else if(p==='dissolve')frame(2,'prep');else if(p==='salt')frame(1,'prep');else if(p==='ready')frame(0,'prep');else if(p==='starter')frame(3,'prep');else frame(0);
   if(['dissolve','pour','mix','fold'].includes(p)){$('#progress-track').hidden=false;$('#progress-fill').style.width=(s.progress*100)+'%';}
 }
 if(busy&&activeAction==='taste-food')setText('꺼내서 한입 맛봐요.','');
 $$('#controls button').forEach(b=>{b.disabled=busy;if(busy&&b.classList.contains('primary'))b.textContent=activeAction==='taste-food'?'맛보는 중…':'만드는 중…';});['#home','#menu','#detail'].forEach(id=>$(id).disabled=busy);stageEl.setAttribute('aria-busy',String(busy));draw();
}
function renderFood(){const f=food(),p=s.food,n=M.cuts[f.id]||1;$('#chapter').textContent=f.name;$('#quantity').textContent=`절임 ${time(f)}`;
 if(p.stage==='prep'){frame(1,true);setText(`${f.name}, 작게 썰어요.`,f.id==='pumpkin'?'5mm 얇은 조각':'손질한 조각을 한 번에 담아요.','');$('#controls').innerHTML=primary('썰어서 담기','chop');}
 else if(p.stage==='place'){frame(2,true);setText(`${objectName(f.name)} 누카에 담아요.`,n>1?'조각을 모아 한 번에 담아요.':'','');piece.hidden=true;$('#piece-image').src=`assets/${f.id}${M.cuts[f.id]?'-cut':''}.webp`;$('#piece-image').alt=f.name;$('#piece-label').textContent=`${p.placed+1} / ${n}조각`;piece.style.left='50%';piece.style.top='86%';$('#controls').innerHTML=primary('집어서 담기','place');}
 else if(p.stage==='taste'){frame(2,true);setText(`절임 시간 · ${time(f)}`,f.unknown?'절임 시간 정보가 없는 재료예요.':`${isCold(f)?'냉장 기준 · ':''}실제 절임 시간은 크기와 누카 상태에 따라 달라요.`);$('#controls').innerHTML=primary('꺼내서 맛 알아보기','serve-food');}
 else{frame(2,true);setText(f.experience.title,f.experience.feel);$('#controls').innerHTML=primary('다른 재료 체험하기','next-food');}
}
function complete(){M.advance(s);save();render();}
async function perform(kind,duration,commit){
 if(busy)return false;busy=true;activeAction=kind;render();sound(kind==='prepare-food'?'chop':'tap');
 let ok=false;try{ok=await performer.play(kind,duration);if(ok&&commit)commit();else toast('그림을 불러오지 못했어요. 한 번 더 눌러주세요.');}catch{toast('그림을 불러오지 못했어요. 한 번 더 눌러주세요.');}finally{busy=false;activeAction="";save();render();}return ok;
}
function addIngredient(){const p=s.phase;return perform(p==='ready'?'bran':p==='salt'?'salt':'starter',1550,()=>M.advance(s));}
function placeFood(){
 if(busy||s.food?.stage!=='place')return;
 return perform('place',M.cuts[s.food.id]?1100:1700,()=>M.finishFood(s));
}
function chopFood(){
 if(busy||s.food?.stage!=='prep')return;
 return perform('prepare-food',2100,()=>M.finishFood(s));
}
function mixBatch(){
 if(busy||!['pour','mix'].includes(s.phase))return;
 return perform('blend',4200,()=>M.finishMix(s));
}
function stopGesture(){pointer=null;performer.gesture(null);save();}
function fermentationHTML(){return `<div class="notice"><strong>누카 자체의 초기 발효 · 약 10일–3주</strong><br>배합과 관리 온도에 따라 달라지는 참고 기간이에요. 이 앱의 혼합 체험을 끝냈다고 바로 먹을 수 있는 것은 아니에요.</div><ol><li><strong>길들이기:</strong> 씻어 물기를 뺀 양배추 겉잎·무 껍질 등으로 버림 절임을 해요.</li><li><strong>매일:</strong> 바닥부터 하루 약 2회 섞고 표면을 정리하며 품온·향·표면을 기록해요.</li><li><strong>2–3일마다:</strong> 버림 절임 채소를 갈아요. 꺼낸 채소는 먹지 않고 버려요.</li><li><strong>시간과 상태 함께:</strong> 날짜나 향만으로 안전·완성을 판단하지 않아요. 냉장에서는 발효가 느려 같은 일정을 적용할 수 없어요.</li></ol><details><summary>온도·시험 배합·판매용 확인</summary><p>발효 속도는 온도·염도·수분·종균 상태에 따라 달라져요.</p><p>현재 배합은 숙성 누카를 넣은 시제품 참고안입니다. 양배추 ${grams(50)}을 추가해 48시간마다 처음 3회 교체·관찰하는 기존 시험안과, 일반 길들이기 방법은 구분해 주세요. 20–25°C 시험 환경, 0·1·3·7·10·14일의 검사 계획은 검증을 위한 안이며 14일이 완성일은 아닙니다.</p><p>생산·판매용은 pH·염도·미생물 검사와 보관·소비기한 검증이 필요해요. 소금 투입량이 최종 총염분과 같지는 않아요. 곰팡이·부패 냄새가 있으면 맛보지 않아요.</p></details>`;}
function batchHTML(){const total=997+s.aromas.reduce((n,id)=>n+(aroma(id).amount||0),0);return `<p class="muted">${s.kg} kg 기준 · 시제품 참고 배합${s.madeAt?' · '+new Date(s.madeAt).toLocaleDateString('ko-KR'):''}</p><dl class="recipe-grid"><dt>볶은 쌀겨</dt><dd>${grams(439)}</dd><dt>물</dt><dd>${grams(439)}</dd><dt>소금</dt><dd>${grams(52.9)}</dd><dt>숙성 누카</dt><dd>${grams(66.1)}</dd>${s.aromas.map(id=>{const a=aroma(id);return `<dt>${esc(a.name)}</dt><dd>${a.amount?grams(a.amount):'소량'}</dd>`}).join('')}</dl><p class="muted">기본 배합 합계 ${grams(997)}. 선택 향미 포함 계량 합계 ${grams(total)}${s.aromas.some(id=>!aroma(id).amount)?' + 소량 향미':''}. 1 kg는 배합 기준명이며 실제 합계와 조금 달라요.</p><ol><li>식품용 원료를 확인하고 용기와 도구를 세척·소독해요.</li><li>끓여 식힌 물에 소금을 완전히 녹여요.</li><li>쌀겨에 소금물을 세 번 나누어 넣고 매번 골고루 섞어요.</li><li>숙성 누카와 선택한 향미를 더해 바닥부터 고르게 섞어요.</li><li>표면·가장자리를 정리한 뒤 발효 상태를 관찰해요.</li></ol>${s.aromas.length?`<h3>내가 더한 풍미</h3>${s.aromas.map(id=>{const a=aroma(id);return `<p><strong>${a.name} · ${a.flavor}</strong><br>${a.method}</p>`}).join('')}`:'<p>추가 향미 없이 기본 누카로 만들어요.</p>'}<p class="muted">시제품 참고 배합입니다. 생산·판매에는 별도 검증이 필요해요.</p>`;}
function showAromas(){open('내 취향의 풍미',`<p class="muted">넣기 전에 풍미를 골라요. 하나도 고르지 않아도 괜찮아요.</p><div class="flavors">${D.aromas.map(a=>`<button class="flavor" data-aroma="${a.id}" aria-pressed="${s.aromas.includes(a.id)}"><strong>${a.name}</strong><small>${a.flavor}</small><small>${a.amount?'약 '+grams(a.amount):'소량'}</small></button>`).join('')}</div>${primary(s.aromas.length?'선택한 풍미 더하기':'기본 누카로 만들기','apply-aromas')}<details><summary>재료별 넣는 방법</summary>${D.aromas.map(a=>`<p><strong>${a.name}</strong><br>${a.method}</p>`).join('')}</details>`,'aromas');}
function showFoods(){const list=D.foods.filter(f=>f.group===group),pages=Math.ceil(list.length/foodsPerPage());page=Math.min(page,pages-1);open('오늘 담글 재료',`<div class="filter-bar">${[['veg','채소'],['fruit','과일'],['special','별미'],['lab','실험']].map(([id,name])=>`<button data-group="${id}" class="${id===group?'selected':''}">${name}</button>`).join('')}</div>${group==='lab'?'<div class="notice">실험 탭은 호불호가 크거나 실패한 기록도 있는 재료예요. 맛있다는 보장이 없어요. 정상 누카를 따로 덜어 실험하고, 본통에 돌려넣지 않아요.</div>':''}<div class="food-grid">${list.slice(page*foodsPerPage(),page*foodsPerPage()+foodsPerPage()).map(f=>`<button class="food-card" data-food="${f.id}">${f.group==='lab'?`<em class="lab-tag">${/실패/.test(f.condition)?'실패 기록':'호불호'}</em>`:''}${foodImage(f,true)}<span>${f.name}</span><small class="food-time">${f.unknown?'시간 정보 없음':time(f).split(' / ')[0]}</small></button>`).join('')}</div>${pages>1?`<div class="pager"><button class="quiet" data-action="page-food-prev" ${page===0?'disabled':''}>← 이전</button><span>${page+1} / ${pages}</span><button class="quiet" data-action="page-food-next" ${page===pages-1?'disabled':''}>다음 →</button></div>`:''}`,'foods');}
function foodImage(f,decorative=false){const b=NukaStage.spriteBounds[f.id];return `<svg class="food-icon" viewBox="${b.join(' ')}" ${decorative?'aria-hidden="true"':`role="img" aria-label="${esc(f.name)}"`}><defs><clipPath id="food-crop-${f.id}"><rect x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${b[3]}"/></clipPath></defs><image href="assets/${f.id==='natto'?'natto-v27':f.id}.webp" width="180" height="180" preserveAspectRatio="xMinYMin meet" clip-path="url(#food-crop-${f.id})"/></svg>`;}
function foodDetails(f){const special=f.group!=='veg',cut=!!M.cuts[f.id];return `<div class="food-hero">${foodImage(f)}<div><strong>${f.name}</strong><div class="time-tag">절임 시간 ${time(f)}</div><span class="muted">${isCold(f)?'냉장 기준':'보관 온도 정보 없음'}</span></div></div><div class="taste-row"><div><small>담그기 전</small>${f.before}</div><div><small>맛 변화 · 참고</small>${f.after.replace(/다는 후기/g,'다고 알려짐').replace(/후기/g,'참고')}</div></div><p>${prepText(f)}</p>${special?'<div class="notice">정상 누카를 따로 덜어 소량씩 냉장 취급해요. 사용한 누카는 본통에 돌려넣지 않아요.</div>':''}${f.unknown?'<p class="muted">시간·온도 정보가 없어요.</p>':''}${cut?'<p class="muted">작게 자르면 절임 시간이 달라져요.</p>':''}<p class="muted">누카 상태·온도·재료 크기에 따라 시간과 맛이 달라져요.</p>`;}

function previewFood(id){foodPreview=id;const f=findFood(id);open(f.name,`<button class="back-link" data-action="foods">← 다른 재료</button>${foodDetails(f)}${primary('이 재료로 해보기','choose-food')}`,'food-detail');}
function showDetail(){if(view==='food'&&food()){showPractical(food());return;}const p=s.phase;const info={batch:'기본 배합은 1 kg 기준 볶은 쌀겨 439 g, 물 439 g, 소금 53 g, 숙성 누카 66 g이에요. 양을 바꾸면 모든 재료를 다시 계산해 드려요. 향미는 따로 더해요.',ready:'식품용 볶은 쌀겨를 사용하고, 깨끗한 식품용 용기와 도구를 준비해요.',salt:`끓여 식힌 물 ${grams(439)}에 소금 ${grams(52.9)}을 넣어요. 뜨거운 물을 누카에 바로 붓지 않아요.`,dissolve:'바닥에 소금이 남지 않도록 충분히 저어 완전히 녹여요.',pour:'한 번에 모두 붓지 않고 세 번 나눠 넣어요. 실제 제조에서는 매번 골고루 섞어요.',mix:'마른 쌀겨가 남지 않게 바닥과 가장자리부터 고르게 섞어요. 한 번 선택하면 고르게 섞는 동작이 이어져요.',starter:`숙성된 정상 누카 ${grams(66.1)}을 넣고 고르게 섞어요. 숙성 누카는 이미 잘 발효된 누카예요. 누카 절임을 하는 가게나 온라인에서 '발효 누카(누카도코)'로 사거나, 누카를 키우는 사람에게 조금 나눠 받아요. 없으면 빼고 만들어도 되지만 길들이는 기간이 더 길어져요. 넣어도 완성 시점을 보장하지는 않아요.`,fold:'선택 향미를 고루 섞고 표면과 가장자리를 정리해요. 다시마와 건고추는 필수 재료가 아닙니다.'};open('오늘 단계의 작은 요령',['ferment','maturing','done'].includes(p)?fermentationHTML():`<p>${info[p]||'원하는 재료와 풍미를 골라요. 배합과 방법은 여기서 다시 볼 수 있어요.'}</p><details><summary>배합 전체 보기</summary>${batchHTML()}</details>`,'info');}
function menu(){open('부엌 메뉴',`<div class="menu-list"><button data-action="quick-foods">다른 재료 체험하기</button><button data-action="practical">직접 만드는 법</button><button data-action="new-game">누카 만들기 처음부터</button><button data-action="share">앱 공유하기</button><button data-action="sound">효과음 ${s.sound?'끄기':'켜기'}</button></div>`,'menu');}
function showPractical(f){
 if(!f){open('누카 직접 만들기',batchHTML()+`<details><summary>초기 발효와 매일의 관리</summary>${fermentationHTML()}</details>`,'practical');return;}
 const cold=isCold(f),limited=f.unknown||!cold;
 const clean=prepText(f);
 open(`${f.name} 직접 담그는 법`,`<div class="food-hero">${foodImage(f)}<div><strong>${f.name}</strong><div class="time-tag">${f.unknown?'절임 시간 정보 없음':'참고 절임 '+time(f)}</div><small>${cold?'냉장 기준':'제시 시간의 온도 조건 미기재'}</small></div></div><div class="taste-row"><div><small>담그기 전</small>${f.before}</div><div><small>맛의 이미지</small>${f.experience.cue}</div></div>${limited?'<p class="notice">시간·온도 정보가 충분하지 않아, 그대로 따라 하는 완성 레시피가 아닌 참고 정보예요.</p>':''}<ol class="practical-steps"><li><strong>준비</strong><br>${clean}</li><li><strong>담그기</strong><br>사용 준비가 된 정상 누카로 재료를 감싸요.${f.group!=='veg'?' 본통에서 따로 덜어 냉장 취급하고, 사용한 누카는 본통에 되돌리지 않아요.':''}</li><li><strong>절임과 꺼내기</strong><br>${f.unknown?'알려진 절임 시간이 없어 시간을 제안하지 않아요.':`참고 시간은 ${time(f)}. 실제 시간은 재료 크기·온도·누카 상태에 따라 달라요.`} ${f.group==='veg'?'꺼낸 뒤 누카를 털고 가볍게 씻어 물기를 닦아요.':'꺼낸 뒤 묻은 누카를 꼼꼼히 제거해요.'}</li></ol><p class="muted">맛·식감 표현은 기존 맛 설명을 풀어 쓴 이미지이며, 결과를 보장하지 않아요.${M.cuts[f.id]?' 게임의 조각 크기는 연출이며 실제 손질법과 시간은 위 내용을 기준으로 확인해요.':''}</p><details><summary>누카가 없다면 · 기본 배합과 발효</summary>${batchHTML()}${fermentationHTML()}</details>`,'practical');
}
async function share(){const info={title:'누카의 부엌',text:'작은 발효 공방에서 나만의 누카를 만들어봐요.',url:URL};if(navigator.share){try{await navigator.share(info);return;}catch(e){if(e.name==='AbortError')return;}}try{await navigator.clipboard.writeText(URL);close();toast('공유 링크를 복사했어요.');}catch{open('앱 공유하기',`<p>아래 링크를 복사해 보내주세요.</p><label class="form-field">공유 링크<input readonly value="${URL}" aria-label="공유 링크"></label>`,'share');}}
function dispatch(action){if(busy)return;
 if(action==='new-game'){s={...M.initial(),sound:s.sound};view='kitchen';resumeView='kitchen';close();render();}
 if(action==='resume'){view=resumeView==='food'&&!s.food?'pantry':resumeView||'kitchen';close();render();if(view==='pantry')showFoods();}
 if(action==='quick-foods'){view='pantry';close();render();showFoods();}
 if(action==='practical')showPractical(view==='food'?food():null);
 if(action==='begin'){s.kg=Number($('#kg').value);complete();}
 if(action==='add')addIngredient();
 if(action==='stir')perform('stir',1800,()=>M.advance(s));
 if(action==='mix-batch')mixBatch();
 
 if(action==='aromas')showAromas();
 if(action==='apply-aromas'){close();if(s.aromas.length)perform('aroma',1600,()=>M.advance(s));else complete();}
 if(action==='ferment')open('누카를 길들이는 시간',`<div class="notice"><strong>초기 발효 약 10일–3주</strong><br>온도와 배합에 따라 달라져요.</div><ol><li>버림 절임 채소를 넣어 길들여요.</li><li>매일 바닥부터 섞고 향·표면을 관찰해요.</li><li>버림 절임 채소는 먹지 않고 교체해요.</li></ol>${primary('발효 관찰 단계로','finish')}<details><summary>발효 방법 자세히</summary>${fermentationHTML()}</details>`,'ferment');
 if(action==='ferment-info')open('발효·사용 안내',fermentationHTML(),'info');
 if(action==='finish'){close();view='kitchen';complete();}
 if(action==='maturity')open('숙성 다음에는 재료를 담가요',`<p>버림 절임 채소를 꺼내고 누카를 고르게 섞은 뒤, 사용 준비가 된 누카에 재료를 담가요.</p><div class="notice">게임에서는 숙성 후로 넘어가요. 실제 누카는 날짜나 향만으로 완성·안전을 판단하지 않아요. 곰팡이·부패 냄새가 있으면 사용하거나 맛보지 않아요.</div>${primary('재료 담그기 체험으로','mature-ready')}<details><summary>관찰과 관리 방법</summary>${fermentationHTML()}</details>`,'maturity');
 if(action==='mature-ready'){if(s.phase!=='maturing')return;M.advance(s);s.food=null;view='pantry';close();save();render();showFoods();}
 if(action==='foods')showFoods();
 if(action==='page-food-prev'){page=Math.max(0,page-1);showFoods();}if(action==='page-food-next'){page++;showFoods();}
 if(action==='choose-food'){M.selectFood(s,foodPreview,D);view='food';close();save();render();if(s.food.stage==='place')placeFood();}
 if(action==='chop')chopFood();
 if(action==='place')placeFood();
 if(action==='serve-food'){if(s.food?.stage==='taste')perform('taste-food',3200,()=>M.serveFood(s));}
 if(action==='next-food'){view='pantry';render();showFoods();}
 if(action==='share')share();
 if(action==='sound'){s.sound=!s.sound;save();menu();sound();}
 if(action==='cancel')close();
}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled||busy)return;if(b.dataset.action){dispatch(b.dataset.action);}if(b.dataset.aroma){const id=b.dataset.aroma;s.aromas=s.aromas.includes(id)?s.aromas.filter(x=>x!==id):[...s.aromas,id];save();showAromas();}if(b.dataset.group){group=b.dataset.group;page=0;showFoods();}if(b.dataset.food)previewFood(b.dataset.food);});
$('#home').onclick=()=>{if(busy)return;stopGesture();view='home';render();};$('#menu').onclick=()=>{if(!busy)menu();};$('#detail').onclick=()=>{if(!busy)showDetail();};$('#sheet-close').onclick=close;
sheet.addEventListener('click',e=>{if(e.target===sheet){const r=sheet.getBoundingClientRect();if(e.clientY<r.top)close();}});
sheet.addEventListener('close',()=>{modal='';});
// Hidden pages pause the stage clock; returning resumes the same action.
stageEl.addEventListener('click',e=>{
 if(busy||view==='home'||sheet.open)return;const r=stageEl.getBoundingClientRect();if((e.clientY-r.top)/r.height<.52)return;
 if(view==='food'){if(s.food?.stage==='prep')dispatch('chop');else if(s.food?.stage==='place')dispatch('place');return;}
 if(view!=='kitchen')return;
 if(['ready','salt','starter'].includes(s.phase))dispatch('add');
 if(['pour','mix'].includes(s.phase))dispatch('mix-batch');
 if(['dissolve','fold'].includes(s.phase))dispatch('stir');
});
const performer=NukaStage.create(canvas,()=>({s,view,M,D}));
function draw(){performer.draw();}
new ResizeObserver(draw).observe(stageEl);render();
})();
