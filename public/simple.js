import {enhanceSelect,closeSelectMenus} from './select-menu.js';
import {backgroundTree,backgroundLeaves,normalizeBackgrounds,backgroundSummary} from './backgrounds.js';
import {clothingStyles,seasons} from './wardrobe.js';
import {displayScene,uiError} from './english.js';
import {buildChatGPTPrompt} from './chatgpt-prompt.js';
const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let selectedBackgrounds=new Set();
let state, source = localStorage.getItem('source') || 'manual', submitting = false, showHistory = false;
const sourceNames = {personal:'OpenAI Images', company:'Company API', manual:'ChatGPT / Gemini'};
const names = {clean:'Clean background',scene:'In a setting',female:'Female',male:'Male',mixed:'50/50 split',face:'Face',half:'Half body',full:'Full body'};
async function api(route, body) {
  const response = await fetch('/api/' + route, body ? {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)} : {});
  const result = await response.json();
  if (!response.ok) throw Error(uiError(result.error) || 'Action could not be completed');
  return result;
}
function toast(message) { $('#toast').textContent = message; $('#toast').style.display = 'block'; clearTimeout(toast.timer); toast.timer = setTimeout(() => $('#toast').style.display = 'none', 4000); }
function modal(html) { $('#modal').innerHTML = html; $('#modal').showModal(); }
function inputValues() { return {...Object.fromEntries(new FormData($('#create-form'))),regionalBackgrounds:[...selectedBackgrounds]}; }
function drawBackgroundTree(){
  function node(n){if(!n.children)return `<label class="background-leaf"><input type="checkbox" data-background-leaf="${n.id}"> ${n.label}</label>`;return `<div class="background-group"><div class="background-group-head"><label><input type="checkbox" data-background-group="${n.id}"> ${n.label}</label><button type="button" data-background-expand="${n.id}" aria-expanded="false" aria-controls="bg-${n.id}" aria-label="Expand ${n.label}">⌄</button></div><div class="background-children" id="bg-${n.id}" hidden>${n.children.map(node).join('')}</div></div>`;}
  $('#background-tree').innerHTML=backgroundTree.map(node).join('');updateBackgroundPicker();
}
function updateBackgroundPicker(){
  $('#background-selection').textContent=backgroundSummary([...selectedBackgrounds]);
  document.querySelectorAll('[data-background-leaf]').forEach(c=>c.checked=selectedBackgrounds.has(c.dataset.backgroundLeaf));
  document.querySelectorAll('[data-background-group]').forEach(c=>{const ids=backgroundLeaves(c.dataset.backgroundGroup),count=ids.filter(id=>selectedBackgrounds.has(id)).length;c.checked=count===ids.length;c.indeterminate=count>0&&count<ids.length;});
}
function closeBackgroundPicker(){$('#background-menu').hidden=true;$('#background-toggle').setAttribute('aria-expanded','false');}
document.addEventListener('click',e=>{if(!e.target.closest('#background-picker'))closeBackgroundPicker();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#background-menu').hidden){closeBackgroundPicker();$('#background-toggle').focus();}});
function isRealRow(row) { if(!['personal','company'].includes(row.source))return false; const version=row.versions.find(v=>v.id===row.active); return version ? version.source!=='mock' : ['personal','company','manual'].includes(row.source); }
function currentRows() { const ids = new Set(state.latestBatch?.ids || []); return state.rows.filter(row => isRealRow(row) && (showHistory ? !ids.has(row.id) : ids.has(row.id))); }
function imageURL(row, version = row.active) { return `/api/image?id=${encodeURIComponent(row.id)}&v=${encodeURIComponent(version)}`; }
function updateSummary() {
  const f = inputValues(), active = source!=='manual'&&state?.rows.some(r => ['queued','running'].includes(r.status));
  document.querySelector('.background-picker>p').textContent=f.regionalBackgrounds.length>Number(f.count)?`${f.regionalBackgrounds.length} backgrounds selected for ${f.count} images. Some will not appear.`:'Choose regions or countries. Selections vary across images.';
  $('#summary').textContent = `${f.count || '—'} images · ${names[f.gender]} · ${f.ageMin || '0'}–${f.ageMax || '0'} yrs · ${names[f.framing]} · ${names[f.background]} · ${f.aspectRatio==='random'?'Random ratios':f.aspectRatio||'4:3'}`;
  if(f.regionalBackgrounds.length)$('#summary').textContent+=' · '+backgroundSummary(f.regionalBackgrounds);
  if(f.clothingStyle&&f.clothingStyle!=='request')$('#summary').textContent+=' · '+(f.clothingStyle==='random'?'Random style':clothingStyles[f.clothingStyle].label);
  if(f.season&&f.season!=='any')$('#summary').textContent+=' · '+(f.season==='random'?'Random season':seasons[f.season].label);
  $('#create b').textContent = active ? 'Generating photos…' : source==='personal'&&!state?.keyReady ? 'Connect API to generate photos' : source==='manual'?'Copy image prompt':`Generate ${f.count || '—'} images`;
  $('#create').disabled = submitting || !!active;
  document.querySelectorAll('[data-method]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.method===(source==='manual'?'manual':'personal'))));
  $('#method-settings').hidden=source==='manual';
  $('#source-name').textContent = source==='personal'&&!state?.keyReady ? 'Not connected' : sourceNames[source];
  $('#billing').textContent = source === 'personal'&&!state?.keyReady ? 'An API key is required to generate photos here' : source === 'manual' ? 'No API key needed · Generate and download in ChatGPT or Gemini' : `${source === 'company' ? 'Company' : 'Your API account'} billing · Cost estimate unavailable`;
  if (f.gender === 'mixed' && Number(f.count) % 2 === 1) $('#summary').textContent += ' (one extra female image)';
}
function render() {
  const unavailable=state.storage?.apiGenerationAvailable===false;
  if(unavailable){source='manual';localStorage.setItem('source','manual');}
  $('#storage-notice').hidden=!unavailable;
  $('#storage-notice').textContent=unavailable?state.storage.message:'';
  const apiMethod=document.querySelector('[data-method="personal"]');
  apiMethod.disabled=unavailable;
  apiMethod.title=unavailable?'Requires durable storage and a job queue on this deployment.':'';
  const manual=source==='manual';
  $('#api-results').hidden=manual;
  $('#manual-workflow').hidden=!manual;
  document.querySelector('.workspace').classList.toggle('manual-only',manual);
  document.body.classList.toggle('manual-mode',manual);
  $('#workflow-footer').textContent=manual?'Copy your prompt. Create in your preferred AI app.':'API results and progress are saved automatically.';
  updateSummary();
  const rows = currentRows(), done = rows.filter(r => r.active).length;
  const active = rows.filter(r => ['queued','running'].includes(r.status)), failed = rows.filter(r => r.status === 'failed');
  $('#result-count').textContent = rows.length ? `${done} / ${rows.length}` : '';
  $('#history').textContent = showHistory ? 'Current batch' : 'History';
  $('#history').hidden = !state.rows.some(r => isRealRow(r) && !state.latestBatch?.ids.includes(r.id)) && !showHistory;
  $('#download-all').hidden = done === 0;
  $('#result-subtitle').textContent = showHistory ? 'Your previous photos are saved and ready to download.' : rows.length ? `${state.latestBatch.requirement.slice(0,40)} · ${active.length ? 'Generating. Photos will appear as they finish.' : failed.length ? `${failed.length} failed. Retry individual images.` : source === 'manual' && !done ? 'Generate in ChatGPT or Gemini, then upload the photos here.' : 'Click a photo to preview it, then download your favorites.'}` : source==='manual'?'Copy the prompt on the left and paste it into ChatGPT or Gemini.':'Your generated photos will appear here.';
  $('#chatgpt-actions').hidden=source!=='manual';
  $('#progress').hidden = active.length === 0;
  $('#progress').innerHTML = active.length ? `<div class="progress-panel"><div><span>Completed ${done} / ${rows.length} · ${rows.filter(r=>r.status==='running').length} generating</span><button id="stop">Stop queued tasks</button></div><div class="progress-track"><span style="width:${Math.round(done/rows.length*100)}%"></span></div></div>` : '';
  $('#images').innerHTML = !rows.length ? `<div class="empty"><div class="empty-art" aria-hidden="true"><div class="paper"></div><div class="paper front">▧</div><span class="spark">✦</span></div><h3>${source==='manual'?'Create photos in ChatGPT or Gemini.':state.keyReady||source==='company'?'Ready to generate your photos.':'Connect an image service to generate photos.'}</h3><p>${source==='manual'?'1. Copy the prompt and paste it into ChatGPT or Gemini.<br>2. Generate and download your photos.<br>3. Return here and upload each photo.':state.keyReady||source==='company'?'Enter a request, choose your options, and generate.':'No API key is configured. Connect one to generate photos here.'}</p>${source==='manual'?'<a class="download connect-empty" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">Open ChatGPT ↗</a><a class="download connect-empty" href="https://gemini.google.com/" target="_blank" rel="noopener noreferrer">Open Gemini ↗</a>':state.keyReady||source==='company'?'':'<button class="download connect-empty" id="connect-empty">Connect OpenAI API →</button>'}<span class="mini">${source==='manual'?'Uses the image features and limits of your account. You open your AI app and paste the prompt yourself.':state.keyReady||source==='company'?'Each image is generated separately and saved automatically.':'Previous demo images are excluded from photo results.'}</span></div>` : `<div class="grid">${rows.map((row,i) => {
    const version = row.versions.find(v => v.id === row.active), waiting = ['running','queued'].includes(row.status);
    return `<article class="image-card">${version ? `<img style="aspect-ratio:${row.width}/${row.height}" src="${imageURL(row)}" alt="${esc(displayScene(row.scene))}" data-preview="${esc(row.id)}">` : `<div style="aspect-ratio:${row.width}/${row.height}" class="skeleton ${row.status==='failed'?'failed':''}">${row.status==='failed'?'Failed':row.status==='running'?'✦ Generating…':row.status==='queued'?'Queued': 'Upload your photo'}</div>`}<div class="image-body"><h3>${String(i+1).padStart(2,'0')} · ${esc(displayScene(row.scene))}</h3>${version ? `<p>${version.source==='mock'?'◈ Demo only, not AI-generated':version.source==='manual'?'Uploaded':'AI-generated'}${row.versions.length>1?' · '+row.versions.length+' versions saved':''}</p>` : ''}${row.error ? `<p class="failure">${esc(uiError(row.error))}</p>` : ''}${row.versions.length>1?`<select data-version="${esc(row.id)}" aria-label="${esc(row.id)} image version">${row.versions.map((v,j)=>`<option value="${v.id}" ${v.id===row.active?'selected':''}>Version ${j+1}${v.source==='mock'?' · Demo':''}</option>`).join('')}</select>`:''}<div class="image-buttons">${version?`<a href="${imageURL(row)}&download=1">↓ Download</a>`:''}${row.source==='manual'?`<button data-copy="${esc(row.id)}">Copy prompt</button><button data-upload="${esc(row.id)}">Upload photo</button>`:`<button data-regenerate="${esc(row.id)}" ${waiting?'disabled':''}>${row.status==='failed'?'Retry':'Regenerate'}</button>`}</div></div></article>`;
  }).join('')}</div>`;
}
async function refresh() { const next = await api('state'); if (JSON.stringify(next) !== JSON.stringify(state)) { state = next; render(); } }
function connectionSettings() {
  if(state.storage?.apiGenerationAvailable===false){modal(`<h2>ChatGPT / Gemini</h2><p>${esc(state.storage.message)}</p><div class="buttons"><button data-close>Close</button></div>`);return;}
  modal(`<h2>Generation method</h2><p>Use ChatGPT or Gemini without an API key: copy the prompt, then generate and download photos in your preferred AI app.</p><form id="connection-form">${[['manual','ChatGPT / Gemini','No API key. Paste the prompt into your chosen AI app.'],['personal','Personal OpenAI API','Billed to your API account'],...(state.companyReady?[['company','Company API',state.account?`Signed in as ${state.account}`:'Sign in to use company billing']]:[])].map(([id,label,desc])=>`<label class="source-option"><input type="radio" name="source" value="${id}" ${source===id?'checked':''}><span>${esc(label)}<br><small>${esc(desc)}</small></span></label>`).join('')}<div id="key-section" ${source==='personal'?'':'hidden'}><h3>OpenAI API Key</h3><p>${state.keyReady?'A key is configured. Leave blank to keep it.':'Not configured. Keys are kept in server memory only.'} ChatGPT subscriptions do not include API credits.</p><input name="key" type="password" autocomplete="off" placeholder="Enter API key" aria-label="OpenAI API Key">${state.keyReady?'<button type="button" id="delete-key">Delete saved key</button>':''}</div><div id="company-section" ${source==='company'&&!state.account?'':'hidden'}><h3>Company account</h3><input name="username" autocomplete="username" placeholder="Company account" aria-label="Company account"><input name="password" type="password" autocomplete="current-password" placeholder="Password" aria-label="Company password"></div><p id="connection-error" class="error" role="alert"></p><div class="buttons"><button type="button" data-close>Cancel</button><button class="primary">Save</button></div></form><p><a href="/advanced.html">Advanced settings</a><small> · Asset list, import / export, and admin settings</small></p>`);
}
function paymentDescription(count) { return `<p>${count} images · ${sourceNames[source]}<br>Billed to: ${source==='company'?'Company':'Your API account'}<br>Estimated cost: unavailable. Billed by actual API usage.</p>`; }
async function startBatch(payload) {
  if (submitting) return;
  if(source==='personal'&&!state.keyReady){connectionSettings();return;}
  submitting = true; $('#form-error').textContent = ''; updateSummary();
  // Keep the same id for a retry after an uncertain network response.
  const serialized = JSON.stringify(payload);
  let pending; try { pending = JSON.parse(sessionStorage.getItem('pending-batch')); } catch {}
  if (!pending || pending.payload !== serialized) pending = {payload:serialized,requestId:crypto.randomUUID()};
  sessionStorage.setItem('pending-batch',JSON.stringify(pending));
  try {
    await api('batch',{...payload,requestId:pending.requestId});
    sessionStorage.removeItem('pending-batch');
    state = await api('state'); showHistory = false; render();
    toast(source==='manual'?'Upload slots are ready. Paste the prompt into ChatGPT or Gemini to generate your photos.':'Photo generation started.');
  } catch (error) { $('#form-error').textContent = uiError(error.message); }
  finally { submitting = false; updateSummary(); }
}
async function copyForChatGPT(payload) {
  let text;try{text=buildChatGPTPrompt(payload);}catch(e){$('#form-error').textContent=uiError(e.message);return;}
  let copied=false;
  try{await navigator.clipboard.writeText(text);copied=true;}catch{}
  if(copied)toast('Prompt copied! Paste it into ChatGPT or Gemini.');
  else modal(`<h2>Image generation prompt</h2><p>If clipboard access is blocked, select the text below and copy it manually.</p><textarea id="copy-text" readonly>${esc(text)}</textarea><div class="buttons"><button data-close>Close</button><button class="primary" id="copy-fallback">Copy prompt</button></div>`);
}
$('#create-form').addEventListener('submit', e => {
  e.preventDefault(); if (submitting) return;
  if(source==='personal'&&!state.keyReady){connectionSettings();return;}
  if(source==='company'&&(!state.companyReady||!state.account)){connectionSettings();return;}
  const payload = {...inputValues(),source};
  const ageMin=Number(payload.ageMin),ageMax=Number(payload.ageMax);
  if(ageMin>ageMax){$('#form-error').textContent='Minimum age cannot exceed maximum age.';return;}
  if (['personal','company'].includes(source)) {
    modal(`<h2>Generate ${esc(payload.count)} photos?</h2>${paymentDescription(payload.count)}<div class="buttons"><button data-close>Cancel</button><button class="primary" id="confirm-batch">Generate</button></div>`);
    $('#confirm-batch').onclick = () => { $('#modal').close(); startBatch(payload); };
  } else if(source==='manual') copyForChatGPT(payload); else startBatch(payload);
});
$('#create-form').addEventListener('input', () => { localStorage.setItem('simple-draft',JSON.stringify(inputValues())); $('#form-error').textContent=''; updateSummary(); });
$('#connections').onclick = connectionSettings;
$('#history').onclick = () => { showHistory = !showHistory; render(); };
$('#download-all').onclick = () => downloadAll().catch(e => toast(uiError(e.message)));
document.addEventListener('click', async e => {
  const button=e.target.closest('button'), preview=e.target.closest('[data-preview]');
  if(preview){const row=state.rows.find(r=>r.id===preview.dataset.preview);modal(`<h2>${esc(displayScene(row.scene))}</h2><img style="aspect-ratio:${row.width}/${row.height}" src="${imageURL(row)}" alt="${esc(displayScene(row.scene))}"><p>${row.versions.find(v=>v.id===row.active)?.source==='mock'?'Demo image, not an AI-generated photo.':''}</p><div class="buttons"><button data-close>Close</button></div>`);return;}
  if(!button)return;
  try {
    if(button.id==='background-toggle'){closeSelectMenus();const open=$('#background-menu').hidden;$('#background-menu').hidden=!open;button.setAttribute('aria-expanded',String(open));}
    if(button.dataset.backgroundExpand){const panel=$('#bg-'+button.dataset.backgroundExpand),open=panel.hidden;panel.hidden=!open;button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',(open?'Collapse ':'Expand ')+button.parentElement.querySelector('label').textContent.trim());}
    if(button.id==='clear-backgrounds'){selectedBackgrounds.clear();updateBackgroundPicker();localStorage.setItem('simple-draft',JSON.stringify(inputValues()));updateSummary();}
    if(button.id==='close-backgrounds'){closeBackgroundPicker();$('#background-toggle').focus();}
    if(button.dataset.method){source=button.dataset.method;localStorage.setItem('source',source);render();if(source==='personal'&&!state.keyReady)connectionSettings();}
    if(button.id==='method-settings')connectionSettings();
    if(button.hasAttribute('data-close'))$('#modal').close();
    if(button.dataset.example){$('#requirement').value=button.dataset.example;$('#requirement').dispatchEvent(new Event('input',{bubbles:true}));$('#requirement').focus();}
    if(button.id==='copy-again')copyForChatGPT({...inputValues(),source:'manual'});
    if(button.id==='copy-fallback') {await navigator.clipboard.writeText($('#copy-text').value);toast('Copied. Paste it into ChatGPT or Gemini.');}
    if(button.id==='connect-empty')connectionSettings();
    if(button.id==='stop'){await api('stop',{});await refresh();toast('Queued tasks stopped. Images already generating will finish.');}
    if(button.id==='delete-key'){await api('key',{});state=await api('state');source='personal';localStorage.setItem('source',source);render();connectionSettings();toast('API key deleted. API generation is paused.');}
    if(button.dataset.copy){const row=state.rows.find(r=>r.id===button.dataset.copy);await navigator.clipboard.writeText(row.prompt);toast('Image prompt copied.');}
    if(button.dataset.upload)upload(button.dataset.upload);
    if(button.dataset.regenerate){
      const row=state.rows.find(r=>r.id===button.dataset.regenerate), selectedSource=row.source==='manual'?'mock':row.source||source;
      const run=async()=>{button.disabled=true;try{await api('generate',{ids:[row.id],source:selectedSource,requestId:crypto.randomUUID()});await refresh();}catch(e){button.disabled=false;toast(uiError(e.message));}};
      if(['personal','company'].includes(selectedSource)) {modal(`<h2>Generate another photo?</h2><p>Source: ${sourceNames[selectedSource]} · Billed to: ${selectedSource==='company'?'Company':'Your API account'}<br>Cost estimate unavailable. Your original photo will be kept.</p><div class="buttons"><button data-close>Cancel</button><button class="primary" id="confirm-regenerate">Generate</button></div>`);$('#confirm-regenerate').onclick=()=>{$('#modal').close();run();};}else await run();
    }
  }catch(error){toast(uiError(error.message));}
});
document.addEventListener('change',async e=>{
  const t=e.target;
  if(t.dataset.backgroundLeaf||t.dataset.backgroundGroup){const ids=t.dataset.backgroundGroup?backgroundLeaves(t.dataset.backgroundGroup):[t.dataset.backgroundLeaf];ids.forEach(id=>t.checked?selectedBackgrounds.add(id):selectedBackgrounds.delete(id));updateBackgroundPicker();localStorage.setItem('simple-draft',JSON.stringify(inputValues()));updateSummary();}
  if(t.name==='source'){$('#key-section').hidden=t.value!=='personal';$('#company-section').hidden=t.value!=='company'||!!state.account;}
  if(t.dataset.version){try{await api('version',{id:t.dataset.version,version:t.value});await refresh();}catch(e){toast(uiError(e.message));}}
});
document.addEventListener('submit',async e=>{
  if(e.target.id!=='connection-form')return;e.preventDefault();const button=e.target.querySelector('button.primary');button.disabled=true;
  try{const values=Object.fromEntries(new FormData(e.target));
    if(values.source==='personal'){if(values.key.trim())await api('key',{key:values.key.trim()});else if(!state.keyReady)throw Error('Enter an API key to generate photos.');}
    if(values.source==='company'&&!state.account)await api('login',{username:values.username,password:values.password});
    source=values.source;localStorage.setItem('source',source);state=await api('state');$('#modal').close();showHistory=false;render();toast('Generation method saved.');
  }catch(error){$('#connection-error').textContent=uiError(error.message);}finally{button.disabled=false;}
});
async function upload(id){const input=document.createElement('input');input.type='file';input.accept='image/png,image/jpeg,image/webp';input.onchange=async()=>{try{const file=input.files[0];if(!file)return;if(file.size>10e6)throw Error('Images must be 10 MB or smaller.');const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});await api('upload',{id,image:data});await refresh();toast('Photo saved.');}catch(e){toast(uiError(e.message));}};input.click();}

function download(content,name,type='application/json'){const a=document.createElement('a');a.href=URL.createObjectURL(content instanceof Blob?content:new Blob([content],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function csv(rows){const fields=['id','category','scene','purpose','prompt','width','height','status'];return '\uFEFF'+[fields,...rows.map(r=>fields.map(f=>r[f]??''))].map(row=>row.map(x=>'"'+String(x).replace(/^[=+@-]/,m=>"'"+m).replaceAll('"','""')+'"').join(',')).join('\r\n')}

function zip(files){const enc=new TextEncoder(),parts=[],central=[];let offset=0;const u16=(v,n)=>v.setUint16(n[0],n[1],true),u32=(v,o,n)=>v.setUint32(o,n>>>0,true);for(const f of files){let name=enc.encode(f.name),bytes=f.bytes,crc=0xffffffff;for(let b of bytes){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}crc=(crc^0xffffffff)>>>0;const h=new Uint8Array(30+name.length),d=new DataView(h.buffer);u32(d,0,0x04034b50);u16(d,[4,20]);u16(d,[6,0x800]);u32(d,14,crc);u32(d,18,bytes.length);u32(d,22,bytes.length);u16(d,[26,name.length]);h.set(name,30);parts.push(h,bytes);const c=new Uint8Array(46+name.length),v=new DataView(c.buffer);u32(v,0,0x02014b50);u16(v,[4,20]);u16(v,[6,20]);u16(v,[8,0x800]);u32(v,16,crc);u32(v,20,bytes.length);u32(v,24,bytes.length);u16(v,[28,name.length]);u32(v,42,offset);c.set(name,46);central.push(c);offset+=h.length+bytes.length}const size=central.reduce((a,c)=>a+c.length,0),end=new Uint8Array(22),v=new DataView(end.buffer);u32(v,0,0x06054b50);u16(v,[8,files.length]);u16(v,[10,files.length]);u32(v,12,size);u32(v,16,offset);return new Blob([...parts,...central,end],{type:'application/zip'})}
async function downloadAll(){const rows=currentRows().filter(r=>r.active);if(!rows.length)return;$('#download-all').disabled=true;toast('Preparing your download…');try{const files=[];for(const row of rows){const version=row.versions.find(v=>v.id===row.active),response=await fetch(imageURL(row));if(!response.ok)throw Error('Download failed. Please try again.');files.push({name:`${row.id}_${version.source}_v${row.versions.indexOf(version)+1}.${version.ext}`,bytes:new Uint8Array(await response.arrayBuffer())});}const enc=new TextEncoder();files.push({name:'manifest.json',bytes:enc.encode(JSON.stringify({request:state.latestBatch,rows},null,2))},{name:'manifest.csv',bytes:enc.encode(csv(rows))});download(zip(files),'sample-images.zip');toast(`${rows.length} photos packed and ready.`);}finally{$('#download-all').disabled=false;}}
try{
  state=await api('state');
  if(localStorage.getItem('chatgpt-copy-flow')!=='1'){source='manual';localStorage.setItem('chatgpt-copy-flow','1');localStorage.setItem('source',source);}
  if(!Object.hasOwn(sourceNames,source)||source==='company'&&!state.companyReady){source='manual';localStorage.setItem('source',source);}
  let draft;try{draft=JSON.parse(localStorage.getItem('simple-draft'));}catch{}
  draft=draft||state.latestBatch;
  if(draft){for(const [name,value]of Object.entries(draft)){const elements=$('#create-form').elements.namedItem(name);if(elements&&typeof value!=='object')elements.value=String(value);}}
  try{selectedBackgrounds=new Set(normalizeBackgrounds(draft?.regionalBackgrounds));}catch{selectedBackgrounds.clear();}
  drawBackgroundTree();
  ['aspect-ratio','clothing-style','season'].forEach(id=>enhanceSelect($('#'+id)));
  render();setInterval(async()=>{try{if(!$('#modal').open&&!submitting)await refresh();}catch{}},1500);
}catch(e){$('#form-error').textContent='Cannot connect. Please check that the server is running.';}
