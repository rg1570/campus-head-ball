CAMPUS HEAD BALL 5.8.4 — MOBİL KONTROL + ÇİFT DİLLİ PWA UX

Bu paket 5.8.3'ün tamamını içerir. Önceki mobil paketleri ayrıca kurman gerekmez.

YALNIZCA MOBİL UX DEĞİŞİKLİKLERİ
- Mobil yatayda MAÇTAN ÇIK butonu siyah kolon oluşturmadan sahanın alt-sol güvenli bölgesine küçültülerek taşındı.
- Joystick yukarı / üst çaprazda tutulduğu sürece, oyuncu her yere inişinde mevcut zıplama fiziğiyle otomatik tekrar zıplar.
- Joystick açı + magnitude mantığına geçirildi.
- Sağ/sol hareket küçük dikey parmak sapmalarına toleranslıdır.
- Sağ-yukarı = sağa doğru zıplama; sol-yukarı = sola doğru zıplama; yukarı = normal zıplama.
- Eğilme dar bir aşağı konisi ve daha yüksek magnitude eşiği ister; hafif alt çaprazlar eğilme sayılmaz.
- iPhone Safari normal sekmesinde, TELEFON seçildikten sonra PWA/Ana Ekrana Ekle yönlendirmesi HER YENİ SAYFA GİRİŞİNDE gösterilir.
- Yönlendirme aynı kartta Türkçe ve İngilizce adımları birlikte gösterir.
- Anladım / Şimdi Değil seçimi kalıcı olarak kaydedilmez; browser'dan sonraki girişte kart yeniden çıkar.
- Standalone/Ana Ekran ikonundan açılışta PWA yönlendirmesi gösterilmez.
- Fullscreen API varsa onboarding içinde yedek ⛶ TAM EKRAN seçeneği görünür; destek yoksa gizlidir.
- Manifest adı Kafa Topu, display standalone, orientation landscape olarak doğrulanır.
- Platform seçimi, masaüstü kontrolleri, J/K fonksiyonları ve cross-platform multiplayer aynen korunur.

KURULUM
1) GitHub Desktop > campus-head-ball > Repository > Show in Finder.
2) Bu klasörün İÇİNDEKİ her şeyi repo köküne kopyala.
3) MOBIL_GUNCELLE.command dosyasını çalıştır.
4) GitHub Desktop Summary: 5.8.4 çift dilli PWA yönlendirmesi
5) Commit to main > Push origin.
6) Render Live olduktan sonra iPhone Safari'de siteyi yeniden aç.
