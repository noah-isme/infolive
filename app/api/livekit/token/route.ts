import { Role } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { ZodError, z } from 'zod';

import { AuthError, requireSession } from '@/lib/auth';
import { getEnv } from '@/lib/env';
import { createLiveKitToken } from '@/lib/livekit';
import prisma from '@/lib/prisma';
import { enforceRateLimit } from '@/lib/rateLimit';

const env = getEnv();

const tokenRequestSchema = z.object({
  identity: z.string().min(1, { message: 'identity wajib diisi' }),
  room: z.string().min(1, { message: 'room wajib diisi' }),
});

export async function POST(request: NextRequest) {
  try {
    const session = requireSession();
    const identifier = request.ip ?? request.headers.get('x-forwarded-for') ?? session.userId;
    const rateLimit = enforceRateLimit(`${session.userId}:${identifier}`, {
      limit: 10,
      windowMs: 60_000,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan, coba lagi nanti.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter ?? 60),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
          },
        },
      );
    }

    const body = await request.json();
    const { identity, room } = tokenRequestSchema.parse(body);

    const sessionRecord = await prisma.session.findUnique({
      where: { roomName: room },
      include: {
        class: {
          include: {
            students: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!sessionRecord) {
      return NextResponse.json({ error: 'Sesi tidak ditemukan' }, { status: 404 });
    }

    if (session.role === Role.TEACHER) {
      if (sessionRecord.class.teacherId !== session.userId) {
        return NextResponse.json({ error: 'Tidak memiliki akses ke sesi ini' }, { status: 403 });
      }
    } else {
      const isEnrolled = sessionRecord.class.students.some(
        (student) => student.id === session.userId,
      );
      if (!isEnrolled) {
        return NextResponse.json({ error: 'Tidak memiliki akses ke sesi ini' }, { status: 403 });
      }
    }

    const token = await createLiveKitToken({
      identity,
      room,
      role: session.role,
      name: session.name,
    });

    return NextResponse.json({
      token,
      url: env.NEXT_PUBLIC_LIVEKIT_URL,
      turnServer: env.TURN_URL,
      participant: {
        identity,
        name: session.name,
        role: session.role,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validasi gagal',
          details: error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    console.error('POST /api/livekit/token error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
