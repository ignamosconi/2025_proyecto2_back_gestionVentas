import { LoginDTO } from '../dto/login.dto';
import { TokenPairDTO } from '../dto/token-pair.dto';

export interface IAuthService {
  login(body: LoginDTO): Promise<TokenPairDTO>;
  tokens(token: string): Promise<Partial<TokenPairDTO>>;
}
