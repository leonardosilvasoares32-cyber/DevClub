// ====================================================================
// 1. CONFIGURAÇÃO SUPABASE
// ====================================================================

// SUBSTITUA pelas suas credenciais (URL e Chave ANÔNIMA)
const supabaseUrl = 'https://sbfxtoxykwtxiecibkcm.supabase.co'; 
const supabaseKey = 'sb_publishable_85uPynUTx9KKCCSYBsdwIg_cXEXzt0f'; 

// CORREÇÃO CRÍTICA: Inicializa o Supabase usando o objeto global 'window.supabase' 
// que é carregado pelo script CDN.
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Variáveis de Estado da Aplicação
const VENDEDOR_ID_LOGADO = '5e2c0dee-4b32-46c3-a240-7da89af8dfff'; 
let carrinho = []; // Array para armazenar os itens de venda temporariamente
let produtosDisponiveis = []; // Lista completa de produtos carregados
let modoEdicao = false; // Flag: true se estiver editando uma venda existente
let vendaEmEdicaoId = null; // ID da venda que está sendo editada
let clienteAtual = {}; // Armazena os dados do cliente selecionado

// Referências dos Botões de Edição/Envio
const btnSalvarEdicao = document.getElementById('btnSalvarEdicao');
const btnCancelarEdicao = document.getElementById('btnCancelarEdicao');
const btnEnviarVenda = document.getElementById('btnEnviarVenda');
const btnCancelarVenda = document.getElementById('btnCancelarVenda');


// ====================================================================
// 2. FUNÇÕES GERAIS DE NAVEGAÇÃO E INICIALIZAÇÃO
// ====================================================================

/**
 * Controla a exibição das abas (Tela de Vendas, Gestão, Cadastros).
 * @param {string} tabId - O ID da seção HTML a ser exibida.
 */
function showTab(tabId) {
    // Esconde todos os conteúdos das abas
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    // Remove o destaque de todos os botões
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    // Mostra o conteúdo da aba clicada e destaca o botão
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`[onclick="showTab('${tabId}')"]`).classList.add('active');

    // Recarrega relatórios apenas quando a aba de gestão é acessada
    if (tabId === 'gestao') {
        carregarRelatorios(); 
    }
}

/**
 * Carrega empresas permitidas, produtos e preenche os dropdowns e permissões.
 */
async function carregarDadosIniciais() {
    // 1. Buscar empresas que o vendedor tem permissão
    const { data: permissoes, error: errPermissoes } = await supabase
        .from('vendedor_empresa_comissao')
        .select('empresa_id, empresas(nome)')
        .eq('vendedor_id', VENDEDOR_ID_LOGADO); 

    if (errPermissoes || !permissoes) {
        document.getElementById('vendedorInfo').innerHTML = 'Vendedor: <strong>Usuário Teste</strong> | Empresas: ❌ Erro ao carregar!';
        return;
    }

    const empresasIds = permissoes.map(p => p.empresa_id);
    const empresasNomes = permissoes.map(p => p.empresas.nome);

    // Atualiza a informação do vendedor na tela
    document.getElementById('vendedorInfo').innerHTML = `Vendedor: <strong>Usuário Teste</strong> | Empresa(s): <strong>${empresasNomes.join(', ')}</strong>`;

    // 2. Popular o SELECT de Empresas (Tela de Vendas)
    const selectEmpresa = document.getElementById('selectEmpresa');
    selectEmpresa.innerHTML = '<option value="">Selecione a Empresa</option>';
    empresasIds.forEach((id, index) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = empresasNomes[index];
        selectEmpresa.appendChild(option);
    });

    // 3. Buscar todos os produtos dessas empresas
    const { data: produtos, error: errProdutos } = await supabase
        .from('produtos')
        .select('*')
        .in('empresa_id', empresasIds); 
        
    if (errProdutos) {
        console.error('Erro ao carregar produtos:', errProdutos);
        return;
    }
    produtosDisponiveis = produtos; 

    // 4. Carrega empresas para o Formulário de Permissões de Vendedor
    popularPermissoesVendedor(permissoes.map(p => ({ id: p.empresa_id, nome: p.empresas.nome })));
}

// Executado ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    carregarDadosIniciais();
    carregarListaEmpresas(); 
    carregarRelatorios(); 
    showTab('vendas'); 
    // Adiciona event listeners para a lógica de vendas
    document.getElementById('btnEnviarVenda').addEventListener('click', processarVenda);
    document.getElementById('btnSalvarEdicao').addEventListener('click', salvarEdicaoVenda);
    document.getElementById('btnCancelarVenda').addEventListener('click', cancelarVenda);
    document.getElementById('btnCancelarEdicao').addEventListener('click', cancelarEdicao);
});


// ====================================================================
// 3. MÓDULO CADASTROS (CRUD) - COM LÓGICA DE INSERÇÃO INTEGRADA
// ====================================================================

/**
 * Funções auxiliares de feedback visual
 */
function setStatus(elementId, message, isSuccess) {
    const statusElement = document.getElementById(elementId);
    
    // Adiciona a classe base de estilo de mensagem
    statusElement.classList.add('status-message'); 
    
    statusElement.innerHTML = message;
    
    // O JavaScript ainda aplica as cores dinamicamente
    statusElement.style.backgroundColor = isSuccess ? '#d4edda' : '#f8d7da'; // Verde para sucesso, Vermelho para erro
    statusElement.style.color = isSuccess ? '#155724' : '#721c24';
}


// --- Cadastro de Vendedores ---
document.getElementById('formCadastroVendedor').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.target;
    const statusId = 'statusVendedorMensagem';

    // 1. Inserir o novo Vendedor (tabela 'vendedores')
    const dadosVendedor = {
        nome: form.nome.value,
        email: form.email.value
    };

    const { data: novoVendedor, error: errorVendedor } = await supabase
        .from('vendedores')
        .insert([dadosVendedor])
        .select('id');

    if (errorVendedor) {
        setStatus(statusId, `❌ Falha ao cadastrar vendedor: ${errorVendedor.message}`, false);
        return;
    }
    
    const novoVendedorId = novoVendedor[0].id;
    
    // 2. Inserir Permissões de Comissão
    const permissoesChecks = document.querySelectorAll('input[name="permissao_empresa"]:checked');
    if (permissoesChecks.length === 0) {
        setStatus(statusId, '✅ Vendedor cadastrado, mas sem permissões de comissão definidas.', true);
        form.reset();
        return;
    }
    
    const permissoesParaInserir = Array.from(permissoesChecks).map(check => ({
        vendedor_id: novoVendedorId,
        empresa_id: check.value,
        comissao_percentual: parseFloat(check.getAttribute('data-comissao')) || 0
    }));
    
    const { error: errorPermissoes } = await supabase
        .from('vendedor_empresa_comissao')
        .insert(permissoesParaInserir);

    if (errorPermissoes) {
        setStatus(statusId, `❌ Vendedor cadastrado, mas ERRO ao salvar permissões: ${errorPermissoes.message}`, false);
    } else {
        setStatus(statusId, `✅ Vendedor ${form.nome.value} e suas permissões cadastrados com sucesso!`, true);
        form.reset();
    }
});

// --- Cadastro de Clientes ---
document.getElementById('formCadastroClientes').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.target;
    const statusId = 'statusClientesMensagem';
    
    const dadosCliente = {
        cpf_cnpj: form.cpf_cnpj.value,
        razao_social: form.razao_social.value,
        endereco: form.endereco.value,
        email: form.email.value,
        telefone: form.telefone.value
    };

    const { error } = await supabase
        .from('clientes')
        .insert([dadosCliente]);

    if (error) {
        setStatus(statusId, `❌ Falha ao cadastrar cliente: ${error.message}`, false);
    } else {
        setStatus(statusId, '✅ Cliente cadastrado com sucesso!', true);
        form.reset();
    }
});

// --- Cadastro de Empresas ---
document.getElementById('formCadastroEmpresa').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.target;
    const statusId = 'statusEmpresaMensagem';

    const dadosEmpresa = {
        nome: form.nome.value,
        cnpj: form.cnpj.value,
        endereco: form.endereco.value,
        telefone: form.telefone.value,
        email: form.email.value,
        nome_gerente: form.nome_gerente.value,
        tel_gerente: form.tel_gerente.value,
        email_gerente: form.email_gerente.value,
        // Conversão para boolean
        is_industria: form.is_industria.checked,
        is_atacado: form.is_atacado.checked
    };

    const { error } = await supabase
        .from('empresas')
        .insert([dadosEmpresa]);

    if (error) {
        // Logar o erro completo no console para debugging
        console.error('Erro detalhado ao cadastrar empresa:', error);
        setStatus(statusId, `❌ Falha ao cadastrar empresa: ${error.message}`, false);
    } else {
        setStatus(statusId, '✅ Empresa cadastrada com sucesso!', true);
        form.reset();
        carregarDadosIniciais(); // Recarrega o select de empresas na tela de vendas
        carregarListaEmpresas(); // Recarrega a lista de empresas no módulo de cadastro
    }
});

// --- Cadastro de Produtos ---
document.getElementById('formCadastroProduto').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.target;
    const statusId = 'statusProdutoMensagem';

    const dadosProduto = {
        empresa_id: form.produto_empresa_id.value, 
        nome: form.nome.value,
        descricao: form.descricao.value,
        valor_unitario: parseFloat(form.valor_unitario.value) || 0,
        valor_caixa: parseFloat(form.valor_caixa.value) || null,
        desconto_max_percentual: parseFloat(form.desconto_max_percentual.value) || 0,
        comissao_produto_percentual: parseFloat(form.comissao_produto_percentual.value) || 0
    };
    
    if (!dadosProduto.empresa_id || dadosProduto.valor_unitario <= 0) {
        setStatus(statusId, '❌ Erro: Selecione a empresa e insira um valor unitário válido.', false);
        return;
    }

    const { error } = await supabase
        .from('produtos')
        .insert([dadosProduto]);

    if (error) {
        setStatus(statusId, `❌ Falha ao cadastrar produto: ${error.message}`, false);
    } else {
        setStatus(statusId, '✅ Produto cadastrado com sucesso!', true);
        form.reset();
        carregarDadosIniciais(); 
    }
});

/**
 * Preenche o formulário de permissões com a lista de empresas.
 */
function popularPermissoesVendedor(listaEmpresas) {
    const permissoesDiv = document.getElementById('permissoesVendedor');
    if (!permissoesDiv) return; // Proteção caso o elemento não exista
    permissoesDiv.innerHTML = ''; 
    
    listaEmpresas.forEach(empresa => {
        const empresaPermissao = document.createElement('div');
        empresaPermissao.classList.add('permissao-item');
        const comissaoPadrao = 5; // Exemplo de comissão padrão
        
        empresaPermissao.innerHTML = `
            <input type="checkbox" id="perm_${empresa.id}" name="permissao_empresa" value="${empresa.id}" data-comissao="${comissaoPadrao}">
            <label for="perm_${empresa.id}">${empresa.nome} (Comissão Padrão: ${comissaoPadrao}%)</label>
        `;
        permissoesDiv.appendChild(empresaPermissao);
    });
}

/**
 * Abre o modal para cadastro de produto, vinculando à empresa selecionada.
 */
function abrirCadastroProduto(empresaId, empresaNome) {
    document.getElementById('produtoEmpresaId').value = empresaId;
    document.getElementById('produtoEmpresaNome').textContent = empresaNome;
    document.getElementById('modalCadastroProduto').style.display = 'block';
    document.getElementById('formCadastroProduto').reset();
    document.getElementById('statusProdutoMensagem').textContent = '';
}

/**
 * Fecha o modal de cadastro de produto.
 */
function fecharCadastroProduto() {
    document.getElementById('modalCadastroProduto').style.display = 'none';
}

/**
 * Carrega a lista de empresas cadastradas para o módulo de cadastro.
 */
async function carregarListaEmpresas() {
    // CORREÇÃO: Usar o ID correto 'listaEmpresasCadastradas'
    const listaEmpresasDiv = document.getElementById('listaEmpresasCadastradas');
    if (!listaEmpresasDiv) return; // Proteção

    const { data: empresas, error } = await supabase
        .from('empresas')
        .select('id, nome, cnpj');

    if (error) {
        console.error('Erro ao carregar lista de empresas:', error);
        listaEmpresasDiv.innerHTML = '<li>Erro ao carregar empresas.</li>';
        return;
    }
    
    listaEmpresasDiv.innerHTML = '';
    
    empresas.forEach(empresa => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${empresa.nome} (${empresa.cnpj}) 
            <button onclick="abrirCadastroProduto('${empresa.id}', '${empresa.nome}')" class="btn-small">Cadastrar Produto</button>
        `;
        listaEmpresasDiv.appendChild(li);
    });
}


// ====================================================================
// 4. MÓDULO TELA DE VENDAS
// ====================================================================

// --- Busca de Cliente (Autocompletar) ---
document.getElementById('buscaCliente').addEventListener('input', async () => {
    const termo = document.getElementById('buscaCliente').value.trim();
    const RESULTADO_BUSCA_DIV = document.getElementById('resultadoBusca');
    RESULTADO_BUSCA_DIV.innerHTML = ''; 

    if (termo.length < 3) return; 

    // Query busca clientes por CPF/CNPJ ou Razão Social (operador 'or')
    const { data: clientes, error } = await supabase
        .from('clientes')
        .select('id, razao_social, cpf_cnpj, telefone, email')
        .or(`cpf_cnpj.ilike.*${termo}*,razao_social.ilike.*${termo}*`)
        .limit(5);

    if (error) { console.error('Erro na busca de clientes:', error); return; }

    // Cria itens de autocompletar na div
    clientes.forEach(cliente => {
        const item = document.createElement('div');
        item.textContent = `${cliente.razao_social} (${cliente.cpf_cnpj})`;
        item.classList.add('autocomplete-item');
        item.onclick = () => selecionarCliente(cliente); 
        RESULTADO_BUSCA_DIV.appendChild(item);
    });
});

/**
 * Define o cliente selecionado na tela de vendas.
 */
function selecionarCliente(cliente) {
    document.getElementById('clienteIdVenda').value = cliente.id;
    document.getElementById('clienteNomeDisplay').textContent = cliente.razao_social;
    document.getElementById('buscaCliente').value = cliente.razao_social;
    document.getElementById('resultadoBusca').innerHTML = '';
    clienteAtual = cliente; 
}

// --- Filtro de Produtos e Seleção ---
document.getElementById('selectEmpresa').addEventListener('change', (e) => {
    const empresaId = e.target.value;
    const selectProduto = document.getElementById('selectProduto');
    selectProduto.innerHTML = '<option value="">Selecione o Produto</option>';
    document.getElementById('inputValorUnitario').value = '';

    // Filtra os produtos carregados pelo ID da empresa selecionada
    const produtosFiltrados = produtosDisponiveis.filter(p => p.empresa_id === empresaId);
    
    produtosFiltrados.forEach(produto => {
        const option = document.createElement('option');
        option.value = produto.id;
        option.textContent = `${produto.nome} (R$ ${produto.valor_unitario.toFixed(2)})`;
        selectProduto.appendChild(option);
    });
});

document.getElementById('selectProduto').addEventListener('change', (e) => {
    const produtoId = e.target.value;
    // Encontra o objeto produto completo na lista global
    const produto = produtosDisponiveis.find(p => p.id === produtoId);
    if (produto) {
        document.getElementById('inputValorUnitario').value = produto.valor_unitario.toFixed(2);
        window.produtoSelecionado = produto; // Armazena o produto selecionado
    }
});

// --- Carrinho de Compras ---

/**
 * Adiciona um item (produto, quantidade, valor) ao carrinho local (array 'carrinho').
 */
function adicionarItemAoCarrinho() {
    if (!document.getElementById('clienteIdVenda').value) { alert('Selecione um cliente!'); return; }
    
    const produto = window.produtoSelecionado;
    const empresaId = document.getElementById('selectEmpresa').value;
    const quantidade = parseInt(document.getElementById('inputQuantidade').value);
    const valorUnitario = parseFloat(document.getElementById('inputValorUnitario').value);
    
    if (!produto || !quantidade || !empresaId) { alert('Preencha todos os campos do item!'); return; }
    
    carrinho.push({
        id: Date.now(), // ID temporário para gerenciamento no frontend
        produto_id: produto.id,
        nome_produto: produto.nome,
        empresa_id: empresaId,
        quantidade: quantidade,
        preco_unitario_aplicado: valorUnitario,
        total_item: quantidade * valorUnitario
    });
    
    atualizarTabelaCarrinho();
    calcularTotalVenda();
    
    // Limpa campos do item
    document.getElementById('selectProduto').value = '';
    document.getElementById('inputQuantidade').value = 1;
    document.getElementById('inputValorUnitario').value = '';
    window.produtoSelecionado = null;
}

/**
 * Remove um item do array 'carrinho' baseado no ID temporário.
 */
function removerItemDoCarrinho(id) {
    carrinho = carrinho.filter(item => item.id !== id);
    atualizarTabelaCarrinho();
    calcularTotalVenda();
}

/**
 * Atualiza o HTML da tabela de carrinho com base no array 'carrinho'.
 */
function atualizarTabelaCarrinho() {
    const carrinhoBody = document.getElementById('carrinhoBody');
    carrinhoBody.innerHTML = '';
    
    carrinho.forEach(item => {
        const row = carrinhoBody.insertRow();
        row.innerHTML = `
            <td>${item.nome_produto}</td>
            <td>${item.quantidade}</td>
            <td>R$ ${item.preco_unitario_aplicado.toFixed(2)}</td>
            <td>R$ ${item.total_item.toFixed(2)}</td>
            <td><button onclick="removerItemDoCarrinho(${item.id})">Remover</button></td>
        `;
    });
}

/**
 * Recalcula o subtotal, soma o frete e atualiza o Total Geral na tela.
 */
function calcularTotalVenda() {
    let subtotal = carrinho.reduce((acc, item) => acc + item.total_item, 0);
    const frete = parseFloat(document.getElementById('inputFrete').value) || 0;
    const totalVenda = subtotal + frete;
    
    document.getElementById('subtotalDisplay').textContent = `R$ ${subtotal.toFixed(2)}`;
    document.getElementById('totalVendaDisplay').textContent = `R$ ${totalVenda.toFixed(2)}`;
}

// ====================================================================
// 5. LÓGICA DE TRANSAÇÃO (INSERT E UPDATE)
// ====================================================================

/**
 * Processa uma NOVA venda (INSERT na tabela 'vendas' e 'itens_venda').
 */
async function processarVenda() {
    if (!document.getElementById('clienteIdVenda').value || carrinho.length === 0) {
        document.getElementById('statusVendaMensagem').textContent = '⚠️ Selecione cliente e adicione itens.';
        return;
    }
    
    // Converte o valor de R$ X.XXX,XX para um número
    const totalVendaText = document.getElementById('totalVendaDisplay').textContent;
    const totalVenda = parseFloat(totalVendaText.replace(/[^\d.,]/g, '').replace('.', '').replace(',', '.'));
    const frete = parseFloat(document.getElementById('inputFrete').value) || 0;

    document.getElementById('statusVendaMensagem').textContent = 'Processando venda...';
    
    // 1. Inserir Cabeçalho da Venda ('vendas')
    const dadosVenda = {
        vendedor_id: VENDEDOR_ID_LOGADO,
        cliente_id: document.getElementById('clienteIdVenda').value,
        empresa_id: carrinho[0].empresa_id,
        data_venda: new Date().toISOString(),
        total_venda: totalVenda,
        frete: frete
    };

    const { data: vendaInserida, error: errorVenda } = await supabase
        .from('vendas')
        .insert([dadosVenda])
        .select('id'); 

    if (errorVenda) {
        document.getElementById('statusVendaMensagem').textContent = `❌ Erro ao salvar venda: ${errorVenda.message}`;
        return;
    }

    const vendaId = vendaInserida[0].id;

    // 2. Inserir Detalhes da Venda ('itens_venda')
    const itensParaInserir = carrinho.map(item => ({
        venda_id: vendaId,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario_aplicado: item.preco_unitario_aplicado,
        total_item: item.total_item
    }));

    const { error: errorItens } = await supabase.from('itens_venda').insert(itensParaInserir);

    if (errorItens) {
        document.getElementById('statusVendaMensagem').textContent = `❌ Venda salva, mas ERRO ao salvar itens: ${errorItens.message}`;
        return;
    }

    // 3. Pós-venda
    document.getElementById('vendaIdConfirmacao').textContent = vendaId.substring(0, 8); // Preenche o ID no modal
    document.getElementById('statusVendaMensagem').textContent = `✅ Venda Nº ${vendaId.substring(0, 8)} salva e pronta para envio.`;
    document.getElementById('modalEnvio').style.display = 'block';
    carregarRelatorios(); 
}

// --- Edição de Venda ---

/**
 * Alterna a visibilidade dos botões de Enviar/Cancelar Venda para Salvar/Cancelar Edição.
 */
function alternarBotoesEdicao(emEdicao) {
    btnSalvarEdicao.style.display = emEdicao ? 'inline-block' : 'none';
    btnCancelarEdicao.style.display = emEdicao ? 'inline-block' : 'none';
    btnEnviarVenda.style.display = emEdicao ? 'none' : 'inline-block';
    btnCancelarVenda.style.display = emEdicao ? 'none' : 'inline-block';
}

/**
 * Carrega os dados de uma venda existente para a tela para que possa ser editada.
 * @param {string} vendaId - ID da venda a ser carregada.
 */
async function carregarVendaParaEdicao(vendaId) {
    showTab('vendas'); 
    
    vendaEmEdicaoId = vendaId;
    modoEdicao = true;
    alternarBotoesEdicao(true); 
    
    // 1. Buscar Cabeçalho da Venda e Cliente
    const { data: venda, error: errVenda } = await supabase
        .from('vendas')
        .select('cliente_id, frete, empresa_id, clientes(id, razao_social, telefone, email)')
        .eq('id', vendaId)
        .single();
    
    if (errVenda) { console.error('Erro ao carregar venda:', errVenda); return; }

    // 2. Preenche os dados do Cliente e Frete
    selecionarCliente(venda.clientes);
    document.getElementById('inputFrete').value = venda.frete.toFixed(2);
    document.getElementById('selectEmpresa').value = venda.empresa_id;

    // 3. Buscar Itens da Venda
    const { data: itens } = await supabase
        .from('itens_venda')
        .select('produto_id, quantidade, preco_unitario_aplicado, total_item, produtos(nome, empresa_id)')
        .eq('venda_id', vendaId); 
        
    // 4. Popula o carrinho local com os itens da venda
    carrinho = itens.map(item => ({
        id: Date.now() + Math.random(),
        produto_id: item.produto_id,
        nome_produto: item.produtos.nome,
        empresa_id: item.produtos.empresa_id,
        quantidade: item.quantidade,
        preco_unitario_aplicado: item.preco_unitario_aplicado,
        total_item: item.total_item
    }));
    
    atualizarTabelaCarrinho();
    calcularTotalVenda();
    document.getElementById('statusVendaMensagem').textContent = `Venda N° ${vendaId.substring(0, 8)} carregada para edição.`;
}

/**
 * Salva as alterações de uma venda em edição (UPDATE na 'vendas' e DELETE/INSERT nos 'itens_venda').
 */
async function salvarEdicaoVenda() {
    const totalVendaText = document.getElementById('totalVendaDisplay').textContent;
    const totalVenda = parseFloat(totalVendaText.replace(/[^\d.,]/g, '').replace('.', '').replace(',', '.'));
    const frete = parseFloat(document.getElementById('inputFrete').value) || 0;
    const statusVendaMensagem = document.getElementById('statusVendaMensagem');

    statusVendaMensagem.textContent = 'Salvando edição...';

    // 1. UPDATE na Venda Principal (vendas)
    const { error: errorUpdateVenda } = await supabase
        .from('vendas')
        .update({ cliente_id: document.getElementById('clienteIdVenda').value, total_venda: totalVenda, frete: frete })
        .eq('id', vendaEmEdicaoId); 

    if (errorUpdateVenda) { statusVendaMensagem.textContent = `❌ Erro ao atualizar venda: ${errorUpdateVenda.message}`; return; }

    // 2. DELETE Itens Antigos
    await supabase.from('itens_venda').delete().eq('venda_id', vendaEmEdicaoId);

    // 3. INSERT Itens Novos/Editados
    const itensParaInserir = carrinho.map(item => ({ venda_id: vendaEmEdicaoId, produto_id: item.produto_id, quantidade: item.quantidade, preco_unitario_aplicado: item.preco_unitario_aplicado, total_item: item.total_item }));
    const { error: errorInsertItens } = await supabase.from('itens_venda').insert(itensParaInserir);

    if (errorInsertItens) { statusVendaMensagem.textContent = `❌ Edição salva, mas ERRO ao reinserir itens: ${errorInsertItens.message}`; return; }

    statusVendaMensagem.textContent = `✅ Venda N° ${vendaEmEdicaoId.substring(0, 8)} editada com sucesso!`;
    cancelarEdicao(); 
    carregarRelatorios(); 
}

/**
 * Cancela o modo de edição e limpa a tela.
 */
function cancelarEdicao() {
    modoEdicao = false;
    vendaEmEdicaoId = null;
    alternarBotoesEdicao(false); 
    cancelarVenda(); 
}

/**
 * Limpa o estado e os campos do formulário para uma nova venda.
 */
function cancelarVenda() {
    carrinho = [];
    document.getElementById('clienteIdVenda').value = '';
    document.getElementById('clienteNomeDisplay').textContent = 'Nenhum';
    document.getElementById('buscaCliente').value = '';
    document.getElementById('inputFrete').value = '0.00';
    document.getElementById('statusVendaMensagem').textContent = '';
    atualizarTabelaCarrinho();
    calcularTotalVenda();
    document.getElementById('modalEnvio').style.display = 'none';
    document.getElementById('statusEnvioCliente').textContent = ''; // Limpa status de envio
}


// ====================================================================
// 6. COMUNICAÇÃO (WHATSAPP)
// ====================================================================

/**
 * Gera o texto formatado do pedido para envio via WhatsApp.
 * @param {string} vendaId - ID da venda.
 */
function gerarTextoPedido(vendaId) {
    // ID da venda resumido na mensagem
    let texto = `*PEDIDO Nº ${vendaId.substring(0, 8)}* \n\n`; 
    texto += `Cliente: ${clienteAtual.razao_social}\n`;
    texto += `Vendedor: João Vendedor\n\n`; 
    texto += `*Itens:*\n`;
    
    carrinho.forEach(item => {
        texto += `  - ${item.nome_produto}: ${item.quantidade}x (R$ ${item.total_item.toFixed(2)})\n`;
    });
    
    texto += `\n*Frete:* R$ ${parseFloat(document.getElementById('inputFrete').value).toFixed(2)}\n`;
    texto += `*Total:* ${document.getElementById('totalVendaDisplay').textContent}`;
    return encodeURIComponent(texto);
}

/**
 * Simula o envio de cópia para um número fixo (Gestão/Logística).
 */
async function enviarCopiaWhatsAppFixo(pedidoTexto) {
    const numeroFixo = '5511987654321'; 
    console.log(`SIMULAÇÃO: Cópia enviada para Logística. URL: https://api.whatsapp.com/send?phone=${numeroFixo}&text=${pedidoTexto}`);
}

/**
 * Abre o link de envio de WhatsApp ou simula o envio de Email para o Cliente.
 */
function enviarCopiaCliente() {
    const enviarWhats = document.getElementById('enviaWhatsAppCliente').checked;
    const statusEnvio = document.getElementById('statusEnvioCliente');
    const idParaMensagem = vendaEmEdicaoId || document.getElementById('vendaIdConfirmacao').textContent;

    if (enviarWhats && clienteAtual.telefone) {
        const pedidoTexto = gerarTextoPedido(idParaMensagem);
        const urlWhatsApp = `https://api.whatsapp.com/send?phone=${clienteAtual.telefone}&text=${pedidoTexto}`;
        window.open(urlWhatsApp, '_blank'); 
        statusEnvio.textContent = 'WhatsApp disparado.';
    } else if (enviarWhats) {
         statusEnvio.textContent = 'ERRO: Cliente sem número de telefone cadastrado.';
    }
    // TODO: Lógica de envio de e-mail aqui
}

/**
 * Fecha o modal de opções de envio.
 */
function fecharModalEnvio() {
    document.getElementById('modalEnvio').style.display = 'none';
    cancelarVenda();
}


// ====================================================================
// 7. MÓDULO GESTÃO E RELATÓRIOS
// ====================================================================

// Variáveis para armazenar instâncias dos gráficos (para destruição)
let quemMaisVendeuChartInstance = null;
let itensMaisVendidosChartInstance = null;

/**
 * Carrega todos os dados e renderiza os relatórios na aba 'Gestão'.
 */
async function carregarRelatorios() {
    // 1. Total Vendido (SUM)
    const totalVendidoElement = document.getElementById('totalVendidoValor');
    const { data: totalData } = await supabase.from('vendas').select('total:sum(total_venda)').single();
    const total = totalData ? totalData.total : 0;
    totalVendidoElement.textContent = `R$ ${parseFloat(total).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

    // 2. Quem Mais Vendeu (Usando VIEW: vendedores_rank_vendas)
    const { data: vendedoresRank } = await supabase
        .from('vendedores_rank_vendas') 
        .select('nome_vendedor, total_vendido')
        .limit(5);

    const labelsVendedores = vendedoresRank ? vendedoresRank.map(d => d.nome_vendedor) : ["Vendedor A", "Vendedor B"];
    const valoresVendedores = vendedoresRank ? vendedoresRank.map(d => d.total_vendido) : [0, 0];
    renderizarGraficoBarras('quemMaisVendeuChart', labelsVendedores, valoresVendedores, 'Vendas (R$)', 'Total Vendido por Vendedor');

    // 3. Itens Mais Vendidos (Usando VIEW: produtos_rank_quantidade)
    const { data: produtosRank } = await supabase
        .from('produtos_rank_quantidade') 
        .select('nome_produto, total_quantidade')
        .limit(8);

    const labelsProdutos = produtosRank ? produtosRank.map(d => d.nome_produto) : ["Produto X", "Produto Y"];
    const quantidadesProdutos = produtosRank ? produtosRank.map(d => d.total_quantidade) : [0, 0];
    renderizarGraficoRosca('itensMaisVendidosChart', labelsProdutos, quantidadesProdutos, 'Itens Mais Vendidos (Qtde)');

    // 4. Lista de Vendas Recentes (Usando VIEW: vendas_detalhe_cliente)
    const { data: vendasRecentes } = await supabase
        .from('vendas_detalhe_cliente') 
        .select('*')
        .order('data_venda', { ascending: false })
        .limit(10);
        
    const listaVendas = document.getElementById('listaVendasRecentes');
    listaVendas.innerHTML = '';
    vendasRecentes.forEach(venda => {
        const li = document.createElement('li');
        li.innerHTML = `
            Venda N° ${venda.id.substring(0, 8)} | Cliente: ${venda.nome_cliente} | Total: R$ ${venda.total_venda.toFixed(2)}
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