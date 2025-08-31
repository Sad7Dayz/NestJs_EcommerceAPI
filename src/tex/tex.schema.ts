import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type texDocument = HydratedDocument<Tex>;

@Schema({ timestamps: true })
export class Tex {
  @Prop({
    required: true,
    default: 0,
  })
  tex: string;
  @Prop({
    type: Number,
    default: 0,
  })
  shippingPrice: string;
}
export const texSchema = SchemaFactory.createForClass(Tex);
