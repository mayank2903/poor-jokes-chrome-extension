# Email Notification Setup Guide

This guide will help you set up email notifications for joke submissions with links to the admin dashboard.

## 🔧 Setup Steps

### 1. Choose Email Provider

#### **Gmail (Recommended)**
- **Easy setup** - Most common choice
- **App passwords** - Secure authentication
- **Free** - No cost involved

#### **Other Providers**
- **Outlook/Hotmail** - Microsoft email
- **Yahoo** - Alternative option
- **Custom SMTP** - Any email provider

### 2. Gmail Setup (Recommended)

#### **Step 1: Enable 2-Factor Authentication**
1. **Go to Google Account** - https://myaccount.google.com
2. **Security** → "2-Step Verification"
3. **Turn on** 2-factor authentication

#### **Step 2: Generate App Password**
1. **Go to Google Account** → "Security"
2. **2-Step Verification** → "App passwords"
3. **Select app** → "Mail"
4. **Select device** → "Other (custom name)"
5. **Enter name** → "Poor Jokes Extension"
6. **Copy the password** (16 characters)

### 3. Set Environment Variables

Add these to your Vercel environment variables:

```bash
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password

# Admin Email (optional - defaults to SMTP_USER)
ADMIN_EMAIL=your-email@gmail.com

# Admin Dashboard URL (optional - auto-detected)
ADMIN_URL=https://your-deployment.vercel.app/admin-local.html
```

### 4. Deploy the Changes

The email system is already implemented and will work once you set the environment variables.

## 🎯 How It Works

### New Submission Email
When someone submits a joke, you'll get an email with:
- **Joke content** and ID
- **Submitter info** and timestamp
- **Direct link** to admin dashboard
- **Beautiful HTML formatting**

### Email Content
- **Subject:** "🎭 New Joke Submission - [ID]"
- **HTML formatted** - Looks professional
- **Mobile friendly** - Works on all devices
- **Admin link** - Click to review submissions

### Approval/Rejection Emails
- **Approval:** Green-themed confirmation email
- **Rejection:** Red-themed notification with reason
- **Status updates** - Track what you've reviewed

## 🔒 Security

- **App passwords** - More secure than regular passwords
- **SMTP encryption** - Emails sent securely
- **Admin-only** - Only you receive notifications
- **No external dependencies** - Just email

## 🧪 Testing

### Test Email Setup
1. **Set environment variables** in Vercel
2. **Submit a test joke** through the extension
3. **Check your email** for the notification
4. **Click admin link** to verify it works

### Troubleshooting
- **No emails?** Check SMTP credentials
- **Gmail blocked?** Use app password, not regular password
- **Wrong email?** Verify ADMIN_EMAIL setting

## 📱 Mobile Support

Email notifications work on:
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

## 🔄 Alternative: Manual Check

If you prefer not to use email:
1. **Bookmark admin dashboard** - https://your-deployment.vercel.app/admin-local.html
2. **Check periodically** - Review submissions when convenient
3. **No notifications** - Less complexity

## 📊 Benefits

- **Instant alerts** - Know immediately when jokes are submitted
- **Mobile friendly** - Check emails on phone
- **Professional** - Beautiful, branded emails
- **Secure** - Only you get notifications
- **Simple** - Just email, no external apps

## 🚨 Troubleshooting

### Common Issues

#### "Authentication failed"
- **Use app password** - Not your regular Gmail password
- **Enable 2FA** - Required for app passwords
- **Check credentials** - Verify SMTP_USER and SMTP_PASS

#### "No emails received"
- **Check spam folder** - Emails might be filtered
- **Verify ADMIN_EMAIL** - Make sure it's correct
- **Check Vercel logs** - Look for error messages

#### "SMTP connection failed"
- **Check SMTP_HOST** - Should be smtp.gmail.com for Gmail
- **Check SMTP_PORT** - Should be 587 for Gmail
- **Check firewall** - Some networks block SMTP

### Getting Help
- **Check Vercel logs** - Look for error messages
- **Test with simple email** - Try sending to yourself first
- **Verify all settings** - Double-check environment variables

The email notification system is simple, secure, and works everywhere! 🎉
