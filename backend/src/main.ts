import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('DataPulse-AI-Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Set global API prefix
  app.setGlobalPrefix('api');

  // Configure CORS for Next.js frontend
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Enable request payload validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`=======================================================`);
  logger.log(` DataPulse AI Analytics Engine online on port ${port}`);
  logger.log(` Query Endpoint:  POST http://localhost:${port}/api/analytics/query`);
  logger.log(` Schema Endpoint: GET  http://localhost:${port}/api/analytics/schema`);
  logger.log(` Health Endpoint: GET  http://localhost:${port}/api/health`);
  logger.log(`=======================================================`);
}
bootstrap();
