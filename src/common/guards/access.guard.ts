/* eslint-disable function-paren-newline */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Bab } from "src/modules/bab/schemas/bab.schema";
import { User } from "src/modules/users/schemas/user.schema";

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(
    @InjectModel(Bab.name) private babModel: Model<Bab>, 
    @InjectModel(User.name) private userModel: Model<User>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { user, params } = request;
    
    // Pastikan babId diambil dari parameter yang benar (biasanya :id atau :babId)
    const babId = params.id;

    if (!babId) throw new BadRequestException('ID Bab diperlukan');

    const bab = await this.babModel.findById(babId).populate('sub_category_key').exec();
    
    // SOLUSI ERROR: Cek apakah data Bab ditemukan
    if (!bab) {
      throw new NotFoundException('Materi (Bab) tidak ditemukan');
    }

    // 1. Jika Bab-nya GRATIS, bolehkan lewat
    if (bab.isFree) return true;

    // Ambil data SubCategory dari populate
    const subCat = bab.sub_category_key as any;
    
    if (!subCat) {
      throw new InternalServerErrorException('Data kategori modul tidak valid');
    }

    // 2. Jika SubCategory-nya GRATIS, bolehkan lewat
    if (subCat.isFree) return true;

    // 3. Jika Berbayar, cek status user
    const userData = await this.userModel.findById(user.userId).exec();
    
    if (!userData) {
      throw new UnauthorizedException('User tidak valid');
    }

    // Cek apakah user memiliki akses ke modul ini
    const isPurchased = userData.purchased_modules.some(id => 
      id.toString() === subCat._id.toString()
    );

    if (!isPurchased) {
      throw new ForbiddenException('Materi ini berbayar. Silakan lakukan pembelian terlebih dahulu.');
    }

    return true;
  }
}