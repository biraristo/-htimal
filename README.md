# İhtimal — Yaşam atlası

Ülkeler ve yıllar arasında yaşam göstergelerini karşılaştıran Türkçe veri arayüzü ve üç kararlı yaşam prototipi.

- [Veri arşivi](public/data/archive) ve [makine tarafından okunabilir kaynak kataloğu](public/data/catalog.json)
- [Kaynaklar, atıflar ve sınırlamalar](docs/KAYNAKLAR.md)
- [Cloudflare Pages kurulumu](docs/CLOUDFLARE.md)

## Çalıştırma

Depo kökünde `python3 -m http.server 8000 --directory public` çalıştırıp tarayıcıda http://localhost:8000 açın. Hazır veri dosyalarıyla çalışır.

## Veri derleme

Python 3.11+ ve curl ile `python3 scripts/collect.py` resmî kaynakları .cache/ içine indirir. Farklı bir konum için --cache seçeneğini kullanabilirsiniz. Kaynak yenilemek için temiz bir önbellek seçin. Derleme tüm dosyalar hazırlandıktan sonra public/data klasörünü değiştirir. GitHub Actions'taki “Açık veri derlemesi” elle de başlatılabilir; başarılı olduğunda sonuçları main dalına aktarır.

## Veritabanı

public/data/archive/pilot.sqlite.gz üç pilot ülkenin yıl ve gösterge düzeyindeki WDI gözlemlerini, gösterge tanımlarını ve kaynaklarını içerir. Sıkıştırmayı açtıktan sonra SQLite veya uyumlu bir masaüstü aracıyla sorgulayabilirsiniz. Örneğin:

```sql
SELECT country, year, value FROM latest WHERE metric = 'SP.DYN.LE00.IN';
```

Küresel WDI arşivi orijinal hassasiyette CSV sütunları ve ayrı dipnot dosyalarını korur. Eksik değerler grafikte boş kalır. Anketler, dönemler, ülkeler ve bölge toplamları kapsamlarına göre farklıdır. Simülasyonun doğum çekilişi 2023 BM doğum verileriyle ağırlıklandırılmıştır; sonraki kararlar editoryal senaryolardır. Oyun kaydı cihazda tutulur.
