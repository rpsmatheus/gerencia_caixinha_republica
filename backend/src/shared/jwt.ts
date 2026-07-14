import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não definido nas variáveis de ambiente');
}

const secretKey = new TextEncoder().encode(JWT_SECRET);
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

export interface JwtPayload {
  sub: string;
  role: 'admin' | 'resident';
  republicId: string;
}

export async function signAccessToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ role: payload.role, republicId: payload.republicId })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(secretKey);
}

export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, secretKey);

  return {
    sub: payload.sub as string,
    role: payload.role as 'admin' | 'resident',
    republicId: payload.republicId as string,
  };
}
