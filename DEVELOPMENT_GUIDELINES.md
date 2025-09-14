# Development Guidelines

## 🛡️ Preventing API Parameter Mismatch Issues

### 1. **Always Use the API Client**
```javascript
// ✅ GOOD - Use the APIClient class
const api = new APIClient(API_BASE_URL);
await api.reviewSubmission(submissionId, 'approve');

// ❌ BAD - Direct fetch calls
await fetch('/api/submissions', {
  method: 'POST',
  body: JSON.stringify({
    submissionId, // Wrong parameter name!
    action: 'approve'
  })
});
```

### 2. **Check API Documentation First**
- Always refer to `API_DOCUMENTATION.md` before making API calls
- Parameter names are case-sensitive and must match exactly
- Required vs optional parameters are clearly documented

### 3. **Run Tests Before Deploying**
```bash
# Test API endpoints
npm run test:api

# Test locally
npm run local
```

### 4. **Parameter Validation Checklist**
Before making any API call, verify:
- [ ] All required parameters are present
- [ ] Parameter names match the API documentation exactly
- [ ] Parameter types are correct (string, number, boolean)
- [ ] Parameter values are within allowed ranges
- [ ] UUIDs are properly formatted

### 5. **Common Parameter Mappings**
| Frontend | Backend API | Notes |
|----------|-------------|-------|
| `submissionId` | `submission_id` | Use snake_case for API |
| `jokeId` | `joke_id` | Use snake_case for API |
| `userId` | `user_id` | Use snake_case for API |
| `rejectionReason` | `rejection_reason` | Use snake_case for API |
| `reviewedBy` | `reviewed_by` | Use snake_case for API |

### 6. **Error Handling Best Practices**
```javascript
try {
  const result = await api.reviewSubmission(id, 'approve');
  console.log('Success:', result);
} catch (error) {
  console.error('API Error:', error.message);
  // Handle error appropriately
}
```

### 7. **Testing New Features**
1. Write tests in `tests/api-test.js`
2. Test both valid and invalid parameters
3. Verify error messages are helpful
4. Run `npm run test:api` before deploying

### 8. **Code Review Checklist**
- [ ] API calls use the APIClient class
- [ ] Parameter names match API documentation
- [ ] Error handling is implemented
- [ ] Tests cover the new functionality
- [ ] Documentation is updated if needed

### 9. **Debugging API Issues**
1. Check browser console for validation errors
2. Check Vercel logs: `vercel logs <deployment-url>`
3. Use the API documentation to verify parameters
4. Test with curl to isolate frontend vs backend issues

### 10. **Deployment Process**
1. Run tests: `npm run test:api`
2. Test locally: `npm run local`
3. Deploy: `vercel --prod`
4. Verify deployment: `npm run test:api`

## 🚨 Red Flags to Watch For
- Direct `fetch()` calls instead of APIClient
- Parameter names that don't match API docs
- Missing error handling
- Untested API changes
- Inconsistent parameter naming (camelCase vs snake_case)

## 📚 Resources
- [API Documentation](./API_DOCUMENTATION.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Test Suite](./tests/api-test.js)
