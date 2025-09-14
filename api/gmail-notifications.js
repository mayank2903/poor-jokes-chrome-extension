// Gmail API notification service for joke submissions
const { google } = require('googleapis');
const API_CONFIG = require('../config/api-config');

// Gmail API configuration
const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const GMAIL_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;
const GMAIL_USER_EMAIL = process.env.GMAIL_USER_EMAIL || 'pc.mayank@gmail.com';

// Create Gmail API client
function createGmailClient() {
  const oauth2Client = new google.auth.OAuth2(
    GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob' // For installed applications
  );

  oauth2Client.setCredentials({
    refresh_token: GMAIL_REFRESH_TOKEN
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

// Send email notification for new joke submission
async function sendSubmissionNotification(submission) {
  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
    console.log('Gmail API not configured, skipping notification');
    return;
  }

  try {
    const gmail = createGmailClient();
    const adminUrl = process.env.ADMIN_URL || API_CONFIG.ADMIN_URL;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🎭 New Joke Submission</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #333; margin-top: 0;">📝 Joke Content:</h3>
            <p style="font-size: 16px; line-height: 1.6; color: #555; background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
              "${submission.content}"
            </p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #333; margin-top: 0;">📊 Submission Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Joke ID:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">${submission.id}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Submitted By:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">${submission.submitted_by || 'Anonymous'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Submitted At:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">${new Date(submission.created_at).toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Status:</strong></td>
                <td style="padding: 8px 0; color: #ffc107; font-weight: bold;">⏳ Pending Review</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${adminUrl}" 
               style="display: inline-block; background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 0 10px; box-shadow: 0 4px 8px rgba(0,123,255,0.3);">
              👀 Review in Admin Dashboard
            </a>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
            <p>This is an automated notification from your Poor Jokes Chrome Extension.</p>
            <p>Click the button above to approve or reject this joke submission.</p>
          </div>
        </div>
      </div>
    `;

    const textContent = `
New Joke Submission - ${submission.id}

Joke Content: "${submission.content}"

Details:
- Joke ID: ${submission.id}
- Submitted By: ${submission.submitted_by || 'Anonymous'}
- Submitted At: ${new Date(submission.created_at).toLocaleString()}
- Status: Pending Review

Review in Admin Dashboard: ${adminUrl}

This is an automated notification from your Poor Jokes Chrome Extension.
    `;

    // Create email message
    const message = {
      to: GMAIL_USER_EMAIL,
      subject: `🎭 New Joke Submission - ${submission.id}`,
      html: htmlContent,
      text: textContent
    };

    // Send email using Gmail API
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: Buffer.from(
          `To: ${message.to}\r\n` +
          `Subject: ${message.subject}\r\n` +
          `Content-Type: text/html; charset=utf-8\r\n` +
          `\r\n` +
          `${message.html}`
        ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      }
    });

    console.log('Gmail notification sent:', result.data.id);
  } catch (error) {
    console.error('Error sending Gmail notification:', error);
  }
}

// Send email notification for approved joke
async function sendApprovalNotification(submission) {
  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
    return;
  }

  try {
    const gmail = createGmailClient();
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">✅ Joke Approved</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #333; margin-top: 0;">📝 Approved Joke:</h3>
            <p style="font-size: 16px; line-height: 1.6; color: #555; background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
              "${submission.content}"
            </p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #333; margin-top: 0;">📊 Approval Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Joke ID:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">${submission.id}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Approved At:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">${new Date().toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Status:</strong></td>
                <td style="padding: 8px 0; color: #28a745; font-weight: bold;">✅ Approved & Added to Collection</td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    `;

    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: Buffer.from(
          `To: ${GMAIL_USER_EMAIL}\r\n` +
          `Subject: ✅ Joke Approved - ${submission.id}\r\n` +
          `Content-Type: text/html; charset=utf-8\r\n` +
          `\r\n` +
          `${htmlContent}`
        ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      }
    });

    console.log('Approval email sent:', result.data.id);
  } catch (error) {
    console.error('Error sending approval email:', error);
  }
}

// Send email notification for rejected joke
async function sendRejectionNotification(submission, reason) {
  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
    return;
  }

  try {
    const gmail = createGmailClient();
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc3545 0%, #e83e8c 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">❌ Joke Rejected</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #333; margin-top: 0;">📝 Rejected Joke:</h3>
            <p style="font-size: 16px; line-height: 1.6; color: #555; background: #f8d7da; padding: 15px; border-radius: 5px; border-left: 4px solid #dc3545;">
              "${submission.content}"
            </p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #333; margin-top: 0;">📊 Rejection Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Joke ID:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">${submission.id}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Rejected At:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">${new Date().toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Reason:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">${reason || 'No reason provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Status:</strong></td>
                <td style="padding: 8px 0; color: #dc3545; font-weight: bold;">❌ Rejected</td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    `;

    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: Buffer.from(
          `To: ${GMAIL_USER_EMAIL}\r\n` +
          `Subject: ❌ Joke Rejected - ${submission.id}\r\n` +
          `Content-Type: text/html; charset=utf-8\r\n` +
          `\r\n` +
          `${htmlContent}`
        ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      }
    });

    console.log('Rejection email sent:', result.data.id);
  } catch (error) {
    console.error('Error sending rejection email:', error);
  }
}

module.exports = {
  sendSubmissionNotification,
  sendApprovalNotification,
  sendRejectionNotification
};
