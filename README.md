# GitHub Webhook ile PR Açıklaması Üreten Server

 Genel Tanım

Bu proje, Deeployed Peer Case Study kapsamında, GitHub üzerinden açılan Pull Request (PR) olaylarını dinleyip, değişiklikleri analiz ederek yapay zekâ destekli PR açıklamaları (description) üreten bir backend servistir.
Amaç, otomatik PR açıklaması üretim sürecini uçtan uca modelleyip; webhook entegrasyonu, yapay zekâ kullanımı, test geliştirme, kod organizasyonu ve deploy süreci gibi alanlardaki teknik yeterliliği göstermektir.

Teknolojiler ve Mimarî
Katman	Teknoloji	Açıklama
Backend:	Bun.js + Express.js	Yüksek performanslı, minimal ve modern bir backend mimarisi sağlamak için tercih edildi.
Yapay Zekâ Servisi:	Gemini API (Google AI Studio)	PR içeriğini anlamlı özetlere dönüştürmede başarılı olduğu ve doğal dil üretiminde tutarlılık sağladığı için seçildi.
Webhook Routing:	Ngrok	Lokal geliştirme sürecinde GitHub webhook isteklerini güvenli şekilde yönlendirmek için kullanıldı.
Kapsülleme:	Docker	Proje tüm bağımlılıklarıyla birlikte kapsüllenerek kolay deploy ve taşınabilirlik sağlandı.
Test Ortamı:	bun:test + Supertest	API endpoint’lerini gerçekçi senaryolarla doğrulamak için kullanıldı.
Deployment:	Dockerized Production Environment	Proje, Docker imajı olarak paketlenip production-ready biçimde deploy edildi.


Fonksiyonel Özellikler
/webhook endpoint’i, GitHub App tarafından tetiklenen pull_request.opened olaylarını dinler.

PR verisini analiz ederek, Gemini API üzerinden anlamlı ve özet bir açıklama üretir.

Yeni açıklama PR’ın description alanına otomatik olarak güncellenir.

Servis, AI tarafından güncellenmiş PR’ları atlar ve gereksiz tekrarları önler.

Eşzamanlı PR isteklerini güvenli şekilde yönetir, veri bütünlüğünü korur.

 Test Yapısı
 Unit Testler (/tests/unit.test.js)

Gemini API entegrasyonu ve hata yönetimini doğrular:

API başarıyla çalıştığında “PR description updated” log’unu üretir.

Ağ veya model hatası durumunda "Gemini API request failed" mesajı loglanır.
Bu testler, AI yanıtlarının asenkron güvenliği ve hata toleransını ölçmek için tasarlandı.

Integration Testler (/tests/integration.test.js)

Gerçek istek akışını uçtan uca doğrular:

Webhook bağlantısı (ping) 200 döner ve “Webhook connection verified!” loglanır.

AI tarafından zaten güncellenmiş PR’lar atlanır.

Kod değişikliği olmayan PR’lar tespit edilip işlenmez.

Gemini API başarısız olduğunda hata düzgün yakalanır ve sistem kararlılığı korunur.

Eşzamanlı gelen iki PR isteği race condition olmadan güvenli biçimde işlenir.

Bu testler, sistemin dağıtık ortamlarda ve paralel istekler altında kararlı çalıştığını kanıtlar.

# Kurulum
npm install

# Geliştirme ortamında çalıştırma
bun run dev

# Testleri çalıştırma
bun test

ngrok http 3000
ve GitHub App webhook URL’ini https://<ngrok-url>/webhook olarak ayarlayın.

#Docker Kullanımı ve Deploy

Proje, Docker üzerinden kolayca çalıştırılabilir ve dağıtılabilir hale getirilmiştir.

Docker image oluşturma:
docker build -t pr-bot-server .

Container’ı çalıştırma:
docker run -d -p 3000:3000 pr-bot-server

Deploy:

Docker image, production ortamına taşınarak webhook bağlantısı aktif hale getirilmiştir.
Bu sayede CI/CD dostu, izole, ölçeklenebilir bir servis elde edilmiştir.

Gemini API, PR içeriğini (diff, başlık, commit özetleri) analiz ederek geliştirici dostu açıklamalar üretir.
Model, sadece “ne değiştiğini” değil “neden değiştiğini” öne çıkaran kısa özetler üretmek üzere prompt edilmiştir:

"Analyze the following pull request changes and generate a concise, natural summary describing what this PR does."
 Geliştirici

İlayda Azra Çelikkaya
Contributor: @atakansarifoglu

Proje: Deeployed Peer Case Study — GitHub Webhook PR Description Generator

PR Örnekleri
Durum	Açıklama	Link
Başarılı PR	Otomatik PR açıklaması başarıyla üretildi	PR https://github.com/ilaydaazracelikkaya-lab/pr-bot-bun/pull/23

Başarısız PR	Gemini API hata senaryosu test edildi	PR https://github.com/ilaydaazracelikkaya-lab/pr-bot-bun/pull/22

