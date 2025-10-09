'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, LogOut, Plus, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import type { AuthUser, ClassSummary } from '@/lib/types';

const createClassSchema = z.object({
  title: z.string().min(3, 'Minimal 3 karakter'),
});

const joinClassSchema = z.object({
  code: z.string().min(4, 'Minimal 4 karakter').max(12, 'Maksimal 12 karakter'),
});

type CreateClassValues = z.infer<typeof createClassSchema>;
type JoinClassValues = z.infer<typeof joinClassSchema>;

interface ClassesViewProps {
  user: AuthUser;
  classes: ClassSummary[];
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

export function ClassesView({ user, classes }: ClassesViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const createForm = useForm<CreateClassValues>({
    resolver: zodResolver(createClassSchema),
    defaultValues: { title: '' },
  });

  const joinForm = useForm<JoinClassValues>({
    resolver: zodResolver(joinClassSchema),
    defaultValues: { code: '' },
  });

  const isTeacher = user.role === 'TEACHER';

  const sortedClasses = useMemo(
    () =>
      [...classes].sort((a, b) => {
        const aDate = a.sessions[0]?.startsAt ?? '';
        const bDate = b.sessions[0]?.startsAt ?? '';
        return bDate.localeCompare(aDate);
      }),
    [classes],
  );

  const handleCreateClass = (values: CreateClassValues) => {
    startTransition(async () => {
      try {
        await postJson('/api/class', values);
        toast.success('Kelas berhasil dibuat');
        createForm.reset();
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Gagal membuat kelas';
        toast.error(message);
      }
    });
  };

  const handleJoinClass = (values: JoinClassValues) => {
    startTransition(async () => {
      try {
        await postJson('/api/class', values);
        toast.success('Berhasil bergabung ke kelas');
        joinForm.reset();
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Gagal bergabung';
        toast.error(message);
      }
    });
  };

  const handleCreateSession = (classId: string) => {
    startTransition(async () => {
      try {
        const payload = await postJson('/api/session', { classId });
        toast.success('Sesi dibuat, siap untuk live!', {
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

  const handleLogout = () => {
    startTransition(async () => {
      try {
        await postJson('/api/auth/logout', {});
        router.push('/login');
        router.refresh();
      } catch (error) {
        toast.error('Gagal keluar, coba lagi');
      }
    });
  };

  return (
    <div className="flex min-h-screen flex-col gap-8 bg-background px-6 py-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Selamat datang, {user.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola kelas dan sesi live streaming kamu dari satu tempat.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isTeacher ? 'default' : 'secondary'} className="uppercase">
            {isTeacher ? 'Guru' : 'Siswa'}
          </Badge>
          <Button variant="ghost" size="sm" onClick={handleLogout} disabled={isPending}>
            <LogOut className="mr-2 size-4" /> Keluar
          </Button>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {isTeacher ? (
          <Card>
            <CardHeader>
              <CardTitle>Buat Kelas Baru</CardTitle>
              <CardDescription>
                Kelas baru otomatis mendapatkan kode unik untuk siswa.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...createForm}>
                <form className="space-y-4" onSubmit={createForm.handleSubmit(handleCreateClass)}>
                  <FormField
                    control={createForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Judul Kelas</FormLabel>
                        <FormControl>
                          <Input placeholder="Informatika Dasar X-1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isPending}>
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" /> Membuat kelas...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 size-4" /> Buat Kelas
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Gabung Kelas</CardTitle>
              <CardDescription>Masukkan kode kelas yang diberikan oleh guru.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...joinForm}>
                <form className="space-y-4" onSubmit={joinForm.handleSubmit(handleJoinClass)}>
                  <FormField
                    control={joinForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kode Kelas</FormLabel>
                        <FormControl>
                          <Input placeholder="ABC123" {...field} className="uppercase" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isPending}>
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" /> Mengirim...
                      </>
                    ) : (
                      'Gabung'
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Kelas</CardTitle>
            <CardDescription>
              {isTeacher
                ? 'Bagikan kode kelas ke siswa untuk mulai belajar.'
                : 'Anda dapat bergabung ke kelas lain dengan kode yang berbeda.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Total kelas aktif:{' '}
              <span className="font-medium text-foreground">{classes.length}</span>
            </p>
            <p>
              Sesi terakhir:
              <span className="font-medium text-foreground">
                {classes[0]?.sessions[0]?.startsAt
                  ? ` ${new Date(classes[0].sessions[0].startsAt).toLocaleString('id-ID')}`
                  : ' Belum ada sesi'}
              </span>
            </p>
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {sortedClasses.map((item) => (
          <Card key={item.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                {item.title}
                <Badge variant="outline" className="font-mono text-xs tracking-wider">
                  {item.code}
                </Badge>
              </CardTitle>
              <CardDescription className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <Users className="size-4" /> {item.studentsCount} siswa
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
              <div className="rounded-lg border border-dashed border-border p-3">
                <p className="text-sm font-semibold text-foreground">Sesi Terbaru</p>
                {item.sessions.length > 0 ? (
                  <div className="mt-2 space-y-1 text-sm">
                    <p className="text-muted-foreground">
                      Mulai: {new Date(item.sessions[0].startsAt).toLocaleString('id-ID')}
                    </p>
                    <p className="text-muted-foreground">
                      Ruang:{' '}
                      <span className="font-mono text-foreground">{item.sessions[0].roomName}</span>
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Belum ada sesi, buat sekarang.
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 md:flex-row">
              <Button
                className="w-full"
                variant="outline"
                onClick={() => router.push(`/class/${item.code}`)}
              >
                Lihat Detail
              </Button>
              {isTeacher ? (
                <Button
                  className="w-full"
                  onClick={() => handleCreateSession(item.id)}
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" /> Membuat sesi
                    </>
                  ) : (
                    'Sesi Baru'
                  )}
                </Button>
              ) : item.sessions.length > 0 ? (
                <Button
                  className="w-full"
                  onClick={() => router.push(`/room/${item.sessions[0].roomName}`)}
                >
                  Masuk Ruang
                </Button>
              ) : null}
            </CardFooter>
          </Card>
        ))}

        {sortedClasses.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
            <p className="text-lg font-medium text-foreground">Belum ada kelas</p>
            <p className="text-sm">
              {isTeacher
                ? 'Buat kelas pertama Anda dan undang siswa.'
                : 'Masukkan kode kelas dari guru untuk mulai belajar.'}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
