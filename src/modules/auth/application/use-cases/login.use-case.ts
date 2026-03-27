import { Injectable, Inject } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import * as bcrypt from 'bcryptjs';
import { Result, ok, err } from '@shared/result/result';
import { NotFoundError, ValidationError } from '@shared/errors/domain.errors';
import { IUserRepository } from '../../domain/ports/user-repository.port';
import { USER_REPOSITORY_PORT } from '../../domain/ports/injection-tokens';
import { LoginAppDto, AuthTokensDto } from '../dtos/auth-app.dto';
import { AuthTokenService } from '../services/auth-token.service';
import { UserLoggedInEvent } from '../../domain/events/user-logged-in.event';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT) private readonly userRepo: IUserRepository,
    private readonly tokenService: AuthTokenService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(dto: LoginAppDto): Promise<Result<AuthTokensDto, NotFoundError | ValidationError>> {
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user || !user.active) return err(new NotFoundError('Invalid credentials'));

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) return err(new ValidationError('Invalid credentials'));

    const tokens = await this.tokenService.issue({ id: user.id, email: user.email, name: user.name });

    this.eventBus.publish(new UserLoggedInEvent(user.id, dto.ipAddress));

    return ok(tokens);
  }
}
