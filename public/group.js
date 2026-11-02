import {resolveBackground} from './backgrounds.js';
// Shared by copied prompts and API planning so every person in a photo gets the same assignment in both paths.
export function resolvePeopleCount(input) {
  const count=Number(input.peopleCount||1);
  if(!Number.isInteger(count)||count<1||count>4)throw Error('Choose 1 to 4 people per photo.');
  return count;
}
export function resolvePeople(input,index=0) {
  const count=resolvePeopleCount(input),min=Number(input.ageMin),max=Number(input.ageMax);
  // A 50/50 split alternates between photos for one person, and mixes genders within a photo for groups.
  return Array.from({length:count},(_,j)=>{const k=index*count+j;return {gender:input.gender==='mixed'?((index+j)%2===0?'female':'male'):input.gender,age:min+k%(max-min+1),background:resolveBackground(input,k)};});
}
