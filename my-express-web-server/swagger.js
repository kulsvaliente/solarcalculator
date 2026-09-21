const swaggerUi = require('swagger-ui-express');
const YAML = require('yaml');
const fs = require('fs');
const basicAuth = require('express-basic-auth');

// Function to setup Swagger UI with authentication
const setupSwagger = (app) => {
  try {
    // Read the OpenAPI specification file
    const file = fs.readFileSync('./openapi.yaml', 'utf8');
    const swaggerDocument = YAML.parse(file);

    // Configure basic authentication
    const users = {};
    users[process.env.SWAGGER_USER || 'admin'] = process.env.SWAGGER_PASSWORD || 'securepassword123';

    const swaggerAuth = basicAuth({
    users: users,
    challenge: true,
    realm: 'Renewable Energy API Documentation',
    });

    // Apply authentication only in production
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Apply middlewares conditionally based on environment
    const middlewares = isProduction ? [swaggerAuth] : [];

    // Mount Swagger UI
    app.use('/api-docs', 
      ...middlewares,
      swaggerUi.serve, 
      swaggerUi.setup(swaggerDocument, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: "Renewable Energy Inventory API Documentation",
        swaggerOptions: {
          persistAuthorization: true,
        }
      })
    );

    console.log('✅ Swagger UI successfully configured');
  } catch (error) {
    console.error('❌ Failed to setup Swagger UI:', error.message);
  }
};

module.exports = setupSwagger;