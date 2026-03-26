import { Injectable, Inject } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Result, ok, err } from '@shared/result/result';
import { ConflictError } from '@shared/errors/domain.errors';
import { IUserRepository } from '../../domain/ports/user-repository.port';
import { USER_REPOSITORY_PORT } from '../../domain/ports/injection-tokens';
import { RegisterAppDto, AuthTokensDto } from '../dtos/auth-app.dto';
import { AuthTokenService } from '../services/auth-token.service';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT) private readonly userRepo: IUserRepository,
    private readonly tokenService: AuthTokenService,
  ) {}

  async execute(dto: RegisterAppDto): Promise<Result<AuthTokensDto, ConflictError>> {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) return err(new ConflictError('Email already registered'));

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.userRepo.create({ email: dto.email, name: dto.name, passwordHash });
    const tokens = await this.tokenService.issue({ id: user.id, email: user.email, name: user.name });
    return ok(tokens);
  }
}
