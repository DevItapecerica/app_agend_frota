# 🚛 PROJETO AGEND_FROTA - CONFIGURAÇÃO MESTRE PRISMA & MARIADB

Este documento contém a arquitetura completa do sistema de banco de dados, preparada para desenvolvimento local e deploy on-premise via Dokploy com Traefik.

---

## 📂 1. ESTRUTURA DE ARQUIVOS (Onde colocar cada coisa)
Agend_Frota/
├── prisma/
│   └── schema.prisma        <-- Definição das tabelas
├── src/
│   └── lib/
│       └── prisma.ts        <-- Instância do Cliente para o seu Código
├── .env                     <-- Suas senhas e variáveis
├── prisma.config.ts         <-- Ponte para o Terminal (npx prisma)
├── teste-conexao.ts         <-- Script de validação rápida
└── package.json             <-- Dependências do projeto

---

## 🔑 2. ARQUIVO: .env
# Configure aqui suas credenciais do MariaDB local. 
# No Dokploy, estas mesmas chaves devem ser inseridas no painel de Environment Variables.

DB_USER=root
DB_PASS=root
DB_HOST=localhost
DB_PORT=3306
DB_NAME=frota_municipal
NODE_ENV=development

---

## 🛠️ 3. ARQUIVO: prisma.config.ts
# Este arquivo ensina o comando 'npx prisma' a montar a URL de conexão usando as variáveis acima.

import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const { DB_USER = '', DB_PASS = '', DB_HOST = 'localhost', DB_PORT = '3306', DB_NAME = '', NODE_ENV } = process.env;
const isProd = NODE_ENV === 'production';
const sslMode = isProd ? 'strict' : 'accept_invalid_certs';
const constructedUrl = `mysql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslaccept=${sslMode}`;

process.env.DATABASE_URL = constructedUrl;

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: { url: constructedUrl },
});

---

## 🛰️ 4. ARQUIVO: src/lib/prisma.ts
# Este é o arquivo que seu código Node/TypeScript vai importar para fazer as consultas.

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const { DB_USER = '', DB_PASS = '', DB_HOST = 'localhost', DB_PORT = '3306', DB_NAME = '', NODE_ENV } = process.env;
const isProd = NODE_ENV === 'production';
const sslMode = isProd ? 'strict' : 'accept_invalid_certs';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `mysql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslaccept=${sslMode}`;
}

export const prisma = new PrismaClient();

---

## 📝 5. ARQUIVO: prisma/schema.prisma
# Sua estrutura de dados sincronizada.

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum StatusVeiculo {
  DISPONIVEL
  EM_VIAGEM
  MANUTENCAO
}

enum Role {
  ADMIN
  GESTOR
  REQUISITANTE
}

enum StatusAgendamento {
  PENDENTE
  APROVADO
  NEGADO
  CONCLUIDO
}

model Secretaria {
  id           Int           @id @default(autoincrement())
  nome         String        @unique
  departamentos Departamento[]
  veiculos     Veiculo[]
  usuarios     Usuario[]
  solicitantes Solicitante[]
}

model Departamento {
  id           Int           @id @default(autoincrement())
  nome         String
  secretariaId Int
  secretaria   Secretaria    @relation(fields: [secretariaId], references: [id])
  ativo        Boolean       @default(true)
  agendamentos Agendamento[]
  solicitantes Solicitante[]
}

model Solicitante {
  id             Int           @id @default(autoincrement())
  nome           String
  documento      String?       @unique
  telefone       String?
  secretariaId   Int?
  secretaria     Secretaria?   @relation(fields: [secretariaId], references: [id])
  departamentoId Int?
  departamento   Departamento? @relation(fields: [departamentoId], references: [id])
  agendamentos   Agendamento[]
  createdAt      DateTime      @default(now())
}

model Veiculo {
  id           Int           @id @default(autoincrement())
  placa        String        @unique
  modelo       String
  capacidade   Int
  tipo         String
  status       StatusVeiculo @default(DISPONIVEL)
  kmAtual      Int           @default(0)
  emManutencao Boolean       @default(false)
  secretariaId Int?
  secretaria   Secretaria?   @relation(fields: [secretariaId], references: [id])
  agendamentos Agendamento[]
}

model Condutor {
  id           Int           @id @default(autoincrement())
  nome         String
  cnh          String        @unique
  validadeCnh  DateTime?
  telefone     String?
  agendamentos Agendamento[]
}

model Usuario {
  id           Int           @id @default(autoincrement())
  nome         String
  email        String        @unique
  senha        String
  role         Role          @default(REQUISITANTE)
  secretariaId Int?
  secretaria   Secretaria?   @relation(fields: [secretariaId], references: [id])
}

model Agendamento {
  id             Int               @id @default(autoincrement())
  dataSaida      DateTime
  dataRetorno    DateTime
  itinerario     String
  passageiros    Int               @default(1)
  observacao     String?
  status         StatusAgendamento @default(PENDENTE)
  solicitante    Solicitante       @relation(fields: [solicitanteId], references: [id])
  solicitanteId  Int
  veiculo        Veiculo           @relation(fields: [veiculoId], references: [id])
  veiculoId      Int
  condutor       Condutor          @relation(fields: [condutorId], references: [id])
  condutorId     Int
  departamento   Departamento?     @relation(fields: [departamentoId], references: [id])
  departamentoId Int?
}

---

## 🧪 6. ARQUIVO: teste-conexao.ts
# Script para validar se o código consegue ler o banco.

import { prisma } from './src/lib/prisma';

async function main() {
  console.log('🚀 Iniciando teste de conexão...');
  try {
    const veiculos = await prisma.veiculo.findMany();
    console.log('✅ Conexão bem-sucedida!');
    console.table(veiculos);
  } catch (error) {
    console.error('❌ Erro ao conectar no banco:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

---

## 💻 7. COMANDOS DO TERMINAL (FLUXO COMPLETO)

# 1. Instalar as dependências necessárias
npm install @prisma/client dotenv
npm install -D prisma tsx typescript @types/node

# 2. Sincronizar o banco existente com o código (Gera o schema)
npx prisma db pull

# 3. Gerar o Cliente Prisma (Cria as tipagens do TypeScript)
npx prisma generate

# 4. Rodar o script de teste
npx tsx teste-conexao.ts

# 5. Abrir interface visual do banco
npx prisma studio

---

## 🚀 8. DICAS PARA DOKPLOY & TRAEFIK
1. No Dokploy, adicione 'NODE_ENV=production' para ativar o 'sslaccept=strict'.
2. Use o nome do container do banco como 'DB_HOST' na rede interna do Docker.
3. Certifique-se de rodar 'npx prisma generate' no seu processo de Build/Deploy.