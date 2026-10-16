# Scalable Product API

Node.js ve Express ile yazılmış bir ürün yönetimi REST API'si. Veriler PostgreSQL'de (Prisma ORM) tutulur, sık okunan cevaplar Redis'te önbelleğe alınır ve istekler Redis tabanlı bir rate limiter ile sınırlandırılır. Tüm servisler Docker Compose ile tek komutla ayağa kalkar.

## Kullanılan Teknolojiler

* **Backend:** Node.js, Express.js
* **Veritabanı & ORM:** PostgreSQL, Prisma ORM
* **Önbellekleme:** Redis (`ioredis`)
* **Güvenlik:** JWT, Bcrypt, rol tabanlı yetkilendirme (USER / ADMIN), Redis tabanlı rate limiter
* **Konteynerizasyon:** Docker & Docker Compose

## Öne Çıkan Özellikler

* **Kimlik doğrulama:** JWT tabanlı register/login. Şifreler bcrypt ile hash'lenir. Giriş hatalarında "kullanıcı yok" ile "şifre yanlış" ayırt edilmez, böylece hangi emaillerin kayıtlı olduğu dışarı sızmaz.
* **Rol tabanlı yetkilendirme:** Ürünleri her giriş yapmış kullanıcı görebilir; ekleme, güncelleme ve silme sadece `ADMIN` rolüne açıktır.
* **Redis cache:** Ürün listesi (sayfa bazında) ve tekil ürünler Redis'te 1 saat tutulur. Ürün eklenince, güncellenince veya silinince ilgili cache temizlenir (`SCAN` ile, Redis'i kilitlemeden).
* **Rate limiting:** IP başına dakikada 50 istek. Sliding window algoritması, Redis sorted set üzerinde tek bir Lua script'i ile atomik olarak çalışır. Redis erişilemezse uygulama durmaz, bellekteki sayaca geçer.
* **Dayanıklılık:** Redis kapalıyken API cache'siz çalışmaya devam eder.
* **Doğrulama:** `page`/`limit`, ürün id'si, isim ve fiyat alanları kontrol edilir; hatalı isteklere 400, olmayan kayıtlara 404 döner.

## Kurulum ve Çalıştırma

Sisteminizde **Docker** ve **Docker Compose** kurulu olmalıdır.

```bash
git clone https://github.com/tahakulac1/scalable-product-api.git
cd scalable-product-api
cp .env.example .env        # JWT_SECRET değerini değiştirin
docker compose up --build
```

API `http://localhost:3000` adresinde çalışır. Container başlarken Prisma şeması veritabanına otomatik uygulanır.

### Admin kullanıcı oluşturma

Yeni kayıt olan herkes `USER` rolüyle başlar. Bir kullanıcıyı admin yapmak için:

```bash
docker compose exec api npm run make-admin -- kullanici@ornek.com
```

Ardından tekrar login olun (rol bilgisi token'ın içinde taşınır).

## Endpoint'ler

Korumalı endpoint'lerde header: `Authorization: Bearer <token>`

| Metot | Yol | Yetki | Açıklama |
|---|---|---|---|
| POST | `/auth/register` | Herkes | `{ "email", "password" }` (şifre en az 8 karakter) |
| POST | `/auth/login` | Herkes | Token döner (1 saat geçerli) |
| GET | `/products?page=1&limit=10` | Giriş yapmış | Sayfalı liste (cache'li) |
| GET | `/products/:id` | Giriş yapmış | Tek ürün (cache'li) |
| POST | `/products` | ADMIN | `{ "name", "price" }` |
| PUT | `/products/:id` | ADMIN | `{ "name"?, "price"? }` |
| DELETE | `/products/:id` | ADMIN | Ürünü siler |

Cevaplardaki `cached: true/false` alanı verinin Redis'ten mi veritabanından mı geldiğini gösterir.
