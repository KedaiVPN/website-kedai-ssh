require("dotenv").config();
const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// === Guardian: Auto delete forwarded messages di group ===
bot.on("message", async (ctx, next) => {
    const chat = ctx.chat;
    const msg = ctx.message;

    if (chat.type === "group" || chat.type === "supergroup") {
        if (msg.forward_from || msg.forward_from_chat) {

            try {
                const member = await ctx.getChatMember(msg.from.id);
                const status = member.status;

                if (status !== "creator" && status !== "administrator") {
                    await ctx.deleteMessage();
                    console.log("Pesan forward dihapus dari non-admin.");
                    return; 
                } else {
                    console.log("Pesan forward dari admin/owner — tidak dihapus.");
                }

            } catch (err) {
                console.error("Gagal cek admin / menghapus pesan:", err);
            }
        }
    }

    return next();
});


// Fungsi delay
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Cek apakah pesan dikirim di private chat
function isPrivateChat(ctx) {
    return ctx.message.chat.type === "private";
}

// Fungsi kirim info file
async function sendFileInfo(ctx, file, type) {
    // Abaikan jika pesan dari grup
    if (!isPrivateChat(ctx)) return;

    try {
        await ctx.reply(`⏳ *Processing... Mohon tunggu 10 detik...*`, { parse_mode: "Markdown" });

        // Delay agar Telegram selesai memproses file_path
        await delay(10000);

        await ctx.reply(
            `📁 *TYPE:* ${type}\n` +
            `🆔 *file_id:*\n\`${file.file_id}\`\n\n` +
            `🔑 *file_unique_id:*\n\`${file.file_unique_id}\``,
            { parse_mode: "Markdown" }
        );

    } catch (err) {
        console.error("Error sending file info:", err);
    }
}

// Handler FILE
bot.on("video", (ctx) => sendFileInfo(ctx, ctx.message.video, "video"));
bot.on("document", (ctx) => sendFileInfo(ctx, ctx.message.document, "document"));

bot.on("photo", (ctx) => {
    const photo = ctx.message.photo.pop();
    sendFileInfo(ctx, photo, "photo");
});

bot.on("audio", (ctx) => sendFileInfo(ctx, ctx.message.audio, "audio"));
bot.on("voice", (ctx) => sendFileInfo(ctx, ctx.message.voice, "voice"));

// Handler text
bot.on("text", (ctx) => {
    if (!isPrivateChat(ctx)) return; // ignore text in group
    ctx.reply("Kirim video / foto / dokumen untuk mendapatkan file_id (butuh 10 detik).");
});


bot.launch();
console.log("🤖 GetFileID bot berjalan dengan filter private chat + delay 10 detik...");
