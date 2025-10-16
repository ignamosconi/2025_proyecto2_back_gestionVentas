import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //Permite recibir peticiones desde el frontend, que se ejecuta en un puerto diferente
  app.enableCors({
    origin: process.env.FRONTEND_URL, 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Establecer prefijo global para todas las rutas
  app.setGlobalPrefix('api');
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true 
  }));

  //Documentación de endpoints con Swagger → http://localhost:3000/docs
  const config = new DocumentBuilder()
    .setTitle('IMC App API')
    .setDescription('API para autenticación, usuarios y cálculo de IMC')
    .setVersion('1.0')
    .addBearerAuth() // Si usás JWT
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  //Multer
  app.use(json({ limit: '10mb' }));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
