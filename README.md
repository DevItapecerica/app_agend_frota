# 🚗 Sistema de Agendamento de Frota Municipal

Este guia contém todos os passos para configurar, instalar e rodar a aplicação.

## 📂 Estrutura do Projeto
Agend_Frota/
┣ 📂 prisma/                     # Migrations, Schema e Seed
┣ 📂 public/                     # Frontend (HTML/JS)
┣ 📂 src/                        # Backend (Fastify)
┣ 📜 .env                        # Database URL
┣ 📜 docker-compose.yml          # MariaDB Docker
┣ 📜 package.json                # Scripts e Deps
┗ 📜 tsconfig.json               # Config TypeScript

## 🛠️ Tecnologias
- Node.js v22.16.0 | Fastify v5.2.1 | Prisma v6.4.1 | MariaDB | Zod

## 🚀 Passo a Passo de Instalação e Configuração

### 1. Instalação de Dependências
<br>npm install -g npm@latest</br>
<br>npm install</br>
<br>npm install fastify @prisma/client zod @fastify/cors @fastify/jwt @fastify/static bcrypt</br>
<br>npm install -D typescript tsx prisma @prisma/config @types/node @types/bcrypt</br>
<br>npx tsc --init --outDir dist --rootDir src</br>
</br>npx prisma init</br>

### 2. Banco de Dados e Migrations
# Subir o banco
docker-compose up -d

# Configurar o .env
# DATABASE_URL="mysql://login:senha@localhost:3306/frota_municipal"

# Rodar Migrations (Comando para Windows/PowerShell)
$env:DATABASE_URL="mysql://root:root@127.0.0.1:3306/frota_municipal"; npx prisma migrate dev --name inicializacao_tabelas

# Gerar Client e Popular Banco
npx prisma generate
npx prisma db seed

### 3. Execução
# Rodar servidor em dev
npm run dev

# Abrir painel do banco
npx prisma studio

## 📜 Scripts Rápidos
- dev: tsx watch src/app.ts
- prisma:generate: npx prisma generate
- prisma:migrate: npx prisma migrate dev

## 📝 Histórico de Migrations
1. inicializacao_tabelas
2. ajuste_frota_geral_e_solicitantes
3. adicionar_observacao_agendamento
4. add_dept_to_solicitante
5. add_em_manutencao
