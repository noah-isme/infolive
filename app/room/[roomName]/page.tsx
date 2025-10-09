import { notFound, redirect } from 'next/navigation';

import { LiveRoom } from '@/components/LiveRoom';
import { getSession } from '@/lib/auth';
import { getEnv } from '@/lib/env';
import { createLiveKitToken } from '@/lib/livekit';
import prisma from '@/lib/prisma';
import type { AuthUser } from '@/lib/types';

interface RoomPageProps {
  params: {
    roomName: string;
  };
}

export default async function RoomPage({ params }: RoomPageProps) {
  const session = getSession();

  if (!session) {
    redirect('/login');
  }

  const room = await prisma.session.findUnique({
    where: { roomName: params.roomName },
    include: {
      class: {
        include: {
          students: { select: { id: true } },
          teacher: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!room) {
    notFound();
  }

  const userRecord = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (!userRecord) {
    redirect('/login');
  }

  const isTeacher = userRecord.role === 'TEACHER' && room.class.teacherId === userRecord.id;
  const isStudent = room.class.students.some((student) => student.id === userRecord.id);

  if (!isTeacher && !isStudent) {
    redirect('/classes');
  }

  const env = getEnv();

  const token = await createLiveKitToken({
    identity: userRecord.id,
    room: room.roomName,
    role: userRecord.role,
    name: userRecord.name,
  });

  const user: AuthUser = {
    id: userRecord.id,
    email: userRecord.email,
    name: userRecord.name,
    role: userRecord.role,
  };

  return (
    <LiveRoom
      token={token}
      serverUrl={env.NEXT_PUBLIC_LIVEKIT_URL}
      user={user}
      roomName={room.roomName}
    />
  );
}
