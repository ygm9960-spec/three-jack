const CACHE_NAME='three-jacks-v0-25-20260908';
const SHELL=['./','./index.html','./css/style.css?v=0.25','./js/storyData.js?v=0.25','./js/assetMap.js?v=0.25','./js/stageMap.js?v=0.25','./js/visualMap.js?v=0.25','./js/directorMap.js?v=0.25','./js/assetAliases.js?v=0.25','./js/assetAvailability.js?v=0.25','./js/portraitMasks.js?v=0.25','./js/app.js?v=0.25','./assets/sfx/sfx_test.wav'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('three-jacks-')&&k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==self.location.origin)return;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(res=>{if(res&&res.ok)caches.open(CACHE_NAME).then(c=>c.put('./index.html',res.clone()));return res}).catch(()=>caches.match('./index.html')));return;
  }
  // Media range requests must reach the server; do not cache partial MP3 responses.
  if(/\.(mp3|m4a|ogg|wav)$/i.test(url.pathname)){return;}
  const isImage=/\.(?:png|webp|jpg|jpeg|gif|svg)$/i.test(url.pathname);
  if(isImage){event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(res=>{if(res&&res.ok)caches.open(CACHE_NAME).then(c=>c.put(req,res.clone()));return res})));return;}
  event.respondWith(caches.match(req).then(hit=>{const network=fetch(req).then(res=>{if(res&&res.ok)caches.open(CACHE_NAME).then(c=>c.put(req,res.clone()));return res}).catch(()=>hit);return hit||network;}));
});
