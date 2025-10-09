# Chrome Web Store Privacy Practices Tab - Complete Guide

## Required Information for Chrome Web Store Submission

### 1. Single Purpose Description
**Field:** Single purpose description
**Required:** YES

**Answer:**
```
This extension replaces the Chrome new tab page with a joke display interface for entertainment purposes. The extension allows users to view jokes, rate them with thumbs up/down, and submit their own jokes to the community collection. All functionality is focused on providing entertainment through humor and building a community around sharing jokes.
```

### 2. Remote Code Justification
**Field:** Justification for remote code use
**Required:** YES

**Answer:**
```
This extension uses remote code (API calls) for the following essential functions:

1. **Fetching Jokes**: The extension fetches jokes from our API to provide fresh content to users. This is essential for the core functionality of displaying jokes.

2. **Syncing Ratings**: User ratings are sent to our API to maintain community statistics and improve joke selection. This enables the social aspect of the extension.

3. **Submitting Jokes**: Users can submit jokes through our API, which is essential for community participation and content growth.

4. **Health Checks**: The extension performs health checks on our API to ensure reliable service and automatically switch to fallback content if needed.

All remote code execution is limited to these specific, essential functions that directly support the extension's single purpose of providing entertainment through jokes. No arbitrary or unnecessary remote code is executed.
```

### 3. Data Usage Compliance Certification
**Field:** Data usage compliance certification
**Required:** YES

**Answer:**
```
✅ I certify that my data usage complies with Chrome Web Store Developer Programme Policies.

**Compliance Details:**
- We collect only anonymous joke ratings and voluntary user-submitted jokes
- No personal information, browsing data, or identifying information is collected
- All data collection is directly related to the extension's entertainment purpose
- No data is shared with third parties
- Users have full control over their data
- We comply with GDPR, CCPA, and COPPA requirements
- Our privacy practices are transparent and clearly documented
```

### 4. Detailed Description (Privacy Practices)
**Field:** Detailed description
**Required:** YES (minimum 25 characters)

**Answer:**
```
This extension collects minimal data necessary for its entertainment functionality:

**Data Collected:**
- Anonymous joke ratings (thumbs up/down) for community statistics
- User-submitted jokes (voluntary) for community content
- Anonymous session ID (local storage only) for preference maintenance

**Data NOT Collected:**
- Personal information (name, email, address)
- Browsing history or visited websites
- Location data or device identifiers
- Any personally identifiable information

**Data Usage:**
- Anonymous ratings: Display community statistics and improve joke selection
- User submissions: Add to community joke collection after moderation
- Session data: Maintain user preferences across browser sessions

**Data Protection:**
- All data transmission uses HTTPS encryption
- Local data stored securely in browser-managed storage
- No third-party data sharing
- Users can clear all data by uninstalling the extension

**Privacy Policy:** https://poor-jokes-newtab.vercel.app/privacy-policy.html
```

## Additional Privacy Tab Fields

### 5. Data Collection
**Field:** What data does your extension collect?
**Answer:**
- Anonymous joke ratings
- User-submitted jokes (voluntary)
- Anonymous session ID (local storage only)

### 6. Data Usage
**Field:** How does your extension use collected data?
**Answer:**
- Display community joke statistics
- Improve joke selection algorithm
- Maintain user rating preferences
- Expand community joke collection

### 7. Data Sharing
**Field:** Does your extension share data with third parties?
**Answer:**
No. We do not share any user data with third parties. The only external service used is Vercel for hosting our API, which only receives anonymous ratings.

### 8. Data Security
**Field:** How does your extension protect user data?
**Answer:**
- All data transmission uses HTTPS encryption
- Local data stored securely in browser-managed storage
- No external access to user data
- Regular security reviews of code and practices

### 9. User Control
**Field:** What control do users have over their data?
**Answer:**
- Users can clear all local data by uninstalling the extension
- Users can choose not to rate jokes
- Users can choose not to submit jokes
- Users can view our privacy policy at any time

### 10. Privacy Policy URL
**Field:** Privacy policy URL
**Answer:**
```
https://poor-jokes-newtab.vercel.app/privacy-policy.html
```

## Step-by-Step Instructions

1. **Go to Chrome Web Store Developer Console**
2. **Select your extension**
3. **Click "Privacy practices" tab**
4. **Fill in each field using the answers above**
5. **Save and submit for review**

## Important Notes

- **Single Purpose**: Focus on entertainment through jokes
- **Remote Code**: Justify API calls for core functionality
- **Data Minimization**: Emphasize minimal data collection
- **User Control**: Highlight user control over data
- **Compliance**: Mention GDPR/CCPA compliance
- **Transparency**: Reference privacy policy URL

---

**Status:** Ready for Chrome Web Store submission
**Last Updated:** September 22, 2025
**Extension Version:** 1.0.1
