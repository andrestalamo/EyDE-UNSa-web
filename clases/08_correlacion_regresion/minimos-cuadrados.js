/* Ocho parcelas históricas. Interacción enteramente local. */
(function(root){
 'use strict';
 const pairs=Object.freeze([[50,1130],[55,1135],[60,1160],[65,1208],[70,1211],[75,1200],[80,1356],[85,1497]].map(Object.freeze));
 function evaluate(intercept,slope){
  if(!Number.isFinite(intercept)||!Number.isFinite(slope))throw new TypeError('Coeficientes no finitos');
  const predicted=pairs.map(([x])=>intercept+slope*x);
  const residuals=pairs.map(([,y],i)=>y-predicted[i]);
  return {intercept,slope,predicted,residuals,sse:residuals.reduce((s,e)=>s+e*e,0)};
 }
 function fit(){
  const n=pairs.length,mx=pairs.reduce((s,p)=>s+p[0],0)/n,my=pairs.reduce((s,p)=>s+p[1],0)/n;
  const slope=pairs.reduce((s,[x,y])=>s+(x-mx)*(y-my),0)/pairs.reduce((s,[x])=>s+(x-mx)**2,0);
  return evaluate(my-slope*mx,slope);
 }
 const api={pairs,evaluate,fit};if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(!root.document)return;root.EydeOLS=api;
 const fmt=x=>x.toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2});
 function start(){
  const box=document.getElementById('h8-ols');if(!box)return;
  const intercept=document.getElementById('h8-intercept'),slope=document.getElementById('h8-slope'),button=document.getElementById('h8-ols-fit');
  // Preserve the full optimum, even though the displayed estimates are rounded.
  intercept.step=slope.step='any';
  function draw(isFit=false){
   const state=evaluate(Number(intercept.value),Number(slope.value));
   document.getElementById('h8-intercept-value').textContent=fmt(state.intercept);
   document.getElementById('h8-slope-value').textContent=fmt(state.slope);
   document.getElementById('h8-sse-value').textContent=fmt(state.sse);
   box.dataset.sse=String(state.sse);
   document.getElementById('h8-ols-status').textContent=isFit?
    'Ésta es la recta elegida por mínimos cuadrados: b₀ = 626,89 y b₁ = 9,04. El mínimo se calcula sin redondear los coeficientes.':
    'Recta candidata. Mové los controles y compará la suma de cuadrados; los residuos son observado − predicho.';
   const svg=document.getElementById('h8-ols-plot'),ns='http://www.w3.org/2000/svg';svg.replaceChildren();
   function el(tag,attrs,text,parent=svg){const e=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));if(text!==undefined)e.textContent=text;parent.append(e);return e;}
   const left=85,right=680,top=20,bottom=310;
   const x=v=>left+(v-45)/45*(right-left),y=v=>bottom-(v-900)/800*(bottom-top);
   const defs=el('defs',{}),clip=el('clipPath',{id:'h8-ols-clip'},undefined,defs);el('rect',{x:left,y:top,width:right-left,height:bottom-top},undefined,clip);
   el('rect',{x:left,y:top,width:right-left,height:bottom-top,fill:'white',stroke:'#66736d'});
   [45,50,60,70,75,80,90].forEach(v=>{el('line',{x1:x(v),x2:x(v),y1:top,y2:bottom,stroke:'#e4e6df'});el('text',{x:x(v),y:bottom+23,'text-anchor':'middle','font-size':17,fill:'#173c2b'},v);});
   [900,1100,1300,1500,1700].forEach(v=>{el('line',{x1:left,x2:right,y1:y(v),y2:y(v),stroke:'#e4e6df'});el('text',{x:left-8,y:y(v)+5,'text-anchor':'end','font-size':17,fill:'#173c2b'},v);});
   const layer=el('g',{'clip-path':'url(#h8-ols-clip)'});
   pairs.forEach(([px,py],i)=>el('line',{class:'h8-ols-residual',x1:x(px),x2:x(px),y1:y(py),y2:y(state.predicted[i]),stroke:'#8a5a3b','stroke-width':2},undefined,layer));
   el('line',{id:'h8-ols-line',x1:x(45),x2:x(90),y1:y(state.intercept+45*state.slope),y2:y(state.intercept+90*state.slope),stroke:'#173c2b','stroke-width':3},undefined,layer);
   pairs.forEach(([px,py])=>el('circle',{cx:x(px),cy:y(py),r:5,fill:'#2d6a4f'},undefined,layer));
   el('text',{x:(left+right)/2,y:359,'text-anchor':'middle','font-size':20,fill:'#173c2b'},'Dosis de fertilizante (L/parcela)');
   el('text',{transform:'translate(21 170) rotate(-90)','text-anchor':'middle','font-size':19,fill:'#173c2b'},'Rendimiento (kg/parcela)');
  }
  [intercept,slope].forEach(e=>e.addEventListener('input',()=>draw()));
  button.addEventListener('click',()=>{const best=fit();intercept.value=best.intercept;slope.value=best.slope;draw(true);});
  ['keydown','keyup','keypress'].forEach(type=>box.addEventListener(type,e=>{if(e.target.closest('input,button'))e.stopPropagation();}));draw();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(typeof window==='undefined'?globalThis:window);
