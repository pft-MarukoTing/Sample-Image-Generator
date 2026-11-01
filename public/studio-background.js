// Shared by copied prompts and API planning so the selected tone reaches both.
export function resolveStudioBackground(input) {
  if(input.background==='scene')return {label:'In a setting',instruction:'a natural indoor or outdoor setting with a clearly recognizable background'};
  if(input.background!=='clean')throw Error('Choose a valid background.');
  const tone=input.backgroundTone||'light';
  if(!['light','dark'].includes(tone))throw Error('Choose a light or dark clean background.');
  return {tone,label: tone==='dark'?'Dark clean background':'Light clean background',instruction: tone==='dark'?'a clean, plain dark studio backdrop in charcoal or deep gray, without clutter, scenery, props, text, or gradients. Keep the subject naturally lit with clear separation from the dark backdrop':'a clean, plain light studio backdrop in white, ivory, or pale gray, without clutter, scenery, props, text, or gradients. Keep the subject naturally lit'};
}
