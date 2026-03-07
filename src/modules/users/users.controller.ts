import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards 
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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

  // Update profil user
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  // Soft delete user
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}