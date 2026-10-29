
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --------------------------------
  // Enable CORS
  // --------------------------------

  const allowedOrigins = (
    process.env.CORS_ORIGIN ||
    'http://localhost:5173'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  console.log('Allowed CORS origins:', allowedOrigins);

  // --------------------------------
  // Global API Prefix
  // --------------------------------

  app.setGlobalPrefix('api');

  // --------------------------------
  // Global Validation
  // --------------------------------

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // --------------------------------
  // Swagger Configuration
  // --------------------------------

  const config = new DocumentBuilder()
    .setTitle('AI Learning Platform API')
    .setDescription(
      'JWT-protected Users, Activities, Chat Sessions and Chat Messages CRUD',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  SwaggerModule.setup(
    'docs',
    app,
    SwaggerModule.createDocument(app, config),
  );

  // --------------------------------
  // Start NestJS Server
  // --------------------------------

  const port = Number(process.env.PORT || 3000);

  await app.listen(port, '0.0.0.0');

  console.log(`Backend running on http://localhost:${port}`);
}

bootstrap();
