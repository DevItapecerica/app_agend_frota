import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main () {
    console.log('🌱 Semeando banco de dados...');

    // 1. Criar Secretarias
    const saude = await prisma.secretaria.upsert({
        where: { nome: 'Secretaria de Saúde' },
        update: {},
        create: { nome: 'Secretaria de Saúde' },
    });

    const obras = await prisma.secretaria.upsert({
        where: { nome: 'Secretaria de Obras' },
        update: {},
        create: { nome: 'Secretaria de Obras' },
    });

    // 2. Criar um Condutor
    await prisma.condutor.upsert({
        where: { cnh: '123456789' },
        update: {},
        create: {
            nome: 'João Motorista',
            cnh: '123456789',
            validadeCnh: new Date('2030-01-01'),
            telefone: '11999999999',
        },
    });

    // 3. Criar Veículos
    await prisma.veiculo.createMany({
        data: [
            {
                placa: 'ABC-1234',
                modelo: 'Renault Master (Ambulância)',
                capacidade: 8,
                tipo: 'Saúde',
                
                status: 'DISPONIVEL',
            },
            {
                placa: 'XYZ-9988',
                modelo: 'VW Gol',
                capacidade: 5,
                tipo: 'Fiscalização',
                
                status: 'EM_VIAGEM',
            },
        ],
        skipDuplicates: true,
    });

    console.log('✅ Dados inseridos com sucesso!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

// Criar Usuário Admin
const senhaCripto = await bcrypt.hash('admin123', 10);

await prisma.usuario.upsert({
    where: { email: 'admin@prefeitura.gov.br' },
    update: {},
    create: {
        nome: 'Administrador Central',
        email: 'admin@prefeitura.gov.br',
        senha: senhaCripto,
        role: 'ADMIN'
    },
});