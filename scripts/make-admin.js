// Kullanım: npm run make-admin -- kullanici@ornek.com
// Docker içinde: docker compose exec api npm run make-admin -- kullanici@ornek.com
require('dotenv').config();
const prisma = require('../src/prismaClient');

async function main() {
    const email = process.argv[2];
    if (!email) {
        console.error("Kullanım: npm run make-admin -- <email>");
        process.exit(1);
    }

    const user = await prisma.user.update({
        where: { email },
        data: { role: "ADMIN" }
    });
    console.log(`${user.email} artık ADMIN.`);
}

main()
    .catch((err) => {
        console.error(err.code === "P2025" ? "Bu email ile kullanıcı bulunamadı." : err);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
