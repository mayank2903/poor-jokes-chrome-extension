# Testing Never-Repeat Joke System Locally

This guide will help you test the never-repeat joke functionality locally.

## Quick Start

### 1. Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top right)
3. Click **"Load unpacked"**
4. Select the `chrome-store-package` folder:
   ```
   /Users/mb1994/Desktop/poor-jokes-newtab/chrome-store-package
   ```
5. The extension should now be loaded

### 2. Open a New Tab

- Open a new tab (Cmd+T / Ctrl+T)
- You should see the Poor Jokes extension with a joke displayed

## Testing Never-Repeat Functionality

### Test 1: Basic Never-Repeat

1. **Open Chrome DevTools** (F12 or Cmd+Option+I)
2. Go to **Console** tab
3. Click "Another" button multiple times
4. Watch the console logs - you should see:
   - `📝 Added joke to allSeenJokeIds: [joke-id]`
   - `📊 Total seen jokes: [count]`
5. **Verify**: Each joke should only appear once

### Test 2: Check localStorage State

1. In DevTools, go to **Application** tab (or **Storage** in older Chrome)
2. Expand **Local Storage** → `chrome-extension://[your-extension-id]`
3. Look for these keys:
   - `poorJokes_allSeenJokeIds` - Array of all seen joke IDs
   - `poorJokes_displayHistory` - Recent display history
   - `poorJokes_jokeFirstSeen` - Timestamps (for analytics)

### Test 3: Simulate "All Jokes Seen"

**Method 1: Using Console**

1. Open DevTools Console
2. Run this command to mark all jokes as seen:
   ```javascript
   // Get all jokes from the page
   const allJokeIds = window.allJokes?.map(j => j.id) || [];
   
   // Mark them all as seen
   const seenIds = new Set(JSON.parse(localStorage.getItem('poorJokes_allSeenJokeIds') || '[]'));
   allJokeIds.forEach(id => seenIds.add(id));
   localStorage.setItem('poorJokes_allSeenJokeIds', JSON.stringify([...seenIds]));
   
   console.log(`Marked ${allJokeIds.length} jokes as seen`);
   ```
3. Click "Another" button
4. You should see: **"You've seen all available jokes! New jokes are added regularly."**

**Method 2: Manual localStorage Edit**

1. In DevTools → Application → Local Storage
2. Find `poorJokes_allSeenJokeIds`
3. Edit the value to include all joke IDs (comma-separated array)
4. Refresh the page
5. Click "Another" - should show the message

### Test 4: Test Cleanup (Removed Jokes)

1. Mark some jokes as seen (click "Another" a few times)
2. In Console, simulate a joke being removed:
   ```javascript
   // Get current seen IDs
   const seenIds = JSON.parse(localStorage.getItem('poorJokes_allSeenJokeIds') || '[]');
   
   // Simulate: joke with ID "test-123" was removed from API
   // This would normally happen when loadJokes() runs and cleans up
   const currentJokeIds = window.allJokes?.map(j => j.id) || [];
   const cleanedIds = seenIds.filter(id => currentJokeIds.includes(id));
   localStorage.setItem('poorJokes_allSeenJokeIds', JSON.stringify(cleanedIds));
   
   console.log(`Cleaned up ${seenIds.length - cleanedIds.length} removed joke IDs`);
   ```

### Test 5: Reset and Start Fresh

**Clear all tracking data:**

```javascript
// Clear all joke tracking
localStorage.removeItem('poorJokes_allSeenJokeIds');
localStorage.removeItem('poorJokes_displayHistory');
localStorage.removeItem('poorJokes_jokeFirstSeen');

// Reload the page
location.reload();
```

Or manually in DevTools:
1. Application → Local Storage
2. Delete the keys:
   - `poorJokes_allSeenJokeIds`
   - `poorJokes_displayHistory`
   - `poorJokes_jokeFirstSeen`
3. Refresh the page

### Test 6: Test Migration (Existing Users)

1. First, create some `jokeFirstSeen` data:
   ```javascript
   const jokeFirstSeen = {
     'joke-1': Date.now(),
     'joke-2': Date.now() - 10000,
     'joke-3': Date.now() - 20000
   };
   localStorage.setItem('poorJokes_jokeFirstSeen', JSON.stringify(jokeFirstSeen));
   ```
2. Clear `poorJokes_allSeenJokeIds`:
   ```javascript
   localStorage.removeItem('poorJokes_allSeenJokeIds');
   ```
3. Reload the page
4. Check console - should see migration log:
   - `🔄 Migrated X jokes from jokeFirstSeen to allSeenJokeIds`
5. Verify in localStorage that IDs were migrated

## Monitoring Console Logs

Watch for these log messages:

- `🆕 First time seeing joke: [id]` - New joke displayed
- `📝 Added joke to allSeenJokeIds: [id]` - Joke added to never-repeat list
- `📊 Total seen jokes: [count]` - Current count of seen jokes
- `🧹 Cleaned up X joke IDs that are no longer active` - Cleanup happened
- `🔄 Migrated X jokes from jokeFirstSeen to allSeenJokeIds` - Migration happened
- `✅ Loaded X jokes from API (Y new)` - Jokes loaded, Y are unseen
- `📚 User has seen all available jokes` - All jokes seen

## Testing Scenarios

### Scenario 1: Normal Usage
1. Open new tab
2. Click "Another" 10-20 times
3. Verify no repeats
4. Check `allSeenJokeIds` grows

### Scenario 2: New Jokes Added
1. Mark all current jokes as seen (see Test 3)
2. Simulate new jokes being added (would happen via API)
3. Click "Another" - should show new jokes

### Scenario 3: Jokes Removed
1. Mark some jokes as seen
2. Simulate those jokes being removed from API
3. Reload page (triggers `loadJokes()`)
4. Check console for cleanup message
5. Verify removed joke IDs are gone from `allSeenJokeIds`

### Scenario 4: Storage Bounds
1. Load extension
2. Check initial `allSeenJokeIds` size
3. Mark many jokes as seen
4. Verify storage only grows with active joke count
5. Remove some jokes (simulate)
6. Verify storage shrinks accordingly

## Debugging Tips

### Check Current State
```javascript
// In Console, run:
const state = {
  allJokes: window.allJokes?.length || 0,
  seenJokes: JSON.parse(localStorage.getItem('poorJokes_allSeenJokeIds') || '[]').length,
  unseenJokes: window.allJokes?.filter(j => {
    const seen = new Set(JSON.parse(localStorage.getItem('poorJokes_allSeenJokeIds') || '[]'));
    return !seen.has(j.id);
  }).length || 0,
  displayHistory: JSON.parse(localStorage.getItem('poorJokes_displayHistory') || '[]').length
};
console.table(state);
```

### Force Show Unseen Jokes
```javascript
// Get unseen jokes
const seen = new Set(JSON.parse(localStorage.getItem('poorJokes_allSeenJokeIds') || '[]'));
const unseen = window.allJokes?.filter(j => !seen.has(j.id)) || [];
console.log(`Unseen jokes: ${unseen.length}`);
console.log(unseen.map(j => j.id));
```

### Check if Joke Will Repeat
```javascript
// Check if a specific joke ID has been seen
const jokeId = 'your-joke-id-here';
const seen = new Set(JSON.parse(localStorage.getItem('poorJokes_allSeenJokeIds') || '[]'));
console.log(`Joke ${jokeId} has been seen: ${seen.has(jokeId)}`);
```

## Expected Behavior

✅ **Should Happen:**
- Jokes never repeat (as long as they're in active list)
- Storage stays bounded (only active jokes tracked)
- Cleanup happens when jokes are removed
- Migration works for existing users
- Message shows when all jokes seen

❌ **Should NOT Happen:**
- Same joke appearing twice
- Storage growing infinitely
- Old/deleted jokes staying in `allSeenJokeIds`
- Repeats after seeing all jokes

## Troubleshooting

**Jokes are repeating:**
- Check if `allSeenJokeIds` is being saved
- Verify joke IDs are consistent
- Check console for errors

**Storage growing too large:**
- Verify cleanup happens in `loadJokes()`
- Check that removed jokes are filtered out
- Ensure only active joke IDs are kept

**Migration not working:**
- Check if `jokeFirstSeen` has data
- Verify jokes exist in current `allJokes`
- Check console for migration logs

**"All jokes seen" message not showing:**
- Verify `getAvailableJokes()` returns empty
- Check that all joke IDs are in `allSeenJokeIds`
- Ensure unseen jokes check is working

Happy testing! 🎭

