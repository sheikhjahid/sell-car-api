import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Expression, Model } from 'mongoose';
import { DeleteProfileDto } from './dtos/delete-profile.dto';
import { SignUpDto } from './dtos/signup.dto';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { User } from './schemas/user.schema';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bcrypt = require('bcrypt');
@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private model: Model<User>) {}

  async create(body: SignUpDto) {
    const userModel = await new this.model(body);
    return await userModel.save();
  }

  async listUser(condition: any = {}) {
    return await this.model
      .find(condition)
      .sort({ created_at: -1 })
      .populate('report');
  }

  async findUser(payload: { [index: string]: string }) {
    return await this.model.findOne(payload).populate('report');
  }

  async updateUser(
    id: string,
    body: Partial<UpdateProfileDto>,
    file: Express.Multer.File | null,
  ) {
    const userModel = await this.findUser({ _id: id });
    userModel.email = body?.email || userModel.email;
    userModel.name = body?.name || userModel.name;
    userModel.password = body?.password
      ? await bcrypt.hash(body.password, 10)
      : userModel.password;
    if (file) {
      userModel.picUrl = 'uploads/user/' + file.filename;
    }
    if (body?.report) {
      userModel.report.push(body.report);
    }
    return await userModel.save();
  }

  async deleteUser(body: DeleteProfileDto) {
    const userModel = await this.findUser({ _id: body.id });
    if (userModel.report.length) {
      userModel.report.forEach(async (reportModel) => {
        reportModel.user = null;
        await reportModel.save();
      });
    }
    return await userModel.remove();
  }
}
