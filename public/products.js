// Shared by copied prompts and API planning so product options reach both paths.
export const productTypes = {
  request:{label:'Follow request',description:'the product described in the request',worn:'where the product is naturally worn, carried, or used'},
  shoes:{label:'Shoes',description:'a pair of shoes',worn:'feet and lower legs only, showing the shoes being worn'},
  bags:{label:'Bags',description:'a bag, such as a handbag, tote, backpack, or crossbody bag',worn:'the torso to the hips, showing the bag carried by hand or on the shoulder; the face may be cropped out'},
  jewelry:{label:'Jewelry',description:'a piece of jewelry, such as a necklace, earrings, ring, or bracelet',worn:'a close-up of the neck, ear, hand, or wrist wearing the jewelry'},
  watches:{label:'Watches',description:'a wristwatch',worn:'a close-up of the wrist and hand wearing the watch'},
  eyewear:{label:'Eyewear',description:'a pair of glasses or sunglasses',worn:'the face and head, showing the eyewear being worn'},
  hats:{label:'Hats',description:'a hat or cap',worn:'the head and shoulders, showing the hat being worn'}
};
export const presentations = {
  packshot:{label:'Product only',instruction:'Product-only studio shot. The product is the only subject, centered with a little space around it. No people, hands, or mannequins.'},
  flatlay:{label:'Flat lay',instruction:'Flat lay photographed from directly above. The product lies flat and neatly arranged on the surface. No people.'},
  worn:{label:'Worn by a model',instruction:'Worn or carried by one adult model. Keep the product as the clear focus and in sharp detail.'}
};
export const angles = {
  front:{label:'Front',instruction:'front view'},
  side:{label:'Side',instruction:'side profile view'},
  threequarter:{label:'3/4 view',instruction:'three-quarter view at about 45 degrees'},
  top:{label:'Top-down',instruction:'top-down view'}
};
export function resolveProduct(input,index=0) {
  const type=input.productType||'request',presentation=input.presentation||'packshot',angle=input.angle||'threequarter';
  if(type!=='random'&&!Object.hasOwn(productTypes,type))throw Error('Choose a valid product type.');
  if(!Object.hasOwn(presentations,presentation))throw Error('Choose a valid product presentation.');
  if(angle!=='random'&&!Object.hasOwn(angles,angle))throw Error('Choose a valid camera angle.');
  // Spread random choices across the batch, so one random choice is not reused for every image.
  const typeKey=type==='random'?['shoes','bags','jewelry','watches','eyewear','hats'][index%6]:type;
  // A flat lay is always shot from above; the angle choice only applies to the other presentations.
  const angleKey=presentation==='flatlay'?'top':angle==='random'?['threequarter','front','side','top'][index%4]:angle;
  const product=productTypes[typeKey],worn=presentation==='worn';
  return {productType:typeKey,presentation,angle:angleKey,worn,
    label:[type==='request'?'':product.label,presentations[presentation].label,presentation==='flatlay'?'':angles[angleKey].label].filter(Boolean).join(' · '),
    instruction:`Product: ${product.description}. ${presentations[presentation].instruction}${worn?` Framing: ${product.worn}.`:''} Camera angle: ${angles[angleKey].instruction}. Show accurate materials, stitching, and texture. No visible brands, logos, or text on the product.`};
}
