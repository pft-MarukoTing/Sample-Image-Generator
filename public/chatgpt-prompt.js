import {normalizeBackgrounds,resolveBackground} from './backgrounds.js';
import {resolveRatio} from './ratios.js';
import {resolveWardrobe} from './wardrobe.js';
export function buildChatGPTPrompt(f) {
  const count=Number(f.count),min=Number(f.ageMin),max=Number(f.ageMax),requirement=String(f.requirement||'').trim();
  if(!requirement)throw Error('Enter a request or a name first.');
  if(!Number.isInteger(count)||count<1||count>100)throw Error('Enter an image count from 1 to 100.');
  if(!Number.isInteger(min)||!Number.isInteger(max)||min<0||max>100||min>max)throw Error('Enter a valid age range.');
  const framing={face:'a face close-up, keeping the entire head and hair outline in frame',half:'a half-body portrait, from the top of the head to the waist',full:'a full-body portrait, from head to feet, without cropping any limbs'}[f.framing];
  const background={clean:'a clean, plain studio background, without clutter or scenery',scene:'a natural indoor or outdoor setting with a clearly recognizable background'}[f.background];
  if(!framing||!background||!['female','male','mixed'].includes(f.gender))throw Error('Choose a background, gender, and framing.');
  resolveWardrobe(f);
  resolveRatio(f);
  normalizeBackgrounds(f.regionalBackgrounds);
  const details=Array.from({length:count},(_,i)=>`${String(i+1).padStart(3,'0')}: ${f.gender==='male'?'Male':f.gender==='female'?'Female':i%2===0?'Female':'Male'}, age ${min+i%(max-min+1)}. Aspect ratio: ${resolveRatio(f,i).ratio}. Regional background: ${resolveBackground(f,i).instruction} Clothing: ${resolveWardrobe(f,i).instruction}`).join('\n');
  const feature={'hair bang':'a hairstyle with clearly visible bangs',volume:'naturally voluminous hair',wavy:'hair with clearly visible waves'}[requirement.toLowerCase()];
  return `Use image generation to create ${count} photorealistic photographs based on the request below. Generate actual images, not just text or prompts.\n\nRequest / subject:\n${requirement}${feature?'\nSubject detail: '+feature:''}\n\nRequirements for every image:\n- Photorealistic portrait photography with natural skin texture and lighting. No illustrations, cartoons, vector avatars, or placeholders.\n- Background: ${background}.\n- Framing: ${framing}.\n- Clothing: follow the outfit and season specified for each image below. Do not change the requested crop or background to show clothing.\n- Regional background: distribute the selected backgrounds across the image list below. Region and nationality are not fixed physical appearances; preserve individual diversity.\n- Age range: ${min}–${max} years.\n- Use the aspect ratio specified for each image below. Each image contains one person. Do not combine different ratios into a collage.\n- No text, logos, or watermarks. No collages, contact sheets, or multiple photos combined into one image.\n- Vary appearance, hair color, and pose naturally while respecting all requirements.\n\nIndividual image list (${count} total):\n${details}\n\nGenerate each image separately and label its number outside the image. If you cannot finish the entire batch in one turn, generate what you can, tell me the last completed number, and wait for me to say "continue". Do not substitute a collage for individual photos.`;
}
