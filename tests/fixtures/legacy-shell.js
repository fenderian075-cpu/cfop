document.getElementById('installOld').onclick=async()=>{
  localStorage.setItem('cfop-prog','PT,OE1,F0');await caches.open('unrelated-test-app');
  await navigator.serviceWorker.register('./__old-sw.js',{scope:'./',updateViaCache:'none'});await navigator.serviceWorker.ready;
  document.getElementById('upgradeStatus').textContent='old-ready';
};
document.getElementById('installNew').onclick=async()=>{
  const registration=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
  const update=()=>{if(registration.waiting)document.getElementById('upgradeStatus').textContent='new-waiting';};
  update();registration.addEventListener('updatefound',()=>registration.installing?.addEventListener('statechange',update));
  registration.installing?.addEventListener('statechange',update);await registration.update();update();
};
