# Basic MCP Server Template

This template provides a starting point for building custom Model Context Protocol (MCP) servers. Use this as a foundation for client projects to accelerate development.

## Features

- Standard MCP server structure with best practices
- Built-in error handling and logging
- Performance optimization
- Security features
- Documentation generation

## Usage

1. Clone this template
2. Update configuration in `config.json`
3. Implement custom tools in `tools/` directory
4. Customize error handling in `utils/error-handler.js`
5. Test with the included test suite
6. Deploy using the deployment script

## Directory Structure

```
basic-mcp-template/
├── config/
│   ├── config.json           # Main configuration
│   └── logging-config.json   # Logging settings
├── src/
│   ├── index.js              # Entry point
│   ├── server.js             # MCP server implementation
│   ├── tools/                # Tool implementations
│   │   ├── index.js          # Tool registry
│   │   ├── example-tool.js   # Example tool implementation
│   │   └── README.md         # Documentation for tool development
│   └── utils/                # Utility functions
│       ├── error-handler.js  # Error handling
│       ├── logger.js         # Logging utility
│       └── validators.js     # Input validation
├── tests/
│   ├── integration/          # Integration tests
│   └── unit/                 # Unit tests
├── docs/
│   ├── api.md                # API documentation
│   └── setup.md              # Setup instructions
├── scripts/
│   ├── deploy.sh             # Deployment script
│   └── test.sh               # Test runner
├── package.json              # Dependencies
└── README.md                 # This file
```

## Customization Guide

### Adding New Tools

1. Create a new file in the `src/tools/` directory
2. Implement the tool interface:

```javascript
// src/tools/my-custom-tool.js
const myCustomTool = {
  name: 'myCustomTool',
  description: 'Performs a custom operation',
  parameters: {
    type: 'object',
    properties: {
      input: {
        type: 'string',
        description: 'Input to process'
      }
    },
    required: ['input']
  },
  execute: async function(params) {
    try {
      // Implement tool functionality
      const result = processInput(params.input);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

module.exports = myCustomTool;
```

3. Register the tool in `src/tools/index.js`:

```javascript
const exampleTool = require('./example-tool');
const myCustomTool = require('./my-custom-tool');

module.exports = {
  exampleTool,
  myCustomTool
};
```

### Configuration

Update `config/config.json` with client-specific settings:

```json
{
  "server": {
    "port": 3000,
    "host": "localhost"
  },
  "security": {
    "enableApiKey": true,
    "apiKeyHeader": "X-API-Key",
    "rateLimiting": {
      "maxRequests": 100,
      "windowMs": 60000
    }
  },
  "logging": {
    "level": "info",
    "format": "json",
    "output": ["console", "file"],
    "filename": "logs/server.log"
  },
  "tools": {
    "exampleTool": {
      "enabled": true,
      "customSetting": "value"
    },
    "myCustomTool": {
      "enabled": true,
      "timeout": 5000
    }
  }
}
```

## Common Customizations for Clients

### API Integration

Add API integration by creating a dedicated tool:

```javascript
// src/tools/api-integration.js
const axios = require('axios');
const config = require('../../config/config.json');

const apiIntegration = {
  name: 'apiIntegration',
  description: 'Integrates with external API',
  parameters: {
    type: 'object',
    properties: {
      endpoint: {
        type: 'string',
        description: 'API endpoint to call'
      },
      method: {
        type: 'string',
        enum: ['GET', 'POST', 'PUT', 'DELETE'],
        default: 'GET',
        description: 'HTTP method'
      },
      data: {
        type: 'object',
        description: 'Data to send with request'
      }
    },
    required: ['endpoint']
  },
  execute: async function(params) {
    try {
      const apiConfig = config.tools.apiIntegration || {};
      const baseURL = apiConfig.baseURL || '';
      
      const response = await axios({
        method: params.method || 'GET',
        url: `${baseURL}${params.endpoint}`,
        data: params.data,
        headers: apiConfig.headers || {}
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        details: error.response?.data
      };
    }
  }
};

module.exports = apiIntegration;
```

### Database Connectivity

Implement database connectivity with a database tool:

```javascript
// src/tools/database.js
const { Pool } = require('pg');
const config = require('../../config/config.json');

// Initialize connection pool
const dbConfig = config.tools.database || {};
const pool = new Pool({
  user: dbConfig.user,
  host: dbConfig.host,
  database: dbConfig.database,
  password: dbConfig.password,
  port: dbConfig.port || 5432
});

const databaseTool = {
  name: 'database',
  description: 'Executes database operations',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'SQL query to execute'
      },
      values: {
        type: 'array',
        description: 'Parameter values for the query'
      }
    },
    required: ['query']
  },
  execute: async function(params) {
    try {
      const result = await pool.query(params.query, params.values || []);
      return { success: true, data: result.rows };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

module.exports = databaseTool;
```

## Deployment

The template includes a deployment script for easy installation:

```bash
# Deploy to production
./scripts/deploy.sh production

# Deploy to staging
./scripts/deploy.sh staging
```

## Testing

Run tests with the included test script:

```bash
# Run all tests
./scripts/test.sh

# Run specific test suite
./scripts/test.sh integration
```

## Documentation

The template includes documentation generation. Update API docs with:

```bash
npm run docs:generate
```

## Support

For help with this template, contact support@mcpforge.ai