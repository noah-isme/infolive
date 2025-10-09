import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { getEnv } from '@/lib/env';
import prisma from '@/lib/prisma';

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: Role;
}

const env = getEnv();
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 6; // 6 jam

export class AuthError extends Error {
  constructor(
    message: string,
    public status = 401,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function createSessionToken(payload: SessionPayload) {
  return jwt.sign(payload, env.AUTH_JWT_SECRET, {
    expiresIn: SESSION_MAX_AGE_SECONDS,
  });
}

export function verifySessionToken(token: string) {
  return jwt.verify(token, env.AUTH_JWT_SECRET) as SessionPayload;
}

export function attachSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: env.SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
  });

  return response;
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: env.SESSION_COOKIE_NAME,
    value: '',
    maxAge: 0,
    path: '/',
  });

  return response;
}

export function getSession(): SessionPayload | null {
  const cookieStore = cookies();
  const token = cookieStore.get(env.SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    return verifySessionToken(token);
  } catch (error) {
    console.warn('Session token invalid', error);
    return null;
  }
}

export function requireSession(roles?: Role[]) {
  const session = getSession();

  if (!session) {
    throw new AuthError('Unauthorized', 401);
  }

  if (roles && !roles.includes(session.role)) {
    throw new AuthError('Forbidden', 403);
  }

  return session;
}

export async function getCurrentUser() {
  const session = getSession();

  if (!session) {
    return null;
  }

  return prisma.user.findUnique({
    where: {
      id: session.userId,
    },
  });
}

export { SESSION_MAX_AGE_SECONDS };
