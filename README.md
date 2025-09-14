# 🎭 Poor Jokes New Tab - Chrome Extension

A modern Chrome extension that transforms your new tab into a laughter-filled experience with poor jokes, community ratings, and submission system.

## ✨ Features

- **Daily Jokes**: Fresh poor jokes delivered to your new tab
- **Community Rating**: Rate jokes with thumbs up/down
- **Joke Submission**: Submit your own poor jokes for review
- **Admin Dashboard**: Manage submissions and approve/reject jokes
- **Modern UI**: Beautiful, responsive design with dark mode support
- **Real-time Updates**: Live joke updates and statistics

## 🏗️ Architecture

This project uses a modern, component-based architecture with clear separation of concerns:

```
src/
├── frontend/           # Frontend components and services
│   ├── components/     # Reusable UI components
│   ├── services/       # API and business logic services
│   ├── app.js         # Main application class
│   ├── newtab.html    # Main HTML template
│   └── styles.css     # Modern CSS with design system
├── backend/           # Backend API and services
│   ├── api/           # API endpoints
│   ├── middleware/    # Request/response middleware
│   └── services/      # Business logic services
├── shared/            # Shared utilities and types
│   ├── constants/     # Application constants
│   ├── types/         # TypeScript-like type definitions
│   └── config/        # Configuration management
└── lib/               # Utility modules
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Chrome browser
- Supabase account (free)
- Vercel account (free)

### 1. Clone and Install

```bash
git clone https://github.com/mayank2903/poor-jokes-chrome-extension.git
cd poor-jokes-chrome-extension
npm install
```

### 2. Set Up Database

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `database-schema.sql`
3. Get your API keys from Settings > API

### 3. Configure Environment

Create a `.env` file:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_PASSWORD=your_admin_password
GMAIL_CLIENT_ID=your_gmail_client_id (optional)
GMAIL_CLIENT_SECRET=your_gmail_client_secret (optional)
GMAIL_REFRESH_TOKEN=your_gmail_refresh_token (optional)
GMAIL_USER_EMAIL=your_email@gmail.com (optional)
```

### 4. Deploy Backend

```bash
# Deploy to Vercel
npm run deploy

# Or deploy manually
vercel --prod
```

### 5. Load Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the project folder
4. Open a new tab to see the extension!

## 🛠️ Development

### Project Structure

#### Frontend (`src/frontend/`)

- **`app.js`**: Main application class with lifecycle management
- **`components/joke-card.js`**: Reusable joke card component
- **`services/api-client.js`**: Modern API client with retry logic
- **`services/joke-service.js`**: Business logic for jokes and ratings
- **`newtab.html`**: Main HTML template
- **`styles.css`**: Modern CSS with design system

#### Backend (`src/backend/`)

- **`api/jokes.js`**: Jokes API endpoint
- **`api/rate.js`**: Rating API endpoint  
- **`api/submissions.js`**: Submissions API endpoint
- **`middleware/error-handler.js`**: Centralized error handling
- **`middleware/validation.js`**: Request validation
- **`services/database.js`**: Database service layer

#### Shared (`src/shared/`)

- **`constants/`**: Application constants and configuration
- **`types/`**: JSDoc type definitions
- **`config/`**: Configuration management system

### Key Features

#### Modern Component System

```javascript
// Create a joke card component
const jokeCard = new JokeCard(joke, {
  showRating: true,
  onRating: (joke, rating) => console.log('Rated!'),
  onCopy: (joke) => console.log('Copied!')
});

const element = jokeCard.create();
```

#### Type-Safe API Client

```javascript
// API client with automatic retries and error handling
const apiClient = new APIClient();

try {
  const jokes = await apiClient.getJokes({ limit: 10 });
  const result = await apiClient.rateJoke(jokeId, userId, 'up');
} catch (error) {
  console.error('API Error:', error.message);
}
```

#### Configuration Management

```javascript
// Centralized configuration
const config = require('./src/shared/config');

console.log(config.get('api.baseUrl'));
console.log(config.get('features.notifications'));
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run deploy       # Deploy to Vercel
npm run local        # Start local server
npm run test         # Run tests
npm run package:store # Package for Chrome Web Store
```

## 🎨 Design System

The project uses a modern design system with:

- **CSS Custom Properties**: Consistent theming
- **Responsive Design**: Mobile-first approach
- **Dark Mode**: Automatic dark mode support
- **Accessibility**: WCAG compliant components
- **Modern Typography**: Inter font family
- **Smooth Animations**: CSS transitions and transforms

### Color Palette

```css
--primary-color: #6366f1
--success-color: #10b981
--error-color: #ef4444
--warning-color: #f59e0b
--background-color: #f8fafc
--surface-color: #ffffff
```

## 📊 API Documentation

### Endpoints

#### `GET /api/jokes`
Fetch jokes with optional pagination.

**Query Parameters:**
- `limit` (number): Number of jokes to return (default: 20)
- `offset` (number): Number of jokes to skip (default: 0)
- `order_by` (string): Field to order by (default: 'created_at')

**Response:**
```json
{
  "success": true,
  "jokes": [...],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 100
  }
}
```

#### `POST /api/jokes`
Submit a new joke for review.

**Request Body:**
```json
{
  "content": "Your poor joke here",
  "submitted_by": "Your Name"
}
```

#### `POST /api/rate`
Rate a joke.

**Request Body:**
```json
{
  "joke_id": "uuid",
  "user_id": "user_id",
  "rating": "up" // or "down"
}
```

#### `GET /api/submissions`
Get joke submissions (admin only).

**Headers:**
- `x-admin-password`: Admin password

**Query Parameters:**
- `status` (string): Filter by status (pending, approved, rejected)

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `ADMIN_PASSWORD` | Admin dashboard password | Yes |
| `GMAIL_CLIENT_ID` | Gmail API client ID | No |
| `GMAIL_CLIENT_SECRET` | Gmail API client secret | No |
| `GMAIL_REFRESH_TOKEN` | Gmail API refresh token | No |
| `GMAIL_USER_EMAIL` | Gmail user email | No |

### Feature Flags

The application supports feature flags in the configuration:

```javascript
features: {
  gmailNotifications: false,  // Gmail API notifications
  adminDashboard: true,       // Admin dashboard
  jokeSubmission: true,       // Joke submission
  ratingSystem: true         // Rating system
}
```

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## 🧪 Testing

```bash
# Run API tests
npm run test:api

# Run all tests
npm run test:all

# Health check
npm run health
```

## 📱 Chrome Web Store

### Packaging

```bash
# Create store package
npm run package:store
```

This creates a `chrome-store-package/` directory ready for upload.

### Store Listing

See `store-assets/store-listing.md` for complete store listing content.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for the backend
- [Vercel](https://vercel.com) for hosting
- [Chrome Extensions API](https://developer.chrome.com/docs/extensions/) for extension functionality

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/mayank2903/poor-jokes-chrome-extension/issues)
- **Documentation**: [Wiki](https://github.com/mayank2903/poor-jokes-chrome-extension/wiki)
- **Email**: [Your Email]

---

Made with 😂 and poor jokes by [Your Name]
