import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Cart, cartSchema } from '../cart/cart.schema';
import { Product, productSchema } from '../product/product.schema';
import { Tax, taxSchema } from '../tax/tax.schema';
import {
  CheckoutCardController,
  OrderCheckoutController,
  OrderForAdminController,
  OrderForUserController,
} from './order.controller';
import { Order, orderSchema } from './order.schema';
import { OrderService } from './order.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: orderSchema },
      { name: Cart.name, schema: cartSchema },
      { name: Tax.name, schema: taxSchema },
      { name: Product.name, schema: productSchema },
    ]),
  ],
  controllers: [
    OrderForAdminController,
    CheckoutCardController,
    OrderCheckoutController,
    OrderForUserController,
  ],
  providers: [OrderService],
})
export class OrderModule {}
