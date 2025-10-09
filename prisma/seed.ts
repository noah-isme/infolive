import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.attendance.deleteMany();
  await prisma.session.deleteMany();
  await prisma.class.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  const teacher = await prisma.user.create({
    data: {
      email: 'teacher@example.com',
      password: passwordHash,
      name: 'Guru Utama',
      role: Role.TEACHER,
    },
  });

  const students = await prisma.user.createMany({
    data: [
      {
        email: 'student1@example.com',
        password: passwordHash,
        name: 'Siswa Satu',
        role: Role.STUDENT,
      },
      {
        email: 'student2@example.com',
        password: passwordHash,
        name: 'Siswa Dua',
        role: Role.STUDENT,
      },
      {
        email: 'student3@example.com',
        password: passwordHash,
        name: 'Siswa Tiga',
        role: Role.STUDENT,
      },
    ],
  });

  if (!students.count) {
    throw new Error('Gagal membuat data siswa awal');
  }

  const studentRecords = await prisma.user.findMany({
    where: {
      role: Role.STUDENT,
    },
  });

  await prisma.class.create({
    data: {
      title: 'Informatika Dasar',
      code: 'ABC123',
      teacherId: teacher.id,
      students: {
        connect: studentRecords.map((student) => ({ id: student.id })),
      },
    },
  });

  console.info('✅ Database seed selesai.');
}

main()
  .catch((error) => {
    console.error('❌ Gagal menjalankan seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
