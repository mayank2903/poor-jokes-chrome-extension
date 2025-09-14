// Gmail API Authorization Script
const { google } = require('googleapis');
const readline = require('readline');

// OAuth 2.0 configuration
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

// Alternative: Use localhost redirect for testing
const LOCAL_REDIRECT_URI = 'http://localhost:3000/oauth2callback';

// You'll need to replace these with your actual credentials from Google Cloud Console
const CLIENT_ID = '408308440374-mqrppnnksq3ho90im2denvi5obgtqao1.apps.googleusercontent.com';
const CLIENT_SECRET = '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';

async function getAuthCode() {
  console.log('🔧 Gmail API Authorization Setup');
  console.log('================================\n');

  if (CLIENT_ID === 'YOUR_CLIENT_ID_HERE' || CLIENT_SECRET === 'YOUR_CLIENT_SECRET_HERE') {
    console.log('❌ Please update the CLIENT_ID and CLIENT_SECRET in this script first!');
    console.log('\n📋 Steps:');
    console.log('1. Go to Google Cloud Console: https://console.cloud.google.com');
    console.log('2. Create a project or select existing one');
    console.log('3. Enable Gmail API');
    console.log('4. Create OAuth 2.0 credentials (Desktop application)');
    console.log('5. Copy Client ID and Client Secret to this script');
    console.log('6. Run this script again');
    return;
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      REDIRECT_URI
    );

    // Generate authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });

    console.log('🌐 Opening browser for authorization...');
    console.log('If browser doesn\'t open, visit this URL:');
    console.log(authUrl);
    console.log('\n');

    // Open browser (works on most systems)
    const { exec } = require('child_process');
    exec(`open "${authUrl}"`);

    // Get authorization code from user
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('📝 Enter the authorization code from the browser: ', async (code) => {
      try {
        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        
        console.log('\n✅ Authorization successful!');
        console.log('================================');
        console.log('📋 Add these to your Vercel environment variables:');
        console.log('');
        console.log(`GMAIL_CLIENT_ID=${CLIENT_ID}`);
        console.log(`GMAIL_CLIENT_SECRET=${CLIENT_SECRET}`);
        console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
        console.log(`GMAIL_USER_EMAIL=pc.mayank@gmail.com`);
        console.log('');
        console.log('🔗 Admin Dashboard URL (optional):');
        console.log('ADMIN_URL=https://your-deployment.vercel.app/admin-local.html');
        console.log('');
        console.log('🎉 Setup complete! Your Gmail API is ready to use.');
        
        rl.close();
      } catch (error) {
        console.error('❌ Error getting tokens:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('- Make sure the authorization code is correct');
        console.log('- Check that Gmail API is enabled in Google Cloud Console');
        console.log('- Verify your OAuth credentials are correct');
        rl.close();
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the authorization
getAuthCode();
