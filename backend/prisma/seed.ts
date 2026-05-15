import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const dbUrl = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb({
  host: dbUrl.hostname,
  port: Number(dbUrl.port) || 3306,
  user: decodeURIComponent(dbUrl.username),
  password: decodeURIComponent(dbUrl.password),
  database: dbUrl.pathname.replace('/', ''),
  connectionLimit: 5,
});
const prisma = new PrismaClient({ adapter });

const hash = (pwd: string) => bcrypt.hash(pwd, 12);

async function main() {
  console.log('Seeding database...');

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@ngoplatform.com' },
    update: {},
    create: {
      email: 'admin@ngoplatform.com',
      passwordHash: await hash('admin123'),
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
    },
  });

  const citizen1 = await prisma.user.upsert({
    where: { email: 'rahul.sharma@example.com' },
    update: {},
    create: {
      email: 'rahul.sharma@example.com',
      passwordHash: await hash('citizen123'),
      firstName: 'Rahul',
      lastName: 'Sharma',
      role: 'CITIZEN',
      phone: '9876543210',
    },
  });

  const citizen2 = await prisma.user.upsert({
    where: { email: 'priya.singh@example.com' },
    update: {},
    create: {
      email: 'priya.singh@example.com',
      passwordHash: await hash('citizen123'),
      firstName: 'Priya',
      lastName: 'Singh',
      role: 'CITIZEN',
      phone: '9876543211',
    },
  });

  const citizen3 = await prisma.user.upsert({
    where: { email: 'arjun.nair@example.com' },
    update: {},
    create: {
      email: 'arjun.nair@example.com',
      passwordHash: await hash('citizen123'),
      firstName: 'Arjun',
      lastName: 'Nair',
      role: 'CITIZEN',
      phone: '9876543212',
    },
  });

  const ngoAdmin1 = await prisma.user.upsert({
    where: { email: 'meera@helpfoundation.org' },
    update: {},
    create: {
      email: 'meera@helpfoundation.org',
      passwordHash: await hash('ngo123'),
      firstName: 'Meera',
      lastName: 'Patel',
      role: 'NGO_ADMIN',
      ngoProfile: {
        create: {
          name: 'Help Foundation',
          registrationNo: 'NGO-MH-2020-001',
          description: 'We help underprivileged families with food, medical aid, and shelter across Maharashtra.',
          address: '15 Bandra West',
          city: 'Mumbai',
          state: 'Maharashtra',
          isVerified: true,
        },
      },
    },
  });

  const ngoAdmin2 = await prisma.user.upsert({
    where: { email: 'director@carekids.in' },
    update: {},
    create: {
      email: 'director@carekids.in',
      passwordHash: await hash('ngo123'),
      firstName: 'Suresh',
      lastName: 'Reddy',
      role: 'NGO_ADMIN',
      ngoProfile: {
        create: {
          name: 'Care for Kids',
          registrationNo: 'NGO-KA-2018-042',
          description: 'Focused on child education and nutrition in rural Karnataka.',
          address: '88 MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          isVerified: true,
        },
      },
    },
  });

  await prisma.user.upsert({
    where: { email: 'amit.kumar@volunteer.com' },
    update: {},
    create: {
      email: 'amit.kumar@volunteer.com',
      passwordHash: await hash('volunteer123'),
      firstName: 'Amit',
      lastName: 'Kumar',
      role: 'VOLUNTEER',
      volunteerProfile: {
        create: {
          bio: 'Retired doctor willing to provide free medical consultations on weekends.',
          skills: ['Medical', 'First Aid', 'Counselling'],
        },
      },
    },
  });

  await prisma.user.upsert({
    where: { email: 'sunita.joshi@volunteer.com' },
    update: {},
    create: {
      email: 'sunita.joshi@volunteer.com',
      passwordHash: await hash('volunteer123'),
      firstName: 'Sunita',
      lastName: 'Joshi',
      role: 'VOLUNTEER',
      volunteerProfile: {
        create: {
          bio: 'School teacher available to provide free tutoring for children in need.',
          skills: ['Teaching', 'Hindi', 'Mathematics', 'Science'],
        },
      },
    },
  });

  const ngo1 = await prisma.nGO.findFirst({ where: { userId: ngoAdmin1.id } });
  const ngo2 = await prisma.nGO.findFirst({ where: { userId: ngoAdmin2.id } });

  await prisma.request.upsert({
    where: { id: 'seed-request-001' },
    update: {},
    create: {
      id: 'seed-request-001',
      citizenId: citizen1.id,
      title: 'Need food assistance for family of five',
      description: 'Our family of five has been struggling since I lost my job three months ago. We have no savings left and desperately need basic food supplies to survive through this difficult period.',
      category: 'FOOD',
      urgencyLevel: 5,
      address: '45 Dharavi Nagar',
      city: 'Mumbai',
      state: 'Maharashtra',
      status: 'PENDING',
    },
  });

  await prisma.request.upsert({
    where: { id: 'seed-request-002' },
    update: {},
    create: {
      id: 'seed-request-002',
      citizenId: citizen2.id,
      ngoId: ngo1?.id,
      title: 'Elderly mother needs diabetes medication',
      description: 'My elderly mother suffers from diabetes and hypertension and requires regular medication. We cannot afford the monthly expenses of approximately Rs 2,500 for her medicines.',
      category: 'MEDICAL',
      urgencyLevel: 5,
      address: '12 Lake Town Block B',
      city: 'Kolkata',
      state: 'West Bengal',
      status: 'UNDER_REVIEW',
    },
  });

  await prisma.request.upsert({
    where: { id: 'seed-request-003' },
    update: {},
    create: {
      id: 'seed-request-003',
      citizenId: citizen1.id,
      ngoId: ngo2?.id,
      title: 'School supplies for three children',
      description: 'My three school-going children aged 7, 10, and 13 need books, uniforms, and stationery for the upcoming academic year. I am a daily wage worker and cannot afford these expenses.',
      category: 'EDUCATION',
      urgencyLevel: 3,
      address: '45 Dharavi Nagar',
      city: 'Mumbai',
      state: 'Maharashtra',
      status: 'APPROVED',
    },
  });

  await prisma.request.upsert({
    where: { id: 'seed-request-004' },
    update: {},
    create: {
      id: 'seed-request-004',
      citizenId: citizen3.id,
      title: 'Temporary shelter after house fire',
      description: 'Our house was completely destroyed in a fire last week. A family of four including two young children are currently sleeping on the street. We need emergency shelter immediately.',
      category: 'SHELTER',
      urgencyLevel: 5,
      address: '33 Karol Bagh',
      city: 'Delhi',
      state: 'Delhi',
      status: 'PENDING',
    },
  });

  await prisma.request.upsert({
    where: { id: 'seed-request-005' },
    update: {},
    create: {
      id: 'seed-request-005',
      citizenId: citizen2.id,
      title: 'Winter clothing for family',
      description: 'With winter approaching, our family of four has no warm clothing. The children are particularly vulnerable and need jackets, sweaters, and blankets before temperatures drop further.',
      category: 'CLOTHING',
      urgencyLevel: 3,
      address: '12 Lake Town Block B',
      city: 'Kolkata',
      state: 'West Bengal',
      status: 'COMPLETED',
    },
  });

  console.log('\nSeed completed successfully.');
  console.log('──────────────────────────────');
  console.log('Credentials (all passwords are shown below):');
  console.log(`  Super Admin : admin@ngoplatform.com       / admin123`);
  console.log(`  Citizen 1   : rahul.sharma@example.com    / citizen123`);
  console.log(`  Citizen 2   : priya.singh@example.com     / citizen123`);
  console.log(`  Citizen 3   : arjun.nair@example.com      / citizen123`);
  console.log(`  NGO Admin 1 : meera@helpfoundation.org    / ngo123`);
  console.log(`  NGO Admin 2 : director@carekids.in        / ngo123`);
  console.log(`  Volunteer 1 : amit.kumar@volunteer.com    / volunteer123`);
  console.log(`  Volunteer 2 : sunita.joshi@volunteer.com  / volunteer123`);
  console.log('──────────────────────────────');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
