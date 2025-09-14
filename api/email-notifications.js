// Email notification service for joke submissions
const nodemailer = require('nodemailer');

// Email configuration
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER, // Your email
    pass: process.env.SMTP_PASS  // Your email password or app password
  }
};

// Create transporter
const transporter = nodemailer.createTransporter(EMAIL_CONFIG);

// Send email notification for new joke submission
async function sendSubmissionNotification(submission) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('Email not configured, skipping notification');
    return;
  }

  try {
    const adminUrl = process.env.ADMIN_URL || 'https://poor-jokes-newtab-hslkg05hk-mayanks-projects-72f678fa.vercel.app/admin-local.html';
    
    const mailOptions = {
      from: `"Poor Jokes Bot" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
      subject: `🎭 New Joke Submission - ${submission.id}`,
      html: `
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
      `,
      text: `
New Joke Submission - ${submission.id}

Joke Content: "${submission.content}"

Details:
- Joke ID: ${submission.id}
- Submitted By: ${submission.submitted_by || 'Anonymous'}
- Submitted At: ${new Date(submission.created_at).toLocaleString()}
- Status: Pending Review

Review in Admin Dashboard: ${adminUrl}

This is an automated notification from your Poor Jokes Chrome Extension.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email notification sent:', info.messageId);
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
}

// Send email notification for approved joke
async function sendApprovalNotification(submission) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return;
  }

  try {
    const mailOptions = {
      from: `"Poor Jokes Bot" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
      subject: `✅ Joke Approved - ${submission.id}`,
      html: `
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
      `,
      text: `
Joke Approved - ${submission.id}

Approved Joke: "${submission.content}"

Details:
- Joke ID: ${submission.id}
- Approved At: ${new Date().toLocaleString()}
- Status: Approved & Added to Collection

This joke has been added to the collection and will now appear to users.
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Approval email sent');
  } catch (error) {
    console.error('Error sending approval email:', error);
  }
}

// Send email notification for rejected joke
async function sendRejectionNotification(submission, reason) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return;
  }

  try {
    const mailOptions = {
      from: `"Poor Jokes Bot" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
      subject: `❌ Joke Rejected - ${submission.id}`,
      html: `
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
      `,
      text: `
Joke Rejected - ${submission.id}

Rejected Joke: "${submission.content}"

Details:
- Joke ID: ${submission.id}
- Rejected At: ${new Date().toLocaleString()}
- Reason: ${reason || 'No reason provided'}
- Status: Rejected

This joke has been rejected and will not be added to the collection.
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Rejection email sent');
  } catch (error) {
    console.error('Error sending rejection email:', error);
  }
}

module.exports = {
  sendSubmissionNotification,
  sendApprovalNotification,
  sendRejectionNotification
};
