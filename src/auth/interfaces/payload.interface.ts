import { JwtPayload } from 'jsonwebtoken';
import { UserRole } from '../../users/helpers/enum.roles';

export interface Payload extends JwtPayload {
  email: string;
  role: UserRole;
}
