// js/cadastros.js - Módulo CRUD do Dashboard Administrativo

import { supabase, empresaLogada, setEmpresaLogada, formatarMoeda } from './core.js';

// ====================================================================
// 1. LÓGICA DAS SUB-ABAS DE CADASTRO
// ====================================================================

function mostrarConteudoSubAba(alvo) {
    document.querySelectorAll('.conteudo-cadastro').forEach(div => {
        div.style.display = 'none';
    });
    document.getElementById(`conteudo-${alvo}`).style.display = 'block';

    document.querySelectorAll('.sub-aba').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.sub-abas button[data-alvo="${alvo}"]`).classList.add('active');

    // Carrega os dados específicos para a aba
    if (alvo === 'clientes') {
        carregarListaClientes();
    } else if (alvo === 'empresas') {
        carregarListaEmpresas();
    } else if (alvo === 'vendedores') {
        carregarListaVendedores(); 
    } else if (alvo === 'produtos') {
        carregarListaProdutos(); 
    }
}

// ====================================================================
// 2. CRUD DE CLIENTES (ATUALIZADO com Email e Telefone)
// ====================================================================

async function salvarCliente(e) {
    e.preventDefault();
    const id = document.getElementById('inputClienteId').value;
    const razao_social = document.getElementById('inputClienteRazaoSocial').value;
    const cnpj = document.getElementById('inputClienteCnpj').value;
    const email = document.getElementById('inputClienteEmail').value;       // NOVO CAMPO
    const telefone = document.getElementById('inputClienteTelefone').value; // NOVO CAMPO

    const dadosCliente = { razao_social, cnpj, email, telefone };

    if (id) {
        // Atualização
        const { error } = await supabase.from('clientes').update(dadosCliente).eq('id', id);
        if (error) { console.error('Erro ao atualizar cliente:', error); alert('Erro ao atualizar cliente.'); } 
        else { alert('Cliente atualizado com sucesso!'); }
    } else {
        // Inserção
        const { error } = await supabase.from('clientes').insert([dadosCliente]);
        if (error) { console.error('Erro ao salvar cliente:', error); alert('Erro ao salvar cliente.'); } 
        else { alert('Cliente salvo com sucesso!'); }
    }
    document.getElementById('formCliente').reset();
    document.getElementById('inputClienteId').value = '';
    carregarListaClientes();
}

async function carregarListaClientes() {
    // Agora selecionamos também email e telefone
    const { data, error } = await supabase.from('clientes').select('id, razao_social, cnpj, email, telefone').order('razao_social', { ascending: true });
        
    if (error) { console.error('Erro ao carregar lista de clientes:', error); return; }

    const lista = document.getElementById('clientesLista');
    lista.innerHTML = '';
    data.forEach(cliente => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${cliente.razao_social}</td>
            <td>${cliente.cnpj || 'N/A'}</td>
            <td>
                <button class="btn-secondary" onclick="preencherFormularioCliente('${cliente.id}', '${cliente.razao_social}', '${cliente.cnpj || ''}', '${cliente.email || ''}', '${cliente.telefone || ''}')">Editar</button>
                <button class="btn-danger" onclick="deletarCliente('${cliente.id}')">Excluir</button>
            </td>
        `;
        lista.appendChild(tr);
    });
}

function preencherFormularioCliente(id, razao_social, cnpj, email, telefone) {
    document.getElementById('inputClienteId').value = id;
    document.getElementById('inputClienteRazaoSocial').value = razao_social;
    document.getElementById('inputClienteCnpj').value = cnpj;
    document.getElementById('inputClienteEmail').value = email;
    document.getElementById('inputClienteTelefone').value = telefone;
}

async function deletarCliente(id) {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) { console.error('Erro ao excluir cliente:', error); alert('Erro ao excluir cliente.'); } 
    else { alert('Cliente excluído com sucesso!'); carregarListaClientes(); }
}


// ====================================================================
// 3. CRUD DE EMPRESAS (MANTIDO)
// ====================================================================

async function salvarEmpresa(e) {
    e.preventDefault();
    const id = document.getElementById('inputEmpresaId').value;
    const nome = document.getElementById('inputEmpresaNome').value;
    const cnpj = document.getElementById('inputEmpresaCnpj').value;

    const dadosEmpresa = { nome, cnpj };

    if (id) {
        const { error } = await supabase.from('empresas').update(dadosEmpresa).eq('id', id);
        if (error) { console.error('Erro ao atualizar empresa:', error); alert('Erro ao atualizar empresa.'); } 
        else { alert('Empresa atualizada com sucesso!'); }
    } else {
        const { error } = await supabase.from('empresas').insert([dadosEmpresa]);
        if (error) { console.error('Erro ao salvar empresa:', error); alert('Erro ao salvar empresa.'); } 
        else { alert('Empresa salva com sucesso!'); }
    }
    document.getElementById('formEmpresa').reset();
    document.getElementById('inputEmpresaId').value = '';
    carregarListaEmpresas();
}

async function carregarListaEmpresas() {
    const { data, error } = await supabase.from('empresas').select('id, nome, cnpj').order('nome', { ascending: true });
        
    if (error) { console.error('Erro ao carregar lista de empresas:', error); return; }

    const lista = document.getElementById('empresasLista');
    lista.innerHTML = '';
    data.forEach(empresa => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${empresa.nome}</td>
            <td>${empresa.cnpj || 'N/A'}</td>
            <td>
                <button class="btn-secondary" onclick="preencherFormularioEmpresa('${empresa.id}', '${empresa.nome}', '${empresa.cnpj || ''}')">Editar</button>
                <button class="btn-danger" onclick="deletarEmpresa('${empresa.id}')">Excluir</button>
            </td>
        `;
        lista.appendChild(tr);
    });
}

function preencherFormularioEmpresa(id, nome, cnpj) {
    document.getElementById('inputEmpresaId').value = id;
    document.getElementById('inputEmpresaNome').value = nome;
    document.getElementById('inputEmpresaCnpj').value = cnpj;
}

async function deletarEmpresa(id) {
    if (!confirm('Tem certeza que deseja excluir esta empresa?')) return;
    const { error } = await supabase.from('empresas').delete().eq('id', id);
    if (error) { console.error('Erro ao excluir empresa:', error); alert('Erro ao excluir empresa.'); } 
    else { alert('Empresa excluída com sucesso!'); carregarListaEmpresas(); }
}


// ====================================================================
// 4. ASSOCIAÇÃO DE VENDEDORES (ATUALIZADO com UID e Nível de Acesso)
// ====================================================================

async function salvarVendedor(e) {
    e.preventDefault();
    
    // Novos campos no Admin:
    const vendedorId = document.getElementById('inputVendedorId').value; // UID do Auth
    const empresaId = document.getElementById('inputVendedorEmpresaId').value; // ID da Empresa
    const comissao = parseFloat(document.getElementById('inputVendedorComissao').value);
    const nivel = document.getElementById('inputVendedorNivel').value; // Nível de Acesso

    // Validação básica
    if (!vendedorId || !empresaId || isNaN(comissao)) {
        alert('Preencha todos os campos corretamente (ID do Vendedor, ID da Empresa e Comissão).');
        return;
    }
    
    // Verifica se já existe uma associação para fazer UPDATE
    const { data: existente, error: checkError } = await supabase
        .from('vendedor_empresa_comissao')
        .select('id')
        .eq('vendedor_id', vendedorId)
        .single();
    
    if (checkError && checkError.code !== 'PGRST116') { 
        console.error('Erro ao verificar associação existente:', checkError);
        return;
    }

    const dadosAssociacao = {
        vendedor_id: vendedorId,
        empresa_id: empresaId,
        comissao_percentual: comissao,
        nivel_acesso: nivel // NOVO CAMPO
    };

    if (existente) {
        // Atualiza a associação
        const { error: updateError } = await supabase
            .from('vendedor_empresa_comissao')
            .update(dadosAssociacao)
            .eq('id', existente.id);
            
        if (updateError) { console.error('Erro ao atualizar associação:', updateError); alert('Erro ao atualizar associação.'); } 
        else { alert(`Associação e Nível de Acesso (${nivel}) atualizados com sucesso!`); }

    } else {
        // Insere nova associação
        const { error: insertError } = await supabase
            .from('vendedor_empresa_comissao')
            .insert([dadosAssociacao]);
            
        if (insertError) { console.error('Erro ao associar vendedor:', insertError); alert('Erro ao associar vendedor.'); } 
        else { alert(`Vendedor ${vendedorId.substring(0, 8)}... associado com sucesso!`); }
    }
    
    document.getElementById('formVendedor').reset();
    carregarListaVendedores();
}

async function carregarListaVendedores() {
    // Usamos a VIEW para buscar os dados de forma consolidada, incluindo o Nível
    const { data, error } = await supabase
        .from('vendedor_empresa_view') 
        .select('vendedor_id, empresa_nome, comissao_percentual, nivel_acesso') // Seleciona Nível
        .order('empresa_nome', { ascending: true });
        
    if (error) { console.error('Erro ao carregar lista de vendedores:', error); return; }

    const lista = document.getElementById('vendedoresLista');
    lista.innerHTML = '';
    data.forEach(vendedor => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${vendedor.vendedor_id.substring(0, 8)}...</td>
            <td>${vendedor.empresa_nome}</td>
            <td>${vendedor.nivel_acesso.toUpperCase()}</td>
            <td>
                <button class="btn-danger" onclick="deletarAssociacaoVendedor('${vendedor.vendedor_id}')">Excluir</button>
            </td>
        `;
        lista.appendChild(tr);
    });
}

async function deletarAssociacaoVendedor(vendedor_id) {
    if (!confirm('Tem certeza que deseja desassociar este vendedor e remover suas permissões?')) return;
    
    // A exclusão é feita na tabela original
    const { error } = await supabase
        .from('vendedor_empresa_comissao')
        .delete()
        .eq('vendedor_id', vendedor_id); 

    if (error) { console.error('Erro ao desassociar vendedor:', error); alert('Erro ao desassociar vendedor.'); } 
    else { alert('Vendedor desassociado com sucesso!'); carregarListaVendedores(); }
}


// ====================================================================
// 5. CRUD DE PRODUTOS (MANTIDO)
// ====================================================================

async function salvarProduto(e) {
    e.preventDefault();
    if (!empresaLogada) {
        alert('Associe-se a uma empresa para cadastrar produtos.');
        return;
    }
    
    const id = document.getElementById('inputProdutoCadastroId').value;
    const nome = document.getElementById('inputProdutoCadastroNome').value;
    const valor_unitario = parseFloat(document.getElementById('inputProdutoCadastroValor').value);

    const dadosProduto = { nome, valor_unitario, empresa_id: empresaLogada };

    if (id) {
        const { error } = await supabase.from('produtos').update(dadosProduto).eq('id', id);
        if (error) { console.error('Erro ao atualizar produto:', error); alert('Erro ao atualizar produto.'); } 
        else { alert('Produto atualizado com sucesso!'); }
    } else {
        const { error } = await supabase.from('produtos').insert([dadosProduto]);
        if (error) { console.error('Erro ao salvar produto:', error); alert('Erro ao salvar produto.'); } 
        else { alert('Produto salvo com sucesso!'); }
    }
    document.getElementById('formProduto').reset();
    document.getElementById('inputProdutoCadastroId').value = '';
    carregarListaProdutos();
}

async function carregarListaProdutos() {
    if (!empresaLogada) {
        document.getElementById('produtosLista').innerHTML = '<tr><td colspan="3">Nenhuma empresa logada.</td></tr>';
        return;
    }
    
    const { data, error } = await supabase.from('produtos')
        .select('id, nome, valor_unitario')
        .eq('empresa_id', empresaLogada)
        .order('nome', { ascending: true });
        
    if (error) { console.error('Erro ao carregar lista de produtos:', error); return; }

    const lista = document.getElementById('produtosLista');
    lista.innerHTML = '';
    data.forEach(produto => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${produto.nome}</td>
            <td>${formatarMoeda(produto.valor_unitario)}</td>
            <td>
                <button class="btn-secondary" onclick="preencherFormularioProduto('${produto.id}', '${produto.nome}', ${produto.valor_unitario})">Editar</button>
                <button class="btn-danger" onclick="deletarProduto('${produto.id}')">Excluir</button>
            </td>
        `;
        lista.appendChild(tr);
    });
}

function preencherFormularioProduto(id, nome, valor_unitario) {
    document.getElementById('inputProdutoCadastroId').value = id;
    document.getElementById('inputProdutoCadastroNome').value = nome;
    document.getElementById('inputProdutoCadastroValor').value = valor_unitario;
}

async function deletarProduto(id) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    const { error } = await supabase.from('produtos').delete().eq('id', id);
    if (error) { console.error('Erro ao excluir produto:', error); alert('Erro ao excluir produto.'); } 
    else { alert('Produto excluído com sucesso!'); carregarListaProdutos(); }
}


// ====================================================================
// 6. INICIALIZAÇÃO DO MÓDULO
// ====================================================================

export function initCadastros() {
    // 1. Configura Listeners das Sub-Abas
    document.querySelectorAll('.sub-abas .sub-aba').forEach(btn => {
        btn.addEventListener('click', (e) => mostrarConteudoSubAba(e.target.dataset.alvo));
    });

    // 2. Torna funções globais para serem acessadas por onclick no HTML
    window.mostrarConteudoSubAba = mostrarConteudoSubAba;
    
    // Cliente
    window.preencherFormularioCliente = preencherFormularioCliente;
    window.deletarCliente = deletarCliente;
    const formCliente = document.getElementById('formCliente');
    if (formCliente) formCliente.addEventListener('submit', salvarCliente);

    // Empresa
    window.preencherFormularioEmpresa = preencherFormularioEmpresa;
    window.deletarEmpresa = deletarEmpresa;
    const formEmpresa = document.getElementById('formEmpresa');
    if (formEmpresa) formEmpresa.addEventListener('submit', salvarEmpresa);
    
    // Vendedor
    window.deletarAssociacaoVendedor = deletarAssociacaoVendedor;
    const formVendedor = document.getElementById('formVendedor');
    if (formVendedor) formVendedor.addEventListener('submit', salvarVendedor);
    
    // Produto
    window.preencherFormularioProduto = preencherFormularioProduto;
    window.deletarProduto = deletarProduto;
    const formProduto = document.getElementById('formProduto');
    if (formProduto) formProduto.addEventListener('submit', salvarProduto);

    // Carrega a primeira aba por padrão
    mostrarConteudoSubAba('clientes');
}