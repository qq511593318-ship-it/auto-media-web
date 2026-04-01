import { Body, Controller, Get, Headers, Post, Put, Req } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';

class LoginDto {
  @IsString()
  username!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

class ChangePasswordDto {
  @IsString()
  @MinLength(8)
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body.username, body.password);
  }

  @Get('session')
  async session(@Headers('authorization') authorization = '') {
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    return this.authService.verifyToken(token);
  }

  @Put('password')
  async changePassword(
    @Req() request: { user?: { username: string } },
    @Body() body: ChangePasswordDto,
  ) {
    const username = request.user?.username || '';
    return this.authService.changePassword(
      username,
      body.currentPassword,
      body.newPassword,
    );
  }
}
