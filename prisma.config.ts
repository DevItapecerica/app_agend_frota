import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    // Se o .env falhar, ele usa a string direta como backup
    url: process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/frota_municipal',
  },
});