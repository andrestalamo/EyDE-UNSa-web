/* Simulador local, sin dependencias. Modelo normal de diferencia de medias.
   CDF: aproximación de erf, error absoluto < 1.5e-7. Cuantiles por bisección.
   Potencia bilateral calculada bajo una diferencia verdadera especificada. */
(function(){
'use strict';
function cdf(z){const s=z<0?-1:1,x=Math.abs(z)/Math.SQRT2,t=1/(1+0.3275911*x);const e=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x);return (1+s*e)/2;}
function quantile(p){let a=-9,b=9;for(let i=0;i<60;i++){const m=(a+b)/2;if(cdf(m)<p)a=m;else b=m;}return (a+b)/2;}
function model(n,effect,sigma,alpha){const se=sigma*Math.sqrt(2/n),critical=quantile(1-alpha/2)*se,beta=Math.max(0,Math.min(1,cdf((critical-effect)/se)-cdf((-critical-effect)/se)));return {n,effect,sigma,alpha,se,critical,beta,power:1-beta,pObserved:2*(1-cdf(.6/se))};}
window.EyDEPower={model,cdf,quantile};
function init(){const root=document.getElementById('potencia-sim');if(!root)return;const el=id=>document.getElementById(id),ns='http://www.w3.org/2000/svg',g=el('sim-drawing');
const fmt=(x,d=2)=>x.toLocaleString('es-AR',{minimumFractionDigits:d,maximumFractionDigits:d});
function node(tag,attrs,text){const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;g.appendChild(e);return e;}
function update(){const n=+el('sim-n').value,effect=+el('sim-efecto').value,sigma=+el('sim-sigma').value,alpha=[.01,.05,.10][+el('sim-alfa').value],m=model(n,effect,sigma,alpha);root.dataset.state=JSON.stringify(m);
for(const [id,v] of [['n',fmt(n,0)],['efecto',fmt(effect)],['sigma',fmt(sigma)],['alfa',fmt(alpha)]])el('val-'+id).textContent=v;
el('sim-alfa').setAttribute('aria-valuetext',fmt(alpha));
el('sim-se').textContent='Error estándar supuesto: '+fmt(m.se,3)+' t/ha';el('sim-beta').innerHTML=(effect===0?'Área de no rechazo: ':'\\(\\beta\\) = ')+fmt(m.beta,3);el('sim-power').innerHTML=(effect===0?'Bajo H₀: P(rechazar) = \\(\\alpha\\) = ':'Potencia = \\(1-\\beta\\) = ')+fmt(m.power,3);
el('sim-evidence').textContent='Ejemplo separado: diferencia observada fija = +0,60 t/ha. z = '+fmt(.6/m.se)+'; p bilateral '+(m.pObserved<.0001?'< 0,0001':'≈ '+fmt(m.pObserved,4))+'.';
g.replaceChildren();const left=70,right=1050,lo=-3.5,hi=4.5,X=x=>left+(x-lo)/(hi-lo)*(right-left),peak=1/(m.se*Math.sqrt(2*Math.PI)),height=83;
function density(x,mu){return Math.exp(-.5*((x-mu)/m.se)**2)/(m.se*Math.sqrt(2*Math.PI));}
function path(mu,a,b,baseline,fill){a=Math.max(a,lo);b=Math.min(b,hi);if(b<=a)return;const count=Math.max(12,Math.ceil((b-a)*180));let d=fill?'M '+X(a)+' '+baseline+' L ': 'M ';for(let j=0;j<=count;j++){const x=a+(b-a)*j/count,y=baseline-height*density(x,mu)/peak;d+=(j?' L ':'')+X(x)+' '+y;}if(fill)d+=' L '+X(b)+' '+baseline+' Z';node('path',{d,fill:fill||'none',stroke:fill?'none':'#173c2b','stroke-width':2.5,opacity:fill?.72:1});}
for(const [mu,y,label] of [[0,120,'H₀: diferencia verdadera = 0'],[effect,250,effect===0?'Mismo escenario: diferencia verdadera = 0':'Alternativa: diferencia verdadera = +'+fmt(effect)+' t/ha']]){
for(const [a,b] of [[lo,-m.critical],[m.critical,hi]])node('rect',{x:X(a),y:y-94,width:X(b)-X(a),height:94,fill:'#a33d2f',opacity:.045});
if(y===120){path(mu,lo,-m.critical,y,'#a33d2f');path(mu,m.critical,hi,y,'#a33d2f');}else{path(mu,-m.critical,m.critical,y,'#d7a928');path(mu,lo,-m.critical,y,'#2d6a4f');path(mu,m.critical,hi,y,'#2d6a4f');}
path(mu,lo,hi,y);node('line',{x1:left,x2:right,y1:y,y2:y,stroke:'#66736d','stroke-width':1});node('line',{x1:X(mu),x2:X(mu),y1:y-90,y2:y,stroke:'#173c2b','stroke-dasharray':'2 5'});node('text',{x:left,y:y-101,fill:'#173c2b','font-size':19,'font-family':'Aptos, Arial, sans-serif'},label);
}
for(const c of [-m.critical,m.critical])node('line',{x1:X(c),x2:X(c),y1:25,y2:251,stroke:'#a33d2f','stroke-width':1.7,'stroke-dasharray':'6 4'});
node('text',{x:right,y:19,'text-anchor':'end',fill:'#a33d2f','font-size':17},'Rechazo: fuera de ±'+fmt(m.critical,3)+' t/ha');
node('text',{x:right,y:149,'text-anchor':'end',fill:'#173c2b','font-size':17},effect===0?'Amarillo: no rechazo · verde: rechazo':'Amarillo: no rechazo · verde: potencia (ambas colas)');
for(let x=-3;x<=4;x++){node('line',{x1:X(x),x2:X(x),y1:250,y2:255,stroke:'#66736d'});node('text',{x:X(x),y:275,'text-anchor':'middle',fill:'#66736d','font-size':18},fmt(x,0));}
if(window.MathJax&&MathJax.Hub)MathJax.Hub.Queue(['Typeset',MathJax.Hub,el('sim-beta')],['Typeset',MathJax.Hub,el('sim-power')]);
node('text',{x:(left+right)/2,y:302,'text-anchor':'middle',fill:'#173c2b','font-size':19},'Diferencia de medias muestrales (fertilizante − habitual), t/ha');
}
root.querySelectorAll('input').forEach(input=>{input.addEventListener('input',update);input.addEventListener('keydown',e=>e.stopPropagation());});
el('sim-reset').addEventListener('click',()=>{el('sim-n').value=17;el('sim-efecto').value=.6;el('sim-sigma').value=1;el('sim-alfa').value=1;update();});update();
}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
