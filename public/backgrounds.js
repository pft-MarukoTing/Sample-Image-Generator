export const backgroundTree=[
  {id:'western',label:'Western',children:[{id:'europe',label:'European'},{id:'north-america',label:'North American'}]},
  {id:'latin-america',label:'Latin American',children:[{id:'mexico',label:'Mexican'},{id:'brazil',label:'Brazilian'},{id:'argentina',label:'Argentinian'},{id:'colombia',label:'Colombian'}]},
  {id:'asia',label:'Asian',children:[
    {id:'east-asia',label:'East Asian',children:[{id:'japan',label:'Japanese'},{id:'korea',label:'Korean'},{id:'taiwan',label:'Taiwanese'},{id:'china',label:'Chinese'}]},
    {id:'southeast-asia',label:'Southeast Asian',children:[{id:'vietnam',label:'Vietnamese'},{id:'thailand',label:'Thai'},{id:'indonesia',label:'Indonesian'},{id:'philippines',label:'Filipino'},{id:'malaysia',label:'Malaysian'},{id:'singapore',label:'Singaporean'}]},
    {id:'south-asia',label:'South Asian',children:[{id:'india',label:'Indian'},{id:'pakistan',label:'Pakistani'},{id:'bangladesh',label:'Bangladeshi'}]}
  ]},
  {id:'africa',label:'African',children:[{id:'north-africa',label:'North African'},{id:'subsaharan-africa',label:'Sub-Saharan African'}]},
  {id:'middle-east',label:'Middle Eastern',children:[{id:'levant',label:'Levantine'},{id:'arabian',label:'Arabian'},{id:'iran',label:'Iranian'}]}
];
const nodes=new Map();function register(list){for(const n of list){nodes.set(n.id,n);if(n.children)register(n.children);}}register(backgroundTree);
export function backgroundLeaves(id){const node=nodes.get(id);if(!node)throw Error('Choose a valid regional background.');return node.children?node.children.flatMap(n=>backgroundLeaves(n.id)):[node.id];}
export function normalizeBackgrounds(selected=[]){if(!Array.isArray(selected)||selected.length>50)throw Error('Choose valid regional backgrounds.');const chosen=new Set(selected.flatMap(backgroundLeaves));return [...nodes.keys()].filter(id=>!nodes.get(id).children&&chosen.has(id));}
export function backgroundSummary(selected=[]){const chosen=new Set(normalizeBackgrounds(selected));if(!chosen.size)return 'Any ethnicity';const labels=[];function visit(node){const ids=backgroundLeaves(node.id);if(ids.every(id=>chosen.has(id)))labels.push(node.label);else if(node.children)node.children.forEach(visit);}backgroundTree.forEach(visit);return labels.join(', ');}
function distributeBackgrounds(selected){
  const chosen=new Set(normalizeBackgrounds(selected));
  function weave(queues){const result=[];for(let i=0;queues.some(q=>q.length>i);i++)for(const q of queues)if(i<q.length)result.push(q[i]);return result;}
  function collect(node){return node.children?weave(node.children.map(collect)):chosen.has(node.id)?[node.id]:[];}
  return weave(backgroundTree.map(collect));
}
export function resolveBackground(input,index=0){const pool=distributeBackgrounds(input.regionalBackgrounds);if(!pool.length)return {id:null,label:'Any ethnicity',instruction:'Use naturally varied regional and cultural backgrounds without a fixed nationality requirement.'};const id=pool[index%pool.length],label=nodes.get(id).label;return {id,label,instruction:`A person of ${label.replace(/ background$/,'')} background. Represent natural individual diversity; do not assume one fixed appearance, skin tone, or facial feature from a country or region. Do not add national flags, costumes, or stereotyped props unless the request explicitly asks for them.`};}
