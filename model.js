(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.NukaModel=factory();})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  const phases=['batch','ready','salt','dissolve','pour','mix','starter','aroma','fold','ferment','maturing','done'];
  const cuts={carrot:8,daikon:8,eggplant:6,turnip:6,avocado:4,chocolate:6,apple:6,pear:8,pineapple:6,kiwi:4,'watermelon-rind':6,paprika:6,lotus:6,pumpkin:8};
  const initial=()=>({version:1,kg:1,phase:'batch',round:0,progress:0,aromas:[],journal:[],picks:[],food:null,observations:[],madeAt:null,sound:false});
  const amount=(n,kg)=>Math.round(n*kg*10)/10;
  function restore(value,data){const s=initial();if(!value||value.version!==1)return s;
    s.kg=[1,5,10].includes(value.kg)?value.kg:1;s.phase=phases.includes(value.phase)?value.phase:'batch';s.round=Math.min(2,Math.max(0,Math.floor(Number(value.round)||0)));s.progress=Math.min(1,Math.max(0,Number(value.progress)||0));
    s.aromas=[...new Set(Array.isArray(value.aromas)?value.aromas:[])].filter(id=>data.aromas.some(a=>a.id===id));s.picks=(Array.isArray(value.picks)?value.picks:[]).filter(p=>p&&data.foods.some(f=>f.id===p.id)).slice(-100).map(p=>({id:p.id,at:typeof p.at==='string'?p.at:null,kg:[1,5,10].includes(p.kg)?p.kg:s.kg}));
    s.observations=(Array.isArray(value.observations)?value.observations:[]).filter(o=>o&&typeof o.note==='string').slice(-60).map(o=>({note:o.note.slice(0,500),temp:o.temp==null?null:Math.min(100,Math.max(-20,Number(o.temp)||0)),at:typeof o.at==='string'?o.at:''}));
    s.journal=(Array.isArray(value.journal)?value.journal:[]).filter(x=>typeof x==='string').slice(-30);s.madeAt=typeof value.madeAt==='string'?value.madeAt:null;s.sound=value.sound===true;
    if(value.food&&data.foods.some(f=>f.id===value.food.id)){const f=value.food,total=cuts[f.id]||1;s.food={id:f.id,cut:Math.max(0,Math.min(total-1,Number(f.cut)||0)),placed:Math.max(0,Math.min(total,Number(f.placed)||0)),stage:['prep','place','taste','served'].includes(f.stage)?f.stage:'prep'};if(s.food.cut===total-1&&s.food.stage==='prep')s.food.stage='place';if(s.food.placed===total&&s.food.stage!=='served')s.food.stage='taste';}return s;
  }
  function legacy(old,data){const s=initial(),g=old?.privateContent?.game;if(!g)return s;s.kg=[1,5,10].includes(g.kg)?g.kg:1;s.picks=(g.picks||[]).filter(p=>data.foods.some(f=>f.id===p.id)).map(p=>({id:p.id,at:null,kg:s.kg}));if(g.phase==='done'){s.phase='done';s.aromas=(g.aromas||[]).filter(id=>data.aromas.some(a=>a.id===id));}return s;}
  function advance(s){const p=s.phase;let next=p;
    if(p==='batch')next='ready';if(p==='ready')next='salt';if(p==='salt')next='dissolve';if(p==='dissolve')next='pour';if(p==='pour')next='mix';
    if(p==='mix'){if(s.round<2){s.round++;next='pour';}else next='starter';}
    if(p==='starter')next='aroma';if(p==='aroma')next='fold';if(p==='fold'){next='ferment';s.madeAt=new Date().toISOString();}if(p==='ferment')next='maturing';if(p==='maturing')next='done';
    if(next!==p){s.journal.push(p+(p==='mix'||p==='pour'?':'+s.round:''));s.phase=next;s.progress=0;}return s;
  }
  function selectFood(s,id,data){if(!data.foods.some(f=>f.id===id))return;s.food={id,cut:0,placed:0,stage:cuts[id]?'prep':'place'};}
  function chop(s){const f=s.food;if(!f||f.stage!=='prep')return false;f.cut=Math.min((cuts[f.id]||1)-1,f.cut+1);if(f.cut===(cuts[f.id]||1)-1)f.stage='place';return true;}
  function place(s){const f=s.food;if(!f||f.stage!=='place')return false;f.placed=Math.min(cuts[f.id]||1,f.placed+1);if(f.placed===(cuts[f.id]||1))f.stage='taste';return true;}
  function note(s){if(!s.food||!['taste','served'].includes(s.food.stage))return false;const id=s.food.id;if(!s.picks.some(p=>p.id===id))s.picks.push({id,at:new Date().toISOString(),kg:s.kg});return true;}
  function serveFood(s){if(s.food?.stage!=='taste')return false;s.food.stage='served';return true;}
  function finishFood(s){const f=s.food;if(!f||!['prep','place'].includes(f.stage))return false;const total=cuts[f.id]||1;f.cut=total-1;f.placed=total;f.stage='taste';return true;}
  function finishMix(s){if(!['pour','mix'].includes(s.phase))return false;while(['pour','mix'].includes(s.phase))advance(s);return true;}
  return{initial,restore,legacy,amount,advance,cuts,selectFood,chop,place,note,finishFood,finishMix,serveFood};
});
