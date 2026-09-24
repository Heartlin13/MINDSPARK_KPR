import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma, isDatabaseConfigured } from './database';

const SESSION_COOKIE = 'resq_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string | null;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function readCookie(request: Request, name: string): string | undefined {
  const cookieHeader = request.header('cookie');
  if (!cookieHeader) return undefined;
  const entry = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : undefined;
}

function setSessionCookie(response: Response, token: string): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}${secure}`
  );
}

function clearSessionCookie(response: Response): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`);
}

export async function loginUser(identifier: unknown, password: unknown): Promise<AuthenticatedUser | null> {
  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_URL is not configured.');
  }
  if (typeof identifier !== 'string' || typeof password !== 'string') return null;
  const normalizedIdentifier = identifier.trim().toLowerCase();
  if (!normalizedIdentifier || !password) return null;

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: normalizedIdentifier }, { email: normalizedIdentifier }],
    },
  });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return null;

  const token = crypto.randomBytes(32).toString('hex');
  await prisma.session.create({
    data: {
      id: hashSessionToken(token),
      userId: user.id,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  return { id: user.id, username: user.username, email: user.email, role: user.role, ...{ __token: token } } as AuthenticatedUser & { __token: string };
}

export async function registerUser(username: unknown, email: unknown, password: unknown): Promise<AuthenticatedUser> {
  if (!isDatabaseConfigured()) throw new Error('DATABASE_URL is not configured.');
  if (typeof username !== 'string' || typeof password !== 'string') throw new Error('Username and password are required.');

  const normalizedUsername = username.trim().toLowerCase();
  const normalizedEmail = typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : null;
  if (!/^[a-z0-9._-]{3,40}$/.test(normalizedUsername)) throw new Error('Username must be 3-40 characters.');
  if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new Error('Enter a valid email address.');
  if (password.length < 12) throw new Error('Password must be at least 12 characters.');

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    await prisma.user.create({
      data: { username: normalizedUsername, email: normalizedEmail, passwordHash, role: 'USER' },
    });
  } catch (error: any) {
    if (error?.code === 'P2002') throw new Error('Username or email is already registered.');
    throw error;
  }

  const authenticatedUser = await loginUser(normalizedUsername, password);
  if (!authenticatedUser) throw new Error('Unable to create session.');
  return authenticatedUser;
}

export async function getAuthenticatedUser(request: Request): Promise<AuthenticatedUser | null> {
  if (!isDatabaseConfigured()) return null;
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { id: hashSessionToken(token) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  return { id: session.user.id, username: session.user.username, email: session.user.email, role: session.user.role };
}

export async function logoutUser(request: Request, response: Response): Promise<void> {
  const token = readCookie(request, SESSION_COOKIE);
  if (token && isDatabaseConfigured()) {
    await prisma.session.delete({ where: { id: hashSessionToken(token) } }).catch(() => undefined);
  }
  clearSessionCookie(response);
}

export async function requireAuth(request: AuthenticatedRequest, response: Response, next: NextFunction): Promise<void> {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      response.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }
    request.user = user;
    next();
  } catch (error) {
    console.error('[Auth] Session validation failed:', error instanceof Error ? error.message : 'unknown error');
    response.status(503).json({ success: false, error: 'Authentication service unavailable.' });
  }
}

export function applyLoginCookie(response: Response, loginResult: AuthenticatedUser | null): AuthenticatedUser | null {
  if (!loginResult) return null;
  const token = (loginResult as AuthenticatedUser & { __token?: string }).__token;
  if (!token) return null;
  const { __token: _, ...safeUser } = loginResult as AuthenticatedUser & { __token: string };
  setSessionCookie(response, token);
  return safeUser;
}
