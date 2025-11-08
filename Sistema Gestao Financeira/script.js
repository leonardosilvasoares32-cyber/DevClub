// ====================================================================
// CONFIGURAÇÃO INICIAL (V31 - ESTÁVEL: FILTRO DASHBOARD E TABELA PENDENTES CORRIGIDOS)
// ====================================================================
// Configuração do Supabase
const SUPABASE_URL = 'https://sbfxtoxykwtxiecibkcm.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiZnh0b3h5a3d0eGllY2lia2NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MDAyMDMsImV4cCI6MjA3NjA3NjIwM30.2uin5pLaRMK3JD4bdQBSbFJwrNAsG3j0ZZfXxoJmKUQ'; // Substitua pelo seu anon key REAL

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variáveis Globais
let todosLancamentos = [];
let todasCategorias = {}; 

// Variáveis para os Gráficos
let graficoMovimentacao;
let graficoDespesasCategoria; 

// Chaves do localStorage
const LS_FILTRO_LANCAMENTOS_KEY = 'financeAppFiltroLancamentosEstado'; 
const LS_ORDEM_KEY = 'financeAppOrdemEstado';
const LS_RELATORIO_MES_KEY = 'financeAppRelatorioMes'; 
const LS_FILTRO_DASHBOARD_MES_KEY = 'financeAppFiltroDashboardMes';

// ====================================================================
// VARIÁVEIS DE ESTADO E UTILIDADE
// ====================================================================

const DEFAULT_FILTRO_ESTADO = { // Estado padrão para Lançamentos Registrados
    tipo: '',
    categoria: '', 
    dataInicial: '',
    dataFinal: ''
};

const DEFAULT_ORDEM_ESTADO = {
    lancamentos: { column: 'data_transacao', direction: 'desc' },
    pendentes: { column: 'data_vencimento', direction: 'asc' }
};

let filtroLancamentosEstado = DEFAULT_FILTRO_ESTADO; 
let relatorioMes = getCurrentMonthYear(); 
let filtroDashboardMes = getCurrentMonthYear(); 


// Funções de utilidade 
function formatarMoeda(valor) {
    if (typeof valor !== 'number' || !isFinite(valor)) {
        return 'R$ 0,00';
    }
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(dataString) {
    if (!dataString) return '-';
    if (dataString.length > 10) {
        dataString = dataString.split('T')[0];
    }
    const [year, month, day] = dataString.split('-');
    if (!year || !month || !day) return dataString; 
    return `${day}/${month}/${year}`;
}

function toLowerSafe(str) {
    return (str || '').toString().toLowerCase();
}

function getCurrentMonthYear() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); 
    return `${year}-${month}`;
}


// ====================================================================
// FUNÇÕES DE PERSISTÊNCIA E INTERFACE
// ====================================================================

function loadState() {
    // 1. Filtro Lançamentos Registrados
    const filtroLancamentosString = localStorage.getItem(LS_FILTRO_LANCAMENTOS_KEY);
    if (filtroLancamentosString) {
        try {
            filtroLancamentosEstado = JSON.parse(filtroLancamentosString);
            if(document.getElementById('filtroTipo')) document.getElementById('filtroTipo').value = filtroLancamentosEstado.tipo || '';
            if(document.getElementById('filtroCategoria')) document.getElementById('filtroCategoria').value = filtroLancamentosEstado.categoria || '';
            if(document.getElementById('filtroDataInicial')) document.getElementById('filtroDataInicial').value = filtroLancamentosEstado.dataInicial || '';
            if(document.getElementById('filtroDataFinal')) document.getElementById('filtroDataFinal').value = filtroLancamentosEstado.dataFinal || '';
        } catch (e) {
            filtroLancamentosEstado = DEFAULT_FILTRO_ESTADO;
        }
    }
    
    // 2. Estado de Ordenação
    const ordemString = localStorage.getItem(LS_ORDEM_KEY);
    if (ordemString) {
        try {
            ordemEstado = Object.assign({}, DEFAULT_ORDEM_ESTADO, JSON.parse(ordemString));
        } catch (e) {
            ordemEstado = DEFAULT_ORDEM_ESTADO;
        }
    }
    
    // 3. Estado do Mês do Relatório
    const mesRelatorio = localStorage.getItem(LS_RELATORIO_MES_KEY);
    if (mesRelatorio) {
        relatorioMes = mesRelatorio;
    }
    
    // 4. Estado do Mês do Dashboard
    const mesDashboard = localStorage.getItem(LS_FILTRO_DASHBOARD_MES_KEY);
    if (mesDashboard) {
        filtroDashboardMes = mesDashboard;
    }
}

function saveState() {
    localStorage.setItem(LS_FILTRO_LANCAMENTOS_KEY, JSON.stringify(filtroLancamentosEstado));
    localStorage.setItem(LS_ORDEM_KEY, JSON.stringify(ordemEstado));
    localStorage.setItem(LS_RELATORIO_MES_KEY, relatorioMes);
    localStorage.setItem(LS_FILTRO_DASHBOARD_MES_KEY, filtroDashboardMes);
}

function mudarAba(idAba) {
    document.querySelectorAll('.aba-conteudo').forEach(aba => {
        aba.classList.add('oculto');
    });
    document.getElementById(idAba).classList.remove('oculto');

    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('ativa');
    });
    const btnAtivo = document.querySelector(`.tab-button[onclick="mudarAba('${idAba}')"]`);
    if(btnAtivo) btnAtivo.classList.add('ativa');
    
    recarregarDadosComFiltro();
}

document.getElementById('status').addEventListener('change', function() {
    const dataVencimentoInput = document.getElementById('data_vencimento');
    dataVencimentoInput.disabled = this.value.toLowerCase() !== 'pendente';
    if (this.value.toLowerCase() !== 'pendente') {
        dataVencimentoInput.value = '';
    }
});

function abrirModal(lancamento) {
    // Busca o objeto completo
    const lancamentoCompleto = todosLancamentos.find(l => l.id === lancamento.id) || lancamento;

    document.getElementById('editId').value = lancamentoCompleto.id;
    document.getElementById('editTipo').value = lancamentoCompleto.tipo;
    document.getElementById('editDescricao').value = lancamentoCompleto.descricao;
    document.getElementById('editCategoria').value = lancamentoCompleto.categoria; 
    
    const valorParaExibir = typeof lancamentoCompleto.valor === 'number' ? lancamentoCompleto.valor.toFixed(2).replace('.', ',') : (lancamentoCompleto.valor || '0.00').replace('.', ',');
    document.getElementById('editValor').value = valorParaExibir;

    document.getElementById('editDataTransacao').value = lancamentoCompleto.data_transacao;
    document.getElementById('editStatus').value = lancamentoCompleto.status;
    document.getElementById('editDataVencimento').value = lancamentoCompleto.data_vencimento || '';
    
    const editDataVencimento = document.getElementById('editDataVencimento');
    const isPendente = toLowerSafe(lancamentoCompleto.status) === 'pendente';

    editDataVencimento.disabled = !isPendente;
    
    document.getElementById('editStatus').onchange = function() {
        const isNewStatusPendente = toLowerSafe(this.value) === 'pendente';
        editDataVencimento.disabled = !isNewStatusPendente;
        if (!isNewStatusPendente) {
            editDataVencimento.value = '';
        }
    };
    
    document.getElementById('modalEdicao').style.display = 'block';
}

function fecharModal() {
    document.getElementById('modalEdicao').style.display = 'none';
}


// ====================================================================
// FUNÇÕES DE ORDENAÇÃO
// ====================================================================

function aplicarOrdenacao(column, tableId) {
    const tableKey = tableId === 'tabelaLancamentos' ? 'lancamentos' : 'pendentes';
    let currentColumn = ordemEstado[tableKey].column;
    let currentDirection = ordemEstado[tableKey].direction;

    if (column === currentColumn) {
        ordemEstado[tableKey].direction = currentDirection === 'asc' ? 'desc' : 'asc';
    } else {
        ordemEstado[tableKey].column = column;
        if (column.includes('data_')) {
            ordemEstado[tableKey].direction = 'desc';
        } else {
            ordemEstado[tableKey].direction = 'asc';
        }
    }
    
    saveState();
    recarregarDadosComFiltro();
}

function atualizarIconesOrdenacao(tableId) {
    const tableKey = tableId === 'tabelaLancamentos' ? 'lancamentos' : 'pendentes';
    const { column, direction } = ordemEstado[tableKey];

    const headers = document.querySelectorAll(`#${tableId} thead th.sortable`);
    
    headers.forEach(header => {
        const headerColumn = header.getAttribute('data-column');
        
        header.classList.remove('sort-asc', 'sort-desc');
        
        if (headerColumn === column) {
            header.classList.add(`sort-${direction}`);
        }
    });
}

function setupOrdenacaoListeners() {
    document.querySelectorAll('.tabela-dados thead th.sortable').forEach(header => {
        header.addEventListener('click', () => {
             // Detecta a tabela pelo parent mais próximo
            const tableId = header.closest('.tabela-dados').id; 
            const column = header.getAttribute('data-column');
            aplicarOrdenacao(column, tableId);
        });
    });
}

// ====================================================================
// FUNÇÕES DE DADOS (SUPABASE & CATEGORIAS)
// ====================================================================

async function fetchCategoriasUnicas() {
    const { data, error } = await supabase
        .from('categorias')
        .select('id, nome')
        .order('nome', { ascending: true });

    if (error) {
        console.error('Erro ao buscar categorias:', error);
        return;
    }

    todasCategorias = data.reduce((acc, cat) => {
        acc[cat.nome] = cat.id; 
        acc[cat.id] = cat.nome;
        return acc;
    }, {});

    const datalist = document.getElementById('listaCategorias');
    const filtroDatalist = document.getElementById('listaCategoriasFiltro');
    
    if (datalist) datalist.innerHTML = '';
    if (filtroDatalist) filtroDatalist.innerHTML = '<option value="">Todos</option>'; 

    data.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.nome;
        if (datalist) datalist.appendChild(option.cloneNode(true));
        if (filtroDatalist) filtroDatalist.appendChild(option);
    });
}

async function getCategoriaId(nomeCategoria) {
    const nome = nomeCategoria.trim();
    if (!nome) return null;

    if (todasCategorias[nome]) {
        return todasCategorias[nome];
    }

    const { data, error } = await supabase
        .from('categorias')
        .upsert({ nome: nome }, { onConflict: 'nome' })
        .select('id, nome')
        .single();
    
    if (error && error.code !== '23505') { 
        console.error('Erro ao inserir/buscar categoria:', error);
        return null;
    }
    
    if (data) {
        todasCategorias[data.nome] = data.id;
        todasCategorias[data.id] = data.nome;
        return data.id;
    }
    
    await fetchCategoriasUnicas();
    return todasCategorias[nome];
}

/**
 * Busca os lançamentos. Por padrão, busca TUDO. Aplica filtro na Query se 
 * a aba Lançamentos Registrados estiver ativa.
 */
async function fetchLancamentos() {
    let query = supabase
        .from('lancamentos')
        .select(`
            *,
            categoria_ref:categorias!left(nome) 
        `); 
        
    const abaAtiva = document.querySelector('.aba-conteudo:not(.oculto)').id;
    let ordem = ordemEstado.lancamentos;
    
    // --- Aplicar Filtros na QUERY APENAS para Lançamentos Registrados ---
    if (abaAtiva === 'abaLancamentos') {
        if (filtroLancamentosEstado.tipo) {
            query = query.eq('tipo', filtroLancamentosEstado.tipo);
        }
        if (filtroLancamentosEstado.categoria) {
             query = query.filter('categoria_ref.nome', 'ilike', `%${filtroLancamentosEstado.categoria}%`);
        }
        if (filtroLancamentosEstado.dataInicial) {
            query = query.gte('data_transacao', filtroLancamentosEstado.dataInicial);
        }
        if (filtroLancamentosEstado.dataFinal) {
            query = query.lte('data_transacao', filtroLancamentosEstado.dataFinal);
        }
    } 
    
    // Filtro obrigatório na query para Pendentes
    if (abaAtiva === 'abaPendentes') {
        query = query.eq('status', 'pendente');
        ordem = ordemEstado.pendentes;
    }


    // --- Aplicar ORDENAÇÃO ---
    query = query.order(ordem.column, { ascending: ordem.direction === 'asc' });
    
    const { data, error } = await query;
    if (error) {
        console.error('Erro ao buscar lançamentos:', error);
        alert('Erro ao carregar lançamentos: ' + error.message);
        return [];
    }

    // Mapear e normalizar os dados
    todosLancamentos = data.map(l => {
        const nomeCategoria = (l.categoria_ref && l.categoria_ref.nome) 
                                ? l.categoria_ref.nome 
                                : 'Sem Categoria';

        return {
            ...l,
            valor: parseFloat(l.valor) || 0, 
            status_normalizado: toLowerSafe(l.status),
            categoria: nomeCategoria 
        };
    });

    return todosLancamentos;
}


// ====================================================================
// FUNÇÕES DE CRUD
// ====================================================================

async function adicionarLancamento(event) {
    event.preventDefault();
    
    const submitButton = event.submitter || document.querySelector('#formNovoLancamento button[type="submit"]');
    submitButton.disabled = true;
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Adicionando...';
    
    try {
        const tipo = document.getElementById('tipo').value;
        const descricao = document.getElementById('descricao').value;
        const categoriaNome = document.getElementById('categoria').value.trim();
        const categoria_id = await getCategoriaId(categoriaNome); 
        
        const valorInput = document.getElementById('valor').value.replace(',', '.');
        const valor = parseFloat(valorInput);
        const data_transacao = document.getElementById('data_transacao').value;
        const status = document.getElementById('status').value.toLowerCase(); 
        const data_vencimento = status === 'pendente' ? document.getElementById('data_vencimento').value : null;

        if (isNaN(valor) || valor <= 0 || !categoria_id) {
            alert('Por favor, insira um valor válido e positivo e garanta que a categoria foi selecionada/criada.');
            throw new Error('Erro de validação de formulário.');
        }

        const { error } = await supabase
            .from('lancamentos')
            .insert([{ 
                tipo, 
                descricao, 
                categoria_id, 
                valor, 
                data_transacao, 
                status, 
                data_vencimento 
            }]);

        if (error) {
            throw new Error('Erro ao cadastrar: ' + error.message);
        } else {
            alert('Lançamento cadastrado com sucesso!');
            document.getElementById('formNovoLancamento').reset();
            await fetchCategoriasUnicas(); 
            recarregarDadosComFiltro();
            mudarAba('abaDashboard');
        }
        
    } catch (e) {
        console.error(e);
        if (e.message !== 'Erro de validação de formulário.') {
            alert(e.message || 'Ocorreu um erro desconhecido ao cadastrar.');
        }
        
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
}

async function atualizarLancamento(event) {
    event.preventDefault();
    
    const submitButton = event.submitter || document.querySelector('#formEdicaoLancamento button[type="submit"]');
    submitButton.disabled = true;
    const originalText = submitButton.textContent;

    try {
        const id = document.getElementById('editId').value;
        const tipo = document.getElementById('editTipo').value;
        const descricao = document.getElementById('editDescricao').value;
        const categoriaNome = document.getElementById('editCategoria').value.trim();
        const categoria_id = await getCategoriaId(categoriaNome); 

        const valorInput = document.getElementById('editValor').value.replace(',', '.');
        const valor = parseFloat(valorInput);
        const data_transacao = document.getElementById('editDataTransacao').value;
        const status = document.getElementById('editStatus').value.toLowerCase(); 
        let data_vencimento = document.getElementById('editDataVencimento').value;
        
        if (status !== 'pendente') {
            data_vencimento = null;
        }

        if (isNaN(valor) || valor <= 0 || !categoria_id) {
            alert('Por favor, insira um valor válido e positivo e garanta que a categoria foi selecionada/criada.');
            throw new Error('Erro de validação de formulário.');
        }

        const { error } = await supabase
            .from('lancamentos')
            .update({
                tipo, 
                descricao, 
                categoria_id, 
                valor, 
                data_transacao, 
                status, 
                data_vencimento
            })
            .eq('id', id);

        if (error) {
            throw new Error('Erro ao atualizar: ' + error.message);
        } else {
            alert('Lançamento atualizado com sucesso!');
            fecharModal();
            await fetchCategoriasUnicas();
            recarregarDadosComFiltro();
        }

    } catch (e) {
        console.error(e);
        if (e.message !== 'Erro de validação de formulário.') {
            alert(e.message || 'Ocorreu um erro desconhecido ao atualizar.');
        }
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
}

async function removerLancamento(id) {
    if (!confirm('Tem certeza que deseja remover este lançamento?')) return;

    const { error } = await supabase.from('lancamentos').delete().eq('id', id);

    if (error) {
        alert('Erro ao remover: ' + error.message);
    } else {
        alert('Lançamento removido com sucesso!');
        recarregarDadosComFiltro();
    }
}

async function confirmarLancamento(id) {
    if (!confirm('Deseja marcar esta conta como CONCLUÍDA/PAGA?')) return;

    const hoje = new Date().toISOString().split('T')[0];

    const { error } = await supabase
        .from('lancamentos')
        .update({ status: 'concluido', data_transacao: hoje, data_vencimento: null })
        .eq('id', id);

    if (error) {
        alert('Erro ao confirmar: ' + error.message);
    } else {
        alert('Lançamento confirmado com sucesso!');
        recarregarDadosComFiltro();
    }
}


// ====================================================================
// FUNÇÕES DE RENDERIZAÇÃO (ATUALIZADAS V31)
// ====================================================================

function renderizarDashboard() {
    const mesFiltro = filtroDashboardMes;
    const statusFinalizados = ['concluido', 'pago/recebido'];
    
    // O Dashboard trabalha com TODOS os dados concluídos (para cálculo do saldo)
    const concluidos = todosLancamentos.filter(l => statusFinalizados.includes(l.status_normalizado));

    // Filtra APENAS os lançamentos do MÊS selecionado para os CARDS de saldo
    let lancamentosDoMes = concluidos;
    if (mesFiltro) {
        lancamentosDoMes = concluidos.filter(l => 
            l.data_transacao && l.data_transacao.startsWith(mesFiltro)
        );
    }

    const totalReceitas = lancamentosDoMes.filter(l => l.tipo === 'Receita').reduce((sum, l) => sum + l.valor, 0);
    const totalDespesas = lancamentosDoMes.filter(l => l.tipo === 'Despesa').reduce((sum, l) => sum + l.valor, 0);

    const saldoAtual = totalReceitas - totalDespesas;

    document.getElementById('totalReceitas').textContent = formatarMoeda(totalReceitas);
    document.getElementById('totalDespesas').textContent = formatarMoeda(totalDespesas);
    
    const saldoElement = document.getElementById('saldoAtual');
    saldoElement.textContent = formatarMoeda(saldoAtual);
    saldoElement.style.color = saldoAtual >= 0 ? '#007bff' : '#dc3545';
    
    // Renderiza o gráfico COM TODOS os lançamentos concluídos (Histórico)
    renderizarGrafico(concluidos);
}

function renderizarTabela(lancamentos) {
    const tbody = document.querySelector('#tabelaLancamentos tbody');
    tbody.innerHTML = '';
    
    if (!lancamentos || lancamentos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Nenhum lançamento encontrado.</td></tr>';
        atualizarIconesOrdenacao('tabelaLancamentos');
        return;
    }

    lancamentos.forEach(l => {
        const tr = document.createElement('tr');
        const statusFormatado = l.status_normalizado.charAt(0).toUpperCase() + l.status_normalizado.slice(1);
        const lancamentoParaModal = JSON.stringify(l).replace(/'/g, '&#39;').replace(/"/g, '&quot;');


        tr.innerHTML = `
            <td>${formatarData(l.data_transacao)}</td>
            <td style="color: ${l.tipo === 'Receita' ? '#28a745' : '#dc3545'}; font-weight: bold;">${l.tipo}</td>
            <td>${l.descricao}</td>
            <td>${l.categoria}</td>
            <td style="text-align: right;">${formatarMoeda(l.valor)}</td>
            <td>${statusFormatado}</td>
            <td>${formatarData(l.data_vencimento)}</td>
            <td>
                <button class="btn-editar" onclick="abrirModal(${lancamentoParaModal})">Editar</button>
                <button class="btn-remover" onclick="removerLancamento('${l.id}')">Remover</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    atualizarIconesOrdenacao('tabelaLancamentos');
}

function renderizarTabelaPendentes() {
    // 1. Tenta obter o corpo da tabela
    const tbody = document.querySelector('#tabelaPendentes tbody');
    
    // V31: Verifica se o elemento existe no HTML (Importante para evitar crashes em outras abas)
    if (!tbody) {
        console.warn("Elemento #tabelaPendentes tbody não encontrado. Pulando a renderização.");
        return;
    }
    
    // Pendentes são filtrados pela Query em fetchLancamentos, se a aba estiver ativa.
    const pendentes = todosLancamentos.filter(l => l.status_normalizado === 'pendente');
    
    tbody.innerHTML = ''; // Limpa antes de renderizar
    
    if (pendentes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhuma conta pendente.</td></tr>';
        atualizarIconesOrdenacao('tabelaPendentes');
        return;
    }

    // Se a busca principal for de TODOS (o que não deve acontecer mais), a ordenação seria refeita aqui
    const { column, direction } = ordemEstado.pendentes;
    
    // A ordenação já deve vir do fetchLancamentos se a aba for Pendentes.
    // Este bloco de ordenação manual é um fallback, mas pode ser otimizado no futuro.
    const abaAtiva = document.querySelector('.aba-conteudo:not(.oculto)').id;
    if (abaAtiva !== 'abaPendentes') {
         pendentes.sort((a, b) => {
            let valA = a[column];
            let valB = b[column];

            if (column === 'valor') {
                valA = parseFloat(valA);
                valB = parseFloat(valB);
            } else if (column.includes('data_')) {
                if (!valA) return direction === 'asc' ? 1 : -1;
                if (!valB) return direction === 'asc' ? -1 : 1;
            }

            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    const hoje = new Date().toISOString().split('T')[0];
    const dataAlertaProximo = new Date();
    dataAlertaProximo.setDate(dataAlertaProximo.getDate() + 7);
    const limiteProximo = dataAlertaProximo.toISOString().split('T')[0];

    pendentes.forEach(l => {
        const tr = document.createElement('tr');
        let classeAlerta = '';
        const lancamentoParaModal = JSON.stringify(l).replace(/'/g, '&#39;').replace(/"/g, '&quot;');

        if (l.data_vencimento && l.data_vencimento < hoje) {
            classeAlerta = 'vencido';
        } else if (l.data_vencimento === hoje) {
            classeAlerta = 'alerta-vencimento';
        } else if (l.data_vencimento && l.data_vencimento <= limiteProximo) {
            classeAlerta = 'proximo-vencimento';
        }
        
        tr.className = classeAlerta;
        
        tr.innerHTML = `
            <td style="font-weight: bold;">${formatarData(l.data_vencimento)}</td>
            <td style="color: ${l.tipo === 'Receita' ? '#28a745' : '#dc3545'};">${l.tipo}</td>
            <td>${l.descricao}</td>
            <td>${l.categoria}</td>
            <td style="text-align: right;">${formatarMoeda(l.valor)}</td>
            <td>
                <button class="btn-confirmar" onclick="confirmarLancamento('${l.id}')">Confirmar Pagto/Recb</button>
                <button class="btn-editar" onclick="abrirModal(${lancamentoParaModal})">Editar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    atualizarIconesOrdenacao('tabelaPendentes');
}

function agruparPorMes(lancamentos) {
    const dadosAgrupados = {};

    lancamentos.forEach(l => {
        if (!l.data_transacao) return;
        
        const mesAno = l.data_transacao.substring(0, 7);
        
        if (!dadosAgrupados[mesAno]) {
            dadosAgrupados[mesAno] = { Receita: 0, Despesa: 0 };
        }

        dadosAgrupados[mesAno][l.tipo] += l.valor;
    });

    return dadosAgrupados;
}

function renderizarGrafico(lancamentos) {
    const dadosAgrupados = agruparPorMes(lancamentos);
    const mesesOrdenados = Object.keys(dadosAgrupados).sort();

    const labels = mesesOrdenados.map(ma => {
        const [ano, mes] = ma.split('-');
        return `${mes}/${ano}`;
    });

    const receitas = mesesOrdenados.map(ma => dadosAgrupados[ma]['Receita']);
    const despesas = mesesOrdenados.map(ma => dadosAgrupados[ma]['Despesa']);
    
    const ctx = document.getElementById('graficoMovimentacao').getContext('2d');

    if (graficoMovimentacao) {
        graficoMovimentacao.destroy();
    }

    graficoMovimentacao = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Receitas (R$)',
                    data: receitas,
                    backgroundColor: 'rgba(40, 167, 69, 0.7)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Despesas (R$)',
                    data: despesas,
                    backgroundColor: 'rgba(220, 53, 69, 0.7)',
                    borderColor: 'rgba(220, 53, 69, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Valor (R$)'
                    }
                }
            }
        }
    });
}

function renderizarRelatorioDespesas() {
    const mesFiltro = relatorioMes; 
    const statusFinalizados = ['concluido', 'pago/recebido'];

    // FILTRO EM MEMÓRIA 
    let despesasFinalizadas = todosLancamentos.filter(l => 
        l.tipo === 'Despesa' && statusFinalizados.includes(l.status_normalizado)
    );

    if (mesFiltro) {
        despesasFinalizadas = despesasFinalizadas.filter(l => 
            l.data_transacao && l.data_transacao.startsWith(mesFiltro)
        );
    }
    
    const totaisPorCategoria = despesasFinalizadas.reduce((acc, l) => {
        const categoria = l.categoria || 'Sem Categoria';
        acc[categoria] = (acc[categoria] || 0) + l.valor;
        return acc;
    }, {});
    
    const totalGlobalDespesas = despesasFinalizadas.reduce((sum, l) => sum + l.valor, 0);
    
    const dadosRelatorio = Object.keys(totaisPorCategoria).map(categoria => ({
        categoria: categoria,
        total: totaisPorCategoria[categoria],
        percentual: totalGlobalDespesas > 0 ? (totaisPorCategoria[categoria] / totalGlobalDespesas) * 100 : 0
    })).sort((a, b) => b.total - a.total);

    const tbody = document.getElementById('tabelaRelatorioCorpo');
    tbody.innerHTML = '';
    
    if (dadosRelatorio.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Nenhuma despesa encontrada para este período.</td></tr>';
    } else {
        dadosRelatorio.forEach(d => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${d.categoria}</td>
                <td style="text-align: right;">${formatarMoeda(d.total)}</td>
                <td style="text-align: right;">${d.percentual.toFixed(2)}%</td>
            `;
            tbody.appendChild(tr);
        });
        const trTotal = document.createElement('tr');
        trTotal.style.fontWeight = 'bold';
        trTotal.innerHTML = `
            <td>TOTAL</td>
            <td style="text-align: right;">${formatarMoeda(totalGlobalDespesas)}</td>
            <td style="text-align: right;">100.00%</td>
        `;
        tbody.appendChild(trTotal);
    }

    renderizarGraficoDespesas(dadosRelatorio);
}

function renderizarGraficoDespesas(dadosRelatorio) {
    const ctx = document.getElementById('graficoDespesasCategoria').getContext('2d');

    if (graficoDespesasCategoria) {
        graficoDespesasCategoria.destroy();
    }

    const categorias = dadosRelatorio.map(d => d.categoria);
    const totais = dadosRelatorio.map(d => d.total);
    
    const cores = ['#dc3545', '#ffc107', '#17a2b8', '#6610f2', '#fd7e14', '#20c997', '#e83e8c', '#adb5bd', '#343a40'];

    if (categorias.length === 0) return; // Evita criar gráfico vazio

    graficoDespesasCategoria = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categorias,
            datasets: [{
                data: totais,
                backgroundColor: cores.slice(0, categorias.length),
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                },
                title: {
                    display: false,
                }
            }
        }
    });
}


// ====================================================================
// FUNÇÕES DE FILTRO E RECARREGAMENTO
// ====================================================================

// Filtro da aba Lançamentos Registrados
function aplicarFiltro() { 
    filtroLancamentosEstado.tipo = document.getElementById('filtroTipo').value;
    filtroLancamentosEstado.categoria = document.getElementById('filtroCategoria').value.trim();
    filtroLancamentosEstado.dataInicial = document.getElementById('filtroDataInicial').value;
    filtroLancamentosEstado.dataFinal = document.getElementById('filtroDataFinal').value;
    
    saveState();
    recarregarDadosComFiltro();
}

// Limpar Filtro da aba Lançamentos Registrados
function limparFiltro() { 
    document.getElementById('filtroTipo').value = DEFAULT_FILTRO_ESTADO.tipo;
    document.getElementById('filtroCategoria').value = DEFAULT_FILTRO_ESTADO.categoria;
    document.getElementById('filtroDataInicial').value = DEFAULT_FILTRO_ESTADO.dataInicial;
    document.getElementById('filtroDataFinal').value = DEFAULT_FILTRO_ESTADO.dataFinal;
    
    filtroLancamentosEstado = DEFAULT_FILTRO_ESTADO;
    
    saveState();
    recarregarDadosComFiltro();
}

// Filtro da aba Relatório de Despesas
function aplicarFiltroRelatorio() {
    const relatorioMesInput = document.getElementById('relatorioMes');
    if (relatorioMesInput) {
        relatorioMes = relatorioMesInput.value;
        saveState();
        renderizarRelatorioDespesas();
    }
}

// Filtro da aba Dashboard
function aplicarFiltroDashboard() {
    const dashboardMesInput = document.getElementById('dashboardMes');
    if (dashboardMesInput) {
        filtroDashboardMes = dashboardMesInput.value;
        saveState(); 
        renderizarDashboard(); 
    }
}

/**
 * Função principal que recarrega os dados do Supabase e atualiza todas as visualizações.
 */
async function recarregarDadosComFiltro() {
    // 1. Atualiza as categorias (cache e datalist)
    await fetchCategoriasUnicas();
    
    // 2. Busca os dados com os filtros aplicados (Busca total ou filtrada por aba)
    const lancamentosFiltrados = await fetchLancamentos(); 

    // 3. Renderiza a aba ativa
    const abaAtiva = document.querySelector('.aba-conteudo:not(.oculto)').id;
    
    if (abaAtiva === 'abaDashboard') {
        renderizarDashboard();
    } else if (abaAtiva === 'abaLancamentos') {
         // Passa os dados já filtrados pelo Supabase
        renderizarTabela(lancamentosFiltrados); 
    } else if (abaAtiva === 'abaPendentes') {
        // Passa os dados já filtrados pelo Supabase (apenas pendentes)
        renderizarTabelaPendentes();
    } else if (abaAtiva === 'abaRelatorio') {
        // O Relatório filtra internamente em memória
        renderizarRelatorioDespesas();
    }
}


// ====================================================================
// INICIALIZAÇÃO
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Carrega o estado de filtros e ordenação do localStorage
    loadState();
    
    // 2. Configura os Listeners de Formulário e Filtro Global
    document.getElementById('formNovoLancamento').addEventListener('submit', adicionarLancamento);
    document.getElementById('formEdicaoLancamento').addEventListener('submit', atualizarLancamento);
    
    // Listeners do filtro Lançamentos Registrados
    document.getElementById('aplicarFiltroBtn').addEventListener('click', aplicarFiltro);
    document.getElementById('limparFiltroBtn').addEventListener('click', limparFiltro);
    
    setupOrdenacaoListeners();
    
    const currentMonthYear = getCurrentMonthYear();
    
    // 3. Configuração Específica do Relatório de Mês/Ano
    const relatorioMesInput = document.getElementById('relatorioMes');
    if (relatorioMesInput) {
        relatorioMesInput.setAttribute('max', currentMonthYear); 
        relatorioMesInput.value = relatorioMes; 
        relatorioMesInput.addEventListener('change', aplicarFiltroRelatorio);
    }
    
    // 4. Configuração Específica do Filtro de Mês do Dashboard
    const dashboardMesInput = document.getElementById('dashboardMes');
    if (dashboardMesInput) {
        dashboardMesInput.setAttribute('max', currentMonthYear); 
        dashboardMesInput.value = filtroDashboardMes; // Usa o estado carregado
        dashboardMesInput.addEventListener('change', aplicarFiltroDashboard);
    }
    
    // 5. Carrega os dados iniciais
    recarregarDadosComFiltro();
});