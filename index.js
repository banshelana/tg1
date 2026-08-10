// index.js
require('dotenv').config();
const { Bot } = require('grammy');

// Replace 'YOUR_BOT_TOKEN' with the token from BotFather
// Or better: create a .env file and store it there as BOT_TOKEN=your_token
const bot = new Bot(process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN');

// 1. Reply to the /start command
bot.command('start', (ctx) => {
  ctx.reply('Hello! I am your JavaScript bot. How can I help you?');
});

// 2. Reply to the /help command
bot.command('help', (ctx) => {
  ctx.reply('Send me a message and I will echo it back to you!');
});

// 3. Echo any text message back to the user
bot.on('message:text', (ctx) => {
  const userMessage = ctx.message.text;
  ctx.reply(`You said: ${userMessage}`);
});

// 4. Start the bot using Long Polling (no domain needed for development)
bot.start();
console.log('Bot is running and listening for messages...');