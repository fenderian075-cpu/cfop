/* Apply the saved or system theme before the page paints. */
(()=>{
  let theme='dark';
  try{
    const savedTheme=localStorage.getItem('cfop-theme');
    if(savedTheme==='light'||savedTheme==='dark')theme=savedTheme;
    else if(typeof window.matchMedia==='function'&&window.matchMedia('(prefers-color-scheme: light)').matches)theme='light';
  }catch(e){
    if(typeof window.matchMedia==='function'&&window.matchMedia('(prefers-color-scheme: light)').matches)theme='light';
  }
  document.documentElement.dataset.theme=theme;
  document.body.dataset.theme=theme;
  const standalone=(typeof navigator!=='undefined'&&navigator.standalone===true)||
    (typeof window.matchMedia==='function'&&window.matchMedia('(display-mode: standalone)').matches);
  document.documentElement.classList.toggle('standalone',standalone);
  document.body.classList.toggle('standalone',standalone);
  const chromeColor=theme==='light'?'#f2f4f9':'#101014';
  document.querySelectorAll('meta[name="theme-color"]').forEach(meta=>meta.content=chromeColor);
})();
