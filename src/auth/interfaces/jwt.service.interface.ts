import { Payload } from './payload.interface';
import { TokenPairDTO } from '../dto/token-pair.dto';

export interface IJwtService {
  generateToken(payload: Payload, type?: 'access' | 'refresh'): string;
  refreshToken(refreshToken: string): Partial<TokenPairDTO>;
  getPayload(token: string, type?: 'access' | 'refresh'): Payload;
}
