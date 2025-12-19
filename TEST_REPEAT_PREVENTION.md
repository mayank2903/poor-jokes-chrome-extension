# Joke Repeat Prevention Test

## Overview
This integration test verifies that the joke repeat prevention system works correctly by simulating a user continuously pressing the "another" button until all jokes are exhausted.

## Test Requirements
- **Maximum allowed repeats**: 10 jokes
- **Test failure**: If more than 10 jokes repeat during the journey, the test fails and publishing is blocked

## How It Works
1. Initializes with 200 test jokes
2. Simulates loading jokes from API (with pagination)
3. Continuously calls `showRandomJoke()` (simulating "another" button clicks)
4. Tracks all jokes shown by ID
5. Counts how many unique jokes were repeated
6. Fails if more than 10 jokes repeated

## Running the Test

### Locally
```bash
npm run test:repeat
# or
node tests/joke-repeat-test.js
```

### In CI/CD
The test runs automatically in GitHub Actions on:
- Push to main/master branch
- Pull requests
- Manual workflow dispatch

## Test Output
The test provides detailed statistics:
- Total jokes shown
- Unique jokes
- Repeated jokes count
- List of repeated jokes (if any)

## Integration with Publishing
The test is integrated into the `package:store` script, so it runs before creating the Chrome Web Store package. If the test fails, packaging is blocked.

## GitHub Actions
The `.github/workflows/test-and-publish.yml` workflow:
1. Runs the repeat prevention test
2. Runs existing integration tests
3. If tests pass, packages the extension
4. Uploads the package as an artifact

If any test fails, the workflow fails and publishing is blocked.

