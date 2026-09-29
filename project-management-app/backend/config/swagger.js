const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Project & Task Management API',
      version: '1.0.0',
      description:
        'REST API for managing organizations, projects, teams and tasks with role-based access control.',
    },
    servers: [{ url: '/api', description: 'Base API path' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js'],
};

module.exports = swaggerJsdoc(options);
