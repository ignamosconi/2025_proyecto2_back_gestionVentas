import { LoginDTO } from '../dto/login.dto';
import { TokenPairDTO } from '../dto/token-pair.dto';
import { RequestWithUser } from '../interfaces/request-with-user.interface';

export interface IAuthController {
  login(body: LoginDTO): Promise<TokenPairDTO>;
  tokens(token: string): Promise<Partial<TokenPairDTO>>;
  me(req: RequestWithUser): Promise<any>;
}
