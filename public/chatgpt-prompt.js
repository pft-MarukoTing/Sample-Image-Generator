import {resolveStudioBackground} from './studio-background.js';
import {normalizeBackgrounds,resolveBackground} from './backgrounds.js';
import {resolveRatio} from './ratios.js';
import {resolveWardrobe} from './wardrobe.js';
import {resolveProduct} from './products.js';
import {resolvePeopleCount,resolvePeople} from './group.js';
export function buildChatGPTPrompt(f) {
  const count=Number(f.count),min=Number(f.ageMin),max=Number(f.ageMax),requirement=String(f.requirement||'').trim();
  if(!requirement)throw Error('Enter a request or a name first.');
  if(!Number.isInteger(count)||count<1||count>100)throw Error('Enter an image count from 1 to 100.');
  if(f.subject==='products')return buildProductPrompt(f,count,requirement);
  if(!Number.isInteger(min)||!Number.isInteger(max)||min<0||max>100||min>max)throw Error('Enter a valid age range.');
  const people=resolvePeopleCount(f),group=people>1;
  const framing=group?{face:`a close-up group shot of ${people} people, with every person's full face and hair outline in frame`,half:`a half-body group shot of ${people} people, each from the top of the head to the waist`,full:`a full-body group shot of ${people} people, each from head to feet, without cropping any limbs`}[f.framing]:{face:'a face close-up, keeping the entire head and hair outline in frame',half:'a half-body portrait, from the top of the head to the waist',full:'a full-body portrait, from head to feet, without cropping any limbs'}[f.framing];
  const background=resolveStudioBackground(f).instruction;
  if(!framing||!background||!['female','male','mixed'].includes(f.gender))throw Error('Choose a background, gender, and framing.');
  resolveWardrobe(f);
  resolveRatio(f);
  normalizeBackgrounds(f.regionalBackgrounds);
  const person=p=>`${p.gender==='female'?'Female':'Male'}, age ${p.age}`;
  const details=Array.from({length:count},(_,i)=>{const list=resolvePeople(f,i);return group?`${String(i+1).padStart(3,'0')}: ${people} people. ${list.map((p,j)=>`Person ${j+1}: ${person(p)}. Ethnicity / regional origin: ${p.background.instruction}`).join(' ')} Aspect ratio: ${resolveRatio(f,i).ratio}. Clothing: ${resolveWardrobe(f,i).instruction} Keep one consistent style across the group, with different garments for each person.`:`${String(i+1).padStart(3,'0')}: ${person(list[0])}. Aspect ratio: ${resolveRatio(f,i).ratio}. Ethnicity / regional origin: ${list[0].background.instruction} Clothing: ${resolveWardrobe(f,i).instruction}`;}).join('\n');
  const feature={'hair bang':'a hairstyle with clearly visible bangs',volume:'naturally voluminous hair',wavy:'hair with clearly visible waves'}[requirement.toLowerCase()];
  return `Use image generation to create ${count} photorealistic photographs based on the request below. Generate actual images, not just text or prompts.\n\nRequest / subject:\n${requirement}${feature?'\nSubject detail: '+feature:''}\n\nRequirements for every image:\n- Photorealistic portrait photography with natural skin texture and lighting. No illustrations, cartoons, vector avatars, or placeholders.\n- Background: ${background}.\n- Framing: ${framing}.\n- Clothing: follow the outfit and season specified for each image below. Do not change the requested crop or background to show clothing.\n- Ethnicity / regional origin: distribute the selected ethnic or regional origins across the image list below. Region and nationality are not fixed physical appearances; preserve individual diversity.\n- Age range: ${min}–${max} years.\n- Use the aspect ratio specified for each image below. ${group?`Each image contains exactly ${people} people, every face clearly visible and unobstructed, with no bystanders.`:'Each image contains one person.'} Do not combine different ratios into a collage.\n- No text, logos, or watermarks. No collages, contact sheets, or multiple photos combined into one image.\n- Vary appearance, hair color, and pose naturally while respecting all requirements.\n\nIndividual image list (${count} total):\n${details}\n\nGenerate each image separately and label its number outside the image. If you cannot finish the entire batch in one turn, generate what you can, tell me the last completed number, and wait for me to say "continue". Do not substitute a collage for individual photos.`;
}
function buildProductPrompt(f,count,requirement) {
  const background=resolveStudioBackground(f).instruction,worn=f.presentation==='worn';
  resolveProduct(f);
  resolveRatio(f);
  if(worn&&!['female','male','mixed'].includes(f.gender))throw Error('Choose the model gender.');
  if(worn)normalizeBackgrounds(f.regionalBackgrounds);
  const details=Array.from({length:count},(_,i)=>`${String(i+1).padStart(3,'0')}: ${resolveProduct(f,i).instruction} Aspect ratio: ${resolveRatio(f,i).ratio}.${worn?` Model: ${f.gender==='male'?'Male':f.gender==='female'?'Female':i%2===0?'Female':'Male'} adult. Ethnicity / regional origin: ${resolveBackground(f,i).instruction}`:''}`).join('\n');
  return `Use image generation to create ${count} photorealistic product photographs based on the request below. Generate actual images, not just text or prompts.\n\nRequest / product:\n${requirement}\n\nRequirements for every image:\n- Photorealistic commercial product photography with accurate materials, soft even lighting, and sharp focus on the product. No illustrations, 3D renders, or placeholders.\n- Background: ${background}.\n- Follow the product type, presentation, and camera angle specified for each image below.\n${worn?'- Each image contains one adult model. Crop to where the product is worn; the product stays the clear focus.\n':'- Each image contains a single product (a pair of shoes counts as one). No people.\n'}- Use the aspect ratio specified for each image below. Do not combine different ratios into a collage.\n- No text, logos, brand names, or watermarks. No collages, contact sheets, or multiple photos combined into one image.\n- Vary style, color, and material naturally while respecting all requirements.\n\nIndividual image list (${count} total):\n${details}\n\nGenerate each image separately and label its number outside the image. If you cannot finish the entire batch in one turn, generate what you can, tell me the last completed number, and wait for me to say "continue". Do not substitute a collage for individual photos.`;
}
