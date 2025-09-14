# 🚀 Quick Setup Guide

Your Vercel deployment is ready! Now you need to set up the database.

## ✅ What's Done:
- ✅ Vercel deployment: `https://poor-jokes-newtab-m71thaw83-mayanks-projects-72f678fa.vercel.app`
- ✅ API URLs updated in extension files
- ✅ All code is deployed

## 🔧 What You Need to Do:

### Step 1: Set up Supabase Database (5 minutes)

1. **Go to [supabase.com](https://supabase.com)**
2. **Create a new project:**
   - Click "Start your project"
   - Sign up with GitHub
   - Click "New project"
   - Name: `poor-jokes-newtab`
   - Choose a strong database password
   - Select region closest to you
   - Click "Create new project"
   - Wait 2-3 minutes for setup

3. **Set up the database:**
   - Go to **SQL Editor** in your Supabase dashboard
   - Click "New query"
   - Copy the entire contents of `database-schema.sql`
   - Paste and click **Run**

4. **Get your credentials:**
   - Go to **Settings** → **API**
   - Copy your **Project URL** (looks like `https://abc123.supabase.co`)
   - Copy your **anon public** key (starts with `eyJ...`)
   - Go to **Settings** → **API** → **Service Role** section
   - Click "Reveal" and copy your **service_role** key

### Step 2: Add Environment Variables to Vercel

1. **Go to [vercel.com/dashboard](https://vercel.com/dashboard)**
2. **Click on your project:** `poor-jokes-newtab`
3. **Go to Settings** → **Environment Variables**
4. **Add these 4 variables:**

| Name | Value | Environment |
|------|-------|-------------|
| `SUPABASE_URL` | Your Supabase project URL | Production |
| `SUPABASE_ANON_KEY` | Your Supabase anon key | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Production |
| `ADMIN_EMAIL` | your-email@example.com | Production |

5. **Click Save for each variable**

### Step 3: Redeploy with Database

```bash
vercel --prod
```

### Step 4: Test Everything

1. **Test API:** Visit `https://poor-jokes-newtab-m71thaw83-mayanks-projects-72f678fa.vercel.app/api/jokes`
2. **Test Admin:** Visit `https://poor-jokes-newtab-m71thaw83-mayanks-projects-72f678fa.vercel.app/admin`
3. **Load Extension:** Load the extension in Chrome

## 🎯 Your URLs:

- **Extension:** Load in Chrome from this folder
- **Admin Dashboard:** `https://poor-jokes-newtab-m71thaw83-mayanks-projects-72f678fa.vercel.app/admin`
- **API:** `https://poor-jokes-newtab-m71thaw83-mayanks-projects-72f678fa.vercel.app/api/jokes`

## 🆘 Need Help?

If you get stuck:
1. Check the `DEPLOYMENT.md` file for detailed instructions
2. Make sure all 4 environment variables are set in Vercel
3. Verify the database schema was created successfully
4. Check Vercel function logs for any errors

Once you complete these steps, your Poor Jokes extension will be fully functional! 🎭
