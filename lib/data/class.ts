import prisma from '@/lib/prisma';
import { serializeClass, type ClassWithRelations } from '@/lib/serializers/class';
import type { ClassSummary } from '@/lib/types';
import { Role, type User } from '@prisma/client';

export async function getClassesForUser(user: Pick<User, 'id' | 'role'>) {
  const classes = (await prisma.class.findMany({
    where:
      user.role === Role.TEACHER
        ? { teacherId: user.id }
        : { students: { some: { id: user.id } } },
    include: {
      teacher: { select: { id: true, name: true, email: true } },
      students: { select: { id: true } },
      sessions: {
        orderBy: { startsAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })) as ClassWithRelations[];

  return classes.map((classItem) =>
    serializeClass(classItem, user.id, user.role),
  ) as ClassSummary[];
}
