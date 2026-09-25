/* Actividad local EyDE 2026. Sin red, R, paquetes ni servicios externos. */
(function (root) {
  'use strict';
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  // Lanczos, g=7. Argumentos positivos en esta aplicación.
  function logGamma(z) {
    const c = [676.5203681218851,-1259.1392167224028,771.32342877765313,
      -176.61502916214059,12.507343278686905,-0.13857109526572012,
      9.9843695780195716e-6,1.5056327351493116e-7];
    if (z < .5) return Math.log(Math.PI)-Math.log(Math.sin(Math.PI*z))-logGamma(1-z);
    z -= 1;
    let x = .99999999999980993;
    c.forEach((v,i) => { x += v/(z+i+1); });
    const t = z+7.5;
    return .5*Math.log(2*Math.PI)+(z+.5)*Math.log(t)-t+Math.log(x);
  }
  function betaFraction(a,b,x) {
    const tiny = 1e-300, eps = 3e-14;
    const safe = v => Math.abs(v)<tiny ? (v<0 ? -tiny : tiny) : v;
    let c=1, d=1/safe(1-(a+b)*x/(a+1)), h=d;
    for(let m=1;m<=400;m++) {
      let aa=m*(b-m)*x/((a+2*m-1)*(a+2*m));
      d=1/safe(1+aa*d); c=safe(1+aa/c); h*=d*c;
      aa=-(a+m)*(a+b+m)*x/((a+2*m)*(a+2*m+1));
      d=1/safe(1+aa*d); c=safe(1+aa/c);
      const step=d*c; h*=step;
      if(Math.abs(step-1)<eps) return h;
    }
    throw new Error('No convergió la beta incompleta. Revisá los datos.');
  }
  function regularizedBeta(x,a,b) {
    if(x<=0) return 0;
    if(x>=1) return 1;
    const bt=Math.exp(logGamma(a+b)-logGamma(a)-logGamma(b)+a*Math.log(x)+b*Math.log1p(-x));
    return clamp(x<(a+1)/(a+b+2) ? bt*betaFraction(a,b,x)/a : 1-bt*betaFraction(b,a,1-x)/b,0,1);
  }
  function studentTwoSided(t,df) {
    if(!(df>0) || Number.isNaN(t)) return null;
    return regularizedBeta(df/(df+t*t),df/2,.5);
  }
  function studentRight(t,df) {
    const p=studentTwoSided(t,df);
    return p===null ? null : t>=0 ? p/2 : 1-p/2;
  }
  function analyze(pairs) {
    const n=pairs.length, out={n,r:null,t:null,delta:n>=3?n-2:null,p:null,ci:null,status:''};
    if(pairs.some(p=>p.length!==2 || p.some(v=>!Number.isFinite(v)))) {
      out.status='Hay valores no finitos.'; return out;
    }
    if(n<2) {out.status='Cargá al menos tres pares para la prueba; cuatro para el IC.';return out;}
    // Center before accumulating to avoid cancellation of raw sums.
    const mx=pairs.reduce((s,p)=>s+p[0],0)/n, my=pairs.reduce((s,p)=>s+p[1],0)/n;
    let xx=0,yy=0,xy=0;
    pairs.forEach(([x,y])=>{const dx=x-mx,dy=y-my;xx+=dx*dx;yy+=dy*dy;xy+=dx*dy;});
    if(!(xx>0 && yy>0)) {out.status='No se define r: alguna variable es constante.';return out;}
    out.r=clamp(xy/Math.sqrt(xx*yy),-1,1);
    if(!Number.isFinite(out.r)) {out.r=null;out.status='La escala excede la precisión numérica.';return out;}
    if(n<3) {out.status='Con dos pares r es descriptivo; no se calcula la prueba ni el IC.';return out;}
    const rem=(1-out.r)*(1+out.r);
    // Exact collinearity can leave a few ulps of rounding in r.
    if(rem<=4*Number.EPSILON) {
      out.r=Math.sign(out.r); out.t=Math.sign(out.r)*Infinity; out.p=out.r>0?0:1;
      out.status='Alineación perfecta: t tiende a ±∞; p derecho tiende a 0 si r = 1 y a 1 si r = −1. IC no disponible; revisá el registro.';
      return out;
    }
    out.t=out.r*Math.sqrt((n-2)/rem);out.p=studentRight(out.t,n-2);
    if(n>3) {
      const z=Math.atanh(out.r), half=1.959963984540054/Math.sqrt(n-3);
      out.ci=[Math.tanh(z-half),Math.tanh(z+half)];
    }
    out.status=n===3 ? 'La prueba tiene δ = 1; el IC requiere n > 3.' : 'Resultados actualizados. Inferencia condicionada por los supuestos y la selección de participantes.';
    return out;
  }
  function parseValue(s) {
    s=String(s).trim();
    if(!/^\d+(?:[.,]\d+)?$/.test(s)) return null;
    const v=Number(s.replace(',','.'));
    return Number.isFinite(v) && v>0 && v<=1e6 ? v : null;
  }
  const api={analyze,studentTwoSided,studentRight,regularizedBeta,parseValue};
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  if(!root.document) return;
  root.EydeCorrelation=api;
  const fmt=(v,d=3)=>v===null?'—':!Number.isFinite(v)?(v<0?'−∞':'+∞'):v.toLocaleString('es-AR',{minimumFractionDigits:d,maximumFractionDigits:d});
  function start() {
    const box=document.getElementById('h8-live'); if(!box) return;
    const tbody=document.getElementById('h8-rows'),form=document.getElementById('h8-add');
    const hi=document.getElementById('h8-height'),si=document.getElementById('h8-shoe');
    const message=document.getElementById('h8-input-status');
    const key='eyde2026-height-shoe-v1';let rows=[],nextId=1,inferenceShown=false;
    const inferButton=document.getElementById('h8-infer');
    try {
      const saved=JSON.parse(sessionStorage.getItem(key)||'[]');
      if(Array.isArray(saved)) rows=saved.filter(r=>r && typeof r.x==='string' && typeof r.y==='string').slice(0,500).map(r=>({id:nextId++,x:r.x,y:r.y}));
    } catch(_) { /* Optional storage may be disabled under file://. */ }
    // Keep Reveal shortcuts out of editing controls, including content loaded later.
    ['keydown','keyup','keypress'].forEach(event=>box.addEventListener(event,e=>{
      if(e.target.closest('input,button,form')) e.stopPropagation();
    }));
    function buildRows() {
      tbody.replaceChildren();
      rows.forEach((r,i)=>{
        const tr=document.createElement('tr'),th=document.createElement('th');
        th.scope='row';th.textContent=String(i+1);tr.append(th);
        ['x','y'].forEach(k=>{
          const td=document.createElement('td'),input=document.createElement('input');
          input.type='text';input.inputMode='decimal';input.value=r[k];
          input.setAttribute('aria-label',`${k==='x'?'Altura':'Talla'}, par ${i+1}`);
          input.addEventListener('input',()=>{r[k]=input.value;update();});td.append(input);tr.append(td);
        });
        const td=document.createElement('td'),button=document.createElement('button');
        button.type='button';button.textContent='×';button.setAttribute('aria-label',`Eliminar par ${i+1}`);
        button.addEventListener('click',()=>{rows=rows.filter(v=>v.id!==r.id);buildRows();update();hi.focus();});
        td.append(button);tr.append(td);tbody.append(tr);
      });
    }
    function update(keepInference=false) {
      if(!keepInference) inferenceShown=false;
      const pairs=[];let invalid=0;
      rows.forEach((r,i)=>{
        const x=parseValue(r.x),y=parseValue(r.y),ok=x!==null&&y!==null;
        tbody.children[i].classList.toggle('h8-invalid',!ok);
        tbody.children[i].querySelectorAll('input').forEach((el,j)=>el.setAttribute('aria-invalid',String((j?y:x)===null)));
        if(ok) pairs.push([x,y]); else invalid++;
      });
      let a;
      try {a=analyze(pairs);} catch(e) {a={n:pairs.length,r:null,t:null,delta:null,p:null,ci:null,status:e.message};}
      const values={n:a.n,r:fmt(a.r),t:fmt(a.t),delta:a.delta===null?'—':a.delta,
        p:a.p===null?'—':a.p<.0001?'< 0,0001':fmt(a.p,4),ci:a.ci?`[${fmt(a.ci[0])}; ${fmt(a.ci[1])}]`:'No disponible',
        status:(invalid?`${invalid} fila(s) incompleta(s) o inválida(s), excluida(s). `:'')+a.status};
      if(a.p===null || !Number.isFinite(a.t)) {
        values.decision='Sin decisión inferencial automática; revisá los datos y el aviso de la actividad.';
        values.conclusion='Todavía no corresponde formular una conclusión poblacional con estos resultados.';
      } else if(a.p<.05) {
        values.decision='Rechazamos H₀ (p < 0,05).';
        values.conclusion=`Con α = 0,05, los datos aportan evidencia de asociación lineal positiva entre altura y talla en la población de estudiantes de EyDE 2026, si se cumplen las condiciones de inferencia y representatividad.`;
      } else {
        values.decision='No rechazamos H₀ (p ≥ 0,05).';
        values.conclusion='Con α = 0,05, no hay evidencia suficiente para concluir que exista una asociación lineal positiva entre altura y talla en la población de estudiantes de EyDE 2026.';
      }
      values.sample=a.r===null ? 'No se puede describir r con estos datos.' :
        `En la muestra, la asociación fue ${a.r>0?'positiva':a.r<0?'negativa':'lineal nula'}, con r = ${fmt(a.r)}.`;
      values.reminder=a.p!==null && Number.isFinite(a.t) && a.p>=.05 ? '(Recordemos: no rechazar H₀ NO demuestra ausencia de asociación.)' : '';
      if(a.p!==null && Number.isFinite(a.t) && a.p>=.05 && a.r>0) values.sample=`Si bien en la muestra observamos una asociación positiva (r = ${fmt(a.r)}), la evidencia no alcanza para generalizar ese resultado a la población.`;
      values.uncertainty=a.ci ? `IC95% bilateral para ρ: [${fmt(a.ci[0])}; ${fmt(a.ci[1])}].${a.ci[0]<=0 && a.ci[1]>=0 ? " Incluye 0." : ""}` : 'El IC95% no está disponible con estos datos.';
      if(!inferenceShown) {
        values.reminder='';
        ['t','delta','p','ci'].forEach(k=>values[k]='—');
        values.decision='Pedí la inferencia después de completar o modificar los datos.';
        values.conclusion='La conclusión poblacional queda pendiente de la inferencia.';
        values.uncertainty='El IC95% se mostrará al pedir la inferencia.';
        values.status=(invalid?`${invalid} fila(s) inválida(s), excluida(s). `:'')+'Mientras cargamos, describimos n y r. Al terminar, presioná «Realizar inferencia».';
      }
      document.querySelectorAll('[data-inference]').forEach(el=>el.hidden=!inferenceShown);
      inferButton.setAttribute('aria-expanded',String(inferenceShown));
      inferButton.textContent=inferenceShown?'Inferencia realizada':'Realizar inferencia';
      inferButton.disabled=inferenceShown;
      document.querySelectorAll('[data-live]').forEach(el=>{el.textContent=values[el.dataset.live]??'—';});
      draw(pairs);
      try {sessionStorage.setItem(key,JSON.stringify(rows.map(({x,y})=>({x,y}))));} catch(_) {}
    }
    function draw(pairs) {
      const svg=document.getElementById('h8-scatter'),ns='http://www.w3.org/2000/svg';svg.replaceChildren();
      function add(tag,attrs,text) {const el=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));if(text!==undefined)el.textContent=text;svg.append(el);return el;}
      function extent(index,def) {if(!pairs.length)return def;const v=pairs.map(p=>p[index]);const lo=Math.min(...v),hi=Math.max(...v),pad=Math.max((hi-lo)*.12,index===0?2:1);return [Math.max(0,lo-pad),hi+pad];}
      const xr=extent(0,[140,200]),yr=extent(1,[30,48]),left=68,right=596,top=18,bottom=286;
      const x=v=>left+(v-xr[0])/(xr[1]-xr[0])*(right-left),y=v=>bottom-(v-yr[0])/(yr[1]-yr[0])*(bottom-top);
      add('rect',{x:left,y:top,width:right-left,height:bottom-top,fill:'#fff',stroke:'#66736d'});
      for(let i=0;i<=4;i++) {
        const vx=xr[0]+i*(xr[1]-xr[0])/4,vy=yr[0]+i*(yr[1]-yr[0])/4;
        add('line',{x1:x(vx),x2:x(vx),y1:top,y2:bottom,stroke:'#e4e6df'});
        add('line',{x1:left,x2:right,y1:y(vy),y2:y(vy),stroke:'#e4e6df'});
        add('text',{x:x(vx),y:bottom+22,'text-anchor':'middle','font-size':16,fill:'#173c2b'},fmt(vx,1));
        add('text',{x:left-10,y:y(vy)+5,'text-anchor':'end','font-size':16,fill:'#173c2b'},fmt(vy,1));
      }
      add('text',{x:(left+right)/2,y:335,'text-anchor':'middle','font-size':19,fill:'#173c2b'},'Altura (cm)');
      add('text',{transform:'translate(19 153) rotate(-90)','text-anchor':'middle','font-size':19,fill:'#173c2b'},'Talla de calzado');
      pairs.forEach(([px,py],i)=>{const c=add('circle',{cx:x(px),cy:y(py),r:5,fill:'#2d6a4f','fill-opacity':.75,stroke:'#173c2b'});const title=document.createElementNS(ns,'title');title.textContent=`Par ${i+1}: ${px} cm, talla ${py}`;c.append(title);});
      if(!pairs.length)add('text',{x:330,y:150,'text-anchor':'middle','font-size':20,fill:'#66736d'},'La nube aparecerá al cargar los pares');
    }
    form.addEventListener('submit',e=>{
      e.preventDefault();const x=parseValue(hi.value),y=parseValue(si.value);
      if(x===null||y===null){message.textContent='Usá dos números positivos; coma o punto decimal. Altura en cm.';return;}
      rows.push({id:nextId++,x:hi.value.trim(),y:si.value.trim()});buildRows();update();form.reset();hi.focus();
      const scroll=tbody.closest('.h8-live-table');scroll.scrollTop=scroll.scrollHeight;
      message.textContent=`Par agregado. ${rows.length} fila(s); podés corregirlas debajo.`;
    });
    inferButton.addEventListener('click',()=>{inferenceShown=true;update(true);if(root.Reveal)root.Reveal.layout();});
    ['keydown','keyup','keypress'].forEach(event=>inferButton.addEventListener(event,e=>e.stopPropagation()));
    buildRows();update();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(typeof window==='undefined'?globalThis:window);
