import { notFound, redirect } from 'next/navigation';

import { ClassDetailView } from '@/components/class/class-detail-view';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { serializeClass, type ClassWithRelations } from '@/lib/serializers/class';
import type { ClassSummary } from '@/lib/types';

interface ClassJoinPageProps {
  params: {
    code: string;
  };
}

export default async function ClassJoinPage({ params }: ClassJoinPageProps) {
  const session = getSession();

  if (!session) {
    redirect('/login');
  }

  const classRecord = (await prisma.class.findUnique({
    where: { code: params.code.toUpperCase() },
    include: {
      teacher: { select: { id: true, name: true, email: true } },
      students: { select: { id: true } },
      sessions: {
        orderBy: { startsAt: 'desc' },
      },
    },
  })) as ClassWithRelations | null;

  if (!classRecord) {
    notFound();
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

  const classSummary: ClassSummary = serializeClass(classRecord, user.id, user.role);
  const isEnrolled =
    user.role === 'TEACHER'
      ? classRecord.teacherId === user.id
      : classRecord.students.some((student) => student.id === user.id);

  return <ClassDetailView user={user} classSummary={classSummary} isEnrolled={isEnrolled} />;
}
