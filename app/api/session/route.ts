import { Role } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { ZodError, z } from 'zod';

import { AuthError, requireSession } from '@/lib/auth';
import { generateRoomName } from '@/lib/id';
import prisma from '@/lib/prisma';

const sessionCreateSchema = z.object({
  classId: z.string().min(1, { message: 'classId wajib diisi' }),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = requireSession();
    const searchParams = request.nextUrl.searchParams;
    const classId = searchParams.get('classId');

    if (!classId) {
      return NextResponse.json({ error: 'Parameter classId wajib diisi' }, { status: 400 });
    }

    const classRecord = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        students: { select: { id: true } },
      },
    });

    if (!classRecord) {
      return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });
    }

    if (session.role === Role.TEACHER) {
      if (classRecord.teacherId !== session.userId) {
        return NextResponse.json({ error: 'Tidak memiliki akses' }, { status: 403 });
      }
    } else {
      const isEnrolled = classRecord.students.some((student) => student.id === session.userId);
      if (!isEnrolled) {
        return NextResponse.json({ error: 'Tidak memiliki akses' }, { status: 403 });
      }
    }

    const sessions = await prisma.session.findMany({
      where: { classId },
      orderBy: { startsAt: 'desc' },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('GET /api/session error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = requireSession([Role.TEACHER]);
    const body = await request.json();
    const payload = sessionCreateSchema.parse(body);

    const classRecord = await prisma.class.findUnique({
      where: { id: payload.classId },
    });

    if (!classRecord) {
      return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });
    }

    if (classRecord.teacherId !== session.userId) {
      return NextResponse.json({ error: 'Tidak memiliki akses' }, { status: 403 });
    }

    const startsAt = payload.startsAt ? new Date(payload.startsAt) : new Date();
    const endsAt = payload.endsAt ? new Date(payload.endsAt) : null;

    const roomName = generateRoomName();

    const createdSession = await prisma.session.create({
      data: {
        classId: payload.classId,
        startsAt,
        endsAt,
        roomName,
      },
    });

    return NextResponse.json({ session: createdSession }, { status: 201 });
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

    console.error('POST /api/session error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
