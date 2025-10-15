import { JwtPayload } from 'jsonwebtoken';
import { UserRole } from 'src/users/helpers/enum.roles';

export interface Payload extends JwtPayload {
  email: string;
  role: UserRole;
}
