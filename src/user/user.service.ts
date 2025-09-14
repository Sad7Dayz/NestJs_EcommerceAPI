import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { I18nContext } from 'nestjs-i18n';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.schema';

/**
 * 사용자 관련 비즈니스 로직을 처리하는 서비스 클래스
 * 사용자 생성, 조회, 수정, 삭제 기능을 제공
 */
@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  /**
   * 새로운 사용자를 생성하는 메서드
   * @param createUserDto 사용자 생성 데이터
   * @returns 생성된 사용자 정보와 상태 메시지
   */
  async create(
    createUserDto: CreateUserDto,
    i18n: I18nContext,
  ): Promise<{ status: number; message: string; data: User }> {
    // Todo: 비밀번호 해시화를 위한 salt 라운드 설정
    const saltOrRounds = 10;

    // Todo: 이메일 중복 체크 - 동일한 이메일로 등록된 사용자가 있는지 확인
    const ifUserExist = await this.userModel.findOne({
      email: createUserDto.email,
    });
    if (ifUserExist) {
      throw new HttpException(
        await i18n.t('service.ALREADY_EXIST', {
          args: { module_name: i18n.lang === 'en' ? 'User' : '사용자' },
        }),
        400,
      );
    }

    // Todo: 비밀번호를 bcrypt를 사용하여 해시화
    const password = await bcrypt.hash(createUserDto.password, saltOrRounds);

    // Todo: 기본값 설정 - role이 없으면 'user', active는 true로 설정
    const user = {
      password,
      role: createUserDto.role ?? 'user',
      active: true,
    };

    // Todo: 데이터베이스에 사용자 정보 저장 및 응답 반환
    const newUser = await this.userModel.create({ ...createUserDto, ...user });
    return {
      status: 200,
      message: 'User created successfully',
      data: newUser,
    };
  }

  /**
   * 모든 사용자 목록을 조회하는 메서드
   * @returns 비밀번호와 __v 필드를 제외한 사용자 목록
   */
  async findAll(query, i18n: I18nContext) {
    const {
      _limit = 1000_000_000,
      skip = 0,
      sort = 'asc',
      name,
      email,
      role,
    } = query;

    if (Number.isNaN(Number(+_limit))) {
      throw new HttpException(
        await i18n.t('service.INVALID', { args: { invalid_name: 'limit' } }),
        400,
      );
    }

    if (Number.isNaN(Number(+skip))) {
      throw new HttpException(
        await i18n.t('service.INVALID', { args: { invalid_name: 'skip' } }),
        400,
      );
    }

    if (!['asc', 'desc'].includes(sort)) {
      throw new HttpException(
        await i18n.t('service.INVALID', { args: { invalid_name: 'sort' } }),
        400,
      );
    }

    const users = await this.userModel
      .find()
      .skip(skip)
      .limit(_limit)
      .where('name', new RegExp(name, 'i'))
      .where('email', new RegExp(email, 'i'))
      .where('role', new RegExp(role, 'i'))
      .sort({ name: sort })
      .select('-password -__v')
      .exec();
    // Todo: 보안을 위해 password와 MongoDB의 __v 필드를 제외하고 반환
    return {
      status: 200,
      message: await i18n.t('service.FOUND_SUCCESS', {
        args: { found_name: i18n.lang === 'en' ? 'Users' : '사용자들' },
      }),
      length: users.length,
      data: users,
    };
  }

  /**
   * 특정 ID의 사용자를 조회하는 메서드
   * @param id 조회할 사용자의 ID
   * @returns 사용자 정보와 상태 메시지
   */
  async findOne(
    id: string,
    i18n: I18nContext,
  ): Promise<{ status: number; data: User }> {
    // Todo: ID로 사용자 조회, 비밀번호와 __v 필드는 제외
    const user = await this.userModel.findById(id).select('-password -__v');

    // Todo: 사용자가 존재하지 않으면 404 에러 발생
    if (!user) {
      throw new NotFoundException(
        await i18n.t('service.NOT_FOUND', {
          args: { not_found_name: i18n.lang === 'en' ? 'User' : '사용자들' },
        }),
      );
    }

    return {
      status: 200,
      data: user,
    };
  }

  /**
   * 사용자 정보를 수정하는 메서드
   * @param id 수정할 사용자의 ID
   * @param updateUserDto 수정할 데이터
   * @returns 수정된 사용자 정보와 상태 메시지
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    i18n: I18nContext,
  ): Promise<{
    status: number;
    message: string;
    data: User | null;
  }> {
    // Todo: 사용자 존재 여부 확인
    const userExist = await this.userModel
      .findById(id)
      .select('-password -__v');
    if (!userExist) {
      throw new NotFoundException(
        await i18n.t('service.NOT_FOUND', {
          args: { not_found_name: i18n.lang === 'en' ? 'User' : '사용자들' },
        }),
      );
    }

    // Todo: 비밀번호 해시화를 위한 salt 라운드 설정
    const saltOrRounds = 10;

    // Todo: 업데이트할 데이터 준비
    let user = {
      ...updateUserDto,
    };

    // Todo: 비밀번호가 포함된 경우 해시화 처리
    if (updateUserDto.password) {
      const password = await bcrypt.hash(updateUserDto.password, saltOrRounds);
      user = {
        ...user,
        password,
      };
    }

    // Todo: 사용자 정보 업데이트 및 새로운 데이터 반환
    return {
      status: 200,
      message: await i18n.t('service.UPDATED_SUCCESS', {
        args: { updated_name: i18n.lang === 'en' ? 'User' : '사용자들' },
      }),
      data: await this.userModel.findByIdAndUpdate(id, user, {
        new: true, // 업데이트된 새로운 문서를 반환
      }),
    };
  }

  /**
   * 사용자를 삭제하는 메서드
   * @param id 삭제할 사용자의 ID
   * @returns 삭제 완료 메시지
   */
  async remove(
    id: string,
    i18n: I18nContext,
  ): Promise<{ status: number; message: string }> {
    // Todo: 사용자 존재 여부 확인
    const user = await this.userModel.findById(id).select('-password -__v');
    if (!user) {
      throw new NotFoundException(
        await i18n.t('service.NOT_FOUND', {
          args: { not_found_name: i18n.lang === 'en' ? 'User' : '사용자' },
        }),
      );
    }

    // Todo: 데이터베이스에서 사용자 삭제
    await this.userModel.findByIdAndDelete(id);

    return {
      status: 200,
      message: await i18n.t('service.DELETED_SUCCESS', {
        args: { deleted_name: i18n.lang === 'en' ? 'User' : '사용자' },
      }),
    };
  }

  async getMe(payload, i18n: I18nContext) {
    if (!payload._id) {
      throw new NotFoundException(
        await i18n.t('service.NOT_FOUND', {
          args: { not_found_name: i18n.lang === 'en' ? 'User' : '사용자' },
        }),
      );
    }
    const user = await this.userModel
      .findById(payload._id)
      .select('-password -__v');
    if (!user) {
      throw new NotFoundException(
        await i18n.t('service.NOT_FOUND', {
          args: { not_found_name: i18n.lang === 'en' ? 'User' : '사용자' },
        }),
      );
    }
    return {
      status: 200,
      message: await i18n.t('service.FOUND_SUCCESS', {
        args: { found_name: i18n.lang === 'en' ? 'User' : '사용자' },
      }),
      data: user,
    };
  }

  async updateMe(payload, updateUserDto: UpdateUserDto, i18n: I18nContext) {
    if (!payload._id) {
      throw new NotFoundException(
        await i18n.t('service.NOT_FOUND', {
          args: { not_found_name: i18n.lang === 'en' ? 'User' : '사용자' },
        }),
      );
    }
    const user = await this.userModel
      .findById(payload._id)
      .select('-password -__v');
    if (!user) {
      throw new NotFoundException(
        await i18n.t('service.NOT_FOUND', {
          args: { not_found_name: i18n.lang === 'en' ? 'User' : '사용자' },
        }),
      );
    }
    return {
      status: 200,
      message: await i18n.t('service.UPDATED_SUCCESS', {
        args: { updated_name: i18n.lang === 'en' ? 'User' : '사용자' },
      }),
      data: await this.userModel
        .findByIdAndUpdate(payload._id, updateUserDto, {
          new: true,
        })
        .select('-password -__v'),
    };
  }

  async deleteMe(payload, i18n: I18nContext) {
    if (!payload._id) {
      throw new NotFoundException(
        await i18n.t('service.NOT_FOUND', {
          args: { not_found_name: i18n.lang === 'en' ? 'User' : '사용자' },
        }),
      );
    }
    const user = await this.userModel
      .findById(payload._id)
      .select('-password -__v');
    if (!user) {
      throw new NotFoundException(
        await i18n.t('service.NOT_FOUND', {
          args: { not_found_name: i18n.lang === 'en' ? 'User' : '사용자' },
        }),
      );
    }

    await this.userModel.findByIdAndUpdate(payload._id, { active: false });
  }
}
