# Telegram Bot Setup Guide

This guide will help you set up a Telegram bot for joke submission notifications with accept/reject buttons.

## 🤖 Setup Steps

### 1. Create Telegram Bot

1. **Open Telegram** and search for `@BotFather`
2. **Start a chat** with BotFather
3. **Send `/newbot`** command
4. **Enter bot name**: `Poor Jokes Admin Bot`
5. **Enter bot username**: `poor_jokes_admin_bot` (must end with `_bot`)
6. **Copy the bot token** - you'll need this for environment variables

### 2. Get Your Chat ID

1. **Start a chat** with your new bot
2. **Send any message** to the bot (e.g., `/start`)
3. **Visit this URL** in your browser:
   ```
   https://api.telegram.org/bot7296453919:AAENy0erUuyv_KV10cYwpLEbKuxdjgQDRaw/getUpdates
   ```
4. **Find your chat ID** in the response (look for `"chat":{"id":123456789}`)
5. **Copy the chat ID** - you'll need this for environment variables

### 3. Set Webhook (Optional)

For production, set up a webhook:
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-vercel-app.vercel.app/api/telegram-webhook"}'
```

### 4. Set Environment Variables

Add these to your Vercel environment variables:

```env
# Required
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here

# Optional
API_URL=https://your-vercel-app.vercel.app
```

## 🎯 How It Works

### New Submission Flow
1. **User submits joke** through the extension
2. **Telegram message sent** to your chat with:
   - Joke content
   - Submission details
   - ✅ Approve button
   - ❌ Reject button
   - 👀 Admin Dashboard link

### Button Actions
- **✅ Approve**: Adds joke to collection, updates message
- **❌ Reject**: Marks as rejected, updates message
- **👀 Admin Dashboard**: Opens web admin panel

### Message Updates
- **Real-time updates**: Messages update when you click buttons
- **Status changes**: Shows approval/rejection status
- **No spam**: Each submission gets one message

## 🧪 Testing

### Test Bot Setup
1. **Set environment variables** in Vercel
2. **Submit a test joke** through the extension
3. **Check Telegram** for the notification
4. **Click approve/reject** buttons
5. **Verify** the joke appears/disappears in the collection

### Test Commands
- `/start` - Start the bot
- `/help` - Get help information

## 🎨 Customization

You can customize the bot by editing:
- `lib/telegram-notifications.js` - Message content and buttons
- `api/telegram-webhook.js` - Button handling logic

## 🚨 Troubleshooting

### No Notifications
- Check if `TELEGRAM_BOT_TOKEN` is set in Vercel
- Verify the bot token is correct
- Check Vercel function logs for errors

### Buttons Not Working
- Ensure the webhook is set up correctly
- Check if `TELEGRAM_CHAT_ID` is correct
- Verify the bot has permission to send messages

### Bot Not Responding
- Make sure you've started a chat with the bot
- Check if the bot is blocked or deleted
- Verify the webhook URL is accessible

## 📱 Mobile Support

Telegram notifications work on:
- **Desktop Telegram** - Full functionality
- **Mobile Telegram** - Full functionality with buttons
- **Web Telegram** - Full functionality

## 🔄 Alternative: Manual Review

If you prefer not to use Telegram:
1. **Bookmark admin dashboard** - https://your-deployment.vercel.app/admin
2. **Check periodically** - Review submissions when convenient
3. **No notifications** - Less complexity

The Telegram bot system is simple, secure, and works everywhere! 🎉
