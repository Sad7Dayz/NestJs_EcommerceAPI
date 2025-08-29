import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type couponDocument = HydratedDocument<Coupon>;

@Schema({ timestamps: true })
export class Coupon {
  @Prop({
    required: true,
    type: String,
    minLength: [3, 'Name must be at least 3 characters'],
    maxLength: [100, 'Name must be at most 100 characters'],
  })
  name: string;
  @Prop({
    type: String,
    required: true,
  })
  expireDate: Date;

  @Prop({
    type: Number,
    required: true,
  })
  discount: number;
}
export const couponSchema = SchemaFactory.createForClass(Coupon);
