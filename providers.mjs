export const compilePrompt=(row,settings)=>row.prompt+'\n'+(settings.constraints||'')+'\nGenerate one standalone image. No collage.';
const safeXML=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function mock(r){
  const full=r.scene.includes('全身'),face=r.scene.includes('臉部'),woman=r.scene.includes('女性'),scenic=r.scene.includes('有場景');
  const shade=[...r.id].reduce((n,c)=>n+c.charCodeAt(0),0)%4;
  const background=['#e2ede8','#ede7db','#e7e4ef','#e6ebd9'][shade],shirt=['#718f83','#9a8874','#8a81a0','#82916d'][shade];
  const [cx,cy,radius]=full?[400,136,48]:face?[400,282,142]:[400,200,88];
  const figure=full?`<rect x="329" y="209" width="142" height="171" rx="32" fill="${shirt}"/><path d="M349 370L342 509M451 370L458 509" stroke="#536259" stroke-width="40" stroke-linecap="round"/><path d="M336 237L302 351M464 237L498 351" stroke="${shirt}" stroke-width="29" stroke-linecap="round"/>`:`<path d="M${face?135:210} 600Q${face?157:219} ${face?437:333} 400 ${face?442:329}Q${face?643:581} ${face?437:333} ${face?665:590} 600" fill="${shirt}"/>`;
  const hair=woman?`<ellipse cx="${cx}" cy="${cy}" rx="${radius*1.16}" ry="${radius*1.35}" fill="#51423c"/>`:'';
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${r.width}" height="${r.height}" viewBox="0 0 800 600"><rect width="800" height="600" fill="${background}"/>${scenic?'<path d="M0 360L150 210 330 380 610 185 800 345V600H0Z" fill="#bdcdbb"/><circle cx="650" cy="118" r="42" fill="#e9dba9"/><rect y="467" width="800" height="133" fill="#a7bda1"/>':''}${figure}${hair}<circle cx="${cx}" cy="${cy}" r="${radius}" fill="#d3b49e"/><path d="M${cx-radius} ${cy}Q${cx-radius*1.3} ${cy-radius*1.55} ${cx} ${cy-radius*1.3}Q${cx+radius*1.3} ${cy-radius*1.55} ${cx+radius} ${cy}L${cx+radius*.7} ${cy-radius*.6}Q${cx} ${cy-radius*.1} ${cx-radius*.7} ${cy-radius*.6}Z" fill="#51423c"/><text x="32" y="44" font-family="sans-serif" font-size="18" fill="#506454">SIMULATION / ${r.id}</text><text x="32" y="572" font-family="sans-serif" font-size="17" fill="#506454">${safeXML(r.category.slice(0,45))} · Placeholder only</text></svg>`);
}

export const providers={
  mock:{async generate({row}){await new Promise(a=>setTimeout(a,1000));if(row.simulateFailure)throw Error('模擬失敗：用於驗證失敗重試，不涉及 API 或費用。');return {bytes:mock(row),ext:'svg'}}},
  personal:{async generate({row,settings,key,fetcher=fetch}){
    if(!key)throw Error('個人 Key 已過期或已刪除，請重新設定。');
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),180000);
    try{const payload={model:process.env.OPENAI_IMAGE_MODEL||'gpt-image-2',prompt:compilePrompt(row,settings),n:1,size:`${row.width}x${row.height}`,output_format:'png'};
    let endpoint='https://api.openai.com/v1/images/generations',body=JSON.stringify(payload),headers={Authorization:`Bearer ${key}`,'Content-Type':'application/json'};
    if(settings.reference){const match=/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(settings.reference);if(!match)throw Error('參考圖片格式無效');const form=new FormData();for(const [name,value]of Object.entries(payload))form.append(name,String(value));form.append('image',new Blob([Buffer.from(match[2],'base64')],{type:`image/${match[1]}`}),`reference.${match[1]}`);endpoint='https://api.openai.com/v1/images/edits';body=form;headers={Authorization:`Bearer ${key}`};}
    const response=await fetcher(endpoint,{method:'POST',headers,body,signal:controller.signal});
    if(!response.ok)throw Error(`OpenAI 回應 ${response.status}；請檢查額度、模型與尺寸，未自動重試。`);
    const result=await response.json();if(!result.data?.[0]?.b64_json)throw Error('API 未回傳可用圖片');return {bytes:Buffer.from(result.data[0].b64_json,'base64'),ext:'png'};
    }catch(e){if(e.name==='AbortError')throw Error('API 請求逾時；可能已計費，請先檢查供應商紀錄再重試。');if(e instanceof TypeError)throw Error('API 連線失敗；請檢查網路，確認帳務後再重試。');throw e}finally{clearTimeout(timer)}
  }}
};
providers.company=providers.personal;
