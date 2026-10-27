const menus=new Set();
export function closeSelectMenus(){for(const menu of menus)menu.close();}
export function enhanceSelect(select){
  if(select.dataset.enhanced)return;
  select.dataset.enhanced='true';select.hidden=true;
  const root=document.createElement('div');root.className='soft-select';
  const trigger=document.createElement('button');trigger.type='button';trigger.className='soft-select-trigger';trigger.id=select.id+'-trigger';trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');
  const label=document.querySelector(`label[for="${select.id}"]`);if(label){label.id||=select.id+'-label';label.htmlFor=trigger.id;trigger.setAttribute('aria-labelledby',`${label.id} ${select.id}-value`);}
  const value=document.createElement('span');value.id=select.id+'-value';
  const arrow=document.createElement('span');arrow.className='soft-select-arrow';arrow.setAttribute('aria-hidden','true');arrow.textContent='⌄';trigger.append(value,arrow);
  const list=document.createElement('div');list.className='soft-select-menu';list.id=select.id+'-listbox';list.setAttribute('role','listbox');list.setAttribute('aria-label',label?.textContent||'Options');list.hidden=true;trigger.setAttribute('aria-controls',list.id);
  const items=Array.from(select.options).map((option,index)=>{const item=document.createElement('div');item.id=`${select.id}-option-${index}`;item.className='soft-select-option';item.setAttribute('role','option');item.tabIndex=-1;const text=document.createElement('span');text.textContent=option.textContent;const check=document.createElement('span');check.className='soft-select-check';check.setAttribute('aria-hidden','true');check.textContent='✓';item.append(text,check);if(option.disabled)item.setAttribute('aria-disabled','true');list.append(item);return item;});
  root.append(trigger,list);select.after(root);
  function sync(){value.textContent=select.selectedOptions[0]?.textContent||'';items.forEach((item,i)=>item.setAttribute('aria-selected',String(i===select.selectedIndex)));}
  function close(focus=false){list.hidden=true;trigger.setAttribute('aria-expanded','false');root.classList.remove('is-open','opens-up');if(focus)trigger.focus();}
  function focusItem(index){const i=(index+items.length)%items.length;if(select.options[i].disabled)return;items[i].focus();items[i].scrollIntoView({block:'nearest'});}
  function open(index=select.selectedIndex){closeSelectMenus();const regional=document.querySelector('#background-menu');if(regional){regional.hidden=true;document.querySelector('#background-toggle')?.setAttribute('aria-expanded','false');}list.hidden=false;root.classList.add('is-open');trigger.setAttribute('aria-expanded','true');const rect=trigger.getBoundingClientRect();const height=Math.min(list.scrollHeight+14,288);root.classList.toggle('opens-up',window.innerHeight-rect.bottom<height+14&&rect.top>height+14);focusItem(Math.max(0,index));}
  function choose(index){if(select.options[index].disabled)return;select.selectedIndex=index;sync();close(true);select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));}
  trigger.addEventListener('click',()=>list.hidden?open():close());
  list.addEventListener('click',event=>{const item=event.target.closest('[role=option]');if(item)choose(items.indexOf(item));});
  let typed='',typedAt=0;
  root.addEventListener('keydown',event=>{
    const current=items.indexOf(document.activeElement);
    if(event.key==='Escape'){if(!list.hidden){event.preventDefault();event.stopPropagation();close(true);}return;}
    if(event.key==='Tab'){setTimeout(()=>close(),0);return;}
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();if(list.hidden)open();else focusItem((current<0?select.selectedIndex:current)+(event.key==='ArrowDown'?1:-1));return;}
    if(event.key==='Home'||event.key==='End'){event.preventDefault();if(list.hidden)open(event.key==='Home'?0:items.length-1);else focusItem(event.key==='Home'?0:items.length-1);return;}
    if(event.key==='Enter'||event.key===' '){event.preventDefault();if(list.hidden)open();else choose(current>=0?current:select.selectedIndex);return;}
    if(event.key.length===1&&!event.ctrlKey&&!event.metaKey&&!event.altKey){typed=Date.now()-typedAt>650?event.key:typed+event.key;typedAt=Date.now();const i=Array.from(select.options).findIndex(option=>option.textContent.toLowerCase().startsWith(typed.toLowerCase()));if(i>=0){event.preventDefault();if(list.hidden)open(i);else focusItem(i);}}
  });
  document.addEventListener('click',event=>{if(!root.contains(event.target))close();});
  select.addEventListener('change',sync);select.addEventListener('input',sync);sync();menus.add({close});
}
