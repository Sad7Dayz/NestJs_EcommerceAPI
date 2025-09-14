import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { I18nValidationPipe } from 'nestjs-i18n';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    bodyParser: true,
  });
  app.use(helmet());
  app.enableCors({
    origin: ['https://ecommerce-nestjs.com'],
  });
  app.useGlobalPipes(new I18nValidationPipe());
  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
