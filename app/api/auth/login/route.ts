import { NextRequest, NextResponse } from 'next/server';
import { ZodError, z } from 'zod';

import { attachSessionCookie, createSessionToken, verifyPassword } from '@/lib/auth';
import prisma from '@/lib/prisma';

const loginSchema = z.object({
  email: z
    .string()
    .email({ message: 'Email tidak valid' })
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8, { message: 'Password minimal 8 karakter' }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Kredensial salah' }, { status: 401 });
    }

    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Kredensial salah' }, { status: 401 });
    }

    const sessionToken = createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    attachSessionCookie(response, sessionToken);

    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validasi gagal',
          details: error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    console.error('POST /api/auth/login error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
