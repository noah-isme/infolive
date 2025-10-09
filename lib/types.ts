import type { Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface SessionSummary {
  id: string;
  roomName: string;
  startsAt: string;
  endsAt: string | null;
}

export interface ClassSummary {
  id: string;
  title: string;
  code: string;
  role: Role;
  teacherId: string;
  teacher: {
    id: string;
    name: string;
    email: string;
  } | null;
  studentsCount: number;
  sessions: SessionSummary[];
  isTeacher: boolean;
}

export interface LiveKitCredentials {
  token: string;
  url: string;
  turnServer: string;
  participant: {
    identity: string;
    name: string;
    role: Role;
  };
}
