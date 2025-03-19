/**
 * MCP Server Implementation
 * This file serves as the core server implementation for Model Context Protocol.
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const logger = require('./utils/logger');
const errorHandler = require('./utils/error-handler');
const validators = require('./utils/validators');
const tools = require('./tools');

class MCPServer {
  constructor(config) {
    this.config = config;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors());
    
    // Parse JSON requests
    this.app.use(bodyParser.json());
    
    // Add request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`);
      next();
    });
    
    // Add rate limiting if configured
    if (this.config.security?.rateLimiting) {
      const limiter = rateLimit({
        windowMs: this.config.security.rateLimiting.windowMs || 60000,
        max: this.config.security.rateLimiting.maxRequests || 100,
        message: 'Too many requests from this IP, please try again later.'
      });
      this.app.use(limiter);
    }
    
    // API key authentication if enabled
    if (this.config.security?.enableApiKey) {
      this.app.use((req, res, next) => {
        const apiKey = req.headers[this.config.security.apiKeyHeader?.toLowerCase() || 'x-api-key'];
        
        if (!apiKey || apiKey !== this.config.security.apiKey) {
          return res.status(401).json({
            success: false,
            error: 'Invalid or missing API key'
          });
        }
        
        next();
      });
    }
  }
  
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        version: require('../../package.json').version,
        timestamp: new Date().toISOString()
      });
    });
    
    // MCP protocol endpoint
    this.app.post('/mcp', async (req, res, next) => {
      try {
        const { tool, params } = req.body;
        
        // Validate request structure
        if (!tool || typeof tool !== 'string') {
          return res.status(400).json({
            success: false,
            error: 'Missing or invalid tool name'
          });
        }
        
        // Check if tool exists
        if (!tools[tool] || !tools[tool].execute) {
          return res.status(404).json({
            success: false,
            error: `Tool '${tool}' not found or not properly implemented`
          });
        }
        
        // Check if tool is enabled in config
        if (this.config.tools?.[tool]?.enabled === false) {
          return res.status(403).json({
            success: false,
            error: `Tool '${tool}' is disabled`
          });
        }
        
        // Validate parameters against schema
        if (tools[tool].parameters) {
          const validationError = validators.validateParams(params, tools[tool].parameters);
          if (validationError) {
            return res.status(400).json({
              success: false,
              error: 'Invalid parameters',
              details: validationError
            });
          }
        }
        
        // Execute the tool
        const result = await tools[tool].execute(params);
        res.json(result);
      } catch (error) {
        next(error);
      }
    });
    
    // Tool discovery endpoint - returns info about available tools
    this.app.get('/tools', (req, res) => {
      const availableTools = Object.entries(tools)
        .filter(([name]) => this.config.tools?.[name]?.enabled !== false)
        .map(([name, tool]) => ({
          name,
          description: tool.description,
          parameters: tool.parameters
        }));
      
      res.json({
        success: true,
        tools: availableTools
      });
    });
  }
  
  setupErrorHandling() {
    // Handle 404 errors
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: `Endpoint ${req.method} ${req.path} not found`
      });
    });
    
    // Global error handler
    this.app.use(errorHandler);
  }
  
  start() {
    const port = this.config.server?.port || 3000;
    const host = this.config.server?.host || 'localhost';
    
    return new Promise((resolve) => {
      this.server = this.app.listen(port, host, () => {
        logger.info(`MCP server listening at http://${host}:${port}`);
        resolve();
      });
    });
  }
  
  stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          logger.info('MCP server stopped');
          resolve();
        });
      });
    }
    return Promise.resolve();
  }
}

module.exports = MCPServer;