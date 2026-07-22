# Oyunu internete açma — en basit yöntem

Bu işlem bir kez yapılır. Sonrasında arkadaşların yalnızca sana verilen internet adresine girer.

## 1. Dosyaları GitHub'a koy

1. [github.com](https://github.com) adresinde ücretsiz hesap aç veya hesabına gir.
2. Sağ üstteki `+` işaretine, sonra `New repository` seçeneğine bas.
3. Repository name bölümüne `campus-head-ball` yaz.
4. `Public` seçili kalsın ve `Create repository` düğmesine bas.
5. Açılan sayfada `uploading an existing file` bağlantısına bas.
6. ZIP'i önce bilgisayarında aç. `campus-head-ball` klasörünün **içindeki bütün dosya ve klasörleri** GitHub yükleme alanına sürükle.
7. Yükleme bitince alttaki `Commit changes` düğmesine bas.

`server.js`, `package.json`, `render.yaml` ve `public` klasörünün GitHub sayfasında göründüğünden emin ol.

## 2. Render'da sunucuyu oluştur

1. [dashboard.render.com](https://dashboard.render.com) adresini aç ve GitHub hesabınla giriş yap.
2. `New +` düğmesine basıp `Blueprint` seç.
3. GitHub'daki `campus-head-ball` deposunu seç.
4. Render, paketteki `render.yaml` dosyasını otomatik okuyacak. Onay ekranında `Deploy Blueprint` düğmesine bas.
5. Kurulum tamamlanana kadar bekle. İlk kurulum birkaç dakika sürebilir.
6. Render sana buna benzer bir adres verecek:

```text
https://campus-head-ball.onrender.com
```

Bu adres senin oyunun kalıcı internet adresidir.

## 3. Arkadaşınla oyna

1. Sen ve arkadaşın aynı `https://...onrender.com` adresini açın.
2. Sen adını yazıp `Yeni Saha Kur` düğmesine bas.
3. Ekrandaki beş haneli saha kodunu en fazla üç arkadaşına gönder.
4. Arkadaşların aynı internet adresinde adlarını ve saha kodunu yazıp `Katıl` düğmesine bassın.
5. Oda sahibi 1'e 1 / 2'ye 2 düzenini ve kompakt / geniş saha boyutunu seçsin.
6. Herkes Mavi veya Kırmızı takımda boş bir koltuğa geçip karakterini seçsin ve `Hazırım` düğmesine bassın.
7. Oda sahibi `Maçı Başlat` düğmesine bassın. Eksik aktif koltukları bilgisayar tamamlar.

Arkadaşının `localhost:3001` adresine girmemesi gerekir. `localhost` yalnızca kendi bilgisayarında çalışır; arkadaşların Render'ın verdiği `https://...onrender.com` adresini kullanacak.

## Ücretsiz Render hakkında

Ücretsiz Render sunucusu 15 dakika kullanılmazsa uykuya geçebilir. İlk kişi siteyi tekrar açtığında uyanması yaklaşık bir dakika sürebilir. Sayfa ilk seferde yavaş açılırsa biraz bekleyip yenile. Maç sırasında bağlantı ve WebSocket mesajları sunucuyu aktif tutar.
