// ARCHIVO: roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/users/helpers/enum.roles';

export const ROLES_KEY = 'roles';   //Después ponemos esta clave en el guard. Es control interno.
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);