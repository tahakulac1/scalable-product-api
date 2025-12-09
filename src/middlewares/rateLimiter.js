const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 1*60*1000,
    max:50,
    message: {
        message: "İstek sınırı aşıldı."
    }
});
module.exports = limiter;