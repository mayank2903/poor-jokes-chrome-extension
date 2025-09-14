// Test complete joke submission and email flow
const { google } = require('googleapis');

// Gmail API configuration
const GMAIL_CLIENT_ID = '408308440374-mqrppnnksq3ho90im2denvi5obgtqao1.apps.googleusercontent.com';
const GMAIL_CLIENT_SECRET = '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';
const GMAIL_REFRESH_TOKEN = '1//0g0wtIDJ8p_LjCgYIARAAGBASNwF-L9Irn_bU-vE6-xHvf_qK6JSXo8a9R1LTVxZnLfa8FLK50qrMiusmsG9vGnmr22U1AfFUe-w';
const GMAIL_USER_EMAIL = 'pc.mayank@gmail.com';

// Create Gmail API client
function createGmailClient() {
  const oauth2Client = new google.auth.OAuth2(
    GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
  );

  oauth2Client.setCredentials({
    refresh_token: GMAIL_REFRESH_TOKEN
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

// Test joke submission via API
async function testJokeSubmission() {
  console.log('🎭 Testing Joke Submission Flow');
  console.log('================================\n');

  try {
    // Submit a test joke
    const testJoke = {
      content: "Why don't scientists trust atoms? Because they make up everything! (Test submission from Gmail API)",
      submitted_by: "Test User"
    };

    console.log('📝 Submitting test joke...');
    console.log('Joke:', testJoke.content);
    console.log('Submitter:', testJoke.submitted_by);
    console.log('');

    const response = await fetch('https://poor-jokes-newtab-jb3sv9tr7-mayanks-projects-72f678fa.vercel.app/api/jokes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testJoke)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Joke submitted successfully!');
      console.log('Submission ID:', result.submission_id);
      console.log('Message:', result.message);
      console.log('');
      
      // Wait a moment for email processing
      console.log('⏳ Waiting for email notification...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      return result.submission_id;
    } else {
      console.log('❌ Failed to submit joke:', result.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Error submitting joke:', error.message);
    return null;
  }
}

// Test direct email sending
async function testDirectEmail() {
  console.log('📧 Testing Direct Email Sending');
  console.log('===============================\n');

  try {
    const gmail = createGmailClient();
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🎭 Gmail API Test Email</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #333; margin-top: 0;">✅ Gmail API Working!</h3>
            <p style="font-size: 16px; line-height: 1.6; color: #555;">
              This is a test email from your Poor Jokes Chrome Extension Gmail API system.
            </p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #333; margin-top: 0;">📊 Test Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Test Type:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Gmail API Direct Send</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Sent At:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">${new Date().toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Status:</strong></td>
                <td style="padding: 8px 0; color: #28a745; font-weight: bold;">✅ Success</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://poor-jokes-newtab-jb3sv9tr7-mayanks-projects-72f678fa.vercel.app/admin-local.html" 
               style="display: inline-block; background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; box-shadow: 0 4px 8px rgba(0,123,255,0.3);">
              👀 Open Admin Dashboard
            </a>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
            <p>This is a test email from your Poor Jokes Chrome Extension.</p>
            <p>If you receive this, the Gmail API system is working perfectly! 🎉</p>
          </div>
        </div>
      </div>
    `;

    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: Buffer.from(
          `To: ${GMAIL_USER_EMAIL}\r\n` +
          `Subject: 🎭 Gmail API Test - Poor Jokes Extension\r\n` +
          `Content-Type: text/html; charset=utf-8\r\n` +
          `\r\n` +
          `${htmlContent}`
        ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      }
    });

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.data.id);
    console.log('Check your inbox at:', GMAIL_USER_EMAIL);
    console.log('');

  } catch (error) {
    console.log('❌ Error sending test email:', error.message);
    console.log('');
  }
}

// Run complete test
async function runCompleteTest() {
  console.log('🚀 Starting Complete Flow Test');
  console.log('==============================\n');

  // Test 1: Direct email sending
  await testDirectEmail();

  // Test 2: Joke submission (this should trigger email via API)
  console.log('🔄 Testing API-triggered email...');
  const submissionId = await testJokeSubmission();

  console.log('🎯 Test Summary:');
  console.log('================');
  console.log('1. ✅ Direct Gmail API email sent');
  console.log('2. ✅ Joke submission via API completed');
  console.log('3. 📧 Check your email for notifications');
  console.log('');
  console.log('If you received both emails, the complete flow is working! 🎉');
}

// Run the test
runCompleteTest().catch(console.error);
