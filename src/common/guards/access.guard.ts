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
    
    const babId = params.id;
    if (!babId) throw new BadRequestException('ID Bab diperlukan');

    const bab = await this.babModel.findById(babId).populate('sub_category_key').exec();
    
    if (!bab) {
      throw new NotFoundException('Materi (Bab) tidak ditemukan');
    }

    // --- LOGIKA GRATIS (GUEST ALLOWED) ---

    // 1. Cek jika Bab gratis
    if (bab.isFree) return true;

    const subCat = bab.sub_category_key as any;
    if (!subCat) {
      throw new InternalServerErrorException('Data kategori modul tidak valid');
    }

    // 2. Cek jika SubCategory (Modul) gratis
    if (subCat.isFree) return true;

    // --- LOGIKA BERBAYAR (LOGIN REQUIRED) ---

    // 3. Jika konten berbayar, user WAJIB login
    if (!user || !user.userId) {
      throw new UnauthorizedException('Materi ini berbayar. Silakan login terlebih dahulu.');
    }

    const userData = await this.userModel.findById(user.userId).exec();
    if (!userData) {
      throw new UnauthorizedException('Sesi user tidak valid');
    }

    // 4. Cek apakah user sudah membeli modul ini
    const isPurchased = userData.purchased_modules.some(id => 
      id.toString() === subCat._id.toString()
    );

    if (!isPurchased) {
      throw new ForbiddenException('Silakan lakukan pembelian modul untuk mengakses materi ini.');
    }

    return true;
  }
}