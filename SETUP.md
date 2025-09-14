# Poor Jokes New Tab Extension - Setup Guide

This guide will help you set up the complete joke submission and rating system with centralized data collection.

## 🚀 Quick Start

### 1. Set Up Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In your Supabase dashboard, go to the SQL Editor
3. Copy and paste the contents of `database-schema.sql` and run it
4. Go to Settings > API to get your project URL and keys

### 2. Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. In your project directory, run: `vercel`
3. Follow the prompts to deploy
4. Set environment variables in Vercel dashboard:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
   - `ADMIN_EMAIL`: Your email for notifications

### 3. Update API URLs

1. In `newtab.js`, replace `https://your-vercel-app.vercel.app/api` with your actual Vercel URL
2. In `admin.html`, replace the API URL with your actual Vercel URL

### 4. Test the System

1. Open `admin.html` in your browser to access the admin dashboard
2. Load the extension in Chrome to test joke submission and rating

## 📁 Project Structure

```
poor-jokes-newtab/
├── api/                    # Vercel API endpoints
│   ├── jokes.js           # Get jokes & submit new ones
│   ├── rate.js            # Rate jokes
│   └── submissions.js     # Admin: review submissions
├── admin.html             # Admin dashboard
├── newtab.html           # Extension main page
├── newtab.js             # Extension logic
├── jokes.js              # Original jokes (fallback)
├── styles.css            # Styling
├── manifest.json         # Chrome extension manifest
├── database-schema.sql   # Database setup
├── package.json          # Dependencies
├── vercel.json           # Vercel configuration
└── SETUP.md              # This file
```

## 🔧 Features

### For Users:
- **Rate jokes** with thumbs up/down
- **Submit new jokes** for community review
- **See rating statistics** for each joke
- **Offline fallback** when API is unavailable

### For Admins:
- **Moderate submissions** - approve or reject jokes
- **View statistics** - total jokes, pending submissions, ratings
- **Real-time updates** - auto-refresh every 30 seconds
- **Rejection reasons** - provide feedback when rejecting

## 🛠️ API Endpoints

### `GET /api/jokes`
Returns all active jokes with rating statistics.

### `POST /api/jokes`
Submit a new joke for review.
```json
{
  "content": "Your joke here",
  "submitted_by": "user_id"
}
```

### `POST /api/rate`
Rate a joke (thumbs up or down).
```json
{
  "joke_id": "uuid",
  "user_id": "user_id",
  "rating": 1
}
```

### `GET /api/submissions?status=pending`
Get pending joke submissions (admin only).

### `POST /api/submissions`
Review a submission (admin only).
```json
{
  "submission_id": "uuid",
  "action": "approve|reject",
  "rejection_reason": "optional reason",
  "reviewed_by": "admin"
}
```

## 🎨 Customization

### Styling
Edit `styles.css` to customize the appearance:
- Colors and gradients
- Button styles
- Layout and spacing
- Responsive design

### Jokes
- Original jokes are in `jokes.js`
- New jokes are submitted through the form
- All jokes are stored in the Supabase database

### Admin Dashboard
Customize `admin.html` to:
- Add more statistics
- Change the layout
- Add bulk actions
- Integrate with other tools

## 🔒 Security

- **Row Level Security (RLS)** enabled on all tables
- **CORS** configured for cross-origin requests
- **Input validation** on all API endpoints
- **Rate limiting** recommended for production

## 📊 Analytics

The system tracks:
- Total number of jokes
- Pending submissions
- User ratings and statistics
- Submission approval/rejection rates

## 🚨 Troubleshooting

### Common Issues:

1. **API not working**: Check Vercel deployment and environment variables
2. **Database errors**: Verify Supabase connection and RLS policies
3. **CORS errors**: Ensure API URLs are correct in the extension
4. **Extension not loading**: Check manifest.json and file paths

### Debug Mode:
- Open browser dev tools to see console errors
- Check Vercel function logs for API issues
- Verify Supabase logs for database problems

## 🔄 Updates

To update the system:
1. Make changes to your code
2. Deploy to Vercel: `vercel --prod`
3. Reload the Chrome extension
4. Clear browser cache if needed

## 📈 Scaling

For high traffic:
- Enable Vercel Pro for higher limits
- Use Supabase Pro for more database resources
- Add caching layers
- Implement rate limiting
- Add CDN for static assets

## 🎯 Next Steps

Consider adding:
- User authentication
- Joke categories/tags
- Advanced analytics
- Email notifications
- Mobile app
- Social sharing
- Joke of the day
- User profiles
- Comment system

## 📞 Support

If you need help:
1. Check the console for errors
2. Verify all environment variables
3. Test API endpoints directly
4. Check Supabase and Vercel logs

Happy joke collecting! 🎭
