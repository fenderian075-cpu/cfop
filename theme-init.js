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
  const chromeColor=theme==='light'?'#f2f4f9':'#101014';
  document.querySelectorAll('meta[name="theme-color"]').forEach(meta=>meta.content=chromeColor);
  const statusBar=document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if(statusBar)statusBar.content=theme==='light'?'default':'black-translucent';
})();
