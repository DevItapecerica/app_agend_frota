# app_agend_frota
Aplicação de agendamento de veiculos frota municipal

Docker + Fastfy + node.js 22.16.0 + Prisma 6.95

Inicie o Servidor dev database 

docker-compose up -d

No console da aplicação dev

npm install -g npm@latest \\para criar o diretorio node_modules

npm init -y

npm install fastify @prisma/client zod 

npm install -D typescript ts-node nodemon @types/node @types/validator prisma

npx tsc --init --outDir dist --rootDir src

npx prisma init

npx prisma migrate dev --name init

npm install @prisma/config

npm install @fastify/cors

npm install -D tsx 

//caso comandos acima não funicone a migration

npx prisma migrate dev --name init --url="mysql://root:root@localhost:3306/frota_municipal" ou $env:DATABASE_URL="mysql://root:root@127.0.0.1:3306/frota_municipal"; npx prisma migrate dev --name ajuste_schema

npx prisma migrate dev --name inicializacao_tabelas
