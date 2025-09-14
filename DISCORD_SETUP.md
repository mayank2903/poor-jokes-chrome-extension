# Discord Notification Setup Guide

This guide will help you set up Discord notifications for joke submissions with interactive approve/reject buttons.

## 🔧 Setup Steps

### 1. Create Discord Webhook

1. **Go to your Discord server**
2. **Right-click on a channel** (e.g., #admin-notifications)
3. **Select "Edit Channel"**
4. **Go to "Integrations" tab**
5. **Click "Webhooks"**
6. **Click "Create Webhook"**
7. **Copy the webhook URL** (keep this secret!)

### 2. Set Environment Variable

Add the Discord webhook URL to your Vercel environment variables:

```bash
# In Vercel dashboard or CLI
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_URL_HERE
```

### 3. Deploy the Changes

The notification system is already implemented and will work once you set the webhook URL.

## 🎯 How It Works

### New Submission Notification
When someone submits a joke, you'll get a Discord message with:
- **Joke content** and ID
- **Submission timestamp**
- **Submitter info** (if provided)
- **Interactive buttons** for approve/reject
- **Link to admin dashboard**

### Interactive Buttons
- **✅ Approve** - Instantly approves and adds joke to collection
- **❌ Reject** - Rejects the joke with reason
- **👀 View Admin** - Opens admin dashboard for detailed review

### Notification Types
1. **New Submission** - Yellow embed with action buttons
2. **Approved** - Green embed confirming approval
3. **Rejected** - Red embed with rejection reason

## 🔒 Security

- **Webhook URL is secret** - Don't share it publicly
- **Admin-only actions** - Only you can approve/reject
- **Ephemeral responses** - Button responses are private

## 🧪 Testing

1. **Submit a test joke** through the extension
2. **Check Discord** for the notification
3. **Click approve/reject** buttons
4. **Verify** the joke appears/disappears in the collection

## 🎨 Customization

You can customize the Discord notifications by editing:
- `api/notifications.js` - Message content and formatting
- `api/discord-bot.js` - Button interactions and responses

## 🚨 Troubleshooting

### No Notifications
- Check if `DISCORD_WEBHOOK_URL` is set in Vercel
- Verify the webhook URL is correct
- Check Vercel function logs for errors

### Buttons Not Working
- Ensure the Discord bot endpoint is deployed
- Check if the webhook has proper permissions
- Verify the custom_id format in notifications.js

### Missing Permissions
- Make sure the webhook has "Send Messages" permission
- Check if the bot has "Use Slash Commands" permission

## 📱 Mobile Support

Discord notifications work on:
- **Desktop Discord** - Full functionality
- **Mobile Discord** - Notifications and basic interactions
- **Web Discord** - Full functionality

## 🔄 Alternative: Manual Review

If you prefer manual review:
1. **Use the "👀 View Admin" button** to open admin dashboard
2. **Review submissions** in detail
3. **Approve/reject** through the web interface

The Discord notifications will still be sent, but you can ignore the buttons and use the admin dashboard instead.
