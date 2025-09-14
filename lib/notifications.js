// Discord notification service for joke submissions
// Using built-in fetch (available in Node.js 18+)

// Discord webhook configuration
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// Send Discord notification for new joke submission
async function sendSubmissionNotification(submission) {
  if (!DISCORD_WEBHOOK_URL) {
    console.log('Discord webhook not configured, skipping notification');
    return;
  }

  try {
    const embed = {
      title: "🎭 New Joke Submission",
      description: `**Joke ID:** ${submission.id}\n**Content:** ${submission.content}`,
      color: 0xffc107, // Yellow color
      fields: [
        {
          name: "📅 Submitted",
          value: new Date(submission.created_at).toLocaleString(),
          inline: true
        },
        {
          name: "👤 Submitted By",
          value: submission.submitted_by || "Anonymous",
          inline: true
        },
        {
          name: "📊 Status",
          value: "⏳ Pending Review",
          inline: true
        }
      ],
      footer: {
        text: "Poor Jokes Chrome Extension"
      },
      timestamp: new Date().toISOString()
    };

    const payload = {
      username: "Joke Moderator",
      avatar_url: "https://cdn.discordapp.com/emojis/1234567890123456789.png", // Optional: add a bot avatar
      embeds: [embed],
      components: [
        {
          type: 1, // Action Row
          components: [
            {
              type: 2, // Button
              style: 3, // Success (green)
              label: "✅ Approve",
              custom_id: `approve_${submission.id}`,
              emoji: {
                name: "✅"
              }
            },
            {
              type: 2, // Button
              style: 4, // Danger (red)
              label: "❌ Reject",
              custom_id: `reject_${submission.id}`,
              emoji: {
                name: "❌"
              }
            },
            {
              type: 2, // Button
              style: 2, // Secondary (gray)
              label: "👀 View Admin",
              url: "https://poor-jokes-newtab-hos0vxjqo-mayanks-projects-72f678fa.vercel.app/admin-local.html",
              emoji: {
                name: "👀"
              }
            }
          ]
        }
      ]
    };

    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log('Discord notification sent successfully');
    } else {
      console.error('Failed to send Discord notification:', response.status, await response.text());
    }
  } catch (error) {
    console.error('Error sending Discord notification:', error);
  }
}

// Send notification for approved joke
async function sendApprovalNotification(submission) {
  if (!DISCORD_WEBHOOK_URL) {
    return;
  }

  try {
    const embed = {
      title: "✅ Joke Approved",
      description: `**Joke ID:** ${submission.id}\n**Content:** ${submission.content}`,
      color: 0x00ff00, // Green color
      fields: [
        {
          name: "📅 Approved",
          value: new Date().toLocaleString(),
          inline: true
        },
        {
          name: "👤 Reviewed By",
          value: "Admin",
          inline: true
        }
      ],
      footer: {
        text: "Poor Jokes Chrome Extension"
      },
      timestamp: new Date().toISOString()
    };

    const payload = {
      username: "Joke Moderator",
      embeds: [embed]
    };

    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    console.log('Approval notification sent');
  } catch (error) {
    console.error('Error sending approval notification:', error);
  }
}

// Send notification for rejected joke
async function sendRejectionNotification(submission, reason) {
  if (!DISCORD_WEBHOOK_URL) {
    return;
  }

  try {
    const embed = {
      title: "❌ Joke Rejected",
      description: `**Joke ID:** ${submission.id}\n**Content:** ${submission.content}`,
      color: 0xff0000, // Red color
      fields: [
        {
          name: "📅 Rejected",
          value: new Date().toLocaleString(),
          inline: true
        },
        {
          name: "👤 Reviewed By",
          value: "Admin",
          inline: true
        },
        {
          name: "📝 Reason",
          value: reason || "No reason provided",
          inline: false
        }
      ],
      footer: {
        text: "Poor Jokes Chrome Extension"
      },
      timestamp: new Date().toISOString()
    };

    const payload = {
      username: "Joke Moderator",
      embeds: [embed]
    };

    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    console.log('Rejection notification sent');
  } catch (error) {
    console.error('Error sending rejection notification:', error);
  }
}

module.exports = {
  sendSubmissionNotification,
  sendApprovalNotification,
  sendRejectionNotification
};
