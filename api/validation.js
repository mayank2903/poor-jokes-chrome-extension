// API Parameter Validation Utilities
// This helps prevent parameter mismatch issues

const API_SCHEMAS = {
  '/api/jokes': {
    POST: {
      required: ['content'],
      optional: ['submitted_by'],
      types: {
        content: 'string',
        submitted_by: 'string'
      },
      validation: {
        content: {
          minLength: 1,
          maxLength: 500,
          trim: true
        },
        submitted_by: {
          maxLength: 100
        }
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
      },
      validation: {
        joke_id: {
          format: 'uuid'
        },
        user_id: {
          minLength: 1,
          maxLength: 100
        },
        rating: {
          values: [1, -1]
        }
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
      },
      validation: {
        submission_id: {
          format: 'uuid'
        },
        action: {
          values: ['approve', 'reject']
        },
        rejection_reason: {
          maxLength: 500,
          optional: true
        },
        reviewed_by: {
          maxLength: 100
        }
      }
    }
  }
};

// Validate request parameters against schema
function validateRequest(req, res, next) {
  const { method, url, body } = req;
  const path = url.split('?')[0]; // Remove query parameters
  
  // Get schema for this endpoint
  const schema = API_SCHEMAS[path]?.[method];
  
  if (!schema) {
    console.warn(`No validation schema found for ${method} ${path}`);
    return next();
  }
  
  const errors = [];
  
  // Check required parameters
  for (const param of schema.required) {
    if (body[param] === undefined || body[param] === null) {
      errors.push(`Missing required parameter: ${param}`);
    }
  }
  
  // Validate parameter types and values
  for (const [param, value] of Object.entries(body)) {
    if (value === undefined || value === null) continue;
    
    const paramSchema = schema.validation[param];
    if (!paramSchema) continue;
    
    // Type validation
    const expectedType = schema.types[param];
    if (expectedType && typeof value !== expectedType) {
      errors.push(`Parameter '${param}' must be of type ${expectedType}, got ${typeof value}`);
    }
    
    // String length validation (only if value is not empty)
    if (value && typeof value === 'string') {
      if (paramSchema.minLength && value.length < paramSchema.minLength) {
        errors.push(`Parameter '${param}' must be at least ${paramSchema.minLength} characters`);
      }
      
      if (paramSchema.maxLength && value.length > paramSchema.maxLength) {
        errors.push(`Parameter '${param}' must be no more than ${paramSchema.maxLength} characters`);
      }
    }
    
    // Value validation
    if (paramSchema.values && !paramSchema.values.includes(value)) {
      errors.push(`Parameter '${param}' must be one of: ${paramSchema.values.join(', ')}`);
    }
    
    // UUID format validation
    if (paramSchema.format === 'uuid') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(value)) {
        errors.push(`Parameter '${param}' must be a valid UUID`);
      }
    }
    
    // Trim strings if specified
    if (paramSchema.trim && typeof value === 'string') {
      body[param] = value.trim();
    }
  }
  
  if (errors.length > 0) {
    console.error('API Validation Errors:', {
      endpoint: `${method} ${path}`,
      errors: errors,
      receivedBody: body
    });
    
    return res.status(400).json({
      success: false,
      error: 'Invalid request parameters',
      details: errors,
      received: body
    });
  }
  
  console.log(`✅ API Validation passed for ${method} ${path}`);
  next();
}

// Enhanced error logging
function logAPIError(endpoint, error, requestBody = {}) {
  console.error('🚨 API Error:', {
    timestamp: new Date().toISOString(),
    endpoint: endpoint,
    error: error.message || error,
    stack: error.stack,
    requestBody: requestBody,
    userAgent: requestBody.userAgent || 'unknown'
  });
}

// Success logging
function logAPISuccess(endpoint, action, data = {}) {
  console.log('✅ API Success:', {
    timestamp: new Date().toISOString(),
    endpoint: endpoint,
    action: action,
    dataKeys: Object.keys(data)
  });
}

module.exports = {
  validateRequest,
  logAPIError,
  logAPISuccess,
  API_SCHEMAS
};
