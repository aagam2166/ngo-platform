import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';

// This line loads the variables from your .env file
dotenv.config();

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});