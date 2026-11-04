(() => {
  'use strict';
  function iniciar() {
    const root = document.getElementById('laboratorio');
    if (!root) return;
    const inputs = [...root.querySelectorAll('input')];
    const inicial = [4.1,4.5,5.2,7.3];
    const f = x => x.toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2});
    const svg = root.querySelector('svg');
    const paths = [...svg.querySelectorAll('path')].slice(1);
    const points = [...svg.querySelectorAll('circle')];
    const y = v => 300-(v-2)*38;
    function update() {
      const m = inputs.map(x => +x.value);
      inputs.forEach((x,i) => { x.nextElementSibling.value = f(m[i]); });
      paths.forEach((p,i) => p.setAttribute('d',`M145 ${y(m[2*i])} L460 ${y(m[2*i+1])}`));
      points.forEach((p,i) => {
        p.setAttribute('cy',y(m[i]));
        p.nextElementSibling.setAttribute('y',y(m[i])-13);
        p.nextElementSibling.textContent=f(m[i]);
      });
      const bajo=m[1]-m[0], alto=m[3]-m[2];
      document.getElementById('efectos').innerHTML = `Simples de fertilización: <strong>${f(bajo)}</strong> (bajo) y <strong>${f(alto)}</strong> (alto).<br>Simples de riego: <strong>${f(m[2]-m[0])}</strong> (sin) y <strong>${f(m[3]-m[1])}</strong> (con).<br>Principal de fertilización: <strong>${f((bajo+alto)/2)}</strong>.<br>Principal de riego: <strong>${f((m[2]+m[3]-m[0]-m[1])/2)}</strong>.<br>Interacción (alto − bajo): <strong>${f(alto-bajo)}</strong> t/ha.`;
    }
    inputs.forEach(x => {
      x.addEventListener('input',update);
      x.addEventListener('keydown',e => e.stopPropagation());
    });
    document.getElementById('restablecer').addEventListener('click',() => { inputs.forEach((x,i) => x.value=inicial[i]); update(); });
    update();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',iniciar); else iniciar();
})();
