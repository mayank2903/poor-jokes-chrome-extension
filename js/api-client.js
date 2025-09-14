// Frontend API Client with Parameter Validation
// This ensures frontend sends correct parameters to backend

class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  // Validate parameters before sending requests
  validateParams(endpoint, method, params) {
    const validationRules = {
      '/api/jokes': {
        POST: {
          required: ['content'],
          optional: ['submitted_by'],
          types: {
            content: 'string',
            submitted_by: 'string'
          }
        }
      },
      '/api/rate': {
        POST: {
          required: ['joke_id', 'user_id', 'rating'],
          optional: [],
          types: {
            joke_id: 'string',
            user_id: 'string',
            rating: 'number'
          }
        }
      },
      '/api/submissions': {
        POST: {
          required: ['submission_id', 'action'],
          optional: ['rejection_reason', 'reviewed_by'],
          types: {
            submission_id: 'string',
            action: 'string',
            rejection_reason: 'string',
            reviewed_by: 'string'
          }
        }
      }
    };

    const rules = validationRules[endpoint]?.[method];
    if (!rules) return { valid: true };

    const errors = [];

    // Check required parameters
    for (const param of rules.required) {
      if (params[param] === undefined || params[param] === null) {
        errors.push(`Missing required parameter: ${param}`);
      }
    }

    // Check parameter types
    for (const [param, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      
      const expectedType = rules.types[param];
      if (expectedType && typeof value !== expectedType) {
        errors.push(`Parameter '${param}' must be of type ${expectedType}, got ${typeof value}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  // Make API request with validation
  async request(endpoint, method = 'GET', params = {}) {
    // Validate parameters
    const validation = this.validateParams(endpoint, method, params);
    if (!validation.valid) {
      console.error('API Parameter Validation Failed:', {
        endpoint,
        method,
        errors: validation.errors,
        params
      });
      throw new Error(`API Parameter Validation Failed: ${validation.errors.join(', ')}`);
    }

    const url = `${this.baseURL}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (method !== 'GET' && Object.keys(params).length > 0) {
      options.body = JSON.stringify(params);
    }

    console.log(`🌐 API Request: ${method} ${url}`, params);

    try {
      const response = await fetch(url, options);
      const data = await response.json();

      if (!response.ok) {
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          data: data,
          endpoint,
          method,
          params
        });
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`✅ API Success: ${method} ${url}`, data);
      return data;
    } catch (error) {
      console.error('API Request Failed:', {
        endpoint,
        method,
        params,
        error: error.message
      });
      throw error;
    }
  }

  // Specific API methods with proper parameter names
  async getJokes() {
    return this.request('/api/jokes', 'GET');
  }

  async submitJoke(content, submittedBy = 'anonymous') {
    return this.request('/api/jokes', 'POST', {
      content: content,
      submitted_by: submittedBy
    });
  }

  async rateJoke(jokeId, userId, rating) {
    return this.request('/api/rate', 'POST', {
      joke_id: jokeId,
      user_id: userId,
      rating: rating
    });
  }

  async getSubmissions(status = 'pending') {
    return this.request(`/api/submissions?status=${status}`, 'GET');
  }

  async reviewSubmission(submissionId, action, rejectionReason = '', reviewedBy = 'admin') {
    return this.request('/api/submissions', 'POST', {
      submission_id: submissionId,
      action: action,
      rejection_reason: rejectionReason,
      reviewed_by: reviewedBy
    });
  }
}

// Export for use in other files
window.APIClient = APIClient;
