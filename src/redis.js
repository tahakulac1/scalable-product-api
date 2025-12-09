console.log("redis çalıştı");
const {createClient} = require("redis");

const redisClient = createClient({
    socket: {
        host: "localhost",
        port:6379
    }
});

// hata kodu
redisClient.on("error", (err) => {
    console.error("Redis bağlantı hatası.", err);

});

//bağlantı sağlandığında

redisClient.on("connect", ()=> {
    console.log("Redis'e bağlanıldı");
});

//bağlantıyı başlat
(async () => {
    try {
        await redisClient.connect();

    }catch (err) {
        console.error("Redis connect() hatası:", err );
    }
})();

module.exports = redisClient;
