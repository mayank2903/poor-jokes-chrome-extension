# Gmail API Setup Guide

This guide will help you set up Gmail API for email notifications without requiring 2FA.

## 🔧 Setup Steps

### 1. Create Google Cloud Project

1. **Go to Google Cloud Console** - https://console.cloud.google.com
2. **Create a new project** or select existing one
3. **Note the project name** for later

### 2. Enable Gmail API

1. **Go to "APIs & Services"** → "Library"
2. **Search for "Gmail API"**
3. **Click on Gmail API** → "Enable"

### 3. Create OAuth 2.0 Credentials

1. **Go to "APIs & Services"** → "Credentials"
2. **Click "Create Credentials"** → "OAuth client ID"
3. **Application type:** "Desktop application"
4. **Name:** "Poor Jokes Extension"
5. **Click "Create"**
6. **Download the JSON file** (keep it secure!)

### 4. Get Authorization Code

Run this script to get your authorization code:

```bash
node get-auth-code.js
```

This will:
- Open your browser to Google OAuth
- Ask for Gmail permissions
- Give you an authorization code
- Exchange it for refresh token

### 5. Set Environment Variables

Add these to your Vercel environment variables:

```bash
# Gmail API Configuration
GMAIL_CLIENT_ID=your-client-id-from-json
GMAIL_CLIENT_SECRET=your-client-secret-from-json
GMAIL_REFRESH_TOKEN=your-refresh-token-from-script
GMAIL_USER_EMAIL=pc.mayank@gmail.com

# Admin Dashboard URL (optional)
ADMIN_URL=https://your-deployment.vercel.app/admin-local.html
```

## 🎯 How It Works

### Gmail API Benefits
- **No 2FA required** - Uses OAuth 2.0
- **More secure** - Token-based authentication
- **Better reliability** - Official Google API
- **Higher limits** - More emails per day

### Email Notifications
- **New submissions** - Beautiful HTML emails
- **Admin dashboard links** - Direct access to approve/reject
- **Mobile friendly** - Works on all devices
- **Professional** - Branded email templates

## 🧪 Testing

### Test Email Setup
1. **Set environment variables** in Vercel
2. **Submit a test joke** through the extension
3. **Check your email** at pc.mayank@gmail.com
4. **Click admin link** to verify it works

### Troubleshooting
- **No emails?** Check Gmail API credentials
- **Permission denied?** Re-run authorization script
- **API errors?** Check Vercel function logs

## 🔒 Security

- **OAuth 2.0** - Industry standard authentication
- **Refresh tokens** - Secure, long-lived access
- **Scoped permissions** - Only Gmail access
- **No passwords** - No sensitive data stored

## 📱 Mobile Support

Gmail API emails work on:
- **Gmail app** - Full HTML support
- **Apple Mail** - Good HTML rendering
- **Outlook app** - Professional appearance
- **Any email client** - Fallback to text version

## 🎨 Email Features

### Beautiful Design
- **Gradient headers** - Professional look
- **Card layout** - Easy to read
- **Color coding** - Green for approve, red for reject
- **Responsive** - Works on all screen sizes

### Rich Content
- **Joke preview** - See content before opening admin
- **Submission details** - ID, timestamp, submitter
- **Action buttons** - Direct links to admin dashboard
- **Status tracking** - Know what you've reviewed

## 🚨 Troubleshooting

### Common Issues

#### "Invalid credentials"
- **Check client ID/secret** - Must match Google Cloud Console
- **Verify refresh token** - Re-run authorization script
- **Check project** - Make sure Gmail API is enabled

#### "Insufficient permissions"
- **Re-authorize** - Run authorization script again
- **Check scopes** - Must include Gmail send permission
- **Verify email** - Must match authorized account

#### "API not enabled"
- **Enable Gmail API** - In Google Cloud Console
- **Check project** - Make sure you're in the right project
- **Wait a few minutes** - API activation can take time

### Getting Help
- **Check Vercel logs** - Look for error messages
- **Test with simple email** - Try sending to yourself first
- **Verify all settings** - Double-check environment variables

## 🔄 Alternative: Manual Check

If you prefer not to use email:
1. **Bookmark admin dashboard** - https://your-deployment.vercel.app/admin-local.html
2. **Check periodically** - Review submissions when convenient
3. **No notifications** - Less complexity

The Gmail API system is more secure and reliable than SMTP! 🎉
