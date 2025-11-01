# GitHub Webhook ile PR Açıklaması Üreten Server

 Genel Tanım

Bu proje, Deeployed Peer Case Study kapsamında, GitHub üzerinden açılan Pull Request (PR) olaylarını dinleyip, değişiklikleri analiz ederek yapay zekâ destekli PR açıklamaları (description) üreten bir backend servistir.
Amaç, otomatik PR açıklaması oluşturma sürecini uçtan uca modelleyerek; webhook entegrasyonu, API kullanımı, test ortamı, kod organizasyonu ve deployment konularında yetkinlik göstermektir.

Teknolojiler ve Mimarî
Katman	Teknoloji	Açıklama
Backend	Bun.js + Express.js	Hafif, hızlı ve modüler backend mimarisi için tercih edildi.
Yapay Zekâ Servisi	Gemini API (Google AI Studio)	Açıklama üretimi için kullanıldı. 
Gerekçe: Gemini, diff benzeri uzun metinlerde bağlamı koruyarak daha doğal açıklamalar üretmekte başarılıdır.
Webhook Routing	Ngrok Tunnel	Lokal geliştirme ortamında GitHub webhook’larının test edilebilmesi için kullanıldı. Kalıcı ve güvenli bir routing çözümü sağladı.
Test Ortamı	bun:test + Supertest	Hem birim hem entegrasyon testlerinde, HTTP endpoint’lerinin gerçekçi şekilde doğrulanması için tercih edildi. 

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

