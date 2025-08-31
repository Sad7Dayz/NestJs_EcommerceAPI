import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from '../category/category.schema';
import { SubCategory } from '../sub-category/sub-category.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './product.schema';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Category.name)
    private readonly categoryModule: Model<Category>,
    @InjectModel(SubCategory.name)
    private readonly subCategoryModule: Model<SubCategory>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    const product = await this.productModel.findOne({
      title: createProductDto.title,
    });
    const category = await this.categoryModule.findById(
      createProductDto.category,
    );

    if (product) {
      throw new HttpException('This Product already Exist', 400);
    }

    if (!category) {
      throw new HttpException('This Category not Exist', 400);
    }

    if (createProductDto.subCategory) {
      const subCategory = await this.subCategoryModule.findById(
        createProductDto.subCategory,
      );
      if (!subCategory) {
        throw new HttpException('This Sub Category not Exist', 400);
      }
    }
    const priceAfterDiscount = createProductDto?.priceAfterDiscount || 0;
    if (createProductDto.price < priceAfterDiscount) {
      throw new HttpException(
        'Must be price After discount greater than price',
        400,
      );
    }

    const newProduct = await (
      await this.productModel.create(createProductDto)
    ).populate('category subCategory brand', '-__v');
    return {
      status: 200,
      message: 'Product created successfully',
      data: newProduct,
    };
  }

  async findAll(query: any) {
    //1) filter
    let requestQuery = { ...query };
    const removeQuery = [
      'page',
      'limit',
      'sort',
      'keyword',
      'category',
      'fields',
    ];
    removeQuery.forEach((singleQuery) => {
      delete requestQuery[singleQuery];
    });
    requestQuery = JSON.parse(
      JSON.stringify(requestQuery).replace(
        /\b(gte|lte|lt|gt)\b/g,
        (match) => `$${match}`,
      ),
    );

    //2)pagenation
    const page = query?.page || 1;
    const limit = query?.limit || 5;
    const skip = (page - 1) * limit;
    //3)sorting
    const sort = query?.sort || 'asc';
    if (!['asc', 'desc'].includes(sort)) {
      throw new HttpException('Sort value must be asc or desc', 400);
    }
    //4)fields
    let fields = query?.fields || '';
    fields = fields.split(',').join(' ');

    //5)search
    let findData = { ...requestQuery };

    if (query.keyword) {
      findData.$or = [
        { title: { $regex: query.keyword } },
        { description: { $regex: query.keyword } },
      ];
    }

    if (query.category) {
      findData.category = query.category.toString();
    }

    const products = await this.productModel
      .find(findData)
      .limit(limit)
      .skip(skip)
      .sort({ title: sort })
      .select(fields);

    return {
      status: 200,
      message: 'Found Product',
      length: products.length > 0 ? 'false' : 'true',
      data: products,
    };
  }

  async findOne(id: string) {
    const product = await this.productModel
      .findById(id)
      .select('-__v')
      .populate('category subCategory brand', '-__v');
    if (!product) {
      throw new NotFoundException('Product Not Found');
    }

    return {
      status: 200,
      message: 'Found a Product',
      data: product,
    };
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.productModel.findById(id);

    if (!product) {
      throw new NotFoundException('Product Not Found');
    }

    if (updateProductDto.category) {
      const category = await this.categoryModule.findById(
        updateProductDto.category,
      );
      if (!category) {
        throw new HttpException('This Category not Exist', 400);
      }
    }
    if (updateProductDto.subCategory) {
      const subCategory = await this.subCategoryModule.findById(
        updateProductDto.subCategory,
      );
      if (!subCategory) {
        throw new HttpException('This Sub Category not Exist', 400);
      }
    }

    if (
      updateProductDto.sold !== undefined &&
      product.quantity < updateProductDto.sold
    ) {
      throw new HttpException('This Quantity is < sold', 400);
    }

    const price = updateProductDto?.price || product.price;
    const priceAfterDiscount =
      updateProductDto?.priceAfterDiscount || product.priceAfterDiscount;
    if (price < priceAfterDiscount) {
      throw new HttpException(
        'Must be price After discount greater than price',
        400,
      );
    }

    return {
      status: 200,
      message: 'Product Updated Successfully',
      data: await this.productModel
        .findByIdAndUpdate(id, updateProductDto, {
          new: true,
        })
        .select('-__V')
        .populate('category subCategory brand', '-__v'),
    };
  }

  async remove(id: string): Promise<void> {
    const product = await this.productModel.findById(id);
    if (!product) {
      throw new NotFoundException('Product Not Found');
    }

    await this.productModel.findByIdAndDelete(id);
  }
}
