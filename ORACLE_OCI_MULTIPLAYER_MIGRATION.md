# KafaTopu — OCI staging, gerçek repo audit'i

Tarih: 2026-08-21. Bu belge yalnız repo kanıtlarına dayanır; production, Render ayarı, DNS ve cloud kaynakları değiştirilmemiştir.

## 1. Executive Summary

Render Free'ın 0.1 CPU / 512 MB limiti ile tek süreçteki 60 Hz authoritative simulation, 2 insan + 2 bot için güçlü bir kaynak-riski adayıdır. Bu bir kanıt değil; eklenen telemetry ile A/B testi gerektirir. OCI A1 2 OCPU / 12 GB staging için uygundur.

## 2. Current Architecture

Client: vanilla browser JavaScript/canvas (`public/client.js`); server: Node.js + Express 4 + Socket.IO 4 (`package.json`, `server.js`). Node aralığı `>=20 <25`, Render Node 20.18.0'dır (`package.json`, `render.yaml`). Socket.IO HTTP upgrade ile WebSocket kullanır; fallback HTTP long-polling olabilir. Uygulama saf HTTP dinler; Render HTTPS/WSS termination yapar (`server.js:7-18`, `README.md`). UDP/TCP raw socket yoktur.

Oda/matchmaking bellek içi `Map` ile yapılır: özel oda ve hızlı eşleşme, 1v1/2v2, boş koltuğa CPU (`server.js:128-200`). Match state, fizik, top, hareket, skor ve input doğrulaması sunucudadır (`update`, `updatePlayer`, `updateBall`); model **server-authoritative**dır. Client yalnız input/action gönderir (`public/client.js:145-150`) ve gelen state'i interpolate/extrapolate ederek çizer (`public/client.js:182-200`). Bot AI server'daki `aiInput`tır (`server.js:226-237`). DB/Redis yoktur; restart/spin-down tüm odaları siler (`README.md`).

## 3. Current Hosting

Provider Render, service `campus-head-ball`, plan `free`, Node runtime, `npm ci --omit=dev`, `npm start`, `/health` (`render.yaml`). Doküman mevcut endpointi `https://kafatopu.onrender.com`, GitHub `rg1570/campus-head-ball`/`main` otomatik deploy olarak belirtir (`YAYINLAMA.md`). Region repoda yoktur. Render'ın güncel resmi tablosu Free = 512 MB / 0.1 CPU; 15 dk idle sonrası spin-down ve yaklaşık 1 dk cold start bildirir ([Render compute plans](https://render.com/docs/compute-plans), [Free limits](https://render.com/docs/free)).

## 4. Suspected Lag Causes

1. **CPU contention/throttling:** 0.1 CPU, 60 tick/s authoritative physics, 2 CPU AI ve yaklaşık 20 state/s/room; kod ve provider limiti bunu mümkün kılar.
2. **Simulation scheduling:** `setInterval(1000/FPS)` gecikince catch-up yoktur (`server.js:363`); geciken tick fizik zamanını telafi etmez, rubberbanding yaratabilir.
3. **Network/client smoothing:** state 20 Hz (`tick%3`), input 30 Hz (`public/client.js:150`), istemci en fazla 75–80 ms prediction uygular (`public/client.js:182-183`). Jitter/loss durumunda görsel artefact mümkündür.

RAM, GC, gerçek RTT/jitter/loss ve Render region **henüz ölçülmedi**; bunlar kanıt değildir.

## 5. Evidence From Code

Her tickte her player için update, player-pair overlap, takım scrum, ball collision/pin/stall/low-play çözümü çalışır (`server.js:240-360`). 2 insan + 2 bot 4 oyuncu ve 6 pair overlap demektir. CPU `aiInput` her bot tickinde çağrılır; karar timer'ı dolduğunda action/dash da başlatabilir (`server.js:226-237`). State serialization `publicState` ile tüm oyuncu ve topu gönderir (`server.js:361`); 2v2 odada tick başına değil 20 Hz'de yapılır. Senkron veya dosya I/O / ağır native hesap yoktur.

## 6. Existing Server Resource Risks

Render Free resource sınırı gerçek ve A1 hedefine göre büyüktür. Idle cold-start ayrı bir kullanıcı deneyimi problemidir; aktif maçta WebSocket mesajları instanceı aktif tutar. Restart/spin-down state kaybı doğrudan repo ve Render dokümanında kanıtlıdır. CPU/RAM'ın mevcut lagın sebebi olduğuna karar vermek için telemetry sonucu gerekir.

## 7. ARM64 Compatibility

**A — doğrudan ARM64 uyumlu.** Lockfile yalnız pure-JS Express/Socket.IO zinciri içerir; native addon, `node-gyp`, prebuilt binary veya `amd64` indirmesi yoktur (`package.json`, `package-lock.json`, `server.js`). Docker base `node:20-alpine` multi-architecture imajdır (`Dockerfile`). Proje Apple Silicon üzerinde Node 22 ile test edildi; staging yine Node 20 ARM64 ile `npm ci --omit=dev` çalıştırmalıdır.

## 8. Oracle OCI Suitability

OCI A1 Flex'in güncel Always Free eşdeğeri toplam 2 OCPU/12 GB'tır ve home region'da provision edilir ([Oracle Always Free](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)). Bu, staging A/B için Render Free'dan anlamlı kapasite farkı sağlar; HA/SLA sağlamaz.

## 9. Recommended OCI Region

Önerilen ve seçilmiş home region Frankfurt (`eu-frankfurt-1`)'tur: Türkiye yakınlığı ve 3 AD. Milan adaydır fakat 1 AD'dir. Home region değiştirilemez; Always Free compute sadece home region'dadır ([OCI home region](https://docs.oracle.com/en/cloud/foundation/cloud_architecture/governance/regions.html)). 21 Ağustos 2026'da kullanıcı, Frankfurt tenancy'sinde `standard-a1-core-count` ve `standard-a1-memory-count` limitlerini Active / Usage 0 olarak doğruladı. Henüz VM veya başka OCI kaynağı oluşturulmadı.

## 10. Deployment Architecture

`ops/oci/` Ubuntu ARM64/systemd/Caddy şablonlarını içerir. Caddy 80/443 TLS/WSS sonlandırır ve Node'u yalnız `127.0.0.1:3001`de tutar. Docker mevcut olsa da Render'ın Docker kullanmadığı için OCI'de systemd önerilir.

## 11. Security

`/metrics` yalnız `METRICS_TOKEN` Bearer header ile açılır, yoksa 404'tür. Token VM'de root-owned environment dosyasında tutulur. NSG + UFW: public yalnız 80/443; SSH yalnız admin IP; 3001 kapalı. `APP_ORIGIN` cross-origin Socket.IO için allow-listtir.

## 12. Observability

`server.js` telemetry: CPU, RSS/heap, event-loop p50/p95/p99, GC p50/p95/p99, gerçek/configured tick rate, tick duration p50/p95/p99, overrun/late tick, bot AI duration, active human/bot, Socket.IO message/byte counters, disconnect/reconnect. Ham input, isim, oda kodu veya token kaydetmez. `/metrics` yerelde doğrulandı: 60 Hz, 16.667 ms budget.

## 13. A/B Test Procedure

Her ortamda üç kez ≥30 dk: aynı 2 insan + 0 bot, sonra aynı 2 insan + 2 bot, aynı mod/arena/ağ. `/metrics` JSON'unu test başı-sonu alın. Karşılaştır: tick p95/p99, overrun/dk, bot-AI p95, event-loop p99, CPU/RSS, inbound/outbound, reconnect. İstemcide RTT/jitter ayrıca browser DevTools veya ping/pong telemetry eklendiğinde kaydedilir; bu protokolde server RTT ölçümü yoktur. B'de tick kötüleşmesi düşerse kaynak hipotezi desteklenir; sadece client artefactı sürerse smoothing incelenir.

## 14. Rollback Plan

Önce immutable commit/build kaydı; OCI health + kısa 4 oyunculu smoke test; sonra yalnız staging URL ile test. Production DNS/endpoint değiştirilmez. Gelecek cutoverda bozulma kriteri p95 RTT/tick veya reconnect artışı; rollback eski Render endpointine dönmek, OCI'yi inceleme için açık bırakmaktır.

## 15. User Manual Actions

**Tamamlandı:** Oracle Free Tier hesabı, Individual tenancy; home region Germany Central (Frankfurt / `eu-frankfurt-1`); `standard-a1-core-count` ve `standard-a1-memory-count` Active / Usage 0 kota kontrolü.

**Bu checkpoint'te başka zorunlu Oracle işlemi yoktur.** VM, VCN, public IP, DNS kaydı veya secret oluşturmayın. Ayrı staging hostname/DNS kaydı, ancak kod audit'i sonucu ve staging VM kurulumu onaylandıktan sonra gerekecektir.

## 16. Risks

Always Free A1 capacity tükenebilir, idle instance reclaim edilebilir, limitler değişebilir. Tek VM App Store production için HA/DDoS/SLA değildir. Render Free de restart/spin-down ve ephemeral state risklidir.

## 17. Recommendation

Şimdi: OCI A1 staging ile ölçümlü A/B. Sonra: gerçek App Store yükü için managed TLS, monitoring, backup, çoklu instance/region planı; mevcut authoritative Node mimarisi kanıtlanmadan Photon/Relay/PlayFab migration önerilmez.

## 18. Changes Made

Aggregate telemetry, token-korumalı metrics, no-store runtime endpoint config, ops/OCI şablonları, `.gitignore` eklendi. Varsayılan socket endpointi değiştirilmedi.

## 19. Files Changed

`server.js`, `public/index.html`, `public/client.js`, `.gitignore`, `ops/oci/*`, bu belge.

## 20. Next Action

Oracle hesap/kota checkpoint'i tamamlandı. Bir sonraki checkpoint, gerçek repository üzerinden Codex'in mimari, lag, telemetry ve ARM64 sonucunu doğrulamasıdır. Bu sonuç olmadan OCI VM oluşturulmayacaktır.

## CURRENT SERVER

Provider: Render  
Plan: Free (512 MB, 0.1 CPU)  
Region: Repo kanıtı yok  
Runtime: Node 20.18.0 on Render; project supports >=20 <25  
Protocol: HTTPS/WSS via Render; Socket.IO (HTTP/WebSocket), no UDP  
Authority model: Server-authoritative  
Simulation tick rate: 60 Hz / 16.667 ms  
Network send rate: 20 Hz state; 30 Hz client input

## LAG DIAGNOSIS

1. Render Free 0.1 CPU vs 60 Hz physics/AI — code/provider evidence above.
2. Delayed `setInterval` tick has no catch-up — `server.js:363`.
3. 20 Hz snapshot + capped client prediction can show jitter — `server.js:363`, `public/client.js:182-183`.

## ARM64

**A** — pure JavaScript dependencies; no architecture-specific/native dependency found.

## OCI

**READY FOR ORACLE TEST: YES — VM CREATION ON HOLD BY USER INSTRUCTION**

### USER ACTION REQUIRED

**Tamamlandı; şu anda kullanıcı işlemi gerekmiyor.** OCI VM oluşturma, Codex'in gerçek kod audit'i/telemetry checkpoint'i teyit edilene ve kullanıcı açıkça onay verene kadar bekleyecektir.
