const PREFIX='chizu-diagram-'+encodeURIComponent(self.registration.scope)+'-';
const CACHE=PREFIX+'33647659344a2b9e';
const ASSETS=["./", "./index.html", "./styles.css", "./ui-config.js", "./diagram-core.js", "./label-layout.js", "./diagram-view.js", "./pan-zoom.js", "./app.js", "./point-view.js", "./data.js", "./register.js", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png"];
self.addEventListener('install',event=>event.waitUntil((async()=>{
 // Write only this release's cache; a failed download never touches older releases.
 const cache=await caches.open(CACHE),abort=new AbortController(),timer=setTimeout(()=>abort.abort(),25000);
 try{await Promise.all(ASSETS.map(async asset=>{const response=await fetch(new Request(new URL(asset,self.registration.scope),{cache:'no-store',signal:abort.signal}));if(!response.ok)throw Error('Download failed');await cache.put(asset,response)}))}
 catch(error){abort.abort();await caches.delete(CACHE);throw error}finally{clearTimeout(timer)}
 // No skipWaiting here: an update waits for explicit user authorization.
})()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('message',event=>{
 if(event.data?.type==='ACTIVATE_UPDATE')event.waitUntil(self.skipWaiting());
 if(event.data?.type==='VERIFY_CACHE')event.waitUntil((async()=>{const cache=await caches.open(CACHE),all=await Promise.all(ASSETS.map(asset=>cache.match(asset)));event.ports[0]?.postMessage({ok:all.every(Boolean),cache:CACHE})})());
});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;
 // Explicit online update probe goes directly to the server.
 if(url.pathname.endsWith('/sw.js')&&url.searchParams.has('chizu-update')){event.respondWith(fetch(event.request));return}
 event.respondWith(caches.open(CACHE).then(async cache=>{const hit=await cache.match(event.request,{ignoreSearch:true});if(hit)return hit;if(event.request.mode==='navigate')return cache.match('./index.html');return fetch(event.request)}));
});
