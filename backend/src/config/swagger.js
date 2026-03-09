const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PrimeTrade REST API',
      version: '1.0.0',
      description: `
## Scalable REST API with Authentication & Role-Based Access Control

### Features
- **JWT Authentication** – Secure login/register with access & refresh tokens
- **Role-Based Access** – \`user\` and \`admin\` roles with protected routes
- **Task CRUD** – Full task management for authenticated users
- **Admin Panel** – User management for admins
- **Rate Limiting** – Protection against brute-force attacks
- **Input Validation** – express-validator on all inputs

### Authentication
Use the \`/api/v1/auth/login\` endpoint to get a JWT token, then click **Authorize** and enter: \`Bearer <your_token>\`
      `,
      contact: {
        name: 'PrimeTrade Dev Team',
        email: 'joydip@primetrade.ai',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development server' },
      { url: 'https://api.primetrade.ai', description: 'Production server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter: Bearer <JWT_TOKEN>',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '665abc123def456' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john@example.com' },
            role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Task: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '665abc123def789' },
            title: { type: 'string', example: 'Complete project setup' },
            description: { type: 'string', example: 'Set up the backend API structure' },
            status: { type: 'string', enum: ['todo', 'in-progress', 'done'], example: 'todo' },
            priority: { type: 'string', enum: ['low', 'medium', 'high'], example: 'high' },
            owner: { type: 'string', example: '665abc123def456' },
            dueDate: { type: 'string', format: 'date-time' },
            tags: { type: 'array', items: { type: 'string' }, example: ['backend', 'api'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error description' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'User registration, login, token management' },
      { name: 'Users', description: 'User profile management' },
      { name: 'Tasks', description: 'Task CRUD operations' },
      { name: 'Admin', description: 'Admin-only endpoints for user management' },
    ],
  },
  apis: ['./src/routes/**/*.js', './src/models/*.js'],
};

module.exports = swaggerJsdoc(options);
