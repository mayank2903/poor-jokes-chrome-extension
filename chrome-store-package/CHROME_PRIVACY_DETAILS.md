# Chrome Web Store Privacy Information

## Single Purpose Declaration

**Primary Purpose:** This extension replaces the Chrome new tab page with a joke display interface that allows users to view, rate, and submit jokes for entertainment purposes.

**Single Purpose Compliance:** ✅ YES
- The extension has one clear, focused purpose: displaying jokes on the new tab page
- All features (rating, submission, display) directly support this single purpose
- No unrelated functionality or data collection

## Permission Justification

### Required Permissions: NONE

**No permissions requested in manifest.json**

**Justification:** This extension operates entirely within the new tab page context and does not require any special permissions. It uses:
- Standard web APIs (fetch, localStorage) available to all web pages
- Chrome's built-in new tab override functionality
- No access to browsing data, tabs, or external websites

## Data Collection & Usage

### Data We Collect

**1. Anonymous Joke Ratings**
- **What:** Thumbs up/down ratings for jokes
- **Why:** To provide community statistics and improve joke selection
- **Storage:** Local device + anonymous server storage
- **Retention:** Indefinitely for community benefit

**2. User-Submitted Jokes**
- **What:** Jokes voluntarily submitted by users
- **Why:** To expand the community joke collection
- **Storage:** Server storage with moderation
- **Retention:** Indefinitely as community content

**3. Anonymous User ID**
- **What:** Randomly generated session identifier
- **Why:** To maintain rating preferences across sessions
- **Storage:** Local device only
- **Retention:** Until extension uninstalled

### Data We DON'T Collect

- ❌ Personal information (name, email, address)
- ❌ Browsing history or visited websites
- ❌ Location data
- ❌ Device identifiers
- ❌ Contact information
- ❌ Any personally identifiable information

## Data Handling Practices

### Local Storage
- **Purpose:** Store user preferences and rating history
- **Scope:** Only on user's device
- **Control:** User can clear by uninstalling extension
- **Security:** No external transmission of personal data

### Server Communication
- **Purpose:** Sync anonymous ratings and fetch new jokes
- **Data Transmitted:** Only anonymous ratings and joke content
- **Encryption:** All communication uses HTTPS
- **Third Parties:** No data shared with third parties

### Data Minimization
- **Principle:** Collect only what's necessary for functionality
- **Implementation:** No tracking, analytics, or advertising
- **User Control:** Users can stop submitting data anytime

## Third-Party Services

### Vercel (Hosting)
- **Purpose:** Host API endpoints
- **Data Shared:** Only anonymous joke ratings
- **Privacy:** Vercel's privacy policy applies to hosting only
- **No Tracking:** No user tracking or analytics

### No Other Third Parties
- ❌ No Google Analytics
- ❌ No advertising networks
- ❌ No social media integration
- ❌ No external tracking

## User Rights & Controls

### Data Access
- **Local Data:** Users can view/clear via browser settings
- **Server Data:** Anonymous ratings cannot be traced to individuals
- **Transparency:** All data practices disclosed in privacy policy

### Data Deletion
- **Local Data:** Uninstall extension to clear all local data
- **Server Data:** Anonymous ratings remain for community statistics
- **User Submissions:** Can be removed by contacting support

### Opt-Out Options
- **Rating:** Users can choose not to rate jokes
- **Submissions:** Users can choose not to submit jokes
- **Complete Opt-Out:** Uninstall extension

## Security Measures

### Data Protection
- **Encryption:** All data transmission uses HTTPS
- **Local Storage:** Browser-managed secure storage
- **No External Access:** No third-party access to user data

### Privacy by Design
- **Minimal Collection:** Only essential data collected
- **Purpose Limitation:** Data used only for stated purposes
- **User Control:** Users have full control over their data

## Compliance Statements

### GDPR Compliance
- ✅ Lawful basis: Legitimate interest (community joke collection)
- ✅ Data minimization: Only necessary data collected
- ✅ User rights: Access, rectification, erasure supported
- ✅ Transparency: Clear privacy policy and practices

### CCPA Compliance
- ✅ No sale of personal information
- ✅ Clear data collection practices
- ✅ User rights respected
- ✅ No discrimination for exercising rights

### COPPA Compliance
- ✅ Not directed to children under 13
- ✅ No collection of personal information from children
- ✅ Age-appropriate content

## Contact Information

**Privacy Questions:** privacy@poorjokes.com
**Extension Support:** https://poor-jokes-newtab.vercel.app
**Privacy Policy:** https://poor-jokes-newtab.vercel.app/privacy-policy.html

---

**Last Updated:** September 22, 2025
**Version:** 1.0.1
**Review Status:** Ready for Chrome Web Store submission
