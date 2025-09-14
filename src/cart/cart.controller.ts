import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { Roles } from '../user/decorator/user.decorator';
import { AuthGuard } from '../user/guard/Auth.guard';
import { CartService } from './cart.service';
import { UpdateCartItemsDto } from './dto/update-cart.dto';

@Controller('v1/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post(':productId')
  @Roles(['user'])
  @UseGuards(AuthGuard)
  create(@Param('productId') productId: string, @Req() req) {
    if (req.user.role.toLowerCase() === 'admin') {
      throw new UnauthorizedException();
    }
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product ID format');
    }
    const user_id = req.user._id;
    return this.cartService.create(productId, user_id);
  }

  @Post('/coupon/:couponName')
  @Roles(['user'])
  @UseGuards(AuthGuard)
  applyCoupon(@Param('couponName') couponName: string, @Req() req) {
    if (req.user.role.toLowerCase() === 'admin') {
      throw new UnauthorizedException();
    }

    const user_id = req.user._id;
    return this.cartService.applyCoupon(user_id, couponName);
  }
  @Get('')
  @Roles(['user'])
  @UseGuards(AuthGuard)
  findOneForUser(@Req() req) {
    if (req.user.role.toLowerCase() === 'admin') {
      throw new UnauthorizedException();
    }
    const user_id = req.user._id;
    return this.cartService.findOne(user_id);
  }

  @Patch(':productId')
  @Roles(['user'])
  @UseGuards(AuthGuard)
  update(
    @Param('productId') productId: string,
    @Body(new ValidationPipe({ forbidNonWhitelisted: true, whitelist: true }))
    updateCartItemsDto: UpdateCartItemsDto,
    @Req() req,
  ) {
    if (req.user.role.toLowerCase() === 'admin') {
      throw new UnauthorizedException();
    }
    const user_id = req.user._id;
    return this.cartService.update(productId, user_id, updateCartItemsDto);
  }

  @Delete(':productId')
  @Roles(['user'])
  @UseGuards(AuthGuard)
  remove(@Param('productId') productId: string, @Req() req) {
    if (req.user.role.toLowerCase() === 'admin') {
      throw new UnauthorizedException();
    }
    const user_id = req.user._id;
    return this.cartService.remove(productId, user_id);
  }

  @Get('/admin/:userId')
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  findOneForAdmin(@Param('userId') userId: string) {
    return this.cartService.findOneForAdmin(userId);
  }
}
