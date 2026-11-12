/* Viewport-sized recipe pages: all copy remains reachable, actions stay visible. */
window.NukaSheets={create(sheet){
 const body=sheet.querySelector('#sheet-body'),title=sheet.querySelector('#sheet-title');
 const nav=document.createElement('nav'),footer=document.createElement('div');
 nav.className='sheet-pagination';nav.setAttribute('aria-label','설명 페이지');
 footer.className='sheet-fixed-actions';sheet.append(nav,footer);
 let current=null,stack=[],pages=[],index=0,links=[],timer;
 function blocks(html){
  const box=document.createElement('div');box.innerHTML=html;const out=[];
  for(const el of [...box.children]){
   if(el.matches('details')){const summary=el.querySelector('summary'),b=document.createElement('button');b.className='sheet-more';b.textContent=summary.textContent+' ›';summary.remove();b.dataset.sheetRead=links.length;links.push({title:b.textContent.slice(0,-2),html:el.innerHTML});out.push(b);}
   else if(el.matches('ol,ul')){[...el.children].forEach((li,i)=>{const row=document.createElement(el.tagName);row.start=i+1;row.className=el.className;row.append(li);out.push(row);});}
   else if(el.matches('dl')){const items=[...el.children];for(let i=0;i<items.length;i+=2){const row=el.cloneNode(false);row.append(...items.slice(i,i+2));out.push(row);}}
   else if(el.matches('.flavors,.food-grid,.menu-list')){const items=[...el.children],n=el.matches('.flavors')?2:el.matches('.food-grid')?3:1;for(let i=0;i<items.length;i+=n){const row=el.cloneNode(false);row.append(...items.slice(i,i+n));out.push(row);}}
   else out.push(el);
  }
  return out;
 }
 function fit(){
  if(!sheet.open||!current)return;
  links=[];title.textContent=current.title;setFooter();
  nav.hidden=false;nav.innerHTML='<button data-sheet-page="-1" aria-label="이전 설명">←</button><span></span><button data-sheet-page="1" aria-label="다음 설명">→</button>';
  const all=blocks(current.html);pages=[[]];body.replaceChildren();
  const max=body.clientHeight+1;
  for(let i=0;i<all.length;i++){
   const el=all[i];body.append(el);
   if(body.scrollHeight>max&&pages.at(-1).length){el.remove();pages.push([]);body.replaceChildren(el);}
   // A long paragraph is continued on another page, never clipped or ellipsized.
   if(body.scrollHeight>max&&el.textContent.length>90&&!el.querySelector('button,input,svg')){
    const words=el.textContent.trim().split(/\s+/),a=document.createElement('p'),b=document.createElement('p');a.className=b.className=el.className;
    const middle=Math.ceil(words.length/2);a.textContent=words.slice(0,middle).join(' ');b.textContent=words.slice(middle).join(' ');el.remove();all.splice(i,1,a,b);i--;continue;
   }
   pages.at(-1).push(el);
  }
  index=Math.min(index,pages.length-1);draw();
 }
 function draw(){
  body.replaceChildren(...pages[index]);nav.hidden=pages.length===1;
  nav.querySelector('span').textContent=`${index+1} / ${pages.length}`;
  nav.querySelector('[data-sheet-page="-1"]').disabled=index===0;
  nav.querySelector('[data-sheet-page="1"]').disabled=index===pages.length-1;
  sheet.dataset.page=String(index+1);sheet.dataset.pages=String(pages.length);
 }
 function setFooter(){footer.innerHTML=current.footer;if(stack.length){const b=document.createElement('button');b.className='sheet-back';b.dataset.sheetBack='';b.textContent='← 돌아가기';footer.prepend(b);}}
 sheet.addEventListener('click',e=>{
  const button=e.target.closest('button');if(!button)return;
  if(button.dataset.sheetPage){index+=Number(button.dataset.sheetPage);draw();}
  if(button.hasAttribute('data-sheet-read')){stack.push({current,index});const next=links[Number(button.dataset.sheetRead)];current={...next,footer:current.footer};index=0;fit();}
  if(button.hasAttribute('data-sheet-back')){const prior=stack.pop();current=prior.current;index=prior.index;fit();}
 });
 addEventListener('resize',()=>{clearTimeout(timer);timer=setTimeout(fit,100);});
 document.fonts?.ready.then(fit);
 return {open(heading,html,key){
  const same=current?.key===key&&current?.title===heading;const box=document.createElement('div');box.innerHTML=html;let actions='';
  for(const el of [...box.children])if(el.matches('.primary,.pager')){actions+=el.outerHTML;el.remove();}
  current={title:heading,html:box.innerHTML,footer:actions,key};stack=[];if(!same)index=0;fit();
 }};
}};
