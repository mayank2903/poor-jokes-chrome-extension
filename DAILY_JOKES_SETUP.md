# On-Demand Joke Generation Setup Guide

This guide will help you set up on-demand joke generation that creates 5 new high-quality jokes when you ping your Telegram bot.

## 🤖 What This System Does

- **Generates 5 jokes on-demand** when you send `/jokes` to your Telegram bot
- **Checks for duplicates** against your existing joke database
- **Sends to Telegram** with approve/reject buttons
- **Integrates with existing system** - approved jokes go to your collection
- **Quality filtering** - only sends jokes with high quality scores
- **Smart fallback** - generates more jokes if duplicates are found

## 🔧 Setup Steps

### 1. Environment Variables

Add these to your Vercel environment variables:

```env
# Required for AI joke generation
OPENAI_API_KEY=your_openai_api_key_here

# Required for duplicate checking
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Required for Telegram notifications (already set up)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

# Required for cron job security
CRON_SECRET=your_random_secret_string_here

# Required for admin access
ADMIN_PASSWORD=your_admin_password
```

### 2. Get OpenAI API Key

1. **Go to** https://platform.openai.com/api-keys
2. **Sign in** to your OpenAI account
3. **Create new secret key**
4. **Copy the key** and add to Vercel environment variables
5. **Add billing** to your OpenAI account (required for API access)

### 3. Set Up Cron Secret

Generate a random secret for cron job security:

```bash
# Generate a random secret
openssl rand -hex 32
```

Add this to your Vercel environment variables as `CRON_SECRET`.

### 4. Deploy the System

The system will be ready after deployment. No cron jobs needed - just send `/jokes` to your bot!

## 🎯 How It Works

### On-Demand Flow
1. **Send `/jokes`**: Message your Telegram bot with `/jokes`
2. **AI Generation**: Creates 5 high-quality jokes using OpenAI
3. **Duplicate Check**: Compares against existing jokes in database
4. **Quality Filter**: Only keeps jokes with quality score ≥ 0.7
5. **Telegram Send**: Sends each joke to your Telegram with buttons
6. **Approval**: You click ✅ Approve or ❌ Reject
7. **Database Update**: Approved jokes go to your collection

### Duplicate Detection
- **Exact matches**: Same text (case-insensitive)
- **Similar content**: 90%+ similarity using Levenshtein distance
- **Database check**: Searches both `jokes` and `joke_submissions` tables
- **Smart fallback**: Generates more jokes if too many duplicates found

### Quality Filtering
- **AI scoring**: Each joke gets a quality score (0.0-1.0)
- **Minimum threshold**: Only jokes with score ≥ 0.7 are sent
- **Content validation**: Checks for inappropriate content
- **Length validation**: Ensures jokes are 10-200 characters

## 🧪 Testing

### Test the System
1. **Send `/jokes`**: Message your Telegram bot with `/jokes`
2. **Check logs**: View Vercel function logs
3. **Verify Telegram**: Check for notifications
4. **Test approval**: Click approve/reject buttons

### Telegram Commands
- **`/start`** - Welcome message and instructions
- **`/help`** - Show available commands and features
- **`/jokes`** - Generate 5 new jokes for approval

### Test Commands
```bash
# Test joke generation (requires admin password)
curl -X POST https://your-app.vercel.app/api/daily-jokes \
  -H "x-admin-password: your_admin_password"

# Check daily stats
curl https://your-app.vercel.app/api/daily-jokes
```

## 📊 Monitoring

### Check Daily Stats
Visit: `https://your-app.vercel.app/api/daily-jokes`

Returns:
```json
{
  "success": true,
  "stats": {
    "today": {
      "total": 5,
      "pending": 2,
      "approved": 2,
      "rejected": 1
    }
  }
}
```

### Vercel Logs
- **Function logs**: Check Vercel dashboard for cron job logs
- **Error tracking**: Monitor for API failures or database issues
- **Performance**: Track generation time and success rates

## 🔧 Customization

### Adjust Quality Threshold
Edit `lib/joke-generator.js`:
```javascript
this.qualityThreshold = 0.8; // Higher = more selective
```

### Change Schedule
Edit `vercel.json`:
```json
"crons": [
  {
    "path": "/api/cron-daily-jokes",
    "schedule": "30 6 * * *"  // 12 PM IST instead of 9 AM
  }
]
```

### Modify Joke Categories
Edit the AI prompts in `lib/joke-generator.js` to focus on specific joke types.

## 🚨 Troubleshooting

### No Jokes Generated
- **Check OpenAI API key**: Ensure it's valid and has billing
- **Check Supabase**: Verify database connection
- **Check logs**: Look for error messages in Vercel logs

### Duplicates Still Appearing
- **Check similarity threshold**: May need to adjust from 0.9
- **Check database**: Ensure all jokes are properly stored
- **Check normalization**: Verify text normalization is working

### Telegram Not Working
- **Check bot token**: Ensure it's correct
- **Check chat ID**: Verify you've started a chat with the bot
- **Check webhook**: Ensure webhook is set up correctly

### Cron Job Not Running
- **Check Vercel Pro**: Cron jobs require Vercel Pro plan
- **Check schedule**: Verify cron expression is correct
- **Check deployment**: Ensure latest code is deployed

## 💰 Costs

### OpenAI API
- **Cost**: ~$0.01-0.05 per day (5 jokes)
- **Model**: GPT-3.5-turbo (cheaper than GPT-4)
- **Usage**: ~500 tokens per generation

### Vercel
- **Cron jobs**: Requires Pro plan ($20/month)
- **Function calls**: Included in Pro plan
- **Database**: Your existing Supabase plan

## 🎉 Benefits

- **Consistent content**: 5 new jokes every day
- **High quality**: AI-filtered for humor and appropriateness
- **No duplicates**: Smart detection prevents repetition
- **Easy approval**: Telegram interface for quick review
- **Scalable**: Can adjust quantity and frequency
- **Reliable**: Automated with fallback systems

The system is now ready to keep your joke collection fresh and growing! 🎭✨
