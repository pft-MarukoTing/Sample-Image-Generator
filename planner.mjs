import {normalizeBackgrounds,resolveBackground} from './public/backgrounds.js';
import {resolveRatio} from './public/ratios.js';
import {resolveWardrobe} from './public/wardrobe.js';
// Deterministic prompt expansion: no planning model, API call, or extra fee.
export function planBatch(input, prefix) {
  const requirement = typeof input.requirement === 'string' ? input.requirement.trim() : '';
  const count = Number(input.count), ageMin = Number(input.ageMin), ageMax = Number(input.ageMax);
  if (!requirement || requirement.length > 6000) throw Error('請輸入需求或名字，最多 6000 字。');
  if (!Number.isInteger(count) || count < 1 || count > 100) throw Error('張數請填 1–100 張。');
  if (!Number.isInteger(ageMin) || !Number.isInteger(ageMax) || ageMin < 0 || ageMax > 100 || ageMin > ageMax) throw Error('請填有效的年齡區間（0–100 歲，最小年齡不大於最大年齡）。');
  if (!['clean', 'scene'].includes(input.background) || !['female', 'male', 'mixed'].includes(input.gender) || !['face', 'half', 'full'].includes(input.framing)) throw Error('請選擇背景、性別與取景。');
  resolveWardrobe(input);
  resolveRatio(input);
  const regionalBackgrounds=normalizeBackgrounds(input.regionalBackgrounds);
  const terms = { 'hair bang': '頭髮具有清楚可見的瀏海', 'volume': '頭髮具有明顯自然蓬鬆感', 'wavy': '頭髮具有清楚可見的波浪捲度' };
  const frame = {face:'臉部特寫，完整保留頭髮與頭部輪廓', half:'半身人像，從頭頂拍到腰部', full:'全身人像，從頭頂到腳底完整入鏡，不裁切四肢'}[input.framing];
  const background = input.background === 'clean' ? '乾淨、單色、無雜物的棚拍背景，不含場景、道具或文字' : '具有真實生活場景的背景，依主題選擇室內或戶外，背景清楚可辨識';
  const config = { requirement, count, ageMin, ageMax, background:input.background, gender:input.gender, framing:input.framing,clothingStyle:input.clothingStyle||'request',season:input.season||'any',aspectRatio:input.aspectRatio||'4:3',regionalBackgrounds };
  const rows = Array.from({length:count}, (_, i) => {
    const gender = input.gender === 'mixed' ? (i % 2 === 0 ? '女性' : '男性') : input.gender === 'female' ? '女性' : '男性';
    const age = ageMin + i % (ageMax - ageMin + 1);
    const wardrobe=resolveWardrobe(input,i);
    const ratio=resolveRatio(input,i);
    const personBackground=resolveBackground(input,i);
    return {id:`${prefix}-${String(i+1).padStart(3,'0')}`,category:requirement.slice(0,60),scene:`${gender} · ${age} 歲 · ${frame.split('，')[0]} · ${input.background==='clean'?'乾淨背景':'有場景'}${wardrobe.label?' · '+wardrobe.label:''} · ${ratio.ratio}${personBackground.id?' · '+personBackground.label:''}`,regionalBackground:personBackground.id,clothingStyle:wardrobe.clothingStyle,season:wardrobe.season,purpose:'素材生成',prompt:[`請根據以下主題或需求生成一張寫實單人照片：\n${requirement}`, terms[requirement.toLowerCase()] || '', `人物：${gender}，年齡 ${age} 歲（限定 ${ageMin}–${ageMax} 歲）。`, `取景：${frame}。`, `背景：${background}。`, `Regional background: ${personBackground.instruction}`, `Clothing: ${wardrobe.instruction}`, `Aspect ratio: ${ratio.ratio}. Output size: ${ratio.width} × ${ratio.height} pixels.`, `這是第 ${i+1} / ${count} 張，人物外觀、髮色與姿態可自然變化，保持上述條件。`, '每張獨立輸出。不要文字、標誌、浮水印或拼貼；只有一個人。'].filter(Boolean).join('\n'),aspectRatio:ratio.ratio,width:ratio.width,height:ratio.height,status:'draft',versions:[],keep:true};
  });
  return {config, rows};
}
