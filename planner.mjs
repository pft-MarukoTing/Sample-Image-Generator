import {resolveStudioBackground} from './public/studio-background.js';
import {normalizeBackgrounds,resolveBackground} from './public/backgrounds.js';
import {resolveRatio} from './public/ratios.js';
import {resolveWardrobe} from './public/wardrobe.js';
import {resolveProduct} from './public/products.js';
// Deterministic prompt expansion: no planning model, API call, or extra fee.
export function planBatch(input, prefix) {
  const requirement = typeof input.requirement === 'string' ? input.requirement.trim() : '';
  const count = Number(input.count), ageMin = Number(input.ageMin), ageMax = Number(input.ageMax);
  if (!requirement || requirement.length > 6000) throw Error('請輸入需求或名字，最多 6000 字。');
  if (!Number.isInteger(count) || count < 1 || count > 100) throw Error('張數請填 1–100 張。');
  if (input.subject === 'products') return planProducts(input, prefix, requirement, count);
  if (input.subject && input.subject !== 'people') throw Error('Choose people or products.');
  if (!Number.isInteger(ageMin) || !Number.isInteger(ageMax) || ageMin < 0 || ageMax > 100 || ageMin > ageMax) throw Error('請填有效的年齡區間（0–100 歲，最小年齡不大於最大年齡）。');
  if (!['clean', 'scene'].includes(input.background) || !['female', 'male', 'mixed'].includes(input.gender) || !['face', 'half', 'full'].includes(input.framing)) throw Error('請選擇背景、性別與取景。');
  resolveWardrobe(input);
  resolveRatio(input);
  const regionalBackgrounds=normalizeBackgrounds(input.regionalBackgrounds);
  const terms = { 'hair bang': '頭髮具有清楚可見的瀏海', 'volume': '頭髮具有明顯自然蓬鬆感', 'wavy': '頭髮具有清楚可見的波浪捲度' };
  const frame = {face:'臉部特寫，完整保留頭髮與頭部輪廓', half:'半身人像，從頭頂拍到腰部', full:'全身人像，從頭頂到腳底完整入鏡，不裁切四肢'}[input.framing];
  const studioBackground=resolveStudioBackground(input);
  const background=studioBackground.instruction;
  const config = { subject:'people', requirement, count, ageMin, ageMax, background:input.background,backgroundTone:studioBackground.tone||'light',...(studioBackground.color?{backgroundColor:studioBackground.color}:{}), gender:input.gender, framing:input.framing,clothingStyle:input.clothingStyle||'request',season:input.season||'any',aspectRatio:input.aspectRatio||'1:1',regionalBackgrounds };
  const rows = Array.from({length:count}, (_, i) => {
    const gender = input.gender === 'mixed' ? (i % 2 === 0 ? '女性' : '男性') : input.gender === 'female' ? '女性' : '男性';
    const age = ageMin + i % (ageMax - ageMin + 1);
    const wardrobe=resolveWardrobe(input,i);
    const ratio=resolveRatio(input,i);
    const personBackground=resolveBackground(input,i);
    return {id:`${prefix}-${String(i+1).padStart(3,'0')}`,category:requirement.slice(0,60),scene:`${gender} · ${age} 歲 · ${frame.split('，')[0]} · ${studioBackground.label}${wardrobe.label?' · '+wardrobe.label:''} · ${ratio.ratio}${personBackground.id?' · '+personBackground.label:''}`,regionalBackground:personBackground.id,clothingStyle:wardrobe.clothingStyle,season:wardrobe.season,purpose:'素材生成',prompt:[`請根據以下主題或需求生成一張寫實單人照片：\n${requirement}`, terms[requirement.toLowerCase()] || '', `人物：${gender}，年齡 ${age} 歲（限定 ${ageMin}–${ageMax} 歲）。`, `取景：${frame}。`, `背景：${background}。`, `Ethnicity / regional origin: ${personBackground.instruction}`, `Clothing: ${wardrobe.instruction}`, `Aspect ratio: ${ratio.ratio}. Output size: ${ratio.width} × ${ratio.height} pixels.`, `這是第 ${i+1} / ${count} 張，人物外觀、髮色與姿態可自然變化，保持上述條件。`, '每張獨立輸出。不要文字、標誌、浮水印或拼貼；只有一個人。'].filter(Boolean).join('\n'),aspectRatio:ratio.ratio,width:ratio.width,height:ratio.height,status:'draft',versions:[],keep:true};
  });
  return {config, rows};
}
function planProducts(input, prefix, requirement, count) {
  if (!['clean', 'scene'].includes(input.background)) throw Error('Choose a background.');
  resolveProduct(input);
  resolveRatio(input);
  const worn = input.presentation === 'worn';
  if (worn && !['female', 'male', 'mixed'].includes(input.gender)) throw Error('Choose the model gender.');
  const regionalBackgrounds = worn ? normalizeBackgrounds(input.regionalBackgrounds) : [];
  const studioBackground = resolveStudioBackground(input);
  const config = { subject:'products', requirement, count, background:input.background, backgroundTone:studioBackground.tone||'light',...(studioBackground.color?{backgroundColor:studioBackground.color}:{}), productType:input.productType||'request', presentation:input.presentation||'packshot', angle:input.angle||'threequarter', aspectRatio:input.aspectRatio||'1:1', ...(worn ? {gender:input.gender, regionalBackgrounds} : {}) };
  const rows = Array.from({length:count}, (_, i) => {
    const product = resolveProduct(input, i), ratio = resolveRatio(input, i);
    const gender = worn ? (input.gender === 'mixed' ? (i % 2 === 0 ? '女性' : '男性') : input.gender === 'female' ? '女性' : '男性') : '';
    const model = worn ? resolveBackground(input, i) : {};
    return {id:`${prefix}-${String(i+1).padStart(3,'0')}`,category:requirement.slice(0,60),scene:`${product.label} · ${worn ? gender + ' · ' : ''}${studioBackground.label} · ${ratio.ratio}${model.id ? ' · ' + model.label : ''}`,subject:'products',productType:product.productType,presentation:product.presentation,angle:product.angle,regionalBackground:model.id,purpose:'素材生成',prompt:[`請根據以下主題或需求生成一張寫實商品照片：\n${requirement}`, product.instruction, worn ? `模特兒：${gender}，成年人。Ethnicity / regional origin: ${model.instruction}` : '', `背景：${studioBackground.instruction}。`, `Aspect ratio: ${ratio.ratio}. Output size: ${ratio.width} × ${ratio.height} pixels.`, `這是第 ${i+1} / ${count} 張，商品款式、顏色與材質可自然變化，保持上述條件。`, `每張獨立輸出。不要文字、標誌、浮水印或拼貼；${worn ? '只有一位模特兒。' : '畫面只有一件商品（成對的鞋子算一件）。'}`].filter(Boolean).join('\n'),aspectRatio:ratio.ratio,width:ratio.width,height:ratio.height,status:'draft',versions:[],keep:true};
  });
  return {config, rows};
}
