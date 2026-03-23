import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';
import fastifyStatic from '@fastify/static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();

// --- CONFIGURAÇÕES ---
await fastify.register(cors, { origin: true });
await fastify.register(jwt, {
    secret: 'prefeitura-itape-segredo-super-secreto'
});

await fastify.register(fastifyStatic, {
    root: path.join(__dirname, '../public'),
    prefix: '/',
});

// --- ROTA DE LOGIN ---
fastify.post('/api/login', async (request, reply) => {



    const { email, senha } = request.body as any;
    const user = await prisma.usuario.findUnique({ where: { email } });

    if (!user) return reply.status(401).send({ message: 'Usuário ou senha inválidos' });

    const senhaValida = await bcrypt.compare(senha, user.senha);
    if (!senhaValida) return reply.status(401).send({ message: 'Usuário ou senha inválidos' });

    const token = fastify.jwt.sign({ id: user.id, role: user.role, nome: user.nome });
    return { token, user: { nome: user.nome, role: user.role } };
});

// --- DASHBOARD ---
fastify.get('/api/dashboard/stats', async (request, reply) => {
    try {
        await request.jwtVerify();

        // Criamos o objeto "agora" e ajustamos para o fuso de SP se necessário
        // Mas a comparação com o banco (que é UTC) precisa ser precisa:
        const agora = new Date();

        const [totalVeiculos, manutencaoCount, viagensAgora] = await Promise.all([
            prisma.veiculo.count(),
            prisma.veiculo.count({ where: { emManutencao: true } }),
            // CONTAGEM REAL: Veículos que têm agendamento aprovado/pendente 
            // onde o horário atual está entre a saída e o retorno
            prisma.agendamento.count({
                where: {
                    status: { in: ['APROVADO', 'PENDENTE'] },
                    dataSaida: { lte: agora },
                    dataRetorno: { gte: agora }
                }
            })
        ]);

        // A lógica do card: Total - Oficina - Quem está na rua agora
        const disponiveis = totalVeiculos - manutencaoCount - viagensAgora;

        return {
            cards: {
                totalVeiculos,
                agendamentosHoje: viagensAgora, // Mostra quantas viagens ocorrem AGORA
                manutencaoUrgente: manutencaoCount,
                veiculosDisponiveis: disponiveis < 0 ? 0 : disponiveis
            }
        };
    } catch (err) {
        return reply.status(401).send({ message: 'Acesso negado' });
    }
});

// --- SECRETARIAS ---
fastify.get('/api/secretarias', async (request, reply) => {
    try {
        await request.jwtVerify();
        return await prisma.secretaria.findMany();
    } catch (err) {
        return reply.status(401).send({ message: 'Não autorizado' });
    }
});

fastify.post('/api/secretarias', async (request, reply) => {
    try {
        await request.jwtVerify();
        const { nome } = request.body as any;
        return await prisma.secretaria.create({ data: { nome: String(nome) } });
    } catch (err) {
        return reply.status(500).send({ message: 'Erro ao criar secretaria' });
    }
});

// --- DEPARTAMENTOS ---
fastify.get('/api/departamentos', async (request, reply) => {
    await request.jwtVerify();
    return await prisma.departamento.findMany({
        where: { ativo: true },
        include: { secretaria: true }
    });
});

fastify.post('/api/departamentos', async (request, reply) => {
    try {
        await request.jwtVerify();
        const { nome, secretariaId } = request.body as any;
        return await prisma.departamento.create({
            data: {
                nome: String(nome),
                secretaria: { connect: { id: Number(secretariaId) } }
            }
        });
    } catch (err) {
        return reply.status(500).send({ message: 'Erro ao cadastrar departamento' });
    }
});

fastify.delete('/api/departamentos/:id', async (request, reply) => {
    try {
        await request.jwtVerify();
        const { id } = request.params as any;
        await prisma.departamento.update({
            where: { id: Number(id) },
            data: { ativo: false }
        });
        return { message: 'Departamento desativado' };
    } catch (err) {
        return reply.status(500).send({ message: 'Erro ao desativar' });
    }
});

// --- SOLICITANTES ---
fastify.get('/api/solicitantes', async (request, reply) => {
    try {
        await request.jwtVerify();
        return await prisma.solicitante.findMany({ include: { secretaria: true } });
    } catch (err) {
        return reply.status(500).send({ message: 'Erro ao buscar solicitantes' });
    }
});


// --- SOLICITANTES (Ajustado para aceitar Externos) ---
// --- SALVAR SOLICITANTE (Vinculando ao Departamento) ---
fastify.post('/api/solicitantes', async (request, reply) => {
    try {
        await request.jwtVerify();
        const { nome, documento, telefone, secretariaId, departamentoId } = request.body as any;

        return await prisma.solicitante.create({
            data: {
                nome,
                documento,
                telefone,
                // Se for externo, secretaria e departamento podem ser null
                secretariaId: secretariaId ? Number(secretariaId) : null,
                departamentoId: departamentoId ? Number(departamentoId) : null
            }
        });
    } catch (err) {
        return reply.status(500).send({ message: 'Erro ao cadastrar solicitante' });
    }
});

// --- VEÍCULOS ---
// 1. Rota completa para a TABELA de gestão (Aba Veículos)
fastify.get('/api/veiculos', async (request, reply) => {
    try {
        await request.jwtVerify();
        // Retorna todos para que você possa EDITAR na aba de veículos
        return await prisma.veiculo.findMany({
            include: { secretaria: true },
            orderBy: { modelo: 'asc' }
        });
    } catch (err) {
        return reply.status(401).send({ message: 'Acesso negado' });
    }
});

// 2. Rota filtrada apenas para o SELECT do agendamento (Modal Agendamento)
fastify.get('/api/veiculos/disponiveis', async (request, reply) => {
    try {
        await request.jwtVerify();
        // Retorna apenas os que NÃO estão em manutenção
        return await prisma.veiculo.findMany({
            where: { emManutencao: false },
            orderBy: { modelo: 'asc' }
        });
    } catch (err) {
        return reply.status(500).send({ message: 'Erro ao buscar veículos' });
    }
});

fastify.post('/api/veiculos', async (request, reply) => {
    try {
        await request.jwtVerify();
        const { modelo, placa, capacidade, tipo, kmAtual, emManutencao } = request.body as any;
        return await prisma.veiculo.create({
            data: {
                modelo: String(modelo),
                placa: String(placa),
                capacidade: Number(capacidade),
                tipo: String(tipo),
                kmAtual: kmAtual ? Number(kmAtual) : 0,
                emManutencao: Boolean(emManutencao),
                status: 'DISPONIVEL'
            }
        });
    } catch (err) {
        return reply.status(500).send({ message: 'Erro interno ao salvar' });
    }
});

fastify.put('/api/veiculos/:id', async (request, reply) => {
    try {
        await request.jwtVerify();
        const { id } = request.params as any;
        const { modelo, placa, capacidade, tipo, kmAtual, emManutencao, status } = request.body as any;
        return await prisma.veiculo.update({
            where: { id: Number(id) },
            data: {
                modelo: modelo ? String(modelo) : undefined,
                placa: placa ? String(placa) : undefined,
                capacidade: capacidade ? Number(capacidade) : undefined,
                tipo: tipo ? String(tipo) : undefined,
                kmAtual: kmAtual !== undefined ? Number(kmAtual) : undefined,
                emManutencao: emManutencao !== undefined ? Boolean(emManutencao) : undefined,
                status: status // Opcional, já que o front calcula, mas bom manter
            }
        });
    } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({ message: 'Erro ao atualizar veículo' });
    }
});

// --- CONDUTORES ---
fastify.get('/api/condutores', async (request, reply) => {
    await request.jwtVerify();
    return await prisma.condutor.findMany();
});

fastify.post('/api/condutores', async (request, reply) => {
    await request.jwtVerify();
    const { nome, cnh } = request.body as any;
    return await prisma.condutor.create({ data: { nome, cnh } });
});

// --- LISTAR AGENDAMENTOS (Com a nova hierarquia) ---

fastify.get('/api/agendamentos', async (request, reply) => {
    try {
        await request.jwtVerify();
        return await prisma.agendamento.findMany({
            include: {
                solicitante: {
                    include: {
                        secretaria: true,
                        departamento: true // Agora o Prisma aceita isso!
                    }
                },
                veiculo: true,
                condutor: true
            },
            orderBy: { dataSaida: 'asc' }
        });
    } catch (err) {
        return reply.status(500).send({ message: 'Erro ao buscar agendamentos' });
    }
});

fastify.post('/api/agendamentos', async (request, reply) => {
    try {
        await request.jwtVerify();
        const { solicitanteId, veiculoId, condutorId, dataSaida, dataRetorno, itinerario, observacao, passageiros } = request.body as any;
        const inicio = new Date(dataSaida);
        const fim = new Date(dataRetorno);

        // 1. Verificar Manutenção (Mantido como estava)
        const veiculo = await prisma.veiculo.findUnique({ where: { id: Number(veiculoId) } });
        if (veiculo?.emManutencao) {
            return reply.status(400).send({ error: "Este veículo está em manutenção." });
        }

        // 2. Verificar Conflitos (Melhorado: Checa Veículo OU Motorista)
        const conflito = await prisma.agendamento.findFirst({
            where: {
                status: { in: ['PENDENTE', 'APROVADO'] }, // Viagens concluídas não geram conflito
                OR: [
                    { veiculoId: Number(veiculoId) },
                    { condutorId: Number(condutorId) }
                ],
                AND: [
                    { dataSaida: { lt: fim } },
                    { dataRetorno: { gt: inicio } }
                ]
            }
        });
        if (conflito) {
            const campo = conflito.veiculoId === Number(veiculoId) ? "veiculoId" : "condutorId";
            return reply.status(400).send({
                field: campo,
                message: `Este ${campo === 'veiculoId' ? 'veículo' : 'motorista'} já está ocupado.`
            });
        }
        //if (conflito) {
        //    const motivo = conflito.veiculoId === Number(veiculoId) ? "veículo" : "motorista";
        //    return reply.status(400).send({ error: `Conflito: Este ${motivo} já possui agendamento neste horário.` });
        //}

        // 3. Salvando (Mantido)
        return await prisma.agendamento.create({
            data: {
                dataSaida: inicio,
                dataRetorno: fim,
                itinerario,
                observacao,
                passageiros: Number(passageiros) || 1,
                status: "PENDENTE",
                solicitante: { connect: { id: Number(solicitanteId) } },
                veiculo: { connect: { id: Number(veiculoId) } },
                condutor: { connect: { id: Number(condutorId) } }
            }
        });
    } catch (err) {
        console.error(err);
        return reply.status(500).send({ message: 'Erro ao criar agendamento' });
    }
});

fastify.put('/api/agendamentos/:id', async (request, reply) => {
    try {
        await request.jwtVerify();
        const { id } = request.params as { id: string };
        const { status } = request.body as { status: string };

        if (!status) return reply.status(400).send({ message: 'O status não foi enviado' });

        const statusValidado = normalizarParaEnum(status);

        // REGRA DE OURO: Se for aprovar, checa se o carro/motorista ainda estão livres
        if (statusValidado === 'APROVADO') {
            const atual = await prisma.agendamento.findUnique({ where: { id: Number(id) } });

            if (atual) {
                const conflito = await prisma.agendamento.findFirst({
                    where: {
                        id: { not: Number(id) }, // Não checar o próprio registro
                        status: 'APROVADO',
                        OR: [
                            { veiculoId: atual.veiculoId },
                            { condutorId: atual.condutorId }
                        ],
                        AND: [
                            { dataSaida: { lt: atual.dataRetorno } },
                            { dataRetorno: { gt: atual.dataSaida } }
                        ]
                    }
                });

                if (conflito) {
                    return reply.status(400).send({ message: 'Não é possível aprovar: Conflito de horário detectado.' });
                }
            }
        }

        const atualizado = await prisma.agendamento.update({
            where: { id: Number(id) },
            data: { status: statusValidado as any }
        });

        return atualizado;
    } catch (err: any) {
        console.error("Erro ao atualizar agendamento:", err.message);
        return reply.status(500).send({ message: 'Erro ao atualizar no banco', error: err.message });
    }
});

// 1. Esta função limpa o texto (remove acentos e deixa em maiúsculo)
function normalizarParaEnum (texto: string) {
    return texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toUpperCase();
}

// --- INICIAR SERVIDOR ---
try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
} catch (err) {
    fastify.log.error(err);
    process.exit(1);
}