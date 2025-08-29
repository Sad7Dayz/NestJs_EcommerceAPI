import { MailerService } from '@nestjs-modules/mailer';
import {
  HttpException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { User } from '../user/user.schema';
import { ResetPasswordDto, SignInDto, SignupDto } from './dto/auth.dto';

const saltOrRounds = 10;

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private readonly mailService: MailerService,
  ) {}

  async signUp(signupDto: SignupDto) {
    const user = await this.userModel.findOne({ email: signupDto.email });
    if (user) {
      throw new HttpException('User already exists', 400);
    }

    const password = await bcrypt.hash(signupDto.password, saltOrRounds);
    const userCreated = {
      password,
      role: 'user',
      active: true,
    };

    const newUser = await this.userModel.create({
      ...signupDto,
      ...userCreated,
    });

    const payload = {
      email: newUser.email,
      _id: newUser._id,
      role: newUser.role,
    };
    const token = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
    });

    return {
      status: 200,
      message: 'User created successfully',
      data: newUser,
      access_token: token,
    };
  }

  async signIn(signInDto: SignInDto) {
    const user = await this.userModel
      .findOne({ email: signInDto.email })
      .select('-__v');
    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    const isMatch = await bcrypt.compare(signInDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException();
    }

    const payload = {
      _id: user._id,
      email: user.email,
      role: user.role,
    };
    const token = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
    });

    return {
      status: 200,
      message: 'User logged in successfully',
      data: user,
      access_token: token,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.userModel.findOne({
      email: resetPasswordDto.email,
    });
    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    const code = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');
    await this.userModel.findOneAndUpdate(
      { email: resetPasswordDto.email },
      { verificationCode: code },
    );

    const htmlMessage = `
    <div>
    <h1>Forgot your password? If you didn't forget your password, please ignore this email!</h1>
    <p>Use the following code to verify your account: <h3 style="color: red; font-weight: bold; text-align: center">${code}</h3></p>
    <h6 style="font-weight: bold">Ecommerce-Nest.JS</h6>
    </div>
    `;

    this.mailService.sendMail({
      from: `Ecommerce-Nest.JS <${process.env.MAIL_USER}>`,
      to: resetPasswordDto.email, // 수정된 부분
      subject: `Ecommerce-Nest.JS - Reset password`,
      html: htmlMessage,
    });

    return {
      status: 200,
      message: `Code sent successfully on your email (${resetPasswordDto.email})`,
    };
  }

  async verifyCode({ email, code }: { email: string; code: string }) {
    const user = await this.userModel
      .findOne({ email })
      .select('verificationCode');
    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    if (user.verificationCode !== code) {
      throw new UnauthorizedException('Invalid code');
    }

    await this.userModel.findOneAndUpdate(
      { email },
      { verificationCode: null },
    );

    return {
      status: 200,
      message: 'Code verified successfully, go to change your password',
    };
  }

  async changePassword(changePasswordData: SignInDto) {
    const user = await this.userModel.findOne({
      email: changePasswordData.email,
    });
    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    const password = await bcrypt.hash(
      changePasswordData.password,
      saltOrRounds,
    );
    await this.userModel.findOneAndUpdate(
      { email: changePasswordData.email },
      { password },
    );

    return {
      status: 200,
      message: 'Password changed successfully, go to login',
    };
  }
}
