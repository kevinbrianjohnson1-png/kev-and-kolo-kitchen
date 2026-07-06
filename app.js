const state = { meal:null, protein:null, ingredients:new Set(), tags:new Set() };
const cap = s => s ? s.split(' ').map(w => w.charAt(0).toUpperCase()+w.slice(1)).join(' ') : '';
const $ = id => document.getElementById(id);
async function loadJson(path){ const base = location.hostname.includes('github.io') ? '/kev-and-kolo-kitchen/' : './'; const r = await fetch(base + path.replace(/^\.?\//,'')); if(!r.ok) throw new Error(base + path); return r.json(); }
let cookbooks=[], recipes=[], ingredients=[], tags=[], recipeIngredients=[], recipeTags=[], synonyms=[];
let ingredientById={}, tagById={}, cookbookById={};
const mealTags = ['breakfast','lunch','dinner','snack','dessert'];
const proteinTags = ['beef','chicken','pork','fish','salmon','prawns','lamb','eggs','bacon','vegetarian'];
const cuisineTags = ['italian','indian','thai','chinese','mexican','french','british','mediterranean','asian'];
const moodTags = ['spicy','quick','comfort','comfort food','curry','fakeaway','one-pot','fresh','stew','soup','pasta','rice','noodles','salad'];
function chip(container, label, onClick){ const b=document.createElement('button'); b.className='chip'; b.textContent=cap(label); b.onclick=()=>{ onClick(label,b); search(); }; container.appendChild(b); }
function toggleSet(set,label,el){ set.has(label) ? set.delete(label) : set.add(label); el.classList.toggle('active'); }
function idsForRecipe(list, recipeId, key){ return list.filter(x=>x.recipe_id===recipeId).map(x=>x[key]); }
function recipeIngNames(r){ return idsForRecipe(recipeIngredients,r.id,'ingredient_id').map(id=>ingredientById[id]?.name).filter(Boolean); }
function recipeTagNames(r){ return idsForRecipe(recipeTags,r.id,'tag_id').map(id=>tagById[id]?.name).filter(Boolean); }
function recipeProfile(r){
  const ing = recipeIngNames(r); const tg = recipeTagNames(r);
  const all = [r.title, r.description, r.meal_type, r.primary_protein, r.cuisine, r.spice_level, ...ing, ...tg].filter(Boolean).join(' ').toLowerCase();
  const meal = r.meal_type || mealTags.find(x=>tg.includes(x)) || '';
  const protein = r.primary_protein || proteinTags.find(x=>tg.includes(x)||ing.includes(x)) || '';
  const cuisine = r.cuisine || cuisineTags.find(x=>tg.includes(x)) || '';
  return { ing, tg, all, meal, protein, cuisine };
}
function normaliseQuery(text){
  let q = text.toLowerCase();
  for(const s of synonyms){
    const terms = [s.term, ...(s.synonyms||[])].filter(Boolean);
    for(const term of terms){ if(q.includes(term.toLowerCase())) q += ' ' + s.maps_to; }
  }
  return q;
}
function queryParts(){
  const q = normaliseQuery($('query').value || '');
  const tokens = q.split(/[^a-z0-9]+/).filter(x=>x.length>2);
  const excludes = [];
  const notMatch = q.match(/(?:not|no|without|don't fancy|dont fancy)\s+([a-z ]{3,30})/g) || [];
  for(const phrase of notMatch){ excludes.push(...phrase.replace(/(?:not|no|without|don't fancy|dont fancy)/,'').trim().split(/\s+/).filter(x=>x.length>2)); }
  return { q, tokens, excludes };
}
function hardFilter(r,p,qp){
  if(state.meal && p.meal !== state.meal) return false;
  if(state.protein && p.protein !== state.protein) return false;
  for(const ex of qp.excludes){ if(p.all.includes(ex)) return false; }
  return true;
}
function scoreRecipe(r,p,qp){
  let score=0, why=[];
  if(state.meal){ score+=40; why.push('Meal: '+cap(state.meal)); }
  if(state.protein){ score+=60; why.push('Protein: '+cap(state.protein)); }
  for(const i of state.ingredients){ if(p.ing.includes(i) || p.all.includes(i)){ score+=28; why.push('Has '+i); } }
  for(const t of state.tags){ if(p.tg.includes(t) || p.all.includes(t)){ score+=24; why.push(cap(t)); } }
  for(const tok of qp.tokens){ if(p.all.includes(tok)){ score+=9; why.push('Matches "'+tok+'"'); } }
  if(!state.meal&&!state.protein&&!state.ingredients.size&&!state.tags.size&&!qp.tokens.length) score=1;
  return { score, why:[...new Set(why)] };
}
function search(){
  const qp=queryParts(); const results=[];
  for(const r of recipes){
    const p=recipeProfile(r); if(!hardFilter(r,p,qp)) continue;
    const s=scoreRecipe(r,p,qp); if(s.score>0) results.push({r,p,score:s.score,why:s.why});
  }
  results.sort((a,b)=>b.score-a.score||a.r.title.localeCompare(b.r.title)); render(results.slice(0,60));
}
function render(results){
  $('summary').textContent = `${results.length} result${results.length===1?'':'s'} shown`;
  const box=$('results'); box.innerHTML='';
  if(!results.length){ box.innerHTML='<div class="empty">No matches. Try removing one filter or asking more broadly.</div>'; return; }
  for(const x of results){
    const cb=cookbookById[x.r.cookbook_id];
    const d=document.createElement('div'); d.className='result';
    const badges=[x.p.meal,x.p.protein,x.p.cuisine,x.r.spice_level,...x.p.tg.slice(0,6)].filter(Boolean);
    d.innerHTML=`<h3>${x.r.title}</h3>
      <div class="meta">${cb ? cb.title + (cb.subtitle ? ': '+cb.subtitle : '') : 'Cookbook'} · ${x.r.display_reference}</div>
      <div class="score">Match score: ${x.score}</div>
      <div class="why">${x.why.length ? 'Why: '+x.why.join(', ') : 'General browsing result'}</div>
      <div class="tags">${[...new Set(badges)].map(t=>`<span class="tag">${cap(t)}</span>`).join('')}</div>`;
    box.appendChild(d);
  }
}
async function init(){
  [cookbooks,recipes,ingredients,tags,recipeIngredients,recipeTags,synonyms] = await Promise.all([
    loadJson('data/cookbooks.json'), loadJson('data/recipes.json'), loadJson('data/ingredients.json'), loadJson('data/tags.json'), loadJson('data/recipe_ingredients.json'), loadJson('data/recipe_tags.json'), loadJson('data/synonyms.json')
  ]);
  ingredientById=Object.fromEntries(ingredients.map(i=>[i.id,i])); tagById=Object.fromEntries(tags.map(t=>[t.id,t])); cookbookById=Object.fromEntries(cookbooks.map(c=>[c.id,c]));
  mealTags.forEach(m=>chip($('mealChips'),m,(l,e)=>{state.meal=state.meal===l?null:l; [...$('mealChips').children].forEach(x=>x.classList.remove('active')); if(state.meal)e.classList.add('active');}));
  proteinTags.filter(p=>recipes.some(r=>recipeProfile(r).protein===p)).forEach(p=>chip($('proteinChips'),p,(l,e)=>{state.protein=state.protein===l?null:l; [...$('proteinChips').children].forEach(x=>x.classList.remove('active')); if(state.protein)e.classList.add('active');}));
  ingredients.filter(i=>['vegetable','carb','dairy','herb_spice_aromatic','unknown'].includes(i.category)).slice(0,54).forEach(i=>chip($('ingredientChips'),i.name,(l,e)=>toggleSet(state.ingredients,l,e)));
  [...new Set([...moodTags, ...cuisineTags])].forEach(t=>chip($('tagChips'),t,(l,e)=>toggleSet(state.tags,l,e)));
  $('find').onclick=search; $('clear').onclick=()=>location.reload(); $('query').addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)) search();}); search();
}
init().catch(err=>{ $('results').innerHTML='<div class="empty">Could not load data. If opening locally, use a simple local server or GitHub Pages later.</div>'; console.error(err); });
