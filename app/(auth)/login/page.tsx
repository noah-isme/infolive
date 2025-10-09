'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const loginSchema = z.object({
  email: z.string({ required_error: 'Email wajib diisi' }).email({ message: 'Format email salah' }),
  password: z.string({ required_error: 'Password wajib diisi' }).min(8, 'Min. 8 karakter'),
});

const registerSchema = loginSchema.extend({
  name: z.string({ required_error: 'Nama wajib diisi' }).min(2, 'Min. 2 karakter'),
  role: z.enum(['TEACHER', 'STUDENT'], {
    required_error: 'Pilih peran',
  }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

async function submitJson(url: string, data: unknown) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error ?? 'Terjadi kesalahan';
    throw new Error(message);
  }

  return payload;
}

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'teacher@example.com',
      password: 'password123',
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'STUDENT',
    },
  });

  const handleLoginSubmit = (values: LoginFormValues) => {
    startTransition(async () => {
      try {
        await submitJson('/api/auth/login', values);
        toast.success('Berhasil masuk');
        router.push('/classes');
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Gagal masuk';
        toast.error(message);
      }
    });
  };

  const handleRegisterSubmit = (values: RegisterFormValues) => {
    startTransition(async () => {
      try {
        await submitJson('/api/auth/register', values);
        toast.success('Akun berhasil dibuat');
        router.push('/classes');
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Gagal mendaftar';
        toast.error(message);
      }
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted px-6 py-12">
      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-8 md:grid-cols-2">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Masuk ke InfoLive</CardTitle>
            <CardDescription>
              Gunakan akun guru atau siswa untuk mengelola kelas dan bergabung sesi live.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...loginForm}>
              <form className="space-y-4" onSubmit={loginForm.handleSubmit(handleLoginSubmit)}>
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="teacher@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button className="w-full" type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" /> Memproses...
                    </>
                  ) : (
                    'Masuk'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              Demo cepat: email <span className="font-medium">teacher@example.com</span> / password
              <span className="font-medium"> password123</span>
            </p>
          </CardFooter>
        </Card>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Buat Akun Baru</CardTitle>
            <CardDescription>
              Untuk siswa, gunakan kode kelas dari guru setelah akun selesai dibuat.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...registerForm}>
              <form
                className="space-y-4"
                onSubmit={registerForm.handleSubmit(handleRegisterSubmit)}
              >
                <FormField
                  control={registerForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap</FormLabel>
                      <FormControl>
                        <Input placeholder="Nama Anda" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Minimal 8 karakter" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peran</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih peran" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="TEACHER">Guru</SelectItem>
                          <SelectItem value="STUDENT">Siswa</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button className="w-full" type="submit" variant="secondary" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" /> Memproses...
                    </>
                  ) : (
                    'Daftar'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              Guru dapat langsung membuat kelas baru setelah mendaftar.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
