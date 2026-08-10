// index.js
require('dotenv').config();
const express = require('express');
const { Bot, webhookCallback } = require('grammy');

// 1. Initialize your bot
const bot = new Bot(process.env.BOT_TOKEN);

// 2. Your bot's logic (commands, messages, etc.)
bot.command('start', (ctx) => {
  ctx.reply('Hello! I am running via Webhooks! 🚀');
});

bot.command('help', (ctx) => {
  ctx.reply('Send me any text and I will echo it back.');
});

bot.on('message:text', (ctx) => {
  ctx.reply(`You said: ${ctx.message.text}`);
});

// 3. Create an Express web server
const app = express();
const PORT = process.env.PORT || 3000;

// IMPORTANT: Tell Express to parse JSON bodies from Telegram
app.use(express.json());

// 4. The webhook endpoint (path)
// Using the bot token as the path adds a layer of security.
// Only Telegram (or someone who knows your token) can hit this URL.
const WEBHOOK_PATH = `/webhook/${process.env.BOT_TOKEN}`;

// Connect the bot to the Express route
app.post(WEBHOOK_PATH, webhookCallback(bot, 'express'));

// 5. Health check for Render (keeps the service happy)
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// 6. Start the server
app.listen(PORT, async () => {
  console.log(`Web server is running on port ${PORT}`);

  // 7. Set the webhook URL for Telegram (this happens once when the server starts)
  // Render automatically sets the environment variable RENDER_EXTERNAL_URL
  const baseUrl = process.env.RENDER_EXTERNAL_URL || 'https://your-app-url.onrender.com';
  const webhookUrl = `${baseUrl}${WEBHOOK_PATH}`;

  try {
    // Tell Telegram where to send updates
    await bot.api.setWebhook(webhookUrl);
    console.log(`✅ Webhook successfully set to: ${webhookUrl}`);
  } catch (error) {
    console.error('❌ Failed to set webhook:', error);
  }
});