// Simple OAuth server for Gmail API authorization
const { google } = require('googleapis');
const express = require('express');
const { exec } = require('child_process');

const app = express();
const PORT = 3000;

// OAuth 2.0 configuration
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
const CLIENT_ID = '408308440374-mqrppnnksq3ho90im2denvi5obgtqao1.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Home page with authorization link
app.get('/', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Gmail API Authorization</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .container { background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center; }
        .btn { background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
        .btn:hover { background: #0056b3; }
        .code { background: #e9ecef; padding: 15px; border-radius: 5px; font-family: monospace; word-break: break-all; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🔧 Gmail API Authorization</h1>
        <p>Click the button below to authorize the Poor Jokes Extension to send emails on your behalf.</p>
        <a href="${authUrl}" class="btn">🔐 Authorize Gmail Access</a>
        <p><small>This will open Google's authorization page where you can grant permission.</small></p>
      </div>
    </body>
    </html>
  `);
});

// OAuth callback handler
app.get('/oauth2callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).send('❌ No authorization code received');
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authorization Successful</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
          .container { background: #d4edda; padding: 30px; border-radius: 10px; text-align: center; }
          .code { background: #e9ecef; padding: 15px; border-radius: 5px; font-family: monospace; word-break: break-all; margin: 20px 0; }
          .success { color: #155724; font-size: 24px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success">✅ Authorization Successful!</div>
          <p>Copy these values to your Vercel environment variables:</p>
          
          <h3>Environment Variables:</h3>
          <div class="code">
            GMAIL_CLIENT_ID=${CLIENT_ID}<br>
            GMAIL_CLIENT_SECRET=${CLIENT_SECRET}<br>
            GMAIL_REFRESH_TOKEN=${tokens.refresh_token}<br>
            GMAIL_USER_EMAIL=pc.mayank@gmail.com
          </div>
          
          <p><strong>Admin Dashboard URL (optional):</strong></p>
          <div class="code">
            ADMIN_URL=https://poor-jokes-newtab-jb3sv9tr7-mayanks-projects-72f678fa.vercel.app/admin-local.html
          </div>
          
          <p>🎉 Setup complete! Your Gmail API is ready to use.</p>
          <p><small>You can close this window now.</small></p>
        </div>
      </body>
      </html>
    `);

    console.log('✅ Authorization successful!');
    console.log('Refresh token:', tokens.refresh_token);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).send(`❌ Error: ${error.message}`);
  }
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 OAuth server started!');
  console.log(`📱 Open your browser and go to: http://localhost:${PORT}`);
  console.log('🔐 Click "Authorize Gmail Access" to get your tokens');
  
  // Try to open browser automatically
  exec(`open http://localhost:${PORT}`, (error) => {
    if (error) {
      console.log('💡 If browser doesn\'t open automatically, visit the URL above');
    }
  });
});
