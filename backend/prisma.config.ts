import { defineConfig } from 'prisma/config';
import 'dotenv/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrate: {
    connectionString: process.env.DATABASE_URL!,
  },
});