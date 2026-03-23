const token = localStorage.getItem('token_frota');
const API = 'http://localhost:3000/api';
if (!token) window.location.href = 'index.html';

let veiculoSendoEditadoId = null;

// --- NAVEGAÇÃO & SIDEBAR ---
function toggleSidebar () { document.getElementById('sidebar').classList.toggle('sidebar-fechada'); }

function trocarAba (idAba, btn) {
    document.querySelectorAll('.aba-conteudo').forEach(a => a.classList.remove('aba-ativa'));
    document.querySelectorAll('.btn-menu').forEach(b => b.classList.remove('bg-slate-700', 'font-bold'));

    const abaAlvo = document.getElementById(idAba);
    if (abaAlvo) abaAlvo.classList.add('aba-ativa');
    if (btn) btn.classList.add('bg-slate-700', 'font-bold');

    const containerAcoes = document.getElementById('container-acoes-header');
    const tituloPg = document.getElementById('titulo-pagina');

    if (idAba === 'aba-dashboard') {
        tituloPg.innerText = '📊 Painel Geral';
        containerAcoes.innerHTML = '';
        carregarStats();
    } else if (idAba === 'aba-agendamentos') {
        tituloPg.innerText = '📅 Agendamentos';
        containerAcoes.innerHTML = '<button onclick="abrirModalAgendamento()" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md">+ Agendar</button>';
        carregarAgendamentos();
    } else if (idAba === 'aba-secretarias') {
        tituloPg.innerText = '🏢 Secretarias';
        containerAcoes.innerHTML = '<button onclick="abrirModalSecretaria()" class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md">+ Nova Secretaria</button>';
        carregarSecretarias();
    } else if (idAba === 'aba-departamentos') {
        tituloPg.innerText = '🏢 Departamentos';
        containerAcoes.innerHTML = '<button onclick="abrirModalDepto()" class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md">+ Novo Departamento</button>';
        carregarDepartamentos();
    } else if (idAba === 'aba-veiculos') {
        tituloPg.innerText = '🚘 Veículos';
        containerAcoes.innerHTML = '<button onclick="abrirModalVeiculo()" class="bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md">+ Novo Veículo</button>';
        carregarVeiculos();
    } else if (idAba === 'aba-solicitantes') {
        tituloPg.innerText = '👥 Solicitantes';
        containerAcoes.innerHTML = '<button onclick="abrirModalSolicitante()" class="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md">+ Novo Solicitante</button>';
        carregarSolicitantes();
    } else if (idAba === 'aba-condutores') {
        tituloPg.innerText = '🪪 Condutores';
        containerAcoes.innerHTML = '<button onclick="abrirModalCondutor()" class="bg-orange-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md">+ Novo Motorista</button>';
        carregarCondutores();
    }
}

// --- NOTIFICAÇÕES & VALIDAÇÃO VISUAL ---
function mostrarNotificacao (mensagem, tipo = 'sucesso') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const cores = { sucesso: 'bg-green-600', erro: 'bg-red-600', aviso: 'bg-yellow-500' };

    toast.className = `${cores[tipo]} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 transform translate-x-full transition-all duration-300 opacity-0 font-bold text-sm`;
    toast.innerHTML = `<span>${tipo === 'sucesso' ? '✅' : '❌'}</span><span>${mensagem}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.remove('translate-x-full', 'opacity-0'), 100);
    setTimeout(() => {
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function setErroCampo (idCampo, mensagem = "", temErro = true) {
    const campo = document.getElementById(idCampo);
    const labelErro = document.getElementById(`erro-${idCampo}`);
    if (temErro) {
        campo.classList.add('border-red-500', 'bg-red-50');
        if (labelErro) { labelErro.innerText = mensagem; labelErro.classList.remove('hidden'); }
    } else {
        campo.classList.remove('border-red-500', 'bg-red-50');
        if (labelErro) labelErro.classList.add('hidden');
    }
}

// --- VEÍCULOS ---
function abrirModalVeiculo (dados = null) {
    veiculoSendoEditadoId = dados ? dados.id : null;

    // Limpa erros visuais ao abrir
    if (typeof setErroCampo === 'function') setErroCampo('veiPlaca', '', false);

    if (dados) {
        document.getElementById('veiModelo').value = dados.modelo;
        // Mostra a placa formatada no input ao editar
        document.getElementById('veiPlaca').value = formatarPlaca(dados.placa);
        document.getElementById('veiCapacidade').value = dados.capacidade;
        document.getElementById('veiTipo').value = dados.tipo;
        document.getElementById('veiKm').value = dados.kmAtual || 0;
        document.getElementById('veiManutencao').checked = dados.emManutencao || false;

        // Ajusta o Radio Button conforme o tipo da placa que veio do banco
        const ehCinza = dados.placa.replace("-", "").match(/^[A-Z]{3}[0-9]{4}$/);
        const radio = document.querySelector(`input[name="tipoPlaca"][value="${ehCinza ? 'CINZA' : 'MERC'}"]`);
        if (radio) radio.checked = true;

    } else {
        document.getElementById('formVeiculo').reset();
    }
    document.getElementById('modalVeiculo').classList.remove('hidden');
}

async function carregarVeiculos () {
    const [resV, resA] = await Promise.all([
        fetch(`${API}/veiculos`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API}/agendamentos`, { headers: { 'Authorization': `Bearer ${token}` } })
    ]);

    const veiculos = await resV.json();
    const agendamentos = await resA.json();
    const agora = new Date();

    document.getElementById('tabelaVeiculos').innerHTML = veiculos.map(v => {
        let statusCalculado = "DISPONÍVEL";
        let corStatus = "bg-emerald-100 text-emerald-700";

        const emViagem = agendamentos.find(a =>
            a.veiculoId === v.id &&
            a.status !== 'CONCLUÍDO' &&
            a.status !== 'CANCELADO' &&
            agora >= new Date(a.dataSaida) &&
            agora <= new Date(a.dataRetorno)
        );

        // --- LÓGICA DE CORES DO TAILWIND ---
        // Se v.emManutencao for true, aplicamos um fundo cinza e opacidade.
        // Se for false, usamos o branco com hover normal.
        const estiloLinha = v.emManutencao
            ? 'bg-slate-100 opacity-60 grayscale-[0.5]'
            : 'bg-white hover:bg-slate-50';

        if (v.emManutencao) {
            statusCalculado = "MANUTENÇÃO";
            corStatus = "bg-red-100 text-red-700";
        } else if (emViagem) {
            statusCalculado = "EM VIAGEM";
            corStatus = "bg-blue-100 text-blue-700";
        }

        return `
            <tr class="border-b transition-all ${estiloLinha}">
                <td class="p-4">
                    <div class="font-bold text-slate-800">${v.modelo}</div>
                    <div class="text-[10px] text-slate-400 font-black uppercase">${v.tipo}</div>
                </td>
                <td class="p-4 text-center font-mono font-bold text-slate-600 italic">
                    ${formatarPlaca(v.placa)}
                </td>
                <td class="p-4 text-center font-bold">
                    ${v.capacidade} <span class="text-[10px] text-slate-400 font-normal">lugares</span>
                </td>
                <td class="p-4 text-center font-mono text-xs text-slate-500">
                    ${v.kmAtual || 0} <span class="text-[10px]">KM</span>
                </td>
                <td class="p-4">
                    <span class="px-2 py-1 rounded-lg text-[10px] font-black uppercase shadow-sm ${corStatus}">
                        ${statusCalculado}
                    </span>
                </td>
                <td class="p-4 text-right">
                    <button onclick='abrirModalVeiculo(${JSON.stringify(v)})' 
                            class="text-blue-600 font-black hover:underline text-xs tracking-tighter">
                        EDITAR
                    </button>
                </td>
            </tr>`;
    }).join('');
}

document.getElementById('formVeiculo').onsubmit = async (e) => {
    e.preventDefault();

    // --- NOVA VALIDAÇÃO DE PLACA ---
    const campoPlaca = document.getElementById('veiPlaca');
    const placaLimpa = campoPlaca.value.replace("-", ""); // Tira o hífen para validar
    const tipoRadio = document.querySelector('input[name="tipoPlaca"]:checked');
    const tipoSelecionado = tipoRadio ? tipoRadio.value : 'CINZA';

    const regexCinza = /^[A-Z]{3}[0-9]{4}$/;
    const regexMercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

    // Limpa qualquer erro anterior antes de validar de novo
    setErroCampo('veiPlaca', '', false);

    if (tipoSelecionado === 'CINZA' && !regexCinza.test(placaLimpa)) {
        setErroCampo('veiPlaca', 'Formato incorreto para placa Cinza (Ex: AAA-0000)');
        return; // Para o envio
    }

    if (tipoSelecionado === 'MERC' && !regexMercosul.test(placaLimpa)) {
        setErroCampo('veiPlaca', 'Formato incorreto para placa Mercosul (Ex: AAA1A11)');
        return; // Para o envio
    }

    // -------------------------------

    const payload = {
        modelo: document.getElementById('veiModelo').value,
        placa: placaLimpa, // Salva sempre limpo no banco
        capacidade: Number(document.getElementById('veiCapacidade').value),
        kmAtual: Number(document.getElementById('veiKm').value),
        emManutencao: document.getElementById('veiManutencao').checked, // TRUE ou FALSE
        tipo: document.getElementById('veiTipo').value
    };

    const method = veiculoSendoEditadoId ? 'PUT' : 'POST';
    const url = veiculoSendoEditadoId ? `${API}/veiculos/${veiculoSendoEditadoId}` : `${API}/veiculos`;

    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        mostrarNotificacao("Veículo salvo!", "sucesso");
        fecharModal('modalVeiculo');
        carregarVeiculos();
        carregarStats();
    }
};

// --- FUNÇÕES DE APOIO DA PLACA (Copie e cole abaixo) ---

function ajustarPlaceholderPlaca () {
    const input = document.getElementById('veiPlaca');
    const tipo = document.querySelector('input[name="tipoPlaca"]:checked').value;
    input.value = "";
    input.placeholder = (tipo === 'CINZA') ? "ABC-1234" : "ABC1D23";
}

document.getElementById('veiPlaca').addEventListener('input', e => {
    const radio = document.querySelector('input[name="tipoPlaca"]:checked');
    const tipo = radio ? radio.value : 'CINZA';
    let v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 7);
    if (tipo === 'CINZA' && v.length > 3) v = v.substring(0, 3) + "-" + v.substring(3);
    e.target.value = v;
});

function formatarPlaca (p) {
    if (!p) return '---';
    const l = p.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (l.match(/^[A-Z]{3}[0-9]{4}$/)) return l.substring(0, 3) + "-" + l.substring(3);
    return l;
}

// --- DEPARTAMENTOS ---
async function abrirModalDepto () {
    document.getElementById('modalDepto').classList.remove('hidden');
    const res = await fetch(`${API}/secretarias`, { headers: { 'Authorization': `Bearer ${token}` } });
    const secretarias = await res.json();
    const select = document.getElementById('deptoSecretaria');
    select.innerHTML = '<option value="">Selecione a Secretaria...</option>' +
        secretarias.map(sec => `<option value="${sec.id}">${sec.nome}</option>`).join('');
}

document.getElementById('formDepto').onsubmit = async (e) => {
    e.preventDefault();
    const payload = {
        nome: document.getElementById('deptoNome').value,
        secretariaId: Number(document.getElementById('deptoSecretaria').value)
    };
    const res = await fetch(`${API}/departamentos`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
    });
    if (res.ok) {
        mostrarNotificacao("Departamento criado!", "sucesso");
        fecharModal('modalDepto'); document.getElementById('formDepto').reset(); carregarDepartamentos();
    } else { mostrarNotificacao("Erro ao cadastrar.", "erro"); }
};

async function carregarDepartamentos () {
    const res = await fetch(`${API}/departamentos`, { headers: { 'Authorization': `Bearer ${token}` } });
    const departamentos = await res.json();
    const lista = document.getElementById('listaDepartamentos');
    if (departamentos.length === 0) {
        lista.innerHTML = '<tr><td colspan="3" class="p-10 text-center text-slate-400">Nenhum depto cadastrado.</td></tr>';
        return;
    }
    lista.innerHTML = departamentos.map(d => `
        <tr class="border-b border-slate-100 hover:bg-slate-50">
            <td class="p-4 font-medium">${d.nome}</td>
            <td class="p-4"><span class="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold uppercase">${d.secretaria?.nome || 'Não vinculada'}</span></td>
            <td class="p-4 text-right"><button onclick="excluirDepartamento(${d.id})" class="text-red-500 hover:text-red-700">Excluir</button></td>
        </tr>`).join('');
}

async function excluirDepartamento (id) {
    if (!confirm("Remover este departamento?")) return;
    const res = await fetch(`${API}/departamentos/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) { mostrarNotificacao("Excluído com sucesso"); carregarDepartamentos(); }
    else { mostrarNotificacao("Erro: Possui vínculos ativos", "erro"); }
}

// --- SECRETARIAS ---
function abrirModalSecretaria () { document.getElementById('modalSecretaria').classList.remove('hidden'); }
async function carregarSecretarias () {
    const res = await fetch(`${API}/secretarias`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    document.getElementById('tabelaSecretarias').innerHTML = data.map(s => `<tr class="border-b"><td class="p-4 font-bold">${s.nome}</td></tr>`).join('');
}
document.getElementById('formSecretaria').onsubmit = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}/secretarias`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nome: document.getElementById('secNome').value })
    });
    if (res.ok) {
        mostrarNotificacao("Secretaria salva!");
        fecharModal('modalSecretaria'); carregarSecretarias(); carregarStats(); document.getElementById('formSecretaria').reset();
    }
};

// --- SOLICITANTES ---
async function abrirModalSolicitante () {
    const [resSec, resDep] = await Promise.all([
        fetch(`${API}/secretarias`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API}/departamentos`, { headers: { 'Authorization': `Bearer ${token}` } })
    ]);
    const secretarias = await resSec.json();
    const departamentos = await resDep.json();
    document.getElementById('solSecretaria').innerHTML = '<option value="">Selecione a Secretaria...</option>' + secretarias.map(s => `<option value="${s.id}">${s.nome}</option>`).join('');
    document.getElementById('solDepartamento').innerHTML = '<option value="">Selecione o Departamento...</option>' + departamentos.map(d => `<option value="${d.id}">${d.nome}</option>`).join('');
    document.getElementById('modalSolicitante').classList.remove('hidden');
}

async function carregarSolicitantes () {
    const res = await fetch(`${API}/solicitantes`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    document.getElementById('tabelaSolicitantes').innerHTML = data.map(s => `
        <tr class="hover:bg-slate-50 border-b">
            <td class="p-4 font-bold">${s.nome}</td>
            <td class="p-4 font-mono text-xs">${formatarDocumento(s.documento)}</td>
            <td class="p-4 text-[10px] font-bold uppercase">${s.departamento?.nome || s.secretaria?.nome || 'EXTERNO'}</td>
            <td class="p-4 text-xs">${formatarTelefone(s.telefone)}</td>
            <td class="p-4 text-right"><button onclick="excluirSolicitante(${s.id})" class="text-red-500">Excluir</button></td>
        </tr>`).join('');
}

document.getElementById('formSolicitante').onsubmit = async (e) => {
    e.preventDefault();
    setErroCampo('solDoc', '', false);
    setErroCampo('solNome', '', false);

    const docRaw = document.getElementById('solDoc').value;
    const docLimpo = docRaw.replace(/\D/g, "");
    const nome = document.getElementById('solNome').value;
    const tipoDoc = document.querySelector('input[name="tipoDoc"]:checked').value;

    if (nome.length < 3) { setErroCampo('solNome', 'Nome muito curto.'); return; }
    if (tipoDoc === 'CPF' && !validarCPF(docLimpo)) { setErroCampo('solDoc', 'CPF Inválido.'); return; }

    const payload = {
        nome, documento: docLimpo,
        telefone: document.getElementById('solTelefone').value.replace(/\D/g, ""),
        secretariaId: document.getElementById('solSecretaria').value ? Number(document.getElementById('solSecretaria').value) : null,
        departamentoId: document.getElementById('solDepartamento').value ? Number(document.getElementById('solDepartamento').value) : null
    };

    const res = await fetch(`${API}/solicitantes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        mostrarNotificacao("Solicitante cadastrado!");
        fecharModal('modalSolicitante'); carregarSolicitantes(); document.getElementById('formSolicitante').reset();
    } else {
        const erro = await res.json();
        if (res.status === 400) setErroCampo('solDoc', 'Documento já cadastrado.');
        else mostrarNotificacao("Erro ao salvar.", "erro");
    }
};

// --- AGENDAMENTOS ---
async function abrirModalAgendamento () {
    const [resSol, resVei, resCon] = await Promise.all([
        fetch(`${API}/solicitantes`, { headers: { 'Authorization': `Bearer ${token}` } }),
        // ATENÇÃO: Mudamos para /veiculos/disponiveis aqui!
        fetch(`${API}/veiculos/disponiveis`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API}/condutores`, { headers: { 'Authorization': `Bearer ${token}` } })
    ]);

    const solicitantes = await resSol.json();
    const veiculos = await resVei.json();
    const condutores = await resCon.json();

    document.getElementById('ageSolicitante').innerHTML = '<option value="">Solicitante...</option>' + solicitantes.map(s => `<option value="${s.id}">${s.nome}</option>`).join('');
    document.getElementById('ageVeiculo').innerHTML = '<option value="">Veículo...</option>' + veiculos.map(v => `<option value="${v.id}">${v.modelo} - ${v.placa}</option>`).join('');
    document.getElementById('ageCondutor').innerHTML = '<option value="">Motorista...</option>' + condutores.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');

    // --- LÓGICA DE TRAVA DE DATA ---
    const inputSaida = document.getElementById('ageData');
    const inputRetorno = document.getElementById('ageRetorno');

    // Ajuste para pegar o horário LOCAL (Brasília) em vez de UTC
    const agora = new Date();
    agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
    const agoraIso = agora.toISOString().slice(0, 16);
    inputSaida.min = agoraIso; // Agora o "mínimo" será 11:20 e não 14:20

    inputSaida.onchange = () => {
        // O retorno não pode ser antes da saída
        inputRetorno.min = inputSaida.value;
        if (inputRetorno.value && inputRetorno.value < inputSaida.value) {
            inputRetorno.value = inputSaida.value;
            mostrarNotificacao("A data de retorno foi ajustada automaticamente.", "aviso");
        }
    };

    document.getElementById('modalAgendamento').classList.remove('hidden');
}

async function carregarAgendamentos () {
    const res = await fetch(`${API}/agendamentos`, { headers: { 'Authorization': `Bearer ${token}` } });
    const dados = await res.json();
    const agora = new Date();

    document.getElementById('tabelaAgendamentos').innerHTML = dados.map(a => {
        const dataSaida = new Date(a.dataSaida);
        const dataRetorno = new Date(a.dataRetorno);

        // Verifica se a viagem está atrasada (Passou do tempo e não foi concluída)
        const estaAtrasado = agora > dataRetorno && (a.status === 'PENDENTE' || a.status === 'APROVADO');

        const s = dataSaida.toLocaleString('pt-BR');
        const r = dataRetorno.toLocaleString('pt-BR');

        let origem = a.solicitante?.departamento?.nome || a.solicitante?.secretaria?.nome || "EXTERNO";

        return `
            <tr class="hover:bg-slate-50 border-b ${estaAtrasado ? 'bg-red-50' : ''}">
                <td class="p-2 text-[10px] leading-tight">
                    <span class="text-blue-600 font-bold">S:</span> ${s}<br>
                    <span class="${estaAtrasado ? 'text-red-600 font-black animate-pulse' : 'text-slate-600'} font-bold">R: ${r}</span>
                </td>
                <td class="p-2 font-bold text-xs uppercase">${a.itinerario}</td>
                <td class="p-2">
                    <div class="font-bold text-xs">${a.solicitante?.nome}</div>
                    <div class="text-[9px] text-indigo-600 font-bold uppercase">${origem}</div>
                </td>
                <td class="p-2 text-xs">${a.condutor?.nome}</td>
                <td class="p-2 text-xs"><b>${a.veiculo?.modelo}</b><br><span class="text-[10px] text-slate-400">${a.veiculo?.placa}</span></td>
                <td class="p-2 text-center font-bold">${a.passageiros}</td>
                <td class="p-2 text-center">
                    <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${estaAtrasado ? 'bg-red-600 text-white' : corStatus(a.status)}">
                        ${estaAtrasado ? 'ATRASADO' : a.status}
                    </span>
                </td>
                <td class="p-2 text-right flex flex-col gap-1 items-end">
                    ${(a.status === 'PENDENTE' || a.status === 'APROVADO') ? `
                        <button onclick="finalizarViagem(${a.id})" 
                                class="bg-emerald-600 text-white px-2 py-1 rounded text-[9px] font-black hover:bg-emerald-700 shadow-sm">
                            CHEGOU
                        </button>
                    ` : ''}
                    <button onclick="excluirAgendamento(${a.id})" 
                            class="text-red-500 font-bold text-[10px] hover:underline">
                        EXCLUIR
                    </button>
                </td>
            </tr>`;
    }).join('');
}

document.getElementById('formAgendamento').onsubmit = async (e) => {
    e.preventDefault();

    // 1. Limpar erros visuais de tentativas anteriores
    setErroCampo('ageVeiculo', '', false);
    setErroCampo('ageCondutor', '', false);
    setErroCampo('ageData', '', false);

    const payload = {
        solicitanteId: Number(document.getElementById('ageSolicitante').value),
        veiculoId: Number(document.getElementById('ageVeiculo').value),
        condutorId: Number(document.getElementById('ageCondutor').value),
        dataSaida: document.getElementById('ageData').value,
        dataRetorno: document.getElementById('ageRetorno').value,
        passageiros: Number(document.getElementById('agePassageiros').value),
        itinerario: document.getElementById('ageItinerario').value,
        observacao: document.getElementById('ageObs').value
    };

    // Validação simples antes de enviar
    if (!payload.solicitanteId || !payload.veiculoId || !payload.condutorId) {
        mostrarNotificacao("Preencha todos os campos obrigatórios", "aviso");
        return;
    }

    try {
        const res = await fetch(`${API}/agendamentos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok) {
            mostrarNotificacao("Agendado com sucesso!", "sucesso");
            fecharModal('modalAgendamento');
            carregarAgendamentos();
            carregarStats();
            document.getElementById('formAgendamento').reset();
        } else {
            // --- AQUI ESTÁ A MÁGICA DO FEEDBACK VISUAL ---

            // Se o erro for de conflito (400), o Back-end envia qual campo falhou
            if (res.status === 400 && data.field) {
                // Mapeia o nome que vem do banco para o ID do seu HTML
                const mapaCampos = {
                    'veiculoId': 'ageVeiculo',
                    'condutorId': 'ageCondutor'
                };

                const idHtml = mapaCampos[data.field];
                setErroCampo(idHtml, data.error || data.message, true);
                mostrarNotificacao(data.error || data.message, "erro");
            } else {
                mostrarNotificacao(data.error || data.message || "Erro ao agendar", "erro");
            }
        }
    } catch (err) {
        mostrarNotificacao("Falha na conexão com o servidor", "erro");
    }
};

async function finalizarViagem (id) {
    if (!confirm("Confirmar o retorno deste veículo ao pátio?")) return;

    const res = await fetch(`${API}/agendamentos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'CONCLUÍDO' })
    });

    if (res.ok) {
        mostrarNotificacao("Viagem finalizada e veículo liberado!");
        carregarAgendamentos();
        carregarStats(); // Atualiza os cards do dashboard na hora
    } else {
        mostrarNotificacao("Erro ao finalizar viagem.", "erro");
    }
}

// --- CONDUTORES ---
function abrirModalCondutor () { document.getElementById('formCondutor').reset(); document.getElementById('modalCondutor').classList.remove('hidden'); }
async function carregarCondutores () {
    const res = await fetch(`${API}/condutores`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    document.getElementById('tabelaCondutores').innerHTML = data.map(c => `
        <tr class="hover:bg-slate-50"><td class="p-4 font-bold">${c.nome}</td><td class="p-4 font-mono">${c.cnh}</td><td class="p-4"><button class="text-orange-600 font-bold text-xs">EDITAR</button></td></tr>`).join('') || '<tr><td colspan="3" class="p-10 text-center text-slate-400">Nenhum motorista.</td></tr>';
}
document.getElementById('formCondutor').onsubmit = async (e) => {
    e.preventDefault();
    const payload = { nome: document.getElementById('conNome').value, cnh: document.getElementById('conCnh').value };
    const res = await fetch(`${API}/condutores`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
    });
    if (res.ok) { mostrarNotificacao("Motorista salvo!"); fecharModal('modalCondutor'); carregarCondutores(); }
};
// --- AUXILIARES & DASHBOARD CARDS ---
async function carregarStats () {
    try {
        const res = await fetch(`${API}/dashboard/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.cards) {
            document.getElementById('totalVeiculos').innerText = data.cards.totalVeiculos;
            document.getElementById('totalAgendamentos').innerText = data.cards.agendamentosHoje;
            document.getElementById('manutencaoUrgente').innerText = data.cards.manutencaoUrgente;

            // AGORA usamos o valor calculado pelo Back-end que considera as viagens
            document.getElementById('veiculosDisponiveis').innerText = data.cards.veiculosDisponiveis;
        }
    } catch (e) {
        console.error("Erro ao carregar stats", e);
    }
}

function corStatus (s) {
    const c = { 'PENDENTE': 'bg-yellow-100 text-yellow-700', 'APROVADO': 'bg-green-100 text-green-700', 'NEGADO': 'bg-red-100 text-red-700', 'CONCLUIDO': 'bg-gray-100 text-gray-700' };
    return c[s] || 'bg-gray-100';
}

function fecharModal (id) { document.getElementById(id).classList.add('hidden'); }
function logout () { localStorage.removeItem('token_frota'); window.location.href = 'index.html'; }

// Máscaras
function ajustarMascaraDoc () {
    const input = document.getElementById('solDoc');
    const tipo = document.querySelector('input[name="tipoDoc"]:checked').value;
    input.value = "";
    input.maxLength = tipo === 'CPF' ? 14 : 8;
    input.placeholder = tipo === 'CPF' ? "000.000.000-00" : "Matrícula";
}

document.getElementById('solDoc').addEventListener('input', e => {
    const tipo = document.querySelector('input[name="tipoDoc"]:checked').value;
    let v = e.target.value.replace(/\D/g, "");
    if (tipo === 'CPF') {
        v = v.substring(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else v = v.substring(0, 8);
    e.target.value = v;
});
//------Calculo mascara telefone e celular
document.getElementById('solTelefone').addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g, ""); // Remove tudo que não é número
    v = v.substring(0, 11); // Limita ao máximo de 11 dígitos

    if (v.length > 0) v = "(" + v;
    if (v.length > 3) v = v.substring(0, 3) + ") " + v.substring(3);

    if (v.length > 9) {
        // Se tiver 11 dígitos (Celular), o traço vai após o 5º número do corpo
        // Se tiver 10 dígitos (Fixo), o traço vai após o 4º número do corpo
        if (v.length === 11) {
            // Formato Fixo: (11) 3333-4444
            v = v.substring(0, 9) + "-" + v.substring(9);
        } else {
            // Formato Celular: (11) 99999-9999
            v = v.substring(0, 10) + "-" + v.substring(10);
        }
    }
    e.target.value = v;
});

//Formatação Telefone

function formatarTelefone (t) {
    if (!t) return '---';
    const v = t.replace(/\D/g, ""); // Limpa qualquer sujeira

    if (v.length === 11) {
        // Celular: (11) 99999-9999
        return v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    } else if (v.length === 10) {
        // Fixo: (11) 3333-4444
        return v.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    return t; // Retorna original se for um formato desconhecido
}

//------Fromatação CPF-----

function formatarDocumento (d) { return (d && d.length === 11) ? d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : d; }
function validarCPF (c) {
    if (c.length !== 11 || !!c.match(/(\d)\1{10}/)) return false;
    let s = 0, r;
    for (let i = 1; i <= 9; i++) s += parseInt(c[i - 1]) * (11 - i);
    r = (s * 10) % 11; if (r >= 10) r = 0;
    if (r !== parseInt(c[9])) return false;
    s = 0;
    for (let i = 1; i <= 10; i++) s += parseInt(c[i - 1]) * (12 - i);
    r = (s * 10) % 11; if (r >= 10) r = 0;
    return r === parseInt(c[10]);
}

window.onload = () => trocarAba('aba-dashboard', document.querySelector('.btn-menu'));