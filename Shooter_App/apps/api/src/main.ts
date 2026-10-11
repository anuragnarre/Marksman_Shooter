import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  // ── CORS ──────────────────────────────────────────────────────────────────
  // Architecture: The Next.js frontend proxies all /api/* requests server-side
  // to this service. The browser NEVER calls this port directly.
  // Therefore CORS only needs to allow localhost (Next.js server) + any
  // explicitly configured origins (e.g. for admin tools or WebSocket clients).
  const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const isDev = process.env.NODE_ENV !== 'production';
  // Strict regex for loopback addresses on any port (protects against attacker-localhost.com)
  const LOCALHOST_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;
  // RFC 1918 private subnets for downrange Target Camera phones & shooting line tablets on range Wi-Fi
  const PRIVATE_LAN_REGEX = /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

  app.enableCors({
    origin: (origin, callback) => {
      // Server-to-server requests (Next.js server actions, curl, background workers)
      if (!origin) return callback(null, true);

      // Localhost variants (Shooter App :3000, Range Ops App :3002, Vite dev tools)
      if (LOCALHOST_REGEX.test(origin)) {
        return callback(null, true);
      }

      // LAN private networks in dev or local range networks (Camera phone, Range tablet)
      if (isDev && PRIVATE_LAN_REGEX.test(origin)) {
        return callback(null, true);
      }

      // Explicitly configured production origins (e.g. from CORS_ORIGINS)
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error(`CORS blocked: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Operation-Id', 'X-Device-Key', 'X-Device-Id'],
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
