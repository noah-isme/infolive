import { Role } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { ZodError, z } from 'zod';

import { AuthError, requireSession } from '@/lib/auth';
import { generateClassCode } from '@/lib/id';
import prisma from '@/lib/prisma';
import { serializeClass, type ClassWithRelations } from '@/lib/serializers/class';

const classPayloadSchema = z.object({
  title: z.string().min(1, { message: 'Judul wajib diisi' }).max(120).optional(),
  code: z.string().min(4).max(12).optional(),
});

export async function GET() {
  try {
    const session = requireSession();

    const classes = (await prisma.class.findMany({
      where:
        session.role === Role.TEACHER
          ? { teacherId: session.userId }
          : { students: { some: { id: session.userId } } },
      include: {
        students: { select: { id: true } },
        teacher: { select: { id: true, name: true, email: true } },
        sessions: {
          orderBy: { startsAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })) as ClassWithRelations[];

    return NextResponse.json({
      classes: classes.map((item) => serializeClass(item, session.userId, session.role)),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('GET /api/class error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = requireSession();
    const body = await request.json();
    const payload = classPayloadSchema.parse(body);

    if (session.role === Role.TEACHER) {
      if (!payload.title) {
        return NextResponse.json({ error: 'Judul kelas wajib diisi' }, { status: 400 });
      }

      let code: string | null = null;

      for (let attempt = 0; attempt < 10; attempt += 1) {
        const candidate = generateClassCode();
        const existing = await prisma.class.findUnique({ where: { code: candidate } });
        if (!existing) {
          code = candidate;
          break;
        }
      }

      if (!code) {
        return NextResponse.json({ error: 'Gagal membuat kode kelas unik' }, { status: 500 });
      }

      const createdClass = (await prisma.class.create({
        data: {
          title: payload.title.trim(),
          code,
          teacherId: session.userId,
        },
        include: {
          students: { select: { id: true } },
          teacher: { select: { id: true, name: true, email: true } },
          sessions: {
            orderBy: { startsAt: 'desc' },
          },
        },
      })) as ClassWithRelations;

      return NextResponse.json(
        {
          class: serializeClass(createdClass, session.userId, session.role),
        },
        { status: 201 },
      );
    }

    // Student join flow
    if (!payload.code) {
      return NextResponse.json({ error: 'Kode kelas wajib diisi' }, { status: 400 });
    }

    const normalizedCode = payload.code.trim().toUpperCase();

    const classToJoin = (await prisma.class.findUnique({
      where: { code: normalizedCode },
      include: {
        students: { select: { id: true } },
        teacher: { select: { id: true, name: true, email: true } },
        sessions: {
          orderBy: { startsAt: 'desc' },
        },
      },
    })) as ClassWithRelations | null;

    if (!classToJoin) {
      return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });
    }

    const alreadyJoined = classToJoin.students.some((student) => student.id === session.userId);
    if (alreadyJoined) {
      return NextResponse.json({
        class: serializeClass(classToJoin, session.userId, session.role),
      });
    }

    const updatedClass = (await prisma.class.update({
      where: { id: classToJoin.id },
      data: {
        students: {
          connect: { id: session.userId },
        },
      },
      include: {
        students: { select: { id: true } },
        teacher: { select: { id: true, name: true, email: true } },
        sessions: {
          orderBy: { startsAt: 'desc' },
        },
      },
    })) as ClassWithRelations;

    return NextResponse.json({
      class: serializeClass(updatedClass, session.userId, session.role),
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

    console.error('POST /api/class error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
