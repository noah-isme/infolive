import { redirect } from 'next/navigation';

import { ClassesView } from '@/components/dashboard/classes-view';
import { getSession } from '@/lib/auth';
import { getClassesForUser } from '@/lib/data/class';
import prisma from '@/lib/prisma';

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

  const classSummaries = await getClassesForUser(user);

  return <ClassesView user={user} classes={classSummaries} />;
}
