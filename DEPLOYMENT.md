# 🚀 Production Deployment Guide

## Prerequisites
- Supabase account (free)
- Vercel account (free)
- Node.js installed
- Git installed

## Step 1: Set up Supabase Database

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up/login with GitHub
4. Click "New project"
5. Choose your organization
6. Enter project details:
   - **Name**: `poor-jokes-newtab`
   - **Database Password**: (choose a strong password)
   - **Region**: Choose closest to your users
7. Click "Create new project"
8. Wait for project to be ready (2-3 minutes)

### 1.2 Set up Database Schema
1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `database-schema.sql`
4. Paste it into the SQL editor
5. Click **Run** to execute the schema
6. You should see "Success. No rows returned" message

### 1.3 Get API Credentials
1. Go to **Settings** → **API**
2. Copy your **Project URL** (looks like `https://abc123.supabase.co`)
3. Copy your **anon public** key (starts with `eyJ...`)
4. Go to **Settings** → **API** → **Service Role** section
5. Click "Reveal" and copy your **service_role** key (starts with `eyJ...`)

## Step 2: Deploy to Vercel

### 2.1 Install Vercel CLI
```bash
npm install -g vercel
```

### 2.2 Deploy the Project
```bash
# In your project directory
vercel

# Follow the prompts:
# ? Set up and deploy "~/poor-jokes-newtab"? [Y/n] y
# ? Which scope do you want to deploy to? [Your account]
# ? Link to existing project? [y/N] n
# ? What's your project's name? poor-jokes-newtab
# ? In which directory is your code located? ./
# ? Want to override the settings? [y/N] n
```

### 2.3 Set Environment Variables
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

| Name | Value | Environment |
|------|-------|-------------|
| `SUPABASE_URL` | Your Supabase project URL | Production |
| `SUPABASE_ANON_KEY` | Your Supabase anon key | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Production |
| `ADMIN_EMAIL` | your-email@example.com | Production |

5. Click **Save** for each variable

### 2.4 Redeploy with Environment Variables
```bash
vercel --prod
```

## Step 3: Update API URLs

### 3.1 Get Your Vercel URL
After deployment, Vercel will give you a URL like:
`https://poor-jokes-newtab-abc123.vercel.app`

### 3.2 Update Extension Files
Replace `https://your-vercel-app.vercel.app` with your actual Vercel URL in:

**newtab.js** (line 18):
```javascript
const API_BASE_URL = 'https://your-actual-vercel-url.vercel.app/api';
```

**admin.html** (line 237):
```javascript
const API_BASE_URL = 'https://your-actual-vercel-url.vercel.app/api';
```

### 3.3 Test the API
Visit your Vercel URL to test:
- `https://your-vercel-url.vercel.app/api/jokes` - Should return jokes
- `https://your-vercel-url.vercel.app/api/submissions?status=pending` - Should return submissions

## Step 4: Load Extension in Chrome

### 4.1 Prepare Extension Files
1. Make sure all files are in the project directory
2. Verify `manifest.json` exists and is valid
3. Ensure all API URLs are updated

### 4.2 Load in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select your project folder
5. The extension should appear in your extensions list

### 4.3 Test the Extension
1. Open a new tab
2. You should see the Poor Jokes extension
3. Test rating jokes
4. Test submitting a joke
5. Check admin dashboard at `https://your-vercel-url.vercel.app/admin`

## Step 5: Verify Everything Works

### 5.1 Test Extension Features
- [ ] Jokes load and display
- [ ] Rating buttons work
- [ ] Submission form works
- [ ] Copy button works
- [ ] Responsive design works

### 5.2 Test Admin Dashboard
- [ ] Statistics load correctly
- [ ] Submissions appear in pending list
- [ ] Approve/reject buttons work
- [ ] Approved jokes appear in extension

### 5.3 Test API Endpoints
```bash
# Test jokes endpoint
curl https://your-vercel-url.vercel.app/api/jokes

# Test submissions endpoint
curl https://your-vercel-url.vercel.app/api/submissions?status=pending

# Test submitting a joke
curl -X POST https://your-vercel-url.vercel.app/api/jokes \
  -H "Content-Type: application/json" \
  -d '{"content":"Test joke","submitted_by":"test_user"}'
```

## Troubleshooting

### Common Issues:

**1. "Failed to load submissions"**
- Check if Vercel is deployed correctly
- Verify environment variables are set
- Check Vercel function logs

**2. CORS errors**
- Ensure you're using the correct Vercel URL
- Check that CORS is enabled in API functions

**3. Database connection errors**
- Verify Supabase credentials are correct
- Check if database schema was created
- Verify RLS policies are set up

**4. Extension not loading**
- Check manifest.json is valid
- Verify all files are in the correct location
- Check Chrome extension console for errors

### Debug Steps:
1. Check Vercel function logs in dashboard
2. Check Supabase logs in dashboard
3. Check browser console for errors
4. Test API endpoints directly with curl

## Next Steps

Once deployed:
1. **Share with users** - Load the extension and share
2. **Monitor usage** - Check Vercel and Supabase dashboards
3. **Add features** - Customize jokes, add categories, etc.
4. **Scale up** - Upgrade to paid plans if needed

## Support

If you need help:
1. Check the troubleshooting section above
2. Look at Vercel function logs
3. Check Supabase logs
4. Verify all environment variables are set correctly

Happy deploying! 🎭
