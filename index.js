// index.js - Bot Playground Template
require('dotenv').config();
const express = require('express');
const { Bot, webhookCallback, session, InlineKeyboard, Keyboard } = require('grammy');

// =============================================
// 1. INITIALIZE BOT & SESSION (for storing user data)
// =============================================
const bot = new Bot(process.env.BOT_TOKEN);

// Session stores temporary data for each user (like form progress)
function initialSession() {
  return { step: 'idle', name: '', age: '' };
}
bot.use(session({ initial: initialSession }));

// =============================================
// 2. COMMANDS
// =============================================

// --- /start - Welcome & Reset ---
bot.command('start', async (ctx) => {
  ctx.session.step = 'idle';
  await ctx.reply(
    `🚀 Welcome to the Bot Playground!\n\n` +
    `Try these commands:\n` +
    `/menu - Show inline buttons\n` +
    `/form - Start a multi-step form\n` +
    `/media - Send photos & files\n` +
    `/keyboard - Show a custom reply keyboard\n` +
    `/cancel - Cancel the form`
  );
});

// --- /menu - Inline Buttons (actions below the message) ---
bot.command('menu', async (ctx) => {
  const keyboard = new InlineKeyboard()
    .text('👋 Say Hello', 'hello_btn')
    .text('🕐 Show Time', 'time_btn')
    .row() // new row
    .text('📝 Start Form', 'form_btn')
    .text('🗑️ Delete This', 'delete_btn');

  await ctx.reply('Choose an option:', { reply_markup: keyboard });
});

// --- /form - Start the interactive form ---
bot.command('form', async (ctx) => {
  ctx.session.step = 'awaiting_name';
  ctx.session.name = '';
  ctx.session.age = '';
  await ctx.reply(
    `📝 Let's fill out a form!\n\n` +
    `What is your name?\n` +
    `(Type /cancel to stop)`
  );
});

// --- /media - Send different file types ---
bot.command('media', async (ctx) => {
  await ctx.reply('📸 Sending you some media:');

  // Send a random photo
  await ctx.replyWithPhoto('https://picsum.photos/400/300', {
    caption: '✨ Random photo from the internet!'
  });

  // Send a dummy PDF document
  await ctx.replyWithDocument('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', {
    caption: '📄 A dummy PDF file.'
  });

  await ctx.reply('You can also send me images, videos, or files directly!');
});

// --- /keyboard - Reply Keyboard (replaces the user's typing bar) ---
bot.command('keyboard', async (ctx) => {
  const keyboard = new Keyboard()
    .text('📍 Share Location').requestLocation() // Requests GPS
    .row()
    .text('📞 Share Contact').requestContact() // Requests phone
    .row()
    .text('✅ Done')
    .row()
    .text('❌ Cancel');

  await ctx.reply(
    'Here is a custom keyboard!\n\n' +
    'Try the "Share Location" or "Share Contact" buttons.\n' +
    'Telegram will ask for your permission first.',
    { reply_markup: keyboard }
  );
});

// --- /cancel - Abort any ongoing form ---
bot.command('cancel', async (ctx) => {
  ctx.session.step = 'idle';
  await ctx.reply('❌ Form cancelled. Start over with /form');
});

// =============================================
// 3. HANDLE INLINE BUTTON CLICKS (Callback Queries)
// =============================================

bot.callbackQuery('hello_btn', async (ctx) => {
  await ctx.answerCallbackQuery(); // Dismiss the loading animation
  await ctx.reply(`👋 Hello, ${ctx.from.first_name}! Welcome to the bot!`);
});

bot.callbackQuery('time_btn', async (ctx) => {
  await ctx.answerCallbackQuery();
  const now = new Date();
  await ctx.reply(`🕐 Current server time: ${now.toLocaleTimeString()}`);
});

bot.callbackQuery('form_btn', async (ctx) => {
  await ctx.answerCallbackQuery('Starting the form...');
  // Trigger the same action as /form
  ctx.session.step = 'awaiting_name';
  await ctx.reply(`📝 What is your name?\n(Type /cancel to stop)`);
});

bot.callbackQuery('delete_btn', async (ctx) => {
  await ctx.answerCallbackQuery('Deleting this message...');
  try {
    await ctx.deleteMessage(); // Deletes the message with the buttons
    await ctx.reply('🗑️ Message deleted successfully!');
  } catch (error) {
    await ctx.reply('❌ I cannot delete this message (maybe too old or missing permissions).');
  }
});

// =============================================
// 4. HANDLE TEXT MESSAGES & FORM LOGIC (State Machine)
// =============================================

bot.on('message:text', async (ctx) => {
  const step = ctx.session.step;
  const text = ctx.message.text;

  // --- FORM STEP 1: Asking for Name ---
  if (step === 'awaiting_name') {
    ctx.session.name = text;
    ctx.session.step = 'awaiting_age';
    await ctx.reply(`Nice to meet you, ${text}! ✨\nNow, how old are you? (just type a number)`);
    return;
  }

  // --- FORM STEP 2: Asking for Age ---
  if (step === 'awaiting_age') {
    ctx.session.age = text;
    ctx.session.step = 'idle';
    await ctx.reply(
      `✅ Form complete!\n\n` +
      `📋 Summary:\n` +
      `Name: ${ctx.session.name}\n` +
      `Age: ${ctx.session.age}\n\n` +
      `Try /menu or /keyboard to test more features!`
    );
    return;
  }

  // --- DEFAULT: Echo everything else ---
  await ctx.reply(`You said: "${text}"\n\nTry /menu for interactive buttons!`);
});

// =============================================
// 5. HANDLE REPLY KEYBOARD ACTIONS
// =============================================

// "Done" button - removes the custom keyboard
bot.hears('✅ Done', async (ctx) => {
  await ctx.reply('👍 Keyboard removed!', {
    reply_markup: { remove_keyboard: true } // Hides the custom keyboard
  });
});

// "Cancel" button - removes keyboard
bot.hears('❌ Cancel', async (ctx) => {
  await ctx.reply('👋 Keyboard cancelled.', {
    reply_markup: { remove_keyboard: true }
  });
});

// "Share Location" button - just a reminder
bot.hears('📍 Share Location', async (ctx) => {
  await ctx.reply('📡 Press the location button on your keyboard to share your GPS!');
});

// "Share Contact" button - just a reminder
bot.hears('📞 Share Contact', async (ctx) => {
  await ctx.reply('📇 Press the contact button on your keyboard to share your phone number!');
});

// =============================================
// 6. HANDLE LOCATION & CONTACT SHARING
// =============================================

bot.on('message:location', async (ctx) => {
  const loc = ctx.message.location;
  await ctx.reply(
    `📍 Location received!\n` +
    `Latitude: ${loc.latitude}\n` +
    `Longitude: ${loc.longitude}\n\n` +
    `I can't actually track you (I'm just a bot), but cool feature, right? 🤖`
  );
});

bot.on('message:contact', async (ctx) => {
  const contact = ctx.message.contact;
  await ctx.reply(
    `📇 Contact received!\n` +
    `Name: ${contact.first_name} ${contact.last_name || ''}\n` +
    `Phone: ${contact.phone_number}\n\n` +
    `I won't call you, don't worry! 😄`
  );
});

// =============================================
// 7. HANDLE PHOTOS & FILES UPLOADED BY THE USER
// =============================================

bot.on('message:photo', async (ctx) => {
  // Get the photo file ID
  const photo = ctx.message.photo[ctx.message.photo.length - 1]; // Largest size
  await ctx.reply(`📸 Nice photo! File ID: ${photo.file_id.substring(0, 20)}...\nI'll save it for later!`);
});

bot.on('message:document', async (ctx) => {
  const doc = ctx.message.document;
  await ctx.reply(`📄 Received a file: ${doc.file_name || 'unknown'}\nSize: ${doc.file_size} bytes`);
});

// =============================================
// 8. EXPRESS WEB SERVER + WEBHOOK SETUP (for Render)
// =============================================

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// The webhook endpoint
const WEBHOOK_PATH = `/webhook/${process.env.BOT_TOKEN}`;
app.post(WEBHOOK_PATH, webhookCallback(bot, 'express'));

// Health check for Render
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get('/', (req, res) => {
  res.send('Telegram Bot is running! 🤖');
});

// Start the server
app.listen(PORT, async () => {
  console.log(`🌐 Web server running on port ${PORT}`);

  // Set webhook automatically
  const baseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  const webhookUrl = `${baseUrl}${WEBHOOK_PATH}`;

  try {
    await bot.api.setWebhook(webhookUrl);
    console.log(`✅ Webhook successfully set to: ${webhookUrl}`);
    console.log(`🤖 Bot is ready! Talk to it on Telegram.`);
  } catch (error) {
    console.error('❌ Failed to set webhook:', error.message);
  }
});