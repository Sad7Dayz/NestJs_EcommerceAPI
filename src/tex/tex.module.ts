import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TexController } from './tex.controller';
import { Tex, texSchema } from './tex.schema';
import { TexService } from './tex.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Tex.name, schema: texSchema }])],
  controllers: [TexController],
  providers: [TexService],
})
export class TexModule {}
