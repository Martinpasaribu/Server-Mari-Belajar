/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  Req,
  UseInterceptors,
  UploadedFile
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { MediaService } from '../media/media.service';
import { FileInterceptor } from '@nestjs/platform-express/multer/interceptors';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly mediaService: MediaService,
  ) {}

  // Pendaftaran User Baru (Public)
  @Post('register')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // Hanya Admin yang boleh melihat semua user
  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // @UseGuards(AuthGuard('jwt'))
  // @Get('profile/me')
  // getProfile(@Req() req) {
  //   // req.user didapat dari JwtStrategy
  //   return this.usersService.findOne(req.user.userId);
  // }

  // Mencari satu user (Hapus tanda '+' karena MongoDB pakai string ID)
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }


  // Soft delete user
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  /**
   * Menangani Update Nama, Telepon, Lokasi, dll.
   */
  @UseGuards(AuthGuard('jwt'))
  @Patch('profile')
  async updateInfo(@Req() req, @Body() body: any) {

    const userId = req.user?.userId || req.user?.id || 'GUEST';
    const result = await this.usersService.updateProfileData(userId, body);
    
    return {
      success: true,
      message: 'Profil diperbarui',
      data: result,
    };
  }

  /**
   * Menangani Upload Foto Profil
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('profile/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@Req() req, @UploadedFile() file: Express.Multer.File) {
    // Cukup panggil service, biarkan service yang bekerja keras
    const userId = req.user?.userId || req.user?.id || 'GUEST';

    const result = await this.usersService.updateAvatar(userId, file);
    
    return {
      success: true,
      message: 'Foto profil diperbarui',
      data: result,
    };
  }

}