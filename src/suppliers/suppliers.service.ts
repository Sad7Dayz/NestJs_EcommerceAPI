import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateSuppliersDto } from './dto/create-suppliers.dto';
import { UpdateSuppliersDto } from './dto/update-suppliers.dto';
import { Suppliers } from './suppliers.schema';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectModel(Suppliers.name) private suppliersModel: Model<Suppliers>,
  ) {}
  async create(createSuppliersDto: CreateSuppliersDto) {
    const suppliers = await this.suppliersModel.findOne({
      name: createSuppliersDto.name,
    });
    if (suppliers) {
      throw new HttpException('Suppliers already exists', 400);
    }

    const newSuppliers = await this.suppliersModel.create(createSuppliersDto);
    return {
      status: 200,
      message: 'Suppliers created successfully',
      data: newSuppliers,
    };
  }

  async findAll() {
    const suppliers = await this.suppliersModel.find().select('-__v');
    return {
      status: 200,
      message: 'Suppliers found',
      length: suppliers.length,
      data: suppliers,
    };
  }

  async findOne(id: string) {
    const suppliers = await this.suppliersModel.findById(id).select('-__v');
    if (!suppliers) {
      throw new NotFoundException('Suppliers not found');
    }
    return {
      status: 200,
      message: 'Suppliers found',
      data: suppliers,
    };
  }

  async update(id: string, updateSuppliersDto: UpdateSuppliersDto) {
    const suppliers = await this.suppliersModel.findById(id).select('-__v');
    if (!suppliers) {
      throw new NotFoundException('Suppliers not found');
    }

    const updatedSuppliers = await this.suppliersModel.findByIdAndUpdate(
      id,
      updateSuppliersDto,
      {
        new: true,
      },
    );
    return {
      status: 200,
      message: 'Brand updated successfully',
      data: updatedSuppliers,
    };
  }

  async remove(id: string): Promise<void> {
    const suppliers = await this.suppliersModel.findById(id).select('-__v');
    if (!suppliers) {
      throw new NotFoundException('Suppliers not found');
    }
    await this.suppliersModel.findByIdAndDelete(id);
  }
}
