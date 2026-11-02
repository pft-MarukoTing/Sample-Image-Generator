// AI apps that can generate images from a pasted prompt. Shown as shortcuts only; any other app works too.
export const aiApps = [
  {name:'ChatGPT',url:'https://chatgpt.com/'},
  {name:'Gemini',url:'https://gemini.google.com/'},
  {name:'Copilot',url:'https://copilot.microsoft.com/'},
  {name:'Grok',url:'https://grok.com/'},
  {name:'Meta AI',url:'https://www.meta.ai/'},
  {name:'Midjourney',url:'https://www.midjourney.com/imagine'},
  {name:'Adobe Firefly',url:'https://firefly.adobe.com/'},
  {name:'Ideogram',url:'https://ideogram.ai/'},
  {name:'Leonardo',url:'https://app.leonardo.ai/'}
];
export const aiAppLinks = (className='download') => aiApps.map(app=>`<a class="${className}" href="${app.url}" target="_blank" rel="noopener noreferrer">${app.name} ↗</a>`).join('');
