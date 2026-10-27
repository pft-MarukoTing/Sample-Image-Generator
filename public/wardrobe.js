export const clothingStyles = {
  request:{label:'Follow request',description:'Follow any clothing instructions in the request; otherwise choose simple, neutral clothing.'},
  formal:{label:'Formal',description:'Formal attire, such as a tailored suit, dress shirt, elegant dress, or equivalent formal clothing.'},
  smartcasual:{label:'Smart casual',description:'Polished but relaxed clothing, such as a blazer with chinos, a neat blouse, or a simple skirt.'},
  casual:{label:'Casual',description:'Relaxed everyday clothing, such as a plain T-shirt, jeans, or comfortable knitwear.'},
  sporty:{label:'Sporty',description:'Practical athletic clothing, such as a sports top, track pants, or a training jacket.'},
  streetwear:{label:'Streetwear',description:'Contemporary streetwear, such as relaxed layers, cargo pants, or an oversized jacket, without visible logos.'}
};
export const seasons = {
  any:{label:'Any season',description:'No specific seasonal clothing requirement.'},
  spring:{label:'Spring',description:'Spring-appropriate clothing with light layers and a lightweight jacket or cardigan.'},
  summer:{label:'Summer',description:'Summer-appropriate clothing with breathable, lightweight fabrics and minimal layers.'},
  autumn:{label:'Autumn',description:'Autumn-appropriate clothing with medium layers, knitwear, or a light coat.'},
  winter:{label:'Winter',description:'Winter-appropriate clothing with warm fabrics, layered knitwear, or a winter coat.'}
};
export function resolveWardrobe(input,index=0) {
  const style=input.clothingStyle||'request',season=input.season||'any';
  if(style!=='random'&&!Object.hasOwn(clothingStyles,style))throw Error('Choose a valid clothing style.');
  if(season!=='random'&&!Object.hasOwn(seasons,season))throw Error('Choose a valid season.');
  // Spread random choices across the batch, so one random choice is not reused for every image.
  const styleKey=style==='random'?['casual','formal','smartcasual','sporty','streetwear'][index%5]:style;
  const seasonKey=season==='random'?['summer','winter','spring','autumn'][index%4]:season;
  return {clothingStyle:styleKey,season:seasonKey,label:[style==='request'?'':clothingStyles[styleKey].label,season==='any'?'':seasons[seasonKey].label].filter(Boolean).join(' · '),
    instruction:`${clothingStyles[styleKey].description} ${seasons[seasonKey].description} Keep the chosen style suitable for the season and the person's age. No visible brands or logos. Clothing must not change the requested background or framing; show only what fits within the requested crop.`};
}
