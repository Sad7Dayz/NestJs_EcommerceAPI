import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Coupon, couponSchema } from '../coupon/coupon.schema';
import { Product, productSchema } from '../product/product.schema';
import { CartController } from './cart.controller';
import { Cart, cartSchema } from './cart.schema';
import { CartService } from './cart.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Cart.name,
        schema: cartSchema,
      },
      {
        name: Product.name,
        schema: productSchema,
      },
      {
        name: Coupon.name,
        schema: couponSchema,
      },
    ]),
  ],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}
