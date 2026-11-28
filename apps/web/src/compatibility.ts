// Detect flex gap by layout: Safari 10 supports grid gap but not flex gap.
export function initializeCompatibility() {
  if(!('showModal' in document.createElement('dialog')))document.documentElement.classList.add('no-native-dialog');
  if(!window.CSS || !CSS.supports('height','100dvh')){
    document.documentElement.classList.add('no-dvh');
    const resize=()=>document.documentElement.style.setProperty('--viewport-height',`${window.innerHeight}px`);
    resize();window.addEventListener('resize',resize);window.addEventListener('orientationchange',resize);
  }
  const probe=document.createElement('div');
  probe.style.cssText='position:absolute;visibility:hidden;display:flex;flex-direction:column;row-gap:1px';
  for(let i=0;i<2;i++){const child=document.createElement('div');child.style.height='1px';probe.appendChild(child);}
  document.body.appendChild(probe);
  if(probe.scrollHeight!==3)document.documentElement.classList.add('no-flex-gap');
  document.body.removeChild(probe);
}

export function scrollCueIntoView(row: HTMLElement) {
  if('scrollBehavior' in document.documentElement.style){row.scrollIntoView({block:'nearest',behavior:'smooth'});return;}
  const container=row.closest('.table-scroll') as HTMLElement | null;
  if(!container)return;
  const viewport=container.getBoundingClientRect();const bounds=row.getBoundingClientRect();
  const header=container.querySelector('thead')?.getBoundingClientRect().height ?? 0;
  if(bounds.top<viewport.top+header)container.scrollTop-=viewport.top+header-bounds.top;
  else if(bounds.bottom>viewport.bottom)container.scrollTop+=bounds.bottom-viewport.bottom;
}
