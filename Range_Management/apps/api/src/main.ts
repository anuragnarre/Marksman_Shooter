import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // ── CORS ──────────────────────────────────────────────────────────────────
  // Architecture: The Next.js frontend proxies all /api/* requests server-side
  // to this service. The browser NEVER calls this port directly.
  // Therefore CORS only needs to allow localhost (Next.js server) + any
  // explicitly configured origins (e.g. for admin tools or WebSocket clients).
  const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // No origin = server-to-server request (Next.js proxy, curl, etc.) — always allow
      if (!origin) return callback(null, true);
      // Localhost variants — always allow (Next.js dev server, same-machine tools)
      if (
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.startsWith('http://[::1]')
      ) {
        return callback(null, true);
      }
      // Explicitly configured origins (set CORS_ORIGINS env var for admin/WS)
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Reject everything else — port 3001 is internal only
      callback(new Error(`CORS blocked: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Operation-Id'],
    credentials: true,
  });


  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Marksman API')
    .setDescription('API for Marksman Pro')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`API running on http://0.0.0.0:${port}`);
}

bootstrap();
