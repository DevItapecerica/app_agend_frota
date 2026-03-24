# 🚗 Sistema de Agendamento de Frota Municipal

Este guia contém todos os passos para configurar, instalar e rodar a aplicação.

## 📂 Estrutura do Projeto
### 📂 Estrutura de Diretórios e Arquivos (Agend_Frota)

* **`Agend_Frota/`** — Diretório raiz do projeto.
    * **`prisma/`** — Pasta central de configuração e modelagem do banco de dados.
        * **`migrations/`** — Histórico de versões e alterações estruturais do banco de dados.
        * **`schema.prisma`** — Arquivo mestre onde ficam os Modelos (tabelas) e Enums.
        * **`seed.ts`** — Script para popular o banco com dados iniciais (Ex: Cadastrar secretarias padrão).
    * **`public/`** — Arquivos estáticos (Frontend) servidos diretamente ao navegador.
        * **`dashboard.html` / `dashboard1.html`** — Interfaces de visualização e gestão da frota.
        * **`index.html`** — Página de entrada (Landing page ou Login).
        * **`scripts.js`** — Lógica do Frontend (Manipulação de DOM e requisições à API).
    * **`src/`** — Código-fonte principal do servidor (Backend).
        * **`lib/`** — Bibliotecas de apoio e instâncias compartilhadas.
            * **`prisma.ts`** — Instância global do Prisma Client para conexão com o banco.
        * **`app.ts`** — Ponto de entrada do servidor (Rotas, Middleware e Inicialização).
    * **`.env`** — Variáveis de ambiente (Credenciais de banco e chaves secretas).
    * **`.gitignore`** — Arquivos e pastas que o Git não deve rastrear (Ex: node_modules).
    * **`docker-compose.yml`** — Orquestração de containers (Levanta o MariaDB e a App com um comando).
    * **`package-lock.json`** — Trava as versões exatas das dependências instaladas.
    * **`package.json`** — Manifesto do projeto (Scripts, metadados e lista de bibliotecas).
    * **`PRISMA_MASTER_GUIDE.md`** — Guia técnico com os códigos de configuração e segurança.
    * **`prisma.config.ts`** — Configuração dinâmica para o Prisma CLI ler o seu `.env`.
    * **`README.md`** — Documentação geral sobre como rodar o projeto.
    * **`teste-conexao.ts`** — Script utilitário para validar se o banco está respondendo.
    * **`tsconfig.json`** — Configurações de compilação do TypeScript para o Node.js.

## 🛠️ Tecnologias
- Node.js v22.16.0 | Fastify v5.2.1 | Prisma v6.19 | MariaDB v1.2.2 | Zod

## 🚀 Passo a Passo de Instalação e Configuração

### 1. Instalação de Dependências
<br>npm install -g npm@latest</br>
<br>npm install</br>
<br>npm install fastify @prisma/client zod @fastify/cors @fastify/jwt @fastify/static bcrypt</br>
<br>npm install -D typescript tsx prisma @prisma/config @types/node @types/bcrypt</br>
<br>npx tsc --init --outDir dist --rootDir src</br>
<br>npm install dotenv</br>
</br>npx prisma init</br>

### 2. Banco de Dados e Migrations
# Subir o banco
docker-compose up -d

# Configurar o .env
# DATABASE_URL="mysql://login:senha@localhost:3306/frota_municipal"

# Rodar Migrations Manualmente (Comando para Windows/PowerShell)
$env:DATABASE_URL="mysql://login:senha@127.0.0.1:3306/frota_municipal"; npx prisma migrate dev --name inicializacao_tabelas

#Teste Database
npx prisma db pull  
npx tsx teste-conexao.ts

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
