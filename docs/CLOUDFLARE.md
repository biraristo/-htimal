# Cloudflare Pages ile yayın

GitHub hesabına bağlı Cloudflare panelinde Workers & Pages → Create application → Pages → Connect to Git adımlarını izleyin. GitHub uygulamasına yalnızca biraristo/-htimal için erişim verin. Hesap onayı panelden yapılır.

| Ayar | Değer |
|---|---|
| Proje adı önerisi | ihtimal-atlas |
| Üretim dalı | main |
| Framework | None |
| Derleme komutu | Boş bırakın |
| Çıktı dizini | public |
| Kök dizin | Depo kökü |
| Ortam sırrı | Gerekmiyor |

Save and Deploy sonrası Pages'in gösterdiği adresi açın. Bir göstergenin iki ülke için yüklenmesini ve kaynak arşivinden bir dosyanın indirilmesini kontrol edin. GitHub'a yeni sürüm gelince Pages yeniden dağıtır. Veri derlemesi Pages'in derleme aşamasında çalışmaz; GitHub Actions sonuçları depoya yazar.

[Cloudflare Git bağlantısı](https://developers.cloudflare.com/pages/get-started/git-integration/)
