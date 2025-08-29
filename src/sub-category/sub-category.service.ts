import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from '../category/category.schema';
import { SubCreateCategoryDto } from './dto/create-sub-category.dto';
import { UpdateSubCategoryDto } from './dto/update-sub-category.dto';
import { SubCategory } from './sub-category.schema';

@Injectable()
export class SubCategoryService {
  constructor(
    @InjectModel(SubCategory.name) private subCategoryModel: Model<SubCategory>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}
  async create(subCreateCategoryDto: SubCreateCategoryDto) {
    const subCategory = await this.subCategoryModel.findOne({
      name: subCreateCategoryDto.name,
    });

    if (subCategory) {
      throw new HttpException('SubCategory already exists', 400);
    }

    const category = await this.categoryModel.findById(
      subCreateCategoryDto.category,
    );

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const newSubCategory = await (
      await this.subCategoryModel.create(subCreateCategoryDto)
    ).populate('category', '-_id -__v');

    //위 코드를 아래 코드로 변경도 가능
    // const newSubCategory = await this.subCategoryModel
    //   .create(subCreateCategoryDto)
    //   .then(doc => doc.populate('category', '-_id -__v'));

    return {
      status: 200,
      message: 'SubCategory created successfully',
      data: newSubCategory,
    };
  }

  async findAll() {
    const subCategory = await this.subCategoryModel
      .find()
      .populate('category', '-_id -__v');
    return {
      status: 200,
      message: 'SubCategorys  found',
      length: subCategory.length,
      isEmpty: subCategory.length > 0 ? 'false' : 'true',
      data: subCategory,
    };
  }

  async findOne(_id: string) {
    const subCategory = await this.subCategoryModel
      .findOne({ _id })
      .select('-__v')
      .populate('category', '-_id -__v');
    if (!subCategory) {
      throw new NotFoundException('SubCategory not found');
    }
    return {
      status: 200,
      message: 'SubCategory retrieved successfully',
      data: subCategory,
    };
  }

  async update(_id: string, updateSubCategoryDto: UpdateSubCategoryDto) {
    const subCategory = await this.subCategoryModel.findOne({ _id });
    if (!subCategory) {
      throw new NotFoundException('SubCategory not found');
    }

    const updatedSubCategory = await this.subCategoryModel
      .findByIdAndUpdate({ _id }, updateSubCategoryDto, { new: true })
      .select('-__v')
      .populate('category', '-_id -__v');
    return {
      status: 200,
      message: 'SubCategory updated successfully',
      data: updatedSubCategory,
    };
  }

  async remove(_id: string) {
    const subCategory = await this.subCategoryModel.findOne({ _id });
    if (!subCategory) {
      throw new NotFoundException('SubCategory not found');
    }
    await this.subCategoryModel.deleteOne({ _id });
    return {
      status: 200,
      message: 'SubCategory deleted successfully',
    };
  }
}
