import { Request } from 'express';
import { User } from './index';
declare global {
  namespace Express {
    interface Request {
      startTime?: number;
    }
  }
}

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                email: string;
                user_type: string;
                monthly_limit: number;
                requests_used: number;
                is_unlimited: boolean;
            };
            authMethod?: 'jwt' | 'api_key';
            apiKeyId?: number;
        }
    }
}