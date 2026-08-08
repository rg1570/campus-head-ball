# Campus Head Ball 5.7.0 — Koç Arenası

On altı özel karakteri kullanan, Koç Üniversitesi Rumelifeneri kampüsü ve yakın çevresinden esinlenen on sekiz haritalı modern kafa topu oyunudur. Tek Oyunculu bölümünde Hızlı Maç, ayarlanabilir Kampüs Ligi ve Kampüs Kupası; Çok Oyunculu bölümünde Hızlı Eşleşme ve özel oda bulunur. Tek ve çok oyunculu lobilerde 1'e 1 / 2'ye 2 düzeni ile saha boyutu bağımsız seçilir. Eksik oyuncuları CPU tamamlar; saha sahibi her CPU koltuğunun karakterini seçebilir ve bağlantısı kesilen oyuncuyu CPU geçici olarak devralır.

## Oyun modları

- **Hızlı Maç:** 1'e 1'de bir, 2'ye 2'de üç CPU'nun tamamladığı tek karşılaşma.
- **Kampüs Ligi:** 4, 6 veya 8 takım; tek ya da çift devre seçilebilir. Böylece sezon 3, 5, 6, 7, 10 veya 14 maç sürebilir. CPU maçları her hafta simüle edilir; galibiyet, beraberlik, mağlubiyet, averaj ve puan tablosu tarayıcıya kaydedilir. İlk maçta seçilen karakter ile süre/gol sınırı sezon boyunca kilitlenir.
- **Kampüs Kupası:** 4, 8 veya 16 takımlı eleme turnuvası seçilebilir; oyuncu sırasıyla 2, 3 veya 4 maç kazanarak şampiyon olur. Tek mağlubiyet turnuvayı bitirir.
- **Hızlı Eşleşme:** Bekleyen başka bir çevrim içi oyuncuyu otomatik bulur; rakip gelmeden maç başlamaz.
- **Özel Oda:** Oda sahibi saha kodunu arkadaşlarına yollar; 1'e 1 veya 2'ye 2 takım koltukları seçilir.
- Lobi, maç ve maç sonu ekranlarında çıkış düğmesi vardır. Lig/kupa ilerlemesi çıkışta silinmez; çevrim içi maçtan ayrılan oyuncunun koltuğunu CPU devralır. Lig ve kupa ana menüden, kariyer lobisinden, lig tablosundan veya maç sırasında onay verilerek sıfırlanabilir.

## Çalıştırma

```bash
npm install
npm start
```

Chrome'da `http://localhost:3001` adresini açın.

## Kontroller

- A / D: Koş
- A veya D'ye iki kez: O yöne dash
- W: Zıpla; erken bırakırsan kısa zıplarsın
- S: Yerde eğilerek alçak topu güvenli biçimde uzaklaştır; havada hızlı aşağı in
- Shift: Basılan yöne dash
- J: Kafa vuruşu
- K: Karaktere özel hareket; 50 enerji harcar

## Karakterler

- Alpsu — Falso Kafa: Dengeli karakter. Özel vuruşu topa belirgin falso verir.
- İhsan — Çifte Hamle: En hızlı ve havada en çevik karakter; daha hafiftir.
- Eaytaclar — Deprem Kafası: Yavaş ve ağırdır; en güçlü kafa vuruşuna sahiptir. Özel gücü yakındaki topu havaya fırlatır.
- Littlerose — Roket Kafa: En yükseğe zıplar; özel gücüyle ileri ve yukarı fırlar.
- Jibiji — Mıknatıs Kafa: Topu kafa koridoruna çeken çevik oyun kurucudur; ham vuruş gücü düşüktür.
- UCY — Ayna Kafa: Gelen top ne kadar hızlıysa kontrayı o kadar sert yapan dayanıklı uzmandır.
- Alto — Geometri Kafa: Dengeli taktikçidir; özel vuruşunu uzak üst köşeye yönlendirir.
- İdiko — Lodos Kafa: Havada çevik oyun kurucudur; topu savunmanın üzerinde kısa süre asılı tutar.

## Resmî maç topu

Tüm maçlarda tek top kullanılır: **Hafif Köpük**. Önceki çok hafif sürüm optimum denge için biraz ağırlaştırıldı; yerçekimi 850'den 920'ye, sekme %94'ten %91'e ve azami hız 1450'den 1320'ye ayarlandı. Böylece canlı ve hava odaklı karakteri korunurken top kontrolsüz biçimde hızlanmaz.

## Oyun sistemi

Sunucu 60 FPS otoriter fizik çalıştırır. Top; karakterlerin kafa ve gövdeleri, kale direkleri, zemin, tavan ve saha duvarlarıyla çarpışır. Tek oyunculu lobide kullanıcı; çok oyunculu özel odada oda sahibi 1'e 1 / 2'ye 2 düzeninden, kompakt / geniş sahadan, 60/90/120/180 saniyelik sürelerden ve 3/5/7/10 gol sınırlarından birini seçer. Süre beraberlikle biterse altın gol oynanır.

Karakter hareketlerinde hızlanma, havada yön kontrolü, değişken zıplama yüksekliği, zıplama tamponu, kısa tolerans süresi ve dash bulunur. Görsel tarafta top izi, kafa vuruşu halkası, parçacıklar, gol konfeti, hareket gölgeleri, kale ağı dalgalanması ve hava efektleri kullanılır.

Oyun ekranı tarayıcının gerçek görünüm yüksekliğine sabitlenir; 16:9 kanvas sayfanın yüksekliğini büyütmez ve maç sırasında dikey kaydırma oluşmaz. Karakter özelliği ile tuş kontrolleri üst üste iki sıra yerine aynı alt HUD satırında yan yana gösterilir. Dar ekranlarda açıklama otomatik kısalır, mobil genişlikte yalnızca gerekli kontrol özeti kalır.

## Maç öncesi akış

- Çevrim içi odada maç düzenini, saha boyutunu ve diğer maç kurallarını yalnızca oda sahibi değiştirebilir; misafirler seçimleri canlı görür.
- 1'e 1 düzeninde takımlarda birer, 2'ye 2 düzeninde ikişer aktif koltuk açılır. Oyuncular boş Mavi/Kırmızı takım koltuğuna geçebilir.
- On altı karakter yalnızca birer kez seçilebilir. İnsan bulunmayan aktif koltuklarda CPU karakterleri saha sahibi tarafından ayrı ayrı seçilebilir; seçim yapılmazsa oyun benzersiz karakterlerle rastgele tamamlar.
- Karakter, arena, saha boyutu, maç düzeni veya kural değiştiğinde hazır durumu sıfırlanır. Tüm insan oyuncular hazır olmadan maç başlayamaz.
- Her karakter için üç farklı Türkçe geçmiş hikâyesi bulunur. Maçtan önce sahadaki bütün karakterlerin yüzleri, oyuncu adları, oyun tarzları, özel güçleri ve rastgele seçilen hikâyeleri takım bazında gösterilir.
- VS tanıtımı sekiz saniye sürer. Bütün insan oyuncular atlarsa maç hemen başlar. Fizik tanıtım süresince sunucuda dondurulur.

## Kale önü dengesi

- Kompakt sahada kale açıklığı 260 piksel olarak korunur. Yalnızca geniş sahada kale üst direği 25 piksel yükselir ve açıklık 285 piksele çıkar; 2'ye 2 hücumlarında yüksek pas ve aşırtma koridoru genişler.
- Oyuncular kale çizgisinin üzerine giremez; sahadaki kesik çizgi savunmacının en geri konumunu gösterir.
- Bir oyuncu kendi kale bölgesinde hareketsiz biçimde 2,45 saniyeden uzun beklerse “kale baskısı” başlar. Sarı oklar oyuncuyu kademeli olarak 74 piksel ileri taşır; oyuncu yeniden hareket edince baskı söner.
- Geniş saha + 2'ye 2 birleşiminde daha güçlü, kişiye özel kural uygulanır: kale önü denetim koridoru 80 piksel genişler, ihlal 1,55 saniyede devreye girer ve yalnızca ihlali yapan oyuncu 5 saniyeliğine kalenin 150 piksel daha ilerisinde tutulur. Takım arkadaşı serbest kalır; diğer maç düzenleri bu sert kuraldan etkilenmez.
- 1'e 1 maçlarda kale üst direği seçilen saha boyutuna göre 14 piksel daha yükselir. Kale önü denetimi 2,0 saniyede devreye girer; ihlali yapan oyuncu 110 piksel ileri taşınır ve 4,8 saniye boyunca derin kale koridoruna dönemez. Bu ayar düelloda kaleye yapışmayı azaltır, fakat 2'ye 2 geniş sahanın daha sert kuralından hafif kalır.
- Kale önündeki sert şutlar savunmacıya çarptığında gelen hızın yaklaşık %90'ını korur ve hafif yukarı sekerek ikinci kafa/aşırtma fırsatı yaratır.
- Direklerin sekme katsayısı yükseltildi, fakat topun azami hızı değiştirilmedi. Böylece sekmeler daha canlıdır; oyun kontrolsüz biçimde hızlanmaz.

## Yer oyunu dengesi

- Top zemindeyken oyuncunun pasif kafa ve gövde çarpışmaları artık aynı karede üst üste çalışmaz. Görsel olarak yere ulaşmayan pasif kafa çarpışması kaldırıldı.
- Gövdeyle yerde sürülen top yalnızca yatay hız kazanmaz; temas enerjisinin bir bölümü kontrollü bir “yerden aşırtma” hareketine dönüşür. Temasta koşucunun momentumu kesilir ve top ileri kaçmak yerine kafa yüksekliğine açılır.
- Aşırtmadan sonra yalnızca ileri koşmaya devam edilirse sonraki pasif temas “yumuşak kontrol” olur: topun ileri hızı sınırlanır, oyuncu kısa süre toparlanır. Böylece topu karakterin önüne alıp dümdüz itmek hızlı hücum olmaktan çıkar.
- Aşırtmadan sonraki 1,15 saniye içinde zıplayıp J ile vurmak yeni **Aşırt & Vur** kombosunu açar. Bu bilinçli zamanlama normal hava kafasından daha güçlüdür, 12 enerji kazandırır ve hızlı hücumun yeni beceri kapısıdır.
- Resmî Hafif Köpük topunun %91 zemin sekmesi ve hızla birlikte çalışan minimum sıçrama desteği, yerde kalma süresini azaltır.
- Yeni tam hücum koridorunu yalnızca sağa basarak geçme süresi ölçüm senaryosunda yaklaşık 5,22 saniyedir. Zamanlamalı Aşırt & Vur aynı koridoru yaklaşık 1,30 saniyede aşar; riskli ve becerili oyun ödüllendirilir.
- Ekrandaki temas bildirimi kafa, hava kafası, gövde, kaleci sekişi, yerden aşırtma, yumuşak kontrol ve komboyu ayrı gösterir. İlk aşırtmada oyuncuya `ZIPLA + J` ipucu verilir.
- Sağ alttaki uzun karakter kutusu kaldırıldı. Benzersiz karakter bilgisi, alt saha bandında kontrollerin üzerinde duran ince yatay bir şeride dönüştürüldü; küçük ekranlarda tamamen gizlenir.

## Sıkışma koruması ve uzun saha

- Önceki sürümde iki oyuncu topa karşılıklı bastığında pasif temas sersemletmesi her fizik karesinde yenilenebiliyordu. Oyuncuların tuş girdileri sunucuya ulaşsa bile yaklaşık her karede yeniden kilitlenmesinin nedeni buydu.
- Pasif top kontrolü artık sersemletme uygulamaz. Bunun yerine yalnızca koşu hızını kısa süre sınırlayan `carrySlow` kullanılır; zıplama, yön değiştirme, kafa ve özel hareketler her zaman çalışır.
- Sıkışma algılama yarıçapı 94'ten 125 piksele, izin verilen oyuncu kümesi genişliği 175'ten 225 piksele çıkarıldı. Topun yavaş ve alçak biçimde en az iki oyuncu arasında 0,38 saniye kalması gerçek sıkışma sayılır; hızlı normal paslar yanlışlıkla tetiklenmez.
- İlk sıkışmada top 360 yatay / 660 dikey kuvvetle kontrollü biçimde açılır. Aynı sıkışma 4,2 saniye içinde tekrarlanırsa sistem oyuncuların daha az bulunduğu koridoru hesaplar ve topu 590 yatay / 780 dikey kuvvetle oraya yollar. Üçüncü tekrar daha da güçlü temizlenir. Böylece kısa fizik mücadeleleri korunur, fakat sonsuz döngü oluşmaz.
- Normal açılmada 0,24; tekrarlanan açılmada 0,30 saniyelik çarpışma koruması uygulanır. Yakındaki oyuncular da hafifçe zıt yönlere ayrılır ve ekranda güçlü açılma için “TOP AÇIK KORİDORA ÇIKTI” bildirimi gösterilir.
- Top çevresindeki üçlü kümede bir takımın iki, diğer takımın bir oyuncusu bulunuyorsa **İkili Baskı** kontrolü devreye girer. Sistem artık takım yönü varsayımı yerine oyuncuların gerçek konumlarından baskı yönünü hesaplar. Çoğunluktaki oyunculardan en az birinin bu yöne basması yeterlidir; CPU takım arkadaşının ters girdisi sayısal üstünlüğü yanlışlıkla iptal etmez.
- İkili Baskı 0,14 saniyede topu ve tek savunmacıyı yavaşça taşımaya başlar. İki oyuncu baskıyı 0,58 saniye birlikte sürdürürse top 480 yatay / 520 dikey kuvvetle öne açılır, savunmacı kontrollü biçimde 260 yatay hıza taşınır ve sistem 1,2 saniye beklemeye girer. Böylece sayısal üstünlük hissedilir; kesintisiz buldozer taktiği oluşmaz.
- Bunlardan bağımsız yeni ilerleme denetçisi, top alçakta ve en az iki oyuncunun 190 piksellik kalabalığında kaldığında gerçek saha ilerlemesini ölçer. Top 95 pikselden fazla yatay yol alamadan 3,8 saniye geçirirse en boş koridor hesaplanır; top 650 yatay / 790 dikey kuvvetle havaya çıkarılır ve çevredeki oyuncular hafifçe ayrılır. Bu son güvenlik, daha önceki algılayıcıların kaçırdığı 10–15 saniyelik kilitleri de sona erdirir.
- Kompakt saha 1376, geniş saha 1720 dünya birimidir. Bu seçim maç düzeninden bağımsızdır; 1'e 1 geniş veya 2'ye 2 kompakt maç da kurulabilir.
- Görüntü yatay olarak gerilmez: 1280 birimlik kamera topu yumuşak biçimde takip eder. Oyuncular ve top iki saha boyutunda da aynı görsel ölçeğini korur.
- Her golden sonra top merkez çevresindeki kontrollü-rastgele bir sağ/sol koridora düşer. Sapma kompakt sahada daha dar, geniş sahada daha geniş tutulur; art arda aynı tarafın avantaj kazanma ihtimali sınırlandırılır.

## On sekiz Koç arenası

- Rumelifeneri Ana Avlu
- Saat Kulesi — Yağmurlu Gece
- Mühendislik Avlusu — Sonbahar
- Suna Kıraç Kütüphanesi — Bahar
- Bilim Kapısı — Mavi Saat
- Kuzey Avlusu — Kış Şafağı
- Henry Ford Çimleri — Gün Batımı
- Öğrenci Merkezi Meydanı — Bahar
- Yurtlar Orman Geçidi — Sonbahar
- Açık Spor Sahası — Gece
- Rumelifeneri Odeon — Altın Saat
- Ana Giriş Bilgi Kapısı — Sonbahar
- Koç Balık Terası — Gün Batımı
- Batı Yurtları Baba’s — Yağmur Sonrası
- Öğrenci Merkezi -1 — Stant Koridoru
- Suna Kıraç Kütüphanesi — Gece İç Avlu
- Mühendislik Merdivenleri — Gece
- Şadırvan Salonu — Mavi Saat

Yeni arenalar, Rumelifeneri kampüsünün merkezî kütüphanesi, avluları, Henry Ford çim alanı, Öğrenci Merkezi, yurt–orman geçitleri, iç mekânları ve yakın çevresinden esinlenen özgün sanatsal yorumlardır. On sekiz arena da aynı fizik koordinat sistemini kullanır; her biri 1'e 1 / 2'ye 2 ve kompakt / geniş saha seçimlerinin tamamında çalışır.

## Görsel kafa ve temas hizası

- Önceki fiziksel kafa merkezi ayaktan 108 piksel yukarıdaydı; 250 piksel yüksekliğinde çizilen karakterlerde bu nokta görsel olarak göğüs/omuz hizasına denk geliyordu. Topun yüzün içinden geçiyor gibi görünmesinin ana nedeni buydu.
- Karakterler 250 yerine 238 piksel yüksekliğinde çizilir. Yeni fizik yapısı gerçek kafa için ayaktan 202 piksel, omuz–gövde için 137 piksel ve alt gövde için 60 piksel yukarıda üç ayrı temas bölgesi kullanır.
- Pasif kafa, omuz ve gövde temasları korunur; fakat J vuruşunun güçlü impulsu yalnızca gerçek kafa bölgesinde çalışır. Aktif kafa vuruşu öne 31 piksel uzanır ve kafa çevresindeki görsel halka da aynı koordinata taşındı.
- Yerden aşırtmanın dikey kuvveti yeni kafa yüksekliğine uyacak biçimde artırıldı. Böylece top gövdeden açılır, kafa koridoruna yükselir ve `W + J` kombosu görsel olarak gerçek bir kafa vuruşuna dönüşür.

## Hızlı yer topu dengesi

- Önceki zemin çözümünde topun dikey hızı 48'in altına indiğinde bu hız sıfırlanıyordu. Yatay hızı çok yüksek bir top bile her karede bu eşiğe takılıp zeminde kayabiliyordu.
- Yatay hızı 250'nin üzerindeki top artık kendi yerçekimine ve hızına göre yaklaşık 70–100 piksel yüksekliğinde minimum bir `anti-roll hop` kazanır. Yatay hız artırılmadığı için oyun hızlanmaz; yalnızca sürekli yerden sürünme kesilir.
- 700 hızlı kontrollü testte Hafif Köpük topu zeminden en az 70 piksel yükselir ve zemine 20 pikselden yakın kaldığı kare oranı %25'in altında kalır.
- Pasif kafa temasının ileri momentum aktarımı azaltıldı; güçlü ilerleme için aktif `J` zamanlaması gerekir. Karakterlerin resmî Hafif Köpük topuyla oluşturduğu kombinasyonlarda yalnızca ileri basmak, zamanlamalı kafa oyunundan daha etkili değildir.
- Düşük gövde teması, top ve oyuncu benzer hızda ilerliyor olsa bile 0,30 saniyelik bekleme sonrasında yeniden aşırtma üretebilir. Yavaş ve bilinçli yer kontrolü korunurken kesintisiz gövde sürüşü kalıcı taktik olamaz.

## 5.2 CPU ve savunma güncellemesi

- Tek Oyunculu Hızlı Maç, Kampüs Ligi ve Kampüs Kupası lobilerinde 1'e 1 / 2'ye 2 seçimi yeniden açıldı. 2'ye 2 seçildiğinde insan oyuncunun takım arkadaşı ile iki rakibi CPU doldurur.
- 1'e 1 CPU artık 2'ye 2 savunmacı çapası kullanmaz. Topun kısa vadeli konumunu tahmin eder, topun kendi kale tarafına geçmeye çalışır ve gerektiğinde orta sahayı geçerek hücuma katılır.
- 2'ye 2'de forvet topa baskı yaparken savunmacı yalnızca kalede beklemez: tehlike yoksa orta saha destek çizgisine çıkar, top yakındaysa ikinci baskıyı kurar. Böylece takım boyu kısalır ve rakip yarı sahaya ilerleme artar.
- CPU, kendi kalesine yakın alçak top arkasında kaldığında ters yöne kafa vurmak yerine `S` savunmasını kullanır. Güvenli kafa/özel vuruş kararı yalnızca top hücum yönündeyken verilir.
- Yerde `S` basılı tutulunca karakter eğilir, hızı düşer ve savunma hitbox'ı görsel duruşla birlikte alçalır. Kendi savunma üçte birindeki alçak temas **Eğilerek Blok** olur; top gelen hızına göre kontrollü biçimde ileri-yukarı uzaklaştırılır. Bu hareket otomatik gol kurtarmaz, fakat ters gövde dokunuşundan doğan kendi kalesine golleri belirgin biçimde azaltır.

## 5.3 ayarlanabilir kariyer

- Yeni lig kurulurken takım sayısı 4/6/8, fikstür tek/çift devre seçilir. Arayüz seçime göre toplam maç sayısını başlamadan önce gösterir; lig tablosunun başlığı da aktif formatı yansıtır.
- Yeni kupa kurulurken 4/8/16 takımlı turnuva seçilir. Kupa yolu yarı final, çeyrek final veya son 16 turundan başlar ve 2/3/4 galibiyet gerektirir.
- Her iki kariyerde **Rahat**, **Dengeli** ve **Usta** CPU profili bulunur. Rahat profil daha yavaş hareket edip karar verir; Dengeli varsayılan adil profildir; Usta topun hareketini daha ileri tahmin eder, daha kısa tepki süresiyle dash ve özel güç fırsatlarını daha iyi değerlendirir. Usta profilde karakter istatistikleri hileli biçimde yükseltilmez.
- Eski 5.2 lig ve kupa kayıtları korunur: lig 8 takım/tek devre, kupa 3 tur ve CPU Dengeli olarak açılır.
- **Ligi Sıfırla / Kupayı Sıfırla** düğmeleri ana tek oyunculu menüde, kariyer lobisinde ve ilgili ekranlarda bulunur. Maç sırasında da kariyer sıfırlanabilir. İşlem geri alınamayacağı için önce onay istenir; onaydan sonra puanlar, fikstür, seçili karakter ve sabit maç kuralları temizlenir.

## Test

```bash
npm test
```

Test; tek/çok oyunculu oda ayrımını, hızlı eşleşmeyi, on altı karakteri, on sekiz arenayı, seçilebilir CPU karakterlerini, tek resmî top fiziğini, sıkışma kurtarmasını, kafa vuruşunu, özel güçleri, CPU devralmasını, dinamik lig/kupa fikstürlerini, CPU zorluklarını ve kariyer maçlarını denetler.

### 5.3.1 oynanış ve ses güncellemesi

- Sekiz karakterin görseli ve kafa/gövde çarpışma alanları yaklaşık `%6` kısaltıldı; karakter sınıflarının hız ve zıplama farkları korunur.
- Savunmacıyı geçerek kale çizgisine ulaşan top için, üst direğin hemen altında yalnızca `34 px` yüksekliğinde dar bir üst-köşe koridoru bulunur. Savunmacı topu daha önce karşılayabilir; çizgi önünde sonradan görünmez duvar oluşturamaz.
- Top `5,5 saniye` boyunca kafa yüksekliğine çıkmadan alçak koridorda kalırsa güvenli yöne ve yukarı doğru kaldırılır. Doğal küçük sekmeler sayacı kandırmaz; gerçek kafa vuruşu veya yüksek hava topu sayacı sıfırlar.
- Seçilen MP3 oyun müziği olarak kullanılır. Çıkış/kariyer düğmeleri sol alta, müzik paneli sağ alta taşındı.

### 5.3.2 maç içi ses dengesi

- Her yeni maçın tanıtımı başladığında MP3 müzik seviyesi ve sağ alttaki müzik çubuğu otomatik olarak `%10` olur.
- Oyuncu maç sırasında müzik çubuğunu istediği seviyeye yükseltip azaltabilir.
- Top, kafa vuruşu, düdük, özel güç ve hareket efektlerinin ses seviyesi değişmez; yeniden bağlanma sırasında oyuncunun son ayarı tekrar ezilmez.

### 5.4 Alto

- Yedinci karakter **Alto**, gözlüklü ve arkadan bağlı saçlı özgün portresiyle bütün seçim ekranlarına, maç tanıtımlarına, lig ve kupa modlarına eklendi.
- Alto dengeli bir taktikçidir: hız, sıçrama ve güç değerleri ortalamaya yakındır; belirgin bir ham istatistik üstünlüğü bulunmaz.
- `K` ile kullanılan **Geometri Kafa**, 50 enerji karşılığında topun uçuşunu uzak kalenin üst köşesine göre hesaplar. Vuruş güçlü bir açı avantajı sağlar ancak enerji maliyeti, aktif kafa temasını doğru zamanlama gereksinimi ve ortalama fizik değerleriyle dengelenir.
- Karakter için maç öncesinde rastgele gösterilen üç yeni Türkçe hikâye yazıldı.

### 5.5 İdiko

- Sekizinci karakter **İdiko**, uzun koyu saçları, halka küpeleri ve 21 numaralı beyaz–gök mavisi formasıyla bütün oyun modlarına eklendi.
- İdiko hafif ve çevik bir hava oyun kurucusudur. Havada yön değiştirmesi güçlüdür; ham kafa gücü ve rakibi itme direnci ortalamanın altındadır.
- `K` ile kullanılan **Lodos Kafa**, 50 enerji karşılığında topu dik bir yayla kaldırır ve 0,72 saniye boyunca yerçekimi etkisini azaltır. Böylece kale önündeki savunmacının üstünden aşan bir ikinci-top fırsatı üretir; doğrudan en güçlü şut değildir.
- Karakter için maç öncesinde rastgele gösterilen üç yeni Türkçe hikâye yazıldı.

### 5.5.1 forma ayrımı

- Sekiz karakterin forma renkleri ve desenleri birlikte kontrol edildi; her karakterin sahada ilk bakışta ayrılabilmesi sağlandı.
- Mor forma ve 8 numara çakışmasını kaldırmak için İdiko'nun kiti tamamen yenilendi: inci beyazı taban, gök mavisi çapraz şerit, mercan vurgu, antrasit şort ve 21 numara.
- Diğer karakterlerin yüzleri, vücutları, istatistikleri ve özel güçleri değiştirilmedi.

### 5.6 dört yeni gerçek mekân haritası

- **Rumelifeneri Odeon — Altın Saat:** Gerçek açık hava Odeon'unun yarım daire basamakları, gösteri meydanı, çim eğimleri ve kampüs saat kulesi kullanıldı.
- **Ana Giriş Bilgi Kapısı — Sonbahar:** Kampüsün Portal of Knowledge olarak bilinen büyük kemerli taş girişi, simetrik kanatları ve önündeki yansıtma havuzu temel alındı.
- **Koç Balık Terası — Gün Batımı:** Maden–Rumeli Feneri yolu üzerindeki gerçek restoranın taş terası, kırmızı çiçekleri ve tepe–su manzarası işlendi.
- **Batı Yurtları Baba’s — Yağmur Sonrası:** Batı Yurtları'nın hemen yanındaki öğrenci mekânı; sıcak cam cephe, U biçimli bar, model tren detayı ve yurt binalarıyla gece haritasına dönüştürüldü.
- Dört harita da 1'e 1 / 2'ye 2 düzeninden bağımsız olarak kompakt veya geniş saha seçimiyle oynanabilir.

### 5.6.1 karakter adları

- Karakter adları bütün seçim kartlarında, maç tanıtımlarında, hikâyelerde, skor bildirimlerinde, lig/kupa ekranlarında ve CPU oyuncularında güncellendi.
- Nihai kadro sırası: **Alpsu, İhsan, Eaytaclar, Littlerose, Jibiji, UCY, Alto, İdiko**.
- İstatistikler, formalar ve özel güçlerin mekanikleri değiştirilmedi.

### 5.6.2 alt HUD yerleşimi

- Masaüstünde karakter özelliği ile tuş bilgileri tek sol-alt grup olarak yan yana konumlandırıldı.
- Sağ alttaki müzik ve ses paneli yerinde bırakıldı; alt HUD'un sağ sınırında müzik paneline özel güvenli alan ayrıldı.
- Orta genişlikteki ekranlarda kontrol grubu müzik panelinin üzerine gelmemesi için bir satır yukarı taşınır.

### 5.7.0 yeni kadro, CPU seçimi ve iç mekân haritaları

- **Teker, Ysoner, Ulushain, Kaynımol, Irene, Caner, Küçük Durak ve Nevşo** fotoğraf referanslarından mevcut büyük-kafa arcade stiline uyarlanarak eklendi. Kadro 16 karaktere çıktı.
- Sekiz yeni formanın her biri renk kadar desenle de ayrıştırıldı: dama, dikey şerit, çapraz kuşak, zikzak, parçalı, şimşek, çeyrek ve yatay halka tasarımları kullanıldı.
- Tek ve çok oyunculu lobilerde boş her CPU koltuğuna ayrı karakter seçilebilir. Aynı karakter aktif maç kadrosunda iki kez kullanılamaz; `Rastgele Karakter` seçeneği korunur.
- Harita sayısı 18'e çıktı: **Öğrenci Merkezi -1 — Stant Koridoru**, **Suna Kıraç Kütüphanesi — Gece İç Avlu**, **Mühendislik Merdivenleri — Gece** ve **Şadırvan Salonu — Mavi Saat** eklendi.
- Yeni iç mekânlar doğrulanmış Koç Üniversitesi kullanım bilgileri ve gerçek Koç kampüs fotoğrafları temel alınarak oyunun sinematik perspektifine uyarlandı.

## Farklı evlerden internet üzerinden oynama

Oyun tek bir Node.js web servisi üzerinden çalışacak biçimde hazırlanmıştır. Socket.IO, yayınlanan sitenin HTTPS adresinden güvenli WebSocket bağlantısını otomatik kurar. Oyuncunun bağlantısı kesilirse CPU geçici olarak devralır; tarayıcı yeniden bağlandığında oyuncu aynı tarafına ve mevcut skora döner. Kullanılmayan boş odalar beş dakika sonra temizlenir.

Paketin içindeki `render.yaml`, `.node-version`, `Dockerfile` ve sağlık kontrolü internet yayını için hazırdır. Başlangıç seviyesine uygun adımlar için [YAYINLAMA.md](YAYINLAMA.md) dosyasını izleyin.

Not: Oda ve maçlar sunucu belleğinde tutulur. Ücretsiz sunucu uykuya girer veya yeniden başlatılırsa açık maçlar sıfırlanabilir; normal arkadaş maçları için bu yapı yeterlidir.

Oyun müziği, proje sahibi tarafından seçilen yaklaşık 3 dakika 3 saniyelik `public/assets/stadium-theme.mp3` kaydıdır. Tarayıcı izinleri nedeniyle ilk tıklamada başlar, maçlar ve menüler arasında kaldığı yerden devam eder ve kayıt bittiğinde döngüye girer. Sağ alttaki aç/kapat düğmesi ile %0–%100 arasındaki kalıcı ses ayarı çalışmaya devam eder; ses efektleri ayrı Web Audio kanalında üretilir. Maçtan çıkma ve kariyer sıfırlama düğmeleri sol altta durur, böylece üst takım göstergelerini kapatmaz. Haritalar sanatsal kampüs yorumlarıdır.
