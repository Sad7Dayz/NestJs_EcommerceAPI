import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Tax } from './entities/tax.entity';
import { TaxController } from './tax.controller';
import { taxSchema } from './tax.schema';
import { TaxService } from './tax.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Tax.name, schema: taxSchema }])],
  controllers: [TaxController],
  providers: [TaxService],
})
export class TaxModule {}
