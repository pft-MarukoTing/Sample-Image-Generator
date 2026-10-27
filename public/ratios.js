export const aspectRatios={
  '1:1':{label:'1:1 · Square',width:1024,height:1024},
  '4:3':{label:'4:3 · Landscape',width:1024,height:768},
  '3:4':{label:'3:4 · Portrait',width:768,height:1024},
  '16:9':{label:'16:9 · Widescreen',width:1536,height:864},
  '9:16':{label:'9:16 · Vertical',width:864,height:1536}
};
export function resolveRatio(input,index=0){
  const choice=input.aspectRatio||'4:3';
  if(choice!=='random'&&!Object.hasOwn(aspectRatios,choice))throw Error('Choose a valid aspect ratio.');
  let ratio=choice;
  if(choice==='random'){
    const pool=Object.keys(aspectRatios);
    // Seeded shuffle gives a varied batch while keeping copied prompts and saved rows consistent.
    let seed=2166136261;for(const c of String(input.requirement||''))seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0;
    for(let i=pool.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[pool[i],pool[j]]=[pool[j],pool[i]];}
    ratio=pool[index%pool.length];
  }
  return {ratio,...aspectRatios[ratio]};
}
