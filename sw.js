/* おぼえるドリル：2回目からすぐ開く・電波が弱くても使えるようにする（記録の送信には通信が要る） */
var VER = 'obo-20261020163714';
var CORE = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'favicon-32.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VER).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== VER && k !== 'obo-tr'; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (/(tr_(en|vi)\.json|\.enc)$/.test(u.pathname)) {   // 翻訳：いちど読みこんだら、版（?v=）が同じあいだは通信しない
    e.respondWith(caches.open('obo-tr').then(function (c) { return c.match(e.request).then(function (hit) { return hit || fetch(e.request).then(function (r) { if (r && r.ok) { c.put(e.request, r.clone()); c.keys().then(function (ks) { ks.forEach(function (k) { if (new URL(k.url).pathname === u.pathname && k.url !== e.request.url) c.delete(k); }); }); } return r; }); }); }));
    return;
  }
  if (/\.json$/.test(u.pathname) && !/manifest\.json$/.test(u.pathname)) {   // ranking.json・notice.json：まず通信、だめなら前のもの
    e.respondWith(fetch(e.request).then(function (r) { var cp = r.clone(); caches.open(VER).then(function (c) { c.put(e.request, cp); }); return r; }).catch(function () { return caches.match(e.request, { ignoreSearch: true }); }));
    return;
  }
  // ページ・アイコン：保存したものをすぐ返し、うらで新しくする
  e.respondWith(caches.open(VER).then(function (c) {
    return c.match(e.request, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(e.request).then(function (r) { if (r && r.ok) c.put(e.request, r.clone()); return r; }).catch(function () { return hit; });
      return hit || net;
    });
  }));
});
