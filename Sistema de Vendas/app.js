// ====================================================================
// 1. CONFIGURAÇÃO SUPABASE E VARIÁVEIS GLOBAIS
// ====================================================================

// **ATUALIZE COM SUAS CHAVES DO PROJETO SUPABASE**
const supabaseUrl = 'SUA_URL_DO_PROJETO_AQUI'; 
const supabaseKey = 'SUA_CHAVE_ANON_AQUI'; 

// Inicializa o cliente Supabase
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// ID fixo do vendedor (para testes)
const VENDEDOR_ID_LOGADO = '5e2c0dee-4b32-46c3-a240-7da89af8dfff'; 

let empresaLogada = null; // Armazenará a ID da empresa associada ao vendedor
let carrinho = []; // Array para armazenar os itens da venda atual

// Variáveis para armazenar instâncias dos gráficos (para destruição)
let quemMaisVendeuChartInstance = null;
let itensMaisVendidosChartInstance = null;

// ====================================================================
// 2. MÓDULO VENDAS (CABEÇALHO)
// ====================================================================

/**
 * Carrega a empresa associada ao vendedor logado e inicializa o sistema.
 */
async function carregarEmpresaVendedor() {
    console.log("2.1 Tentando carregar empresa para o Vendedor:", VENDEDOR_ID_LOGADO);

    // Consulta para buscar a empresa e o nome da empresa
    const { data, error } = await supabase
        .from('vendedor_empresa_comissao')
        .select('empresa_id, empresas(nome)')
        .eq('vendedor_id', VENDEDOR_ID_LOGADO)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: Nenhum dado encontrado
        console.error('Erro ao carregar empresa do vendedor:', error.message);
        document.getElementById('infoVendedor').textContent = `Erro: ${error.message}`;
        return;
    }
    
    // **REVISÃO CRÍTICA:** Se data existe e o join funcionou (data.empresas não é nulo)
    if (data && data.empresas) {
        empresaLogada = data.empresa_id;
        // O Supabase retorna o objeto da coluna referenciada (empresas)
        document.getElementById('infoVendedor').textContent = `Vendedor: João Teste | Empresa: ${data.empresas.nome}`;
        console.log("2.2 Empresa carregada com sucesso:", data.empresas.nome);
        
        document.getElementById('formVenda').addEventListener('submit', finalizarVenda);
        document.getElementById('btnAdicionarProduto').addEventListener('click', adicionarProdutoAoCarrinho);
        atualizarCarrinho(); 
    } else {
         // Ocorre se o Vendedor não tiver um registro em vendedor_empresa_comissao
         console.warn("Vendedor não associado a uma empresa ou chave de foreign key ausente.");
         document.getElementById('infoVendedor').textContent = `Vendedor: João Teste | **ERRO: Empresa não associada.**`;
    }
}

/**
 * Reseta o estado da venda após a finalização.
 */
function limparVenda() {
    carrinho = [];
    document.getElementById('inputCliente').value = '';
    document.getElementById('inputClienteId').value = '';
    document.getElementById('inputProduto').value = '';
    document.getElementById('inputProdutoId').value = '';
    document.getElementById('inputValorUnitarioBase').value = '';
    document.getElementById('inputQuantidade').value = '1';
    document.getElementById('inputDesconto').value = '0.00';
    document.getElementById('inputFrete').value = '0.00';
    atualizarCarrinho();
}

/**
 * Finaliza a transação, registrando a venda e os itens.
 */
async function finalizarVenda(event) {
    event.preventDefault();
    if (carrinho.length === 0) {
        alert('O carrinho está vazio.');
        return;
    }

    const cliente_id = document.getElementById('inputClienteId').value;
    const frete = parseFloat(document.getElementById('inputFrete').value) || 0.00;
    
    // Calcula o total da venda a partir da função auxiliar
    const total_venda = calcularTotalGeral(); 

    if (!cliente_id) {
        alert('Selecione um cliente válido.');
        return;
    }

    // 1. Inserir Venda (Cabeçalho)
    const vendaData = {
        vendedor_id: VENDEDOR_ID_LOGADO,
        cliente_id: cliente_id,
        empresa_id: empresaLogada,
        total_venda: total_venda,
        frete: frete
    };

    const { data: vendaInserida, error: vendaError } = await supabase
        .from('vendas')
        .insert([vendaData])
        .select()
        .single();

    if (vendaError) {
        alert(`Erro ao finalizar a venda: ${vendaError.message}`);
        console.error('Erro na inserção da venda:', vendaError);
        return;
    }
    
    const venda_id = vendaInserida.id;
    console.log('Venda registrada com sucesso, ID:', venda_id);

    // 2. Preparar e Inserir Itens da Venda
    const itensParaInserir = carrinho.map(item => ({
        venda_id: venda_id,
        produto_id: item.id,
        quantidade: item.quantidade,
        preco_unitario_aplicado: item.preco_unitario_aplicado,
        total_item: item.total_item
    }));

    const { error: itensError } = await supabase
        .from('itens_venda')
        .insert(itensParaInserir);

    if (itensError) {
        alert(`Venda finalizada, mas houve um erro ao registrar os itens: ${itensError.message}`);
        console.error('Erro na inserção dos itens:', itensError);
    } else {
        alert('Venda finalizada com sucesso!');
    }

    limparVenda();
}


// ====================================================================
// 3. MÓDULO BUSCA DE CLIENTES (Autocomplete)
// ====================================================================

/**
 * Realiza a busca de clientes para autocomplete.
 */
async function buscarClientes(query) {
    if (query.length < 3) return;

    const { data, error } = await supabase
        .from('clientes')
        .select('id, razao_social, cpf_cnpj')
        .ilike('razao_social', `%${query}%`)
        .limit(10);

    if (error) {
        console.error('Erro ao buscar clientes:', error);
        return;
    }

    renderizarResultadosBusca('clienteSugestoes', data, (cliente) => {
        document.getElementById('inputCliente').value = cliente.razao_social;
        document.getElementById('inputClienteId').value = cliente.id;
    });
}

// ====================================================================
// 4. MÓDULO BUSCA DE PRODUTOS (Autocomplete)
// ====================================================================

/**
 * Realiza a busca de produtos para autocomplete.
 */
async function buscarProdutos(query) {
    if (query.length < 3 || !empresaLogada) return;

    const { data, error } = await supabase
        .from('produtos')
        .select('id, nome, valor_unitario')
        .eq('empresa_id', empresaLogada) 
        .ilike('nome', `%${query}%`)
        .limit(10);

    if (error) {
        console.error('Erro ao buscar produtos:', error);
        return;
    }

    renderizarResultadosBusca('produtoSugestoes', data, (produto) => {
        document.getElementById('inputProduto').value = produto.nome;
        document.getElementById('inputProdutoId').value = produto.id;
        document.getElementById('inputValorUnitarioBase').value = produto.valor_unitario.toFixed(2);
        
        document.getElementById('inputQuantidade').value = 1;
        document.getElementById('inputDesconto').value = 0.00;
    });
}

/**
 * Função utilitária para renderizar resultados de busca.
 */
function renderizarResultadosBusca(listaId, resultados, callbackSelecao) {
    const lista = document.getElementById(listaId);
    lista.innerHTML = '';
    
    // Limpar o autocomplete field se não houver resultados
    if (!resultados || resultados.length === 0) {
        lista.innerHTML = '<li>Nenhum resultado encontrado.</li>';
        return;
    }

    resultados.forEach(item => {
        const li = document.createElement('li');
        // Usa o nome ou a razão social (para clientes)
        li.textContent = item.razao_social || item.nome; 
        li.addEventListener('click', () => {
            callbackSelecao(item);
            lista.innerHTML = ''; 
        });
        lista.appendChild(li);
    });
}


// ====================================================================
// 5. MÓDULO CARRINHO DE COMPRAS
// ====================================================================

/**
 * Calcula o subtotal dos itens no carrinho.
 */
function calcularSubtotal() {
    return carrinho.reduce((acc, item) => acc + item.total_item, 0);
}

/**
 * Calcula o total geral (subtotal + frete).
 */
function calcularTotalGeral() {
    const subtotal = calcularSubtotal();
    const frete = parseFloat(document.getElementById('inputFrete').value) || 0.00;
    return subtotal + frete;
}


/**
 * Adiciona o produto selecionado ao carrinho.
 */
function adicionarProdutoAoCarrinho() {
    const produtoId = document.getElementById('inputProdutoId').value;
    const nome = document.getElementById('inputProduto').value;
    const valorBase = parseFloat(document.getElementById('inputValorUnitarioBase').value);
    const quantidade = parseInt(document.getElementById('inputQuantidade').value);
    const descontoPercentual = parseFloat(document.getElementById('inputDesconto').value) || 0.00;

    if (!produtoId || isNaN(valorBase) || isNaN(quantidade) || quantidade <= 0) {
        alert('Selecione um produto válido e insira uma quantidade válida.');
        return;
    }

    const valorComDesconto = valorBase * (1 - descontoPercentual / 100);
    const totalItem = valorComDesconto * quantidade;

    const novoItem = {
        id: produtoId,
        nome: nome,
        quantidade: quantidade,
        preco_unitario_base: valorBase,
        desconto_aplicado: descontoPercentual,
        preco_unitario_aplicado: parseFloat(valorComDesconto.toFixed(2)), // Fixa a precisão
        total_item: parseFloat(totalItem.toFixed(2)) // Fixa a precisão
    };

    // Atualiza ou adiciona
    const indexExistente = carrinho.findIndex(item => item.id === produtoId);
    if (indexExistente !== -1) {
        carrinho[indexExistente] = novoItem;
    } else {
        carrinho.push(novoItem);
    }
    
    // Limpa campos de produto
    document.getElementById('inputProduto').value = '';
    document.getElementById('inputProdutoId').value = '';
    document.getElementById('inputValorUnitarioBase').value = '';
    document.getElementById('inputQuantidade').value = '1';
    document.getElementById('inputDesconto').value = '0.00';

    atualizarCarrinho();
}

/**
 * Remove um item do carrinho pelo seu ID.
 */
function removerItemCarrinho(produtoId) {
    carrinho = carrinho.filter(item => item.id !== produtoId);
    atualizarCarrinho();
}

/**
 * Renderiza o carrinho de compras na tela e calcula totais.
 */
function atualizarCarrinho() {
    const listaCarrinho = document.getElementById('listaCarrinho');
    listaCarrinho.innerHTML = '';
    const subtotal = calcularSubtotal();
    const totalGeral = calcularTotalGeral();
    const frete = parseFloat(document.getElementById('inputFrete').value) || 0.00;

    carrinho.forEach(item => {
        const li = document.createElement('li');
        
        const precoUnitarioFormatado = item.preco_unitario_aplicado.toFixed(2).replace('.', ',');
        const totalItemFormatado = item.total_item.toFixed(2).replace('.', ',');

        li.innerHTML = `
            ${item.nome} (${item.quantidade}x R$ ${precoUnitarioFormatado}) 
            [Desc: ${item.desconto_aplicado.toFixed(2)}%] 
            = R$ ${totalItemFormatado}
            <button onclick="removerItemCarrinho('${item.id}')">Remover</button>
        `;
        listaCarrinho.appendChild(li);
    });

    // Função de formatação para evitar repetição de código
    const formatarBRL = (valor) => `R$ ${valor.toFixed(2).replace('.', ',')}`;

    document.getElementById('subtotalValor').textContent = formatarBRL(subtotal);
    document.getElementById('totalGeralValor').textContent = formatarBRL(totalGeral);
    // Atualiza o frete, caso o campo tenha sido alterado
    document.getElementById('inputFrete').value = frete.toFixed(2); 
}


// ====================================================================
// 6. MÓDULO NAVEGAÇÃO E INICIALIZAÇÃO (Entry Point)
// ====================================================================

/**
 * Função principal que inicializa o sistema
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Configura os listeners de busca (Autocomplete)
    document.getElementById('inputCliente').addEventListener('input', (e) => {
        buscarClientes(e.target.value);
        // Limpar o ID do cliente se o campo for alterado
        document.getElementById('inputClienteId').value = '';
    });
    document.getElementById('inputProduto').addEventListener('input', (e) => {
        buscarProdutos(e.target.value);
        // Limpar os dados do produto se o campo for alterado
        document.getElementById('inputProdutoId').value = '';
        document.getElementById('inputValorUnitarioBase').value = '';
    });
    
    // 2. Listener para atualizar o total quando o frete mudar
    document.getElementById('inputFrete').addEventListener('input', atualizarCarrinho); 

    // 3. Inicializa os dados da venda
    carregarEmpresaVendedor();
    
    // 4. Configura a navegação por abas
    configurarAbas();
});

/**
 * Configura os listeners para a navegação por abas.
 */
function configurarAbas() {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', async () => {
            const targetId = button.getAttribute('data-tab');
            
            // Esconde todo o conteúdo
            document.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
            });
            
            // Remove a classe 'active' de todos os botões e adiciona ao clicado
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Mostra o conteúdo alvo
            document.getElementById(targetId).style.display = 'block';
            
            // Ativa o carregamento de relatórios se a aba 'Gestão' for selecionada
            if (targetId === 'tabGestao') {
                await carregarRelatorios();
            }
        });
    });

    // Inicia na aba 'Vendas' e simula o clique para garantir o estado 'active'
    document.getElementById('tabVendas').style.display = 'block';
    document.querySelector('.tab-button[data-tab="tabVendas"]').classList.add('active');
}


// ====================================================================
// 7. MÓDULO GESTÃO E RELATÓRIOS
// ====================================================================

/**
 * Carrega todos os dados e renderiza os relatórios na aba 'Gestão'.
 */
async function carregarRelatorios() {
    console.log("7.1 Carregando relatórios...");

    // 1. Total Vendido (SUM)
    const totalVendidoElement = document.getElementById('totalVendidoValor');
    const { data: totalData } = await supabase.from('vendas').select('total:sum(total_venda)').single();
    const total = totalData ? totalData.total : 0;
    
    // Formatação complexa para BRL com separador de milhar
    const totalFormatado = parseFloat(total).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    totalVendidoElement.textContent = `R$ ${totalFormatado}`;

    // 2. Quem Mais Vendeu (VIEW: vendedores_rank_vendas)
    const { data: vendedoresRank } = await supabase
        .from('vendedores_rank_vendas') 
        .select('nome_vendedor, total_vendido')
        .limit(5);

    const labelsVendedores = vendedoresRank ? vendedoresRank.map(d => d.nome_vendedor) : ["Vendedor A", "Vendedor B"];
    // Mapeia para float para garantir o gráfico
    const valoresVendedores = vendedoresRank ? vendedoresRank.map(d => parseFloat(d.total_vendido)) : [0, 0]; 
    renderizarGraficoBarras('quemMaisVendeuChart', labelsVendedores, valoresVendedores, 'Vendas (R$)', 'Total Vendido por Vendedor');
    

    // 3. Itens Mais Vendidos (VIEW: produtos_rank_quantidade)
    const { data: produtosRank } = await supabase
        .from('produtos_rank_quantidade') 
        .select('nome_produto, total_quantidade')
        .limit(8);

    const labelsProdutos = produtosRank ? produtosRank.map(d => d.nome_produto) : ["Produto X", "Produto Y"];
    const quantidadesProdutos = produtosRank ? produtosRank.map(d => d.total_quantidade) : [0, 0];
    renderizarGraficoRosca('itensMaisVendidosChart', labelsProdutos, quantidadesProdutos, 'Itens Mais Vendidos (Qtde)');
    

    // 4. Lista de Vendas Recentes (VIEW: vendas_detalhe_cliente)
    const { data: vendasRecentes } = await supabase
        .from('vendas_detalhe_cliente') 
        .select('*')
        .order('data_venda', { ascending: false })
        .limit(10);
        
    const listaVendas = document.getElementById('listaVendasRecentes');
    listaVendas.innerHTML = '';
    vendasRecentes.forEach(venda => {
        const li = document.createElement('li');
        // Formatação do total de venda dentro do loop
        const totalVendaFormatado = venda.total_venda.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

        li.innerHTML = `
            Venda N° ${venda.id.substring(0, 8)} | Cliente: ${venda.nome_cliente} | Total: R$ ${totalVendaFormatado}
            <button onclick="carregarVendaParaEdicao('${venda.id}')" style="margin-left: 10px; background-color: #ffc107;">Editar</button>
        `;
        listaVendas.appendChild(li);
    });
}

/**
 * Renderiza um gráfico de Barras (Chart.js).
 */
function renderizarGraficoBarras(canvasId, labels, data, labelData, titulo) {
    if (quemMaisVendeuChartInstance) quemMaisVendeuChartInstance.destroy();
    const ctx = document.getElementById(canvasId).getContext('2d');
    quemMaisVendeuChartInstance = new Chart(ctx, { 
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: labelData,
                data: data,
                backgroundColor: 'rgba(54, 162, 235, 0.6)'
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true } },
            plugins: { title: { display: true, text: titulo } }
        }
    });
}

/**
 * Renderiza um gráfico de Rosca (Chart.js).
 */
function renderizarGraficoRosca(canvasId, labels, data, titulo) {
    if (itensMaisVendidosChartInstance) itensMaisVendidosChartInstance.destroy();
    const ctx = document.getElementById(canvasId).getContext('2d');
    itensMaisVendidosChartInstance = new Chart(ctx, { 
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#ff6384', '#36a2eb', '#cc65fe', '#ffce56', '#5ee95e', '#795548', '#8b1a1a', '#f5922e'] 
            }]
        },
        options: {
            responsive: true,
            plugins: { title: { display: true, text: titulo } }
        }
    });
}

/**
 * Função placeholder (Módulo 8: Edição de Vendas).
 */
function carregarVendaParaEdicao(vendaId) {
    alert(`Funcionalidade de Edição: Carregando detalhes da Venda N° ${vendaId.substring(0, 8)}`);
}