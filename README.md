#  Scalable Product API

Bu proje; yüksek performanslı, ölçeklenebilir ve güvenli bir RESTful API mimarisi sunmak amacıyla geliştirilmiştir. Modern backend teknolojileri kullanılarak inşa edilmiş olup, Docker sayesinde tek komutla herhangi bir ortamda çalıştırılabilir.

##  Kullanılan Teknolojiler

*   **Backend:** Node.js, Express.js
*   **Veritabanı & ORM:** PostgreSQL, Prisma ORM
*   **Önbellekleme (Caching):** Redis (`ioredis`)
*   **Güvenlik:** JWT (JSON Web Token), Bcrypt, Custom Rate Limiter (Redis tabanlı)
*   **Konteynerizasyon:** Docker & Docker Compose

##  Öne Çıkan Özellikler

*   **🔐 Kimlik Doğrulama:** JWT tabanlı güvenli Register/Login işlemleri. Şifreler veritabanında Bcrypt ile hash'lenerek saklanır.
*   **⚡ Redis Caching:** Sık istek atılan listeleme uç noktaları (endpoint) Redis ile önbelleğe alınır. Veritabanı yükü minimuma indirilerek milisaniyelik yanıt süreleri elde edilir.
*   **🛡️ Rate Limiting:** Kötü niyetli spam ve DDoS saldırılarına karşı IP bazlı istek sınırlandırması (Sliding Window algoritması ile).
*   **🐳 Tamamen Dockerize:** Uygulama, Veritabanı (Postgres) ve Önbellek (Redis) servisleri `docker-compose` ile birbirine entegre ve izole şekilde çalışır.

## 🚀 Kurulum ve Çalıştırma

Projeyi yerel ortamınızda çalıştırmak için sisteminizde **Docker** ve **Docker Compose** kurulu olmalıdır.

### 1. Projeyi Klonlayın
```bash
git clone [https://github.com/tahakulac1/scalable-product-api.git](https://github.com/tahakulac1/scalable-product-api.git)
cd scalable-product-api