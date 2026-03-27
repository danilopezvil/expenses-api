import { SetMetadata } from '@nestjs/common';
import { GroupRole } from '../../domain/ports/group-membership-repository.port';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: GroupRole[]) => SetMetadata(ROLES_KEY, roles);
