import { Role } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { ZodError, z } from 'zod';

import { AuthError, requireSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

const attendanceSchema = z.object({
  sessionId: z.string().min(1, { message: 'sessionId wajib diisi' }),
});

export async function POST(request: NextRequest) {
  try {
    const session = requireSession();
    const body = await request.json();
    const { sessionId } = attendanceSchema.parse(body);

    const sessionRecord = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        class: {
          include: {
            students: { select: { id: true } },
          },
        },
      },
    });

    if (!sessionRecord) {
      return NextResponse.json({ error: 'Sesi tidak ditemukan' }, { status: 404 });
    }

    if (session.role === Role.TEACHER) {
      if (sessionRecord.class.teacherId !== session.userId) {
        return NextResponse.json({ error: 'Tidak memiliki akses' }, { status: 403 });
      }
    } else {
      const isEnrolled = sessionRecord.class.students.some(
        (student) => student.id === session.userId,
      );
      if (!isEnrolled) {
        return NextResponse.json({ error: 'Tidak memiliki akses' }, { status: 403 });
      }
    }

    const now = new Date();

    const existing = await prisma.attendance.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId: session.userId,
        },
      },
    });

    if (!existing) {
      const created = await prisma.attendance.create({
        data: {
          sessionId,
          userId: session.userId,
          joinedAt: now,
          lastSeenAt: now,
          durationSec: 0,
        },
      });

      return NextResponse.json({ attendance: created }, { status: 201 });
    }

    const diffSeconds = Math.max(
      0,
      Math.round((now.getTime() - existing.lastSeenAt.getTime()) / 1000),
    );

    const updated = await prisma.attendance.update({
      where: {
        sessionId_userId: {
          sessionId,
          userId: session.userId,
        },
      },
      data: {
        lastSeenAt: now,
        durationSec: diffSeconds > 0 ? existing.durationSec + diffSeconds : existing.durationSec,
      },
    });

    return NextResponse.json({ attendance: updated });
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

    console.error('POST /api/attendance error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
