# Kapsam ve yeniden kullanım

Gözlemlerin birimleri, dönemleri ve paydaları kaynağın kendi tanımına göre değerlendirilmelidir. Ülke, bölge ve dünya toplamları bir arada toplanmamalıdır. Arşiv dosyaları resmî toplu tablolardan dönüştürülmüştür. Her indirme adresi ve indirilen girdi dosyasının SHA-256 özeti [katalogda](../public/data/catalog.json) bulunur.

| Koleksiyon | Dağıtılan içerik ve sınır |
|---|---|
| Dünya Bankası WDI | Yeniden dağıtım lisansı CC BY 4.0 veya CC BY 3.0 IGO olarak işaretlenmiş serilerin tüm dolu ülke/yıl gözlemleri ve toplulaştırılmış coğrafyalar. Orijinal üretici, tanım, lisans ve dipnotlar WDISeries ve WDIfootnote tablolarındadır. SIPRI koşullu altı seri dışarıda bırakıldı. Grafikler yalnızca ülke ve ekonomileri içerir. |
| Global Findex 2025 | Tüm yayımlanan toplulaştırılmış ülke/grup kayıtları. Oran ile yüzdeyi, grup ile toplamı ayırın. Sütun açıklamaları için üreticinin sözlüğüne bakın. |
| Dünya Bankası PIP | 2021 satın alma gücü paritesine dayalı 100 dilimlik anket dağılımları. Gelir ve tüketim ölçüleri ayrı tutulur. |
| GDIM / GSAP | Ebeveyn-çocuk eğitim hareketliliği ve seçili yıllarda bölgesel yoksulluk. GSAP özgün Excel dosyası içinde gösterge sözlüğü vardır. Yayıncı Dünya Bankası, CC BY 4.0. |
| BM WPP | UN DESA Population Division, World Population Prospects 2024, CC BY 3.0 IGO. Standart orta senaryo demografik göstergeleri ve 1950–2023 kısaltılmış yaşam tabloları. 2024 ve sonraki yıllar bu revizyonda projeksiyondur. Togo için BM düzeltme dosyasındaki demografi satırları ülke, yıl ve senaryo anahtarıyla ana tabloya uygulanmıştır. |
| WHO / UNICEF JMP | Ülke ve kır/kent düzeyinde su, sanitasyon ve hijyen tahminleri, nüfus ve hizmet sınıfı kaynak sütunlarıyla. |
| Eurostat | Yaş ve yoksulluk durumuna göre konut yükü (iki cinsiyet toplamı); erişilen ücretsiz çalışma zamanı tablosunun tüm boyutları. Kaynak JSON-stat dosyalarında boyut sözlükleri ve mevcut gözlem bayrakları korunur. |
| NASA POWER | Ankara, Tokyo ve Lagos için istenen koordinatlarda iki metrede sıcaklık ve düzeltilmiş yağış klimatolojisi. Bunlar nokta örnekleridir. Kesin dönem, birim ve koordinat her JSON dosyasında bulunur. |
| Natural Earth | Ana sayfadaki küre geometrisi Natural Earth 1:110m Land kamu malı kıyı çizgilerinden türetilmiştir. |

Dünya Bankası ve özgün veri üreticilerine atıf, sonraki dağıtımlarda da korunmalıdır. [Dünya Bankası veri koşulları](https://data.worldbank.org/summary-terms-of-use). [BM veri portalı](https://population.un.org/wpp/). [Eurostat yeniden kullanım politikası](https://ec.europa.eu/eurostat/about-us/policies/copyright). [Findex sözlük ve yöntem belgeleri](https://www.worldbank.org/en/publication/globalfindex/download-data).

## Kapsama alınacak diğer kaynaklar

- UNESCO WIDE toplu dosyası incelendi. Ticari kullanım ve çeviri için ayrı izin isteyen WIDE koşulları nedeniyle herkese açık pakete alınmadı. [Koşullar](https://www.education-inequalities.org/terms-and-conditions).
- [TÜİK yerel doğumlar](https://veriportali.tuik.gov.tr/tr/databrowser/tuik/TR%2CDF_DOGUM_IL_ILCE_C%2C1.0), [Nijerya MICS eyalet tabloları](https://www.unicef.org/nigeria/media/6126/file/2021%20MICS%20Statistical%20Snapshots%20Report.pdf) ve [Japonya e-Stat](https://www.e-stat.go.jp/api/en) ayrı ulusal kaynaklardır. TÜİK doğum tablosunun doğrudan SDMX isteği kimlik doğrulaması istedi. Türkiye için Eurostat demo_r_births içinden TR kodlu NUTS 3 doğumları, Nijerya için 2021 MICS raporunun 50. sayfasındaki tamamlama oranları, Japonya için Statistics Bureau 2026 el kitabı Ek 1’den prefektörlüklerin 2024 nüfus ve alan sütunları [bölgesel CSV dosyaları](../public/bolgeler/) olarak ayrıca çıkarıldı. Eurostat özgün bayrakları korunmuştur. Japonya tablosunda nüfusun birimi bin kişidir.
- ERA5 saatlik ızgaraları ve sağlık kuruluşuna erişim rasterları için coğrafi örnekleme ve dönem eşleştirmesi gerekir. [Copernicus](https://cds.climate.copernicus.eu/datasets/reanalysis-era5-land) ve [MAP](https://malariaatlas.org/project-resources/accessibility-to-healthcare/).
- DHS, IPUMS ve TÜİK birey/hane mikro verilerinin erişim izinleri toplulaştırılmış yayınlardan ayrıdır. Kamu deposunda kişisel kayıt veya API anahtarı tutulmaz.
