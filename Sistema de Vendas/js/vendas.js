// js/vendas.js

// Importações do módulo principal
import { supabase, VENDEDOR_ID_LOGADO, empresaLogada, setEmpresaLogada } from './main.js';

// ====================================================================
// Variáveis e Helpers
// ====================================================================

let carrinho = [];

function formatarMoeda(valor) {
    const valorNumerico = parseFloat(valor);
    if (isNaN(valorNumerico)) return 'R$ 0,00';
    
    return valorNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ====================================================================
// 1. LÓGICA DE CARREGAMENTO INICIAL E FILTRO DE EMPRESA (SOLUÇÃO VIEW)
// ====================================================================

/**
 * Carrega a empresa principal do vendedor logado usando uma View do BD.
 * SOLUÇÃO FINAL: Evita ambiguidade consultando uma View pré-filtrada.
 */
export async function carregarEmpresaVendedor() {
    console.log('2.1 Tentando carregar empresa para o Vendedor:', VENDEDOR_ID_LOGADO);
    
    // Agora consultamos a VIEW criada no banco de dados
    const { data, error } = await supabase
        .from('vendedor_empresa_view') // <-- CONSULTANDO A VIEW
        .select('empresa_id_fk, empresa_nome') 
        .eq('vendedor_id', VENDEDOR_ID_LOGADO)
        .single();
    
    // 1. Tratamento de erro "Não Encontrado" (PGRST116)
    if (error && error.code === 'PGRST116') {
        document.getElementById('infoVendedor').innerHTML = '⚠️ Vendedor não associado a uma empresa. Use Cadastros &gt; Vendedores.';
        document.getElementById('inputProduto').disabled = true;
        document.getElementById('btnAdicionarProduto').disabled = true;
        return;
    }
    
    // 2. Tratamento de outros erros de BD 
    if (error) { 
        console.error('Erro ao carregar empresa do vendedor:', error.message);
        document.getElementById('infoVendedor').innerHTML = `⚠️ Erro de BD. (RESOLVA A AMBIGUIDADE COM A VIEW): ${error.message}`;
        document.getElementById('inputProduto').disabled = true;
        document.getElementById('btnAdicionarProduto').disabled = true;
        return;
    }

    if (data && data.empresa_id_fk) {
        // ACESSO AO DADO: O objeto virá com as colunas diretas da View
        const empresaId = data.empresa_id_fk;
        const empresaNome = data.empresa_nome; 
        
        setEmpresaLogada(empresaId);
        document.getElementById('infoVendedor').innerHTML = `Vendedor Logado: **[Vendedor ID ${VENDEDOR_ID_LOGADO.substring(0, 8)}]** | Empresa Atual: **${empresaNome}**`;
        
        // Habilitar a venda se a empresa for carregada
        document.getElementById('inputProduto').disabled = false;
        document.getElementById('btnAdicionarProduto').disabled = false;
    } else {
        document.getElementById('infoVendedor').innerHTML = '⚠️ Vendedor não associado ou dados incompletos.';
        document.getElementById('inputProduto').disabled = true;
        document.getElementById('btnAdicionarProduto').disabled = true;
    }
}


// ====================================================================
// 2. LÓGICA DE AUTOCOMPLETE (Cliente e Produto) - CORRIGIDO
// ====================================================================

/**
 * Busca e exibe sugestões de clientes.
 */
async function buscarClientes(termo) {
    if (termo.length < 3) {
        document.getElementById('clienteSugestoes').innerHTML = '';
        return;
    }

    const { data, error } = await supabase
        .from('clientes')
        .select('id, razao_social')
        .ilike('razao_social', `%${termo}%`) 
        .limit(10);

    if (error) {
        console.error('Erro ao buscar clientes:', error);
        return;
    }

    const sugestoes = document.getElementById('clienteSugestoes');
    sugestoes.innerHTML = '';

    data.forEach(cliente => {
        const li = document.createElement('li');
        li.textContent = cliente.razao_social;
        li.addEventListener('click', () => {
            document.getElementById('inputCliente').value = cliente.razao_social;
            document.getElementById('inputClienteId').value = cliente.id;
            sugestoes.innerHTML = '';
        });
        sugestoes.appendChild(li);
    });
}

/**
 * Busca e exibe sugestões de produtos (FILTRADO PELA EMPRESA LOGADA).
 */
async function buscarProdutos(termo) {
    const sugestoes = document.getElementById('produtoSugestoes');

    if (!empresaLogada) {
        sugestoes.innerHTML = '<li style="color: red;">Vendedor sem empresa associada.</li>';
        return;
    }
    
    if (termo.length < 3) {
        sugestoes.innerHTML = '';
        return;
    }
    
    const { data, error } = await supabase
        .from('produtos')
        .select('id, nome, valor_unitario')
        .eq('empresa_id', empresaLogada) 
        .ilike('nome', `%${termo}%`) 
        .limit(10);

    if (error) {
        console.error('Erro ao buscar produtos:', error);
        return;
    }

    sugestoes.innerHTML = '';

    data.forEach(produto => {
        const li = document.createElement('li');
        li.textContent = `${produto.nome} (${formatarMoeda(produto.valor_unitario)})`;
        li.addEventListener('click', () => {
            document.getElementById('inputProduto').value = produto.nome;
            document.getElementById('inputProdutoId').value = produto.id;
            document.getElementById('inputValorUnitarioBase').value = produto.valor_unitario;
            sugestoes.innerHTML = '';
            document.getElementById('inputQuantidade').focus();
        });
        sugestoes.appendChild(li);
    });
}

// ====================================================================
// 3. LÓGICA DO CARRINHO
// ====================================================================

function adicionarProdutoAoCarrinho() {
    const produtoId = document.getElementById('inputProdutoId').value;
    const produtoNome = document.getElementById('inputProduto').value;
    let valorBase = parseFloat(document.getElementById('inputValorUnitarioBase').value);
    const quantidade = parseInt(document.getElementById('inputQuantidade').value);
    const descontoPercentual = parseFloat(document.getElementById('inputDesconto').value) || 0;

    if (!produtoId || quantidade <= 0 || isNaN(valorBase)) {
        alert('Selecione um produto válido e informe uma quantidade.');
        return;
    }

    const descontoFator = 1 - (descontoPercentual / 100);
    const valorUnitarioFinal = valorBase * descontoFator;
    const totalItem = valorUnitarioFinal * quantidade;

    const novoItem = {
        produto_id: produtoId,
        nome: produtoNome,
        quantidade: quantidade,
        valor_base: valorBase,
        desconto_percentual: descontoPercentual,
        valor_unitario_final: valorUnitarioFinal,
        total: totalItem
    };

    carrinho.push(novoItem);
    renderizarCarrinho();
    limparInputsProduto();
}

function limparInputsProduto() {
    document.getElementById('inputProduto').value = '';
    document.getElementById('inputProdutoId').value = '';
    document.getElementById('inputValorUnitarioBase').value = '';
    document.getElementById('inputQuantidade').value = '1';
    document.getElementById('inputDesconto').value = '0.00';
}

function removerItemCarrinho(index) {
    carrinho.splice(index, 1);
    renderizarCarrinho();
}

function calcularTotais() {
    let subtotal = carrinho.reduce((acc, item) => acc + item.total, 0);
    const frete = parseFloat(document.getElementById('inputFrete').value) || 0;
    const totalGeral = subtotal + frete;

    document.getElementById('subtotalValor').textContent = formatarMoeda(subtotal);
    document.getElementById('freteValorDisplay').textContent = frete.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    document.getElementById('totalGeralValor').textContent = formatarMoeda(totalGeral);

    return { subtotal, frete, totalGeral };
}

function renderizarCarrinho() {
    const listaCarrinho = document.getElementById('listaCarrinho');
    listaCarrinho.innerHTML = '';

    if (carrinho.length === 0) {
        listaCarrinho.innerHTML = '<li>Carrinho vazio. Adicione um produto acima.</li>';
    } else {
        carrinho.forEach((item, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    ${item.nome} (${item.quantidade}x)<br>
                    <small>R$ ${item.valor_unitario_final.toFixed(2)} unit. (Desc: ${item.desconto_percentual}%)</small>
                </div>
                <div>
                    <strong>${formatarMoeda(item.total)}</strong>
                    <button onclick="removerItemCarrinho(${index})">X</button>
                </div>
            `;
            listaCarrinho.appendChild(li);
        });
    }

    calcularTotais();
}

// ====================================================================
// 4. LÓGICA DE FINALIZAÇÃO DE VENDA
// ====================================================================

async function finalizarVenda(event) {
    event.preventDefault();

    const clienteId = document.getElementById('inputClienteId').value;
    if (!clienteId) {
        alert('Selecione um cliente para finalizar a venda.');
        return;
    }
    if (carrinho.length === 0) {
        alert('O carrinho está vazio.');
        return;
    }
    if (!empresaLogada) {
         alert('Vendedor não está associado a nenhuma empresa. Não é possível finalizar a venda.');
        return;
    }

    const { subtotal, frete, totalGeral } = calcularTotais();

    // 1. Inserir a Venda Principal (Cabeçalho)
    const vendaData = {
        vendedor_id: VENDEDOR_ID_LOGADO,
        cliente_id: clienteId,
        empresa_id: empresaLogada,
        data_venda: new Date().toISOString(),
        valor_subtotal: subtotal,
        valor_frete: frete,
        valor_total: totalGeral
    };

    const { data: vendaInserida, error: vendaError } = await supabase
        .from('vendas')
        .insert([vendaData])
        .select();

    if (vendaError) {
        console.error('Erro ao salvar venda:', vendaError);
        alert(`Erro ao finalizar a venda: ${vendaError.message}`);
        return;
    }

    const novaVendaId = vendaInserida[0].id;
    
    // 2. Inserir os Itens da Venda (Detalhes)
    const itensVenda = carrinho.map(item => ({
        venda_id: novaVendaId,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        valor_unitario_base: item.valor_base,
        desconto_percentual: item.desconto_percentual,
        valor_unitario_final: item.valor_unitario_final,
        valor_total_item: item.total
    }));

    const { error: itensError } = await supabase
        .from('itens_venda')
        .insert(itensVenda);

    if (itensError) {
        console.error('Erro ao salvar itens da venda:', itensError);
        alert(`Venda registrada, mas houve erro ao salvar os itens: ${itensError.message}. Consulte o administrador.`);
        return;
    }

    // Sucesso
    alert(`Venda nº ${novaVendaId.substring(0, 8)} finalizada com sucesso! Total: ${formatarMoeda(totalGeral)}`);
    limparFormularioVenda();
}

function limparFormularioVenda() {
    document.getElementById('formVenda').reset();
    document.getElementById('inputClienteId').value = '';
    document.getElementById('inputFrete').value = '0.00';
    carrinho = [];
    renderizarCarrinho();
}

// ====================================================================
// 5. INICIALIZAÇÃO DO MÓDULO
// ====================================================================

export function initVendas() {
    window.removerItemCarrinho = removerItemCarrinho; 
    
    // Listeners de Autocomplete
    document.getElementById('inputCliente').addEventListener('input', (e) => buscarClientes(e.target.value));
    document.getElementById('inputProduto').addEventListener('input', (e) => buscarProdutos(e.target.value));

    // Listeners de Carrinho e Venda
    document.getElementById('btnAdicionarProduto').addEventListener('click', adicionarProdutoAoCarrinho);
    document.getElementById('inputFrete').addEventListener('input', calcularTotais);
    document.getElementById('formVenda').addEventListener('submit', finalizarVenda);

    renderizarCarrinho();
}