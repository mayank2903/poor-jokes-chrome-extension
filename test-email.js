// Test email script
const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'pc.mayank@gmail.com', // Your email
    pass: 'your-app-password-here' // You'll need to set this
  }
});

// Test email
async function sendTestEmail() {
  try {
    const mailOptions = {
      from: '"Poor Jokes Bot" <pc.mayank@gmail.com>',
      to: 'pc.mayank@gmail.com',
      subject: '🎭 Test Email - Poor Jokes Extension',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">🎭 Email Test Successful!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h3 style="color: #333; margin-top: 0;">✅ Email System Working!</h3>
              <p style="font-size: 16px; line-height: 1.6; color: #555;">
                This is a test email from your Poor Jokes Chrome Extension notification system.
              </p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h3 style="color: #333; margin-top: 0;">📧 What This Means:</h3>
              <ul style="color: #555; line-height: 1.6;">
                <li>✅ Email notifications are working</li>
                <li>✅ You'll get notified of new joke submissions</li>
                <li>✅ Beautiful HTML emails will be sent</li>
                <li>✅ Mobile-friendly formatting</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://poor-jokes-newtab-hqqdanftc-mayanks-projects-72f678fa.vercel.app/admin-local.html" 
                 style="display: inline-block; background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; box-shadow: 0 4px 8px rgba(0,123,255,0.3);">
                👀 Open Admin Dashboard
              </a>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
              <p>This is a test email from your Poor Jokes Chrome Extension.</p>
              <p>When someone submits a joke, you'll get a similar email with the joke content and admin link.</p>
            </div>
          </div>
        </div>
      `,
      text: `
Email Test Successful!

This is a test email from your Poor Jokes Chrome Extension notification system.

What This Means:
✅ Email notifications are working
✅ You'll get notified of new joke submissions  
✅ Beautiful HTML emails will be sent
✅ Mobile-friendly formatting

Open Admin Dashboard: https://poor-jokes-newtab-hqqdanftc-mayanks-projects-72f678fa.vercel.app/admin-local.html

This is a test email from your Poor Jokes Chrome Extension.
When someone submits a joke, you'll get a similar email with the joke content and admin link.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Check your inbox at pc.mayank@gmail.com');
  } catch (error) {
    console.error('❌ Error sending test email:', error.message);
    console.log('\n🔧 To fix this:');
    console.log('1. Enable 2-factor authentication on your Gmail account');
    console.log('2. Generate an app password for "Poor Jokes Extension"');
    console.log('3. Replace "your-app-password-here" with the 16-character app password');
    console.log('4. Run this script again');
  }
}

// Run the test
sendTestEmail();
