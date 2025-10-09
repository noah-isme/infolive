import { redirect } from 'next/navigation';

import { ClassesView } from '@/components/dashboard/classes-view';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { serializeClass, type ClassWithRelations } from '@/lib/serializers/class';
import type { ClassSummary } from '@/lib/types';

export default async function ClassesPage() {
  const session = getSession();

  if (!session) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (!user) {
    redirect('/login');
  }

  const classes = (await prisma.class.findMany({
    where:
      user.role === 'TEACHER' ? { teacherId: user.id } : { students: { some: { id: user.id } } },
    include: {
      teacher: { select: { id: true, name: true, email: true } },
      students: { select: { id: true } },
      sessions: {
        orderBy: { startsAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })) as ClassWithRelations[];

  const classSummaries: ClassSummary[] = classes.map((classItem) =>
    serializeClass(classItem, user.id, user.role),
  );

  return <ClassesView user={user} classes={classSummaries} />;
}
