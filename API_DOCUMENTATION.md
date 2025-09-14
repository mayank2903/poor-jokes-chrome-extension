# Poor Jokes API Documentation

## Base URL
```
https://poor-jokes-newtab-ch83a79yv-mayanks-projects-72f678fa.vercel.app/api
```

## Authentication
No authentication required for public endpoints.

## Endpoints

### 1. Get Jokes
**GET** `/api/jokes`

Returns all active jokes with their ratings.

**Response:**
```json
{
  "success": true,
  "jokes": [
    {
      "id": "uuid",
      "content": "string",
      "created_at": "ISO date",
      "up_votes": 0,
      "down_votes": 0,
      "total_votes": 0,
      "rating_percentage": 0
    }
  ]
}
```

### 2. Submit Joke
**POST** `/api/jokes`

Submit a new joke for moderation.

**Parameters:**
- `content` (string, required): The joke content (1-500 characters)
- `submitted_by` (string, optional): Submitter identifier (max 100 characters)

**Request Body:**
```json
{
  "content": "Why did the chicken cross the road?",
  "submitted_by": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Joke submitted successfully! It will be reviewed before being added.",
  "submission_id": "uuid"
}
```

### 3. Rate Joke
**POST** `/api/rate`

Rate a joke with thumbs up or down.

**Parameters:**
- `joke_id` (string, required): UUID of the joke
- `user_id` (string, required): User identifier (1-100 characters)
- `rating` (number, required): 1 for thumbs up, -1 for thumbs down

**Request Body:**
```json
{
  "joke_id": "uuid",
  "user_id": "user123",
  "rating": 1
}
```

**Response:**
```json
{
  "success": true,
  "action": "added|updated|removed",
  "message": "Rating added"
}
```

### 4. Get Submissions
**GET** `/api/submissions?status=pending`

Get joke submissions for moderation.

**Query Parameters:**
- `status` (string, optional): Filter by status (pending, approved, rejected). Default: pending

**Response:**
```json
{
  "success": true,
  "submissions": [
    {
      "id": "uuid",
      "content": "string",
      "submitted_by": "string",
      "status": "pending",
      "created_at": "ISO date",
      "reviewed_at": "ISO date",
      "reviewed_by": "string",
      "rejection_reason": "string"
    }
  ]
}
```

### 5. Review Submission
**POST** `/api/submissions`

Approve or reject a joke submission.

**Parameters:**
- `submission_id` (string, required): UUID of the submission
- `action` (string, required): "approve" or "reject"
- `rejection_reason` (string, optional): Reason for rejection (max 500 characters)
- `reviewed_by` (string, optional): Reviewer identifier (max 100 characters)

**Request Body:**
```json
{
  "submission_id": "uuid",
  "action": "approve",
  "rejection_reason": "",
  "reviewed_by": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Joke approved and added to the collection",
  "joke_id": "uuid"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid request parameters",
  "details": [
    "Missing required parameter: content",
    "Parameter 'rating' must be one of: 1, -1"
  ],
  "received": {
    "content": "",
    "rating": 2
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to submit joke"
}
```

## Parameter Validation Rules

### Content
- Type: string
- Length: 1-500 characters
- Trimmed automatically

### UUIDs
- Format: Standard UUID v4
- Examples: joke_id, submission_id

### Ratings
- Type: number
- Values: 1 (thumbs up) or -1 (thumbs down)

### Actions
- Type: string
- Values: "approve" or "reject"

## Frontend Integration

Use the provided `APIClient` class for type-safe API calls:

```javascript
const api = new APIClient('https://poor-jokes-newtab-ch83a79yv-mayanks-projects-72f678fa.vercel.app/api');

// Submit a joke
await api.submitJoke("Why did the chicken cross the road?", "user123");

// Rate a joke
await api.rateJoke("joke-uuid", "user123", 1);

// Review submission
await api.reviewSubmission("submission-uuid", "approve");
```

## Testing

Test API endpoints with curl:

```bash
# Get jokes
curl "https://poor-jokes-newtab-ch83a79yv-mayanks-projects-72f678fa.vercel.app/api/jokes"

# Submit joke
curl -X POST "https://poor-jokes-newtab-ch83a79yv-mayanks-projects-72f678fa.vercel.app/api/jokes" \
  -H "Content-Type: application/json" \
  -d '{"content":"Test joke","submitted_by":"test-user"}'

# Rate joke
curl -X POST "https://poor-jokes-newtab-ch83a79yv-mayanks-projects-72f678fa.vercel.app/api/rate" \
  -H "Content-Type: application/json" \
  -d '{"joke_id":"uuid","user_id":"test-user","rating":1}'
```
