import {
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
import { Roles } from '../user/decorator/user.decorator';
import { AuthGuard } from '../user/guard/Auth.guard';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewService } from './review.service';

@Controller('v1/review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @Roles(['user'])
  @UseGuards(AuthGuard)
  create(
    @Body(new ValidationPipe({ forbidNonWhitelisted: true, whitelist: true }))
    createReviewDto: CreateReviewDto,
    @Req() req,
  ) {
    // 일반 사용자만 리뷰 작성 가능
    if (req.user.role.toLowerCase() !== 'user') {
      throw new UnauthorizedException('Only users can create reviews');
    }
    const user_id = req.user._id;
    return this.reviewService.create(createReviewDto, user_id);
  }

  @Get(':id')
  findAll(@Param('id') product_id: string) {
    return this.reviewService.findAll(product_id);
  }

  @Patch(':id')
  @Roles(['user'])
  @UseGuards(AuthGuard)
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ forbidNonWhitelisted: true, whitelist: true }))
    updateReviewDto: UpdateReviewDto,
    @Req() req,
  ) {
    // 본인의 리뷰만 수정 가능 (서비스에서 검증)
    const user_id = req.user._id;
    return this.reviewService.update(id, updateReviewDto, user_id);
  }

  @Delete(':id')
  @Roles(['user'])
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string, @Req() req) {
    if (req.user.role.toLowerCase() === 'admin') {
      throw new UnauthorizedException();
    }
    const user_id = req.user._id;
    return this.reviewService.remove(id, user_id);
  }
}

@Controller('v1/dashboard/review')
export class ReviewDashboardController {
  constructor(private readonly reviewService: ReviewService) {}
  @Get(':id')
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  findOne(@Param('id') user_id: string) {
    return this.reviewService.findOne(user_id);
  }
}
