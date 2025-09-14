import type { RawBodyRequest } from '@nestjs/common';
import {
  Body,
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../user/decorator/user.decorator';
import { AuthGuard } from '../user/guard/Auth.guard';
import { AcceptOrderCashDto, CreateOrderDto } from './dto/create-order.dto';
import { OrderService } from './order.service';

@Controller('v1/cart/checkout')
export class OrderCheckoutController {
  constructor(private readonly orderService: OrderService) {}

  @Post(':paymentMethodType')
  @Roles(['user'])
  @UseGuards(AuthGuard)
  create(
    @Param('paymentMethodType') paymentMethodType: 'card' | 'cash',
    @Body(new ValidationPipe({ forbidNonWhitelisted: true, whitelist: true }))
    createOrderDto: CreateOrderDto,
    @Req() req,
    @Query() query,
  ) {
    if (req.user.role.toLowerCase() === 'admin') {
      throw new UnauthorizedException();
    }
    if (!['card', 'cash'].includes(paymentMethodType)) {
      throw new NotFoundException('No payment method found');
    }
    const {
      success_url = 'https://ecommerce-nestjs.com',
      cancel_url = 'https://ecommerce-nestjs.com',
    } = query;

    const dataAfterPayment = {
      success_url,
      cancel_url,
    };

    const user_id = req.user._id;
    return this.orderService.create(
      user_id,
      paymentMethodType,
      createOrderDto,
      dataAfterPayment,
    );
  }

  @Patch(':orderId/cash')
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  update(
    @Param('orderId') orderId: string,
    @Body(
      new ValidationPipe({
        forbidNonWhitelisted: true,
        whitelist: true,
      }),
    )
    updateOrderDto: AcceptOrderCashDto,
  ) {
    return this.orderService.updatePaidCash(orderId, updateOrderDto);
  }
}

@Controller('v1/cart/session')
export class CheckoutCardController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  updatePaidCard(
    @Headers('stripe-signature') sig,
    @Req() request: RawBodyRequest<Request>,
  ) {
    const endPointSecret =
      'whsec_db59966519a65529ae568ade70303bf419be37a47f3777c18a8a4f1c79c8a07a';
    const body = request.rawBody;
    console.log(sig);
    console.log('======================');
    console.log(body);
    return this.orderService.updatePaidCard(body, sig, endPointSecret);
  }
}

@Controller('v1/order/user')
export class OrderForUserController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @Roles(['user'])
  @UseGuards(AuthGuard)
  findAllOrdersOnUser(@Req() req) {
    if (req.user.role.toLowerCase() === 'admin') {
      throw new UnauthorizedException();
    }
    const user_id = req.user._id;
    return this.orderService.findAllOrdersOnUser(user_id);
  }
}

@Controller('v1/order/admin')
export class OrderForAdminController {
  constructor(private readonly orderService: OrderService) {}

  @Get(':userId')
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  findAllOrdersOnUser(@Param('userId') userId: string) {
    return this.orderService.findAllOrdersOnUser(userId);
  }
}
