import type { NextFunction, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { HttpError } from './game';
import type { GoogleProfile, Store, UserRec } from './store';

const TOKEN_TTL = '180d';

export function signToken(userId: string, secret: string): string {
  return jwt.sign({ sub: userId }, secret, { expiresIn: TOKEN_TTL, algorithm: 'HS256' });
}

export function readToken(header: string | undefined, secret: string): string | null {
  if (!header?.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(header.slice(7), secret, { algorithms: ['HS256'] });
    return typeof payload === 'object' && typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: UserRec;
    }
  }
}

/** แนบผู้เล่นเข้ากับ request ถ้ามี token ที่ถูกต้อง */
export function attachUser(store: Store, secret: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const uid = readToken(req.headers.authorization, secret);
    if (uid) {
      const user = await store.findUser(uid);
      if (user) req.user = user;
    }
    next();
  };
}

export function requireUser(req: Request): UserRec {
  if (!req.user) throw new HttpError(401, 'unauthorized');
  return req.user;
}

/** ตรวจ ID token จาก Google Identity Services */
export type GoogleVerifier = (credential: string) => Promise<GoogleProfile>;

export function googleVerifier(clientId: string): GoogleVerifier {
  const client = new OAuth2Client(clientId);
  return async (credential) => {
    const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
    const p = ticket.getPayload();
    if (!p?.sub || p.email_verified === false) throw new HttpError(401, 'google_invalid');
    return {
      sub: p.sub,
      email: p.email ?? null,
      name: (p.name ?? p.email?.split('@')[0] ?? 'ผู้เล่น').slice(0, 32),
      picture: p.picture ?? null,
    };
  };
}

/** ชื่อ Guest แบบสุ่ม เช่น "เกสต์ปลาทอง#4821" */
export function guestName(rand: () => number = Math.random): string {
  const animals = ['ปลาทอง', 'แมวส้ม', 'ไก่ชน', 'จระเข้', 'ตุ๊กแก', 'หมูกระทะ', 'นกแก้ว', 'กุ้งเต้น'];
  const a = animals[Math.floor(rand() * animals.length)] ?? 'ปลาทอง';
  return `เกสต์${a}#${String(Math.floor(rand() * 10_000)).padStart(4, '0')}`;
}
