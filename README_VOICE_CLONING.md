# Campus Voice Lab

Bu uygulama, yalnızca sahibinden izin alınmış referans seslerle yerel ses üretimi için hazırlanmıştır. Ses dosyası tarayıcıdan sunucuya işlenmek üzere gider; kalıcı bir ses profili/veritabanı tutulmaz.

## Model seçimi

- **XTTS-v2:** Türkçe dahil 16 dil, kısa referans klibi ve kolay başlangıç. Coqui Public Model License.
- **F5-TTS:** Akıcı ve doğal uzun metinler için güçlü seçenek. Kod MIT, önceden eğitilmiş model CC-BY-NC; ticari kullanım öncesi model lisansını ayrıca kontrol edin.
- **OpenVoice v2:** MIT lisanslı ve hızlı ton rengi aktarımı; v2'nin yerleşik dil listesi Türkçe içermez, bu nedenle Türkçe ana kullanım için XTTS önerilir.

## Kurulum (GPU önerilir)

Python 3.10/3.11 ve FFmpeg kurulu bir ortamda:

```bash
python3 -m venv .voice-venv
source .voice-venv/bin/activate
pip install --upgrade pip
pip install TTS
```

XTTS'i gerçek uygulama endpoint'ine bağlamak için komut şablonunu aşağıdaki gibi ayarlayın. `voice_engine.py` gelen dosyayı WAV'a çevirip XTTS-v2 ile üretir:

```bash
export VOICE_TTS_COMMAND="python3 voice_engine.py --engine {engine} --reference_audio {reference_audio} --reference_text {reference_text} --text {text} --output {output}"
npm start
```

F5-TTS için resmi depodaki kurulum ve model indirme adımlarını takip edin: https://github.com/SWivid/F5-TTS . Sonra aynı komut şablonunda `voice_engine.py` yerine kendi F5-TTS wrapper'ınızı kullanın. Resmi CLI örneği:

```bash
f5-tts_infer-cli --model F5TTS_v1_Base --ref_audio reference.wav --ref_text "..." --gen_text "..."
```

OpenVoice v2 için resmi repo: https://github.com/myshell-ai/OpenVoice . OpenVoice v2'nin yerleşik dilleri İngilizce, İspanyolca, Fransızca, Çince, Japonca ve Korecedir.

## Güvenlik

Uygulama üretimden önce açık rıza kutusu ister. Gerçek kişiler adına izinsiz klonlama, kimlik taklidi veya dolandırıcılık amacıyla kullanmayın; dışarıya açacaksanız kimlik doğrulama, oran sınırlama, dosya boyutu/süre sınırı ve üretilen ses için provenance/watermark katmanı ekleyin.
