export const backgroundTree=[
  {id:'western',label:'Western',children:[{id:'europe',label:'European background'},{id:'north-america',label:'North American background'}]},
  {id:'latin-america',label:'Latin American',children:[{id:'mexico',label:'Mexican background'},{id:'brazil',label:'Brazilian background'},{id:'argentina',label:'Argentinian background'},{id:'colombia',label:'Colombian background'}]},
  {id:'asia',label:'Asian',children:[
    {id:'east-asia',label:'East Asian',children:[{id:'japan',label:'Japanese background'},{id:'korea',label:'Korean background'},{id:'taiwan',label:'Taiwanese background'},{id:'china',label:'Chinese background'}]},
    {id:'southeast-asia',label:'Southeast Asian',children:[{id:'vietnam',label:'Vietnamese background'},{id:'thailand',label:'Thai background'},{id:'indonesia',label:'Indonesian background'},{id:'philippines',label:'Filipino background'},{id:'malaysia',label:'Malaysian background'},{id:'singapore',label:'Singaporean background'}]},
    {id:'south-asia',label:'South Asian',children:[{id:'india',label:'Indian background'},{id:'pakistan',label:'Pakistani background'},{id:'bangladesh',label:'Bangladeshi background'}]}
  ]},
  {id:'africa',label:'African',children:[{id:'north-africa',label:'North African background'},{id:'subsaharan-africa',label:'Sub-Saharan African background'}]},
  {id:'middle-east',label:'Middle Eastern',children:[{id:'levant',label:'Levantine background'},{id:'arabian',label:'Arabian background'},{id:'iran',label:'Iranian background'}]}
];
const nodes=new Map();function register(list){for(const n of list){nodes.set(n.id,n);if(n.children)register(n.children);}}register(backgroundTree);
export function backgroundLeaves(id){const node=nodes.get(id);if(!node)throw Error('Choose a valid regional background.');return node.children?node.children.flatMap(n=>backgroundLeaves(n.id)):[node.id];}
export function normalizeBackgrounds(selected=[]){if(!Array.isArray(selected)||selected.length>50)throw Error('Choose valid regional backgrounds.');const chosen=new Set(selected.flatMap(backgroundLeaves));return [...nodes.keys()].filter(id=>!nodes.get(id).children&&chosen.has(id));}
export function backgroundSummary(selected=[]){const chosen=new Set(normalizeBackgrounds(selected));if(!chosen.size)return 'Any background';const labels=[];function visit(node){const ids=backgroundLeaves(node.id);if(ids.every(id=>chosen.has(id)))labels.push(node.label);else if(node.children)node.children.forEach(visit);}backgroundTree.forEach(visit);return labels.join(', ');}
function distributeBackgrounds(selected){
  const chosen=new Set(normalizeBackgrounds(selected));
  function weave(queues){const result=[];for(let i=0;queues.some(q=>q.length>i);i++)for(const q of queues)if(i<q.length)result.push(q[i]);return result;}
  function collect(node){return node.children?weave(node.children.map(collect)):chosen.has(node.id)?[node.id]:[];}
  return weave(backgroundTree.map(collect));
}
export function resolveBackground(input,index=0){const pool=distributeBackgrounds(input.regionalBackgrounds);if(!pool.length)return {id:null,label:'Any background',instruction:'Use naturally varied regional and cultural backgrounds without a fixed nationality requirement.'};const id=pool[index%pool.length],label=nodes.get(id).label;return {id,label,instruction:`A person of ${label.replace(/ background$/,'')} background. Represent natural individual diversity; do not assume one fixed appearance, skin tone, or facial feature from a country or region. Do not add national flags, costumes, or stereotyped props unless the request explicitly asks for them.`};}
