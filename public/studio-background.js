// Shared by copied prompts and API planning so the selected tone reaches both.
export const backgroundSwatches = ['#F5F1E8','#F4C7C3','#C9DDF0','#B7C9B0','#E3D3BC','#F3E3A1','#D8CCE8','#2F3E4E'];
// Image models follow color names more reliably than hex codes, so prompts give both.
const colorNames = [
  ['#FFFFFF','pure white'],['#F5F1E8','warm off-white'],['#E5E5E5','light gray'],['#9E9E9E','medium gray'],['#4A4A4A','charcoal gray'],['#111111','black'],
  ['#F4C7C3','soft blush pink'],['#E8A0A8','dusty rose'],['#D94A4A','bright red'],['#8E2A2A','deep burgundy'],
  ['#F6B98A','soft peach'],['#E8833A','warm orange'],['#E3D3BC','oatmeal beige'],['#B8946A','camel tan'],['#6B4A33','chocolate brown'],
  ['#F3E3A1','pale butter yellow'],['#E8C547','mustard yellow'],
  ['#B7C9B0','sage green'],['#7FBF7F','fresh green'],['#3E6B48','forest green'],['#A8DCD1','mint'],['#2E8C8C','teal'],
  ['#C9DDF0','pale sky blue'],['#5B8FD1','medium blue'],['#2F3E4E','deep navy'],
  ['#D8CCE8','soft lavender'],['#8A6BBE','purple'],['#4B2E5E','deep plum']
];
const rgb = hex => [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
export function colorName(hex) {
  const [r,g,b]=rgb(hex);let best;
  for(const [value,name] of colorNames){const [r2,g2,b2]=rgb(value),d=(r-r2)**2+(g-g2)**2+(b-b2)**2;if(!best||d<best.d)best={d,name};}
  return best.name;
}
export function resolveStudioBackground(input) {
  if(input.background==='scene')return {label:'In a setting',instruction:'a natural indoor or outdoor setting with a clearly recognizable background'};
  if(input.background!=='clean')throw Error('Choose a valid background.');
  const tone=input.backgroundTone||'light';
  if(!['light','dark','custom'].includes(tone))throw Error('Choose a light, dark, or custom clean background.');
  if(tone==='custom'){
    const color=String(input.backgroundColor||'').toUpperCase();
    if(!/^#[0-9A-F]{6}$/.test(color))throw Error('Choose a valid background color.');
    const name=colorName(color);
    return {tone,color,label:`${name[0].toUpperCase()+name.slice(1)} background (${color})`,instruction:`a clean, plain solid backdrop in ${name} (hex ${color}), evenly colored without clutter, scenery, props, text, patterns, or gradients. Keep the subject naturally lit, and keep the backdrop as close to that color as possible`};
  }
  return {tone,label: tone==='dark'?'Dark clean background':'Light clean background',instruction: tone==='dark'?'a clean, plain dark studio backdrop in charcoal or deep gray, without clutter, scenery, props, text, or gradients. Keep the subject naturally lit with clear separation from the dark backdrop':'a clean, plain light studio backdrop in white, ivory, or pale gray, without clutter, scenery, props, text, or gradients. Keep the subject naturally lit'};
}
