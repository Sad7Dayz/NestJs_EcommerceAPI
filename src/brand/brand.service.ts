import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Brand } from './brand.schema';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandService {
  constructor(@InjectModel(Brand.name) private brandModel: Model<Brand>) {}
  async create(createBrandDto: CreateBrandDto) {
    const brand = await this.brandModel.findOne({ name: createBrandDto.name });
    if (brand) {
      throw new HttpException('Brand already exists', 400);
    }

    const newBrand = await this.brandModel.create(createBrandDto);
    return {
      status: 'success',
      message: 'Brand created successfully',
      data: newBrand,
    };
  }

  async findAll() {
    const brands = await this.brandModel.find().select('-__v');
    return {
      status: 'success',
      message: 'Brands found',
      length: brands.length,
      data: brands,
    };
  }

  async findOne(id: number) {
    const brand = await this.brandModel.findById(id);
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    return {
      status: 200,
      message: 'Brand found',
      data: brand,
    };
  }

  async update(id: string, updateBrandDto: UpdateBrandDto) {
    const brand = await this.brandModel.findById(id).select('-__v');
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    const updatedBrand = await this.brandModel.findByIdAndUpdate(
      id,
      updateBrandDto,
      {
        new: true,
      },
    );
    return {
      status: 200,
      message: 'Brand updated successfully',
      data: updatedBrand,
    };
  }

  async remove(id: string) {
    const brand = await this.brandModel.findById(id).select('-__v');
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    await this.brandModel.findByIdAndDelete(id);
  }
}
