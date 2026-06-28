// src/services/jwtService.ts
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

const JWT_SECRET = config.jwtSecret || 'your-secret-key';
const JWT_EXPIRES_IN = config.jwtExpiresIn || '7d';

export interface JWTPayload {
    id: number;
    email: string;
    user_type: string;
}

export const jwtService = {
    // Generate JWT token
    generateToken(payload: JWTPayload): string {
        try {
            // ✅ Use the secret and options directly
            return jwt.sign(payload, JWT_SECRET, { 
                expiresIn: JWT_EXPIRES_IN 
            } as jwt.SignOptions);
        } catch (error) {
            console.error('Error generating JWT:', error);
            throw new Error('Failed to generate token');
        }
    },

    // Verify JWT token
    verifyToken(token: string): JWTPayload | null {
        try {
            return jwt.verify(token, JWT_SECRET) as JWTPayload;
        } catch (error) {
            console.error('Error verifying JWT:', error);
            return null;
        }
    },

    // Decode token without verification (for debugging)
    decodeToken(token: string): JWTPayload | null {
        try {
            return jwt.decode(token) as JWTPayload;
        } catch (error) {
            console.error('Error decoding JWT:', error);
            return null;
        }
    }
};