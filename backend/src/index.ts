import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth';
import documentRoutes from './routes/documents';
import reportRoutes from './routes/reports';
import termListRoutes from './routes/term-lists';
import templateRoutes from './routes/templates';

dotenv.config();

const prisma = new PrismaClient();
const fastify = Fastify({
  logger: true,
  bodyLimit: 104857600 // 100MB
});

// Register plugins
fastify.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
});

fastify.register(multipart, {
  limits: {
    fileSize: 104857600 // 100MB
  }
});

// Make Prisma available in routes
fastify.decorate('prisma', prisma);

// Register routes
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(documentRoutes, { prefix: '/api/documents' });
fastify.register(reportRoutes, { prefix: '/api/reports' });
fastify.register(termListRoutes, { prefix: '/api/term-lists' });
fastify.register(templateRoutes, { prefix: '/api/templates' });

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001', 10);
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });
    console.log(`🚀 Server running at http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    await prisma.$disconnect();
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
});

start();

// TypeScript declarations
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}
