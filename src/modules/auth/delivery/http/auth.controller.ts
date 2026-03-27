import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { RegisterHttpDto } from './dtos/register.http-dto';
import { LoginHttpDto } from './dtos/login.http-dto';
import { RefreshHttpDto } from './dtos/refresh.http-dto';
import { JwtAuthGuard } from '../../../../shared/infrastructure/guards/jwt-auth.guard';
import { JwtRefreshGuard } from '../../../../shared/infrastructure/guards/jwt-refresh.guard';
import { RefreshTokenPayload } from '../../infrastructure/jwt/jwt-refresh.strategy';
import { CurrentUser, CurrentUserPayload } from '../../../../shared/infrastructure/decorators/current-user.decorator';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly register: RegisterUseCase,
    private readonly login: LoginUseCase,
    private readonly refresh: RefreshTokenUseCase,
    private readonly logout: LogoutUseCase,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse()
  async registerHandler(@Body() dto: RegisterHttpDto) {
    const result = await this.register.execute(dto);
    if (result.isErr()) throw result.error;
    return result.value;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiOkResponse()
  async loginHandler(@Body() dto: LoginHttpDto, @Request() req: ExpressRequest) {
    const result = await this.login.execute({ ...dto, ipAddress: req.ip });
    if (result.isErr()) throw result.error;
    return result.value;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rotate refresh token (send current refresh JWT as Bearer)' })
  @ApiOkResponse()
  async refreshHandler(@Request() req: ExpressRequest) {
    const payload = req.user as RefreshTokenPayload;
    const result = await this.refresh.execute({ userId: payload.userId, tokenHash: payload.tokenHash });
    if (result.isErr()) throw result.error;
    return result.value;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a refresh token' })
  async logoutHandler(@Body() dto: RefreshHttpDto) {
    await this.logout.execute(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiOkResponse()
  async me(@CurrentUser() user: CurrentUserPayload) {
    return user;
  }
}
