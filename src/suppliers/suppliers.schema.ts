import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type suppliersDocument = HydratedDocument<Suppliers>;

@Schema({ timestamps: true })
export class Suppliers {
  @Prop({
    required: true,
    type: String,
    minLength: [3, 'Name must be at least 3 characters'],
    maxLength: [100, 'Name must be at most 100 characters'],
  })
  name: string;
  @Prop({
    type: String,
  })
  website: string;
}
export const suppliersSchema = SchemaFactory.createForClass(Suppliers);
