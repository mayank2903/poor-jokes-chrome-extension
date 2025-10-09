# Chrome Web Store Privacy Section Information

## For Chrome Web Store Developer Console

### Single Purpose
**Question:** Does your extension have a single purpose that is clear to users?

**Answer:** ✅ YES

**Explanation:** This extension has one clear, focused purpose: replacing the Chrome new tab page with a joke display interface for entertainment. All features (joke display, rating, submission) directly support this single entertainment purpose.

### Permission Justification
**Question:** Why does your extension need each permission?

**Answer:** NO PERMISSIONS REQUIRED

**Explanation:** This extension operates entirely within the new tab page context and does not request any special permissions. It uses only standard web APIs (fetch, localStorage) available to all web pages and Chrome's built-in new tab override functionality.

### Data Collection
**Question:** What data does your extension collect?

**Answer:** 
- Anonymous joke ratings (thumbs up/down)
- User-submitted jokes (voluntary)
- Anonymous session ID (local storage only)

**Explanation:** We collect minimal data necessary for functionality. No personal information, browsing data, or identifying information is collected.

### Data Usage
**Question:** How does your extension use collected data?

**Answer:**
- Anonymous ratings: Display community statistics and improve joke selection
- User submissions: Add to community joke collection after moderation
- Session ID: Maintain user preferences across browser sessions

**Explanation:** All data usage directly supports the extension's entertainment purpose and community features.

### Data Sharing
**Question:** Does your extension share data with third parties?

**Answer:** ❌ NO

**Explanation:** We do not share any user data with third parties. The only external service used is Vercel for hosting our API, which only receives anonymous ratings.

### Data Security
**Question:** How does your extension protect user data?

**Answer:**
- All data transmission uses HTTPS encryption
- Local data stored securely in browser-managed storage
- No external access to user data
- Regular security reviews of code and practices

### User Control
**Question:** What control do users have over their data?

**Answer:**
- Users can clear all local data by uninstalling the extension
- Users can choose not to rate jokes
- Users can choose not to submit jokes
- Users can view our privacy policy at any time

### Privacy Policy
**Question:** Do you have a privacy policy?

**Answer:** ✅ YES

**URL:** https://poor-jokes-newtab.vercel.app/privacy-policy.html

**Summary:** Our privacy policy clearly explains what data we collect, how we use it, and user rights. We collect minimal data (anonymous ratings and voluntary joke submissions only) and never share personal information.

### Data Retention
**Question:** How long do you retain user data?

**Answer:**
- Anonymous ratings: Indefinitely for community statistics
- User submissions: Indefinitely as community content
- Local session data: Until extension uninstalled

### Compliance
**Question:** Does your extension comply with applicable privacy laws?

**Answer:** ✅ YES

**Explanation:** We comply with GDPR, CCPA, and COPPA. We collect minimal data, provide user control, and maintain transparency about our practices.

### Children's Privacy
**Question:** Does your extension collect data from children?

**Answer:** ❌ NO

**Explanation:** Our extension is not directed to children under 13 and we do not knowingly collect personal information from children.

---

## Additional Information for Review

### Code Review
- All code is open source and available for review
- No hidden data collection or tracking
- Clear separation between local and server data

### Testing
- Extension tested for data leaks
- Privacy practices verified through code review
- No unauthorized data access found

### Updates
- Privacy practices will be maintained in future updates
- Any changes will be clearly communicated to users
- Privacy policy will be updated if practices change

---

**Prepared for:** Chrome Web Store Privacy Review
**Date:** September 22, 2025
**Extension Version:** 1.0.1
**Status:** Ready for submission
