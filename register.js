/* Manual updates: a downloaded worker waits until the HOME button authorizes activation. */
(() => {
'use strict';
const button=document.getElementById('update-app'),message=document.getElementById('update-message'),offline=document.getElementById('offline-status');
let busy=false,restart=false;
const supported='serviceWorker' in navigator&&window.isSecureContext&&location.protocol!=='file:';
const say=t=>{message.textContent=t};
if(!supported){button.disabled=true;button.title='更新確認は公開したPWAで使用できます';offline.textContent='単独HTML版はこのファイルだけで利用できます。更新は新しいファイルを開いてください。';return}
const timeout=(promise,ms=30000)=>new Promise((resolve,reject)=>{const id=setTimeout(()=>reject(Error('更新の待機時間を超えました')),ms);promise.then(v=>{clearTimeout(id);resolve(v)},e=>{clearTimeout(id);reject(e)})});
function installed(worker){if(!worker||worker.state==='installed'||worker.state==='activated')return Promise.resolve();return timeout(new Promise((resolve,reject)=>{const change=()=>{if(worker.state==='installed'||worker.state==='activated'){worker.removeEventListener('statechange',change);resolve()}else if(worker.state==='redundant'){worker.removeEventListener('statechange',change);reject(Error('取得失敗'))}};worker.addEventListener('statechange',change);change()}))}
function send(worker,type){return timeout(new Promise((resolve,reject)=>{const channel=new MessageChannel();channel.port1.onmessage=e=>{channel.port1.close();e.data?.ok?resolve(e.data):reject(Error('キャッシュが不完全です'))};worker.postMessage({type},[channel.port2])}),10000)}
navigator.serviceWorker.addEventListener('controllerchange',()=>{if(restart){restart=false;location.reload()}});
// First installation is the sole automatic network setup; subsequent visits use the current worker.
navigator.serviceWorker.getRegistration('./').then(async reg=>{if(!reg){reg=await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});await navigator.serviceWorker.ready}offline.textContent='オフライン版を使用できます。最新版の確認はHOMEの更新ボタンから行います。'}).catch(()=>{offline.textContent='オフライン保存を開始できませんでした。オンラインで再度開いてください。'});
button.onclick=async()=>{
 if(busy)return;busy=true;button.disabled=true;say('最新版を確認しています…');
 try{
  // This network request must bypass the active service worker and browser HTTP cache.
  const controller=new AbortController(),id=setTimeout(()=>controller.abort(),15000);
  try{const response=await fetch('./sw.js?chizu-update='+Date.now(),{cache:'no-store',signal:controller.signal});if(!response.ok)throw Error('通信失敗');await response.text()}finally{clearTimeout(id)}
  const reg=await navigator.serviceWorker.getRegistration('./')||await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});
  await timeout(reg.update());
  const candidate=reg.installing;if(candidate)await installed(candidate);
  const worker=reg.waiting;
  if(worker){await send(worker,'VERIFY_CACHE');say('更新を取得しました。再起動しています…');restart=true;worker.postMessage({type:'ACTIVATE_UPDATE'});await timeout(new Promise(resolve=>{navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true})}),15000)}
  else {await send(reg.active,'VERIFY_CACHE');say('最新のバージョンです。再起動しています…');location.reload()}
 }catch{restart=false;say('更新できませんでした。現在のバージョンを使用します。')}
 finally{busy=false;button.disabled=false}
};
})();
