'use client';

import { Loader2, Play, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { AuthUser, ClassSummary } from '@/lib/types';

interface ClassDetailViewProps {
  user: AuthUser;
  classSummary: ClassSummary;
  isEnrolled: boolean;
}

async function postJson(url: string, body: unknown) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error ?? 'Terjadi kesalahan');
  }

  return payload;
}

export function ClassDetailView({ user, classSummary, isEnrolled }: ClassDetailViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isTeacher = user.role === 'TEACHER' && classSummary.teacherId === user.id;

  const handleJoin = () => {
    startTransition(async () => {
      try {
        await postJson('/api/class', { code: classSummary.code });
        toast.success('Berhasil bergabung ke kelas');
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Gagal bergabung';
        toast.error(message);
      }
    });
  };

  const handleCreateSession = () => {
    startTransition(async () => {
      try {
        const payload = await postJson('/api/session', { classId: classSummary.id });
        toast.success('Sesi baru berhasil dibuat', {
          action: {
            label: 'Masuk',
            onClick: () => router.push(`/room/${payload.session.roomName}`),
          },
        });
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Gagal membuat sesi';
        toast.error(message);
      }
    });
  };

  const latestSession = classSummary.sessions[0];

  return (
    <div className="flex min-h-screen flex-col gap-8 bg-background px-6 py-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {classSummary.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline" className="font-mono text-xs">
              Kode: {classSummary.code}
            </Badge>
            {classSummary.teacher && (
              <span>
                Guru: <strong className="text-foreground">{classSummary.teacher.name}</strong>
              </span>
            )}
            <span>
              Total Siswa: <strong className="text-foreground">{classSummary.studentsCount}</strong>
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {isTeacher ? (
            <Button onClick={handleCreateSession} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Membuat sesi...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 size-4" /> Sesi Baru
                </>
              )}
            </Button>
          ) : !isEnrolled ? (
            <Button onClick={handleJoin} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Mengirim...
                </>
              ) : (
                'Gabung Kelas'
              )}
            </Button>
          ) : latestSession ? (
            <Button onClick={() => router.push(`/room/${latestSession.roomName}`)}>
              <Play className="mr-2 size-4" /> Masuk Sesi Terbaru
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status Kelas</CardTitle>
            <CardDescription>
              Kode kelas dapat dibagikan kepada siswa untuk bergabung.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Peran Anda:
              <Badge variant="secondary" className="ml-2 uppercase">
                {isTeacher ? 'Guru' : isEnrolled ? 'Siswa' : 'Belum bergabung'}
              </Badge>
            </p>
            <p>
              Sesi terbaru:
              <span className="font-medium text-foreground">
                {latestSession
                  ? ` ${new Date(latestSession.startsAt).toLocaleString('id-ID')}`
                  : ' Belum ada sesi'}
              </span>
            </p>
            {latestSession && (
              <p>
                Ruang aktif:{' '}
                <span className="font-mono text-foreground">{latestSession.roomName}</span>
              </p>
            )}
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              Gunakan tombol di atas untuk mulai sesi baru atau bergabung ke ruang live.
            </p>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Riwayat Sesi</CardTitle>
            <CardDescription>Daftar sesi live yang pernah dibuat di kelas ini.</CardDescription>
          </CardHeader>
          <CardContent>
            {classSummary.sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada sesi yang dibuat.</p>
            ) : (
              <ScrollArea className="max-h-64 pr-4">
                <div className="space-y-4">
                  {classSummary.sessions.map((session) => (
                    <div key={session.id} className="rounded-lg border border-border p-3">
                      <p className="text-sm font-semibold text-foreground">
                        {new Date(session.startsAt).toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ruang: <span className="font-mono">{session.roomName}</span>
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/room/${session.roomName}`)}
                        >
                          Masuk Ruang
                        </Button>
                        {session.endsAt && (
                          <Badge variant="outline" className="text-xs">
                            Selesai {new Date(session.endsAt).toLocaleTimeString('id-ID')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Langkah Selanjutnya</CardTitle>
          <CardDescription>
            Setelah sesi dimulai, sistem akan mencatat presensi otomatis setiap 15 detik.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
