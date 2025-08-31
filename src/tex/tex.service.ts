import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateTexDto } from './dto/create-tex.dto';
import { Tex } from './tex.schema';

@Injectable()
export class TexService {
  constructor(@InjectModel(Tex.name) private readonly texModel: Model<Tex>) {}
  async createOrUpdate(createTexDto: CreateTexDto) {
    const tex = await this.texModel.findOne({});
    if (!tex) {
      // Create New Tax
      const newTex = await this.texModel.create(createTexDto);
      return {
        status: 200,
        message: 'Tax created successfully',
        data: newTex,
      };
    }
    // Update Tax
    const updateTex = await this.texModel
      .findOneAndUpdate({}, createTexDto, {
        new: true,
      })
      .select('-__v');
    return {
      status: 200,
      message: 'Tax Updated successfully',
      data: updateTex,
    };
  }

  async find() {
    const tex = await this.texModel.findOne({}).select('-__v');

    return {
      status: 200,
      message: 'Tax found successfully',
      data: tex,
    };
  }

  async reSet(): Promise<void> {
    await this.texModel.findOneAndUpdate({}, { taxPrice: 0, shippingPrice: 0 });
  }
}
