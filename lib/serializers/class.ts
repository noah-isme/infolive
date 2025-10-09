import type { ClassSummary } from '@/lib/types';

import type { Prisma, Role } from '@prisma/client';

export type ClassWithRelations = Prisma.ClassGetPayload<{
  include: {
    teacher: {
      select: { id: true; name: true; email: true };
    };
    students: {
      select: { id: true };
    };
    sessions: true;
  };
}>;

export function serializeClass(
  classData: ClassWithRelations,
  currentUserId: string,
  role: Role,
): ClassSummary {
  return {
    id: classData.id,
    title: classData.title,
    code: classData.code,
    role,
    teacherId: classData.teacherId,
    teacher: classData.teacher
      ? {
          id: classData.teacher.id,
          name: classData.teacher.name,
          email: classData.teacher.email,
        }
      : null,
    studentsCount: classData.students.length,
    sessions: classData.sessions.map((session) => ({
      id: session.id,
      roomName: session.roomName,
      startsAt: session.startsAt.toISOString(),
      endsAt: session.endsAt ? session.endsAt.toISOString() : null,
    })),
    isTeacher: classData.teacherId === currentUserId,
  };
}
