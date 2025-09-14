import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, productSchema } from '../product/product.schema';
import {
  ReviewController,
  ReviewDashboardController,
} from './review.controller';
import { Review, reviewSchema } from './review.schema';
import { ReviewService } from './review.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Review.name, schema: reviewSchema },
      { name: Product.name, schema: productSchema },
    ]),
  ],
  controllers: [ReviewController, ReviewDashboardController],
  providers: [ReviewService],
})
export class ReviewModule {}
