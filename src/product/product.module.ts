import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, categorySchema } from '../category/category.schema';
import {
  SubCategory,
  subCategorySchema,
} from '../sub-category/sub-category.schema';
import { ProductController } from './product.controller';
import { Product, productSchema } from './product.schema';
import { ProductService } from './product.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: productSchema },
      { name: Category.name, schema: categorySchema },
      { name: SubCategory.name, schema: subCategorySchema },
    ]),
  ],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
