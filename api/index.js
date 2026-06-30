// NETLINK AGENCIES — Telegram Bot
// Run this on Replit. It forwards every message to your bot-access.js API
// and sends back whatever reply the API generates.
//
// SETUP ON REPLIT:
// 1. Create a Node.js Repl
// 2. Run: npm install node-telegram-bot-api node-fetch
// 3. Add these as Replit "Secrets" (lock icon on the left sidebar):
//      TELEGRAM_BOT_TOKEN   = your token from @BotFather
//      NETLINK_API_KEY      = the key you generated in /admin/api-key.html
// 4. Paste this file as index.js and click Run

const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_KEY = process.env.NETLINK_API_KEY;
const API_URL = 'https://netlinkagencies.vercel.app/api/bot-access';

if (!TELEGRAM_TOKEN) {
  console.error('Missing TELEGRAM_BOT_TOKEN in Replit Secrets.');
  process.exit(1);
}
if (!API_KEY) {
  console.error('Missing NETLINK_API_KEY in Replit Secrets.');
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

console.log('NETLINK AGENCIES Telegram bot is running...');

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text) return; // ignore non-text messages (stickers, images, etc.)

  try {
    bot.sendChatAction(chatId, 'typing');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        action: 'chat',
        chatId: chatId,
        message: text,
        platform: 'telegram'
      })
    });

    const data = await response.json();

    if (data.error) {
      await bot.sendMessage(chatId, '⚠️ ' + data.error);
      return;
    }

    await bot.sendMessage(chatId, data.reply, { disable_web_page_preview: true });

  } catch (err) {
    console.error('Bot error:', err.message);
    await bot.sendMessage(chatId, '❌ Something went wrong. Please try again in a moment.');
  }
});

bot.on('polling_error', (err) => {
  console.error('Polling error:', err.message);
});
