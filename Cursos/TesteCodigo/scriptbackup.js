let produtosCadastrados = {};
let clientesCadastrados = [
    { id: 1, razaoSocial: "Empresa Exemplo Ltda", nomeFantasia: "Exemplo Tec", cnpj: "12.345.678/0001-90", telefone: "11987654321", comprador: "João Silva", email: "joao@exemplo.com", vendedor: "Maria" },
    { id: 2, razaoSocial: "Comércio de Produtos S.A.", nomeFantasia: "Produtos Agora", cnpj: "98.765.432/0001-12", telefone: "21912345678", comprador: "Ana Costa", email: "ana@produtos.com.br", vendedor: "Pedro" }
];
let inputAtivo = null;

// Variável para o debounce da busca
let timeoutBusca = null;

// Funções para gerenciar o localStorage
function salvarProdutosNoStorage() {
    localStorage.setItem('produtos', JSON.stringify(produtosCadastrados));
}

function salvarClientesNoStorage() {
    localStorage.setItem('clientes', JSON.stringify(clientesCadastrados));
}

// Inicializa a página, carregando os dados corretos
function inicializarPagina() {
    // Carrega produtos
    const produtosSalvos = localStorage.getItem('produtos');
    if (produtosSalvos) {
        produtosCadastrados = JSON.parse(produtosSalvos);
    } else {
        produtosCadastrados = {
            "Notebook": { caixaMaster: 1, precoAtacado: 3000, precoVarejo: 3200 },
            "Mouse": { caixaMaster: 10, precoAtacado: 50, precoVarejo: 65 },
            "Teclado": { caixaMaster: 5, precoAtacado: 100, precoVarejo: 130 },
            "Monitor": { caixaMaster: 1, precoAtacado: 800, precoVarejo: 950 }
        };
        salvarProdutosNoStorage();
    }

    // Carrega clientes
    const clientesSalvos = localStorage.getItem('clientes');
    if (clientesSalvos) {
        clientesCadastrados = JSON.parse(clientesSalvos);
    }

    if (document.getElementById('cadastroProdutos')) {
        renderizarTabelaCadastro();
    } else if (document.getElementById('tabelaVendas')) {
        const campoBusca = document.getElementById('campoBusca');
        campoBusca.addEventListener('input', toggleClearButton);
        buscarCliente(); // Popula a datalist inicial
    } else if (document.getElementById('tabelaClientes')) {
        renderizarTabelaClientes();
        document.getElementById('formCliente').addEventListener('submit', salvarCliente);
    }
}

// Funções para a página de Vendas (index.html)

function selecionarClientePelaBusca() {
    const input = document.getElementById('campoClienteResultado');
    const valorDigitado = input.value;

    const clienteSelecionado = clientesCadastrados.find(cliente => {
        return cliente.razaoSocial === valorDigitado || `${cliente.razaoSocial} | ${cliente.cnpj}` === valorDigitado;
    });

    if (clienteSelecionado) {
        // Preenche os campos do formulário oculto (para envio ao WhatsApp)
        document.getElementById('razaoSocial').value = clienteSelecionado.razaoSocial;
        document.getElementById('cnpj').value = clienteSelecionado.cnpj;
        document.getElementById('telefone').value = clienteSelecionado.telefone;
        document.getElementById('comprador').value = clienteSelecionado.comprador;
        document.getElementById('email').value = clienteSelecionado.email;
        document.getElementById('vendedor').value = clienteSelecionado.vendedor;

        // Exibe e preenche o novo mini-formulário
        const miniForm = document.querySelector('.mini-form-cliente');
        miniForm.classList.remove('oculto');
        document.getElementById('displayRazaoSocial').value = clienteSelecionado.razaoSocial;
        document.getElementById('displayNomeFantasia').value = clienteSelecionado.nomeFantasia || 'N/A';
        document.getElementById('displayCnpj').value = clienteSelecionado.cnpj;

    } else {
        limparCamposCliente();
    }
}

function limparCamposCliente() {
    document.getElementById('campoBusca').value = '';
    document.getElementById('campoClienteResultado').value = '';
    document.getElementById('checkCnpj').checked = false;
    document.getElementById('checkRazaoSocial').checked = false;
    document.getElementById('razaoSocial').value = '';
    document.getElementById('cnpj').value = '';
    document.getElementById('telefone').value = '';
    document.getElementById('comprador').value = '';
    document.getElementById('email').value = '';
    document.getElementById('vendedor').value = '';
    
    // Oculta o mini-formulário
    document.querySelector('.mini-form-cliente').classList.add('oculto');
    buscarCliente(); // Atualiza a lista após limpar
}

// Função de debounce
function debounceBuscarCliente() {
    clearTimeout(timeoutBusca);
    timeoutBusca = setTimeout(buscarCliente, 300);
    toggleClearButton();
}

function limparBusca() {
    document.getElementById('campoBusca').value = '';
    document.querySelector('.clear-button').style.display = 'none';
    buscarCliente();
}

function toggleClearButton() {
    const campoBusca = document.getElementById('campoBusca');
    const clearButton = document.querySelector('.clear-button');
    if (campoBusca.value) {
        clearButton.style.display = 'block';
    } else {
        clearButton.style.display = 'none';
    }
}

function buscarCliente() {
    const termoBusca = document.getElementById('campoBusca').value.toLowerCase();
    const checkCnpj = document.getElementById('checkCnpj');
    const checkRazaoSocial = document.getElementById('checkRazaoSocial');

    // Lógica para que os checkboxes sejam mutuamente exclusivos
    if (event && event.target && (event.target.id === 'checkRazaoSocial' || event.target.id === 'checkCnpj')) {
        if (checkCnpj.checked && event.target.id === 'checkRazaoSocial') {
            checkCnpj.checked = false;
        }
        if (checkRazaoSocial.checked && event.target.id === 'checkCnpj') {
            checkRazaoSocial.checked = false;
        }
    }

    let clientesFiltrados = clientesCadastrados.filter(cliente => {
        if (!termoBusca) {
            return true;
        }

        if (checkCnpj.checked) {
            return cliente.cnpj.toLowerCase().includes(termoBusca);
        }

        if (checkRazaoSocial.checked) {
            return cliente.razaoSocial.toLowerCase().includes(termoBusca) || (cliente.nomeFantasia && cliente.nomeFantasia.toLowerCase().includes(termoBusca));
        }

        // Busca padrão em todos os campos
        return Object.values(cliente).some(valor => 
            String(valor).toLowerCase().includes(termoBusca)
        );
    });

    atualizarDatalist(clientesFiltrados);
}

function atualizarDatalist(clientesFiltrados) {
    const datalist = document.getElementById('listaClientes');
    if (!datalist) return;

    const checkCnpj = document.getElementById('checkCnpj').checked;
    const checkRazaoSocial = document.getElementById('checkRazaoSocial').checked;

    datalist.innerHTML = '';

    clientesFiltrados.forEach(cliente => {
        const option = document.createElement('option');
        
        if (checkCnpj || checkRazaoSocial) {
            option.value = `${cliente.razaoSocial} | ${cliente.cnpj}`;
        } else {
            option.value = cliente.razaoSocial;
        }

        datalist.appendChild(option);
    });
}

function finalizarPedido() {
    const linhas = document.querySelectorAll("#tabelaVendas tbody tr");
    if (linhas.length === 0) {
        alert("Adicione pelo menos um produto ao pedido antes de finalizar!");
        return;
    }

    const clienteInfo = {
        razaoSocial: document.getElementById('razaoSocial').value.trim(),
        comprador: document.getElementById('comprador').value.trim(),
        telefone: document.getElementById('telefone').value.trim(),
        vendedor: document.getElementById('vendedor').value.trim()
    };

    let mensagem = "Novo Pedido:\n\n";

    if (clienteInfo.razaoSocial || clienteInfo.comprador) {
        mensagem += `*Cliente:* ${clienteInfo.razaoSocial || clienteInfo.comprador}\n`;
        if (clienteInfo.telefone) { mensagem += `*Telefone:* ${clienteInfo.telefone}\n`; }
        if (clienteInfo.vendedor) { mensagem += `*Vendedor:* ${clienteInfo.vendedor}\n`; }
        mensagem += "\n";
    }

    let totalGeral = 0;
    linhas.forEach(linha => {
        const produtoNome = linha.cells[0].querySelector("select").value;
        const quantidade = parseFloat(linha.cells[1].querySelector("input").value);
        const precoUnitario = parseFloat(linha.cells[2].querySelector("input").value);
        const totalItem = quantidade * precoUnitario;

        if (produtoNome) {
            mensagem += `* ${produtoNome}\n`;
            mensagem += `   - Quantidade: ${quantidade}\n`;
            mensagem += `   - Valor: R$ ${precoUnitario.toFixed(2).replace('.', ',')}\n`;
            mensagem += `   - Total: R$ ${totalItem.toFixed(2).replace('.', ',')}\n\n`;
            totalGeral += totalItem;
        }
    });

    mensagem += `*Total Geral:* R$ ${totalGeral.toFixed(2).replace('.', ',')}`;

    const numeroWhatsApp = "5535999830663";
    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;

    window.open(url, '_blank');
    
    const tbody = document.querySelector("#tabelaVendas tbody");
    tbody.innerHTML = '';
    document.getElementById("totalGeral").textContent = "0";
    limparCamposCliente();

    alert("Pedido finalizado! A mensagem foi preparada no WhatsApp.");
}

// Funções de Cadastro de Produtos
function renderizarTabelaCadastro() { 
    const tbody = document.querySelector("#cadastroProdutos tbody");
    tbody.innerHTML = '';
    for (const nome in produtosCadastrados) {
        const produto = produtosCadastrados[nome];
        const novaLinha = document.createElement("tr");
        novaLinha.innerHTML = `
            <td>${nome}</td>
            <td>${produto.caixaMaster}</td>
            <td>${produto.precoAtacado}</td>
            <td>${produto.precoVarejo}</td>
            <td><button class="btn-remover" onclick="removerProdutoCadastro(this, '${nome}')">Remover</button></td>
        `;
        tbody.appendChild(novaLinha);
    }
}

function cadastrarProduto() {
    const nome = document.getElementById("novoProduto").value.trim();
    const caixaMaster = parseInt(document.getElementById("novaCaixaMaster").value);
    const precoAtacado = parseFloat(document.getElementById("novoPrecoAtacado").value);
    const precoVarejo = parseFloat(document.getElementById("novoPrecoVarejo").value);
    if (!nome || isNaN(caixaMaster) || caixaMaster <= 0 || isNaN(precoAtacado) || precoAtacado <= 0 || isNaN(precoVarejo) || precoVarejo <= 0) {
        alert("Preencha todos os campos corretamente!");
        return;
    }
    produtosCadastrados[nome] = { caixaMaster: caixaMaster, precoAtacado: precoAtacado, precoVarejo: precoVarejo };
    salvarProdutosNoStorage();
    renderizarTabelaCadastro();
    document.getElementById("novoProduto").value = "";
    document.getElementById("novaCaixaMaster").value = "";
    document.getElementById("novoPrecoAtacado").value = "";
    document.getElementById("novoPrecoVarejo").value = "";
    alert("Produto cadastrado com sucesso!");
}

function removerProdutoCadastro(botao, nomeProduto) {
    if (confirm(`Tem certeza que deseja remover o produto "${nomeProduto}"?`)) {
        delete produtosCadastrados[nomeProduto];
        salvarProdutosNoStorage();
        renderizarTabelaCadastro();
        alert("Produto removido com sucesso!");
    }
}

// Funções para Exportar e Importar Produtos
function exportarProdutos() {
    const dataStr = JSON.stringify(produtosCadastrados, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'produtos.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function importarProdutos(event) {
    const file = event.target.files[0];
    if (!file) { return; }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            produtosCadastrados = importedData;
            salvarProdutosNoStorage();
            renderizarTabelaCadastro();
            alert("Produtos importados com sucesso!");
        } catch (error) {
            alert("Erro ao importar o arquivo. Verifique se o formato JSON está correto.");
        }
    };
    reader.readAsText(file);
}

// Funções de Cadastro de Clientes
function salvarCliente(event) {
    event.preventDefault();
    const razaoSocial = document.getElementById("razaoSocial").value.trim();
    const nomeFantasia = document.getElementById("nomeFantasia").value.trim();
    const cnpj = document.getElementById("cnpj").value.trim();
    const telefone = document.getElementById("telefone").value.trim();
    const comprador = document.getElementById("comprador").value.trim();
    const email = document.getElementById("email").value.trim();
    const vendedor = document.getElementById("vendedor").value.trim();
    if (!razaoSocial || !cnpj || !telefone || !comprador || !email || !vendedor) {
        alert("Todos os campos são de preenchimento obrigatório!");
        return;
    }
    const ultimoId = clientesCadastrados.length > 0 ? clientesCadastrados[clientesCadastrados.length - 1].id : 0;
    const novoId = ultimoId + 1;
    const novoCliente = {
        id: novoId,
        razaoSocial: razaoSocial,
        nomeFantasia: nomeFantasia,
        cnpj: cnpj,
        telefone: telefone,
        comprador: comprador,
        email: email,
        vendedor: vendedor
    };
    clientesCadastrados.push(novoCliente);
    salvarClientesNoStorage();
    renderizarTabelaClientes();
    document.getElementById("formCliente").reset();
    alert("Cliente salvo com sucesso!");
}

function renderizarTabelaClientes() {
    const tbody = document.querySelector("#tabelaClientes tbody");
    tbody.innerHTML = '';
    clientesCadastrados.forEach(cliente => {
        const novaLinha = document.createElement("tr");
        novaLinha.innerHTML = `
            <td>${cliente.id}</td>
            <td>${cliente.razaoSocial}</td>
            <td>${cliente.nomeFantasia}</td>
            <td>${cliente.cnpj}</td>
            <td>${cliente.telefone}</td>
            <td>${cliente.comprador}</td>
            <td>${cliente.email}</td>
            <td>${cliente.vendedor}</td>
        `;
        tbody.appendChild(novaLinha);
    });
}

// Funções para Exportar e Importar Clientes
function exportarClientes() {
    const dataStr = JSON.stringify(clientesCadastrados, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'clientes.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function importarClientes(event) {
    const file = event.target.files[0];
    if (!file) { return; }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            clientesCadastrados = importedData;
            salvarClientesNoStorage();
            renderizarTabelaClientes();
            alert("Clientes importados com sucesso!");
        } catch (error) {
            alert("Erro ao importar o arquivo. Verifique se o formato JSON está correto.");
        }
    };
    reader.readAsText(file);
}

// Funções para Tabela de Vendas
function adicionarProduto() {
    const tbody = document.querySelector("#tabelaVendas tbody");
    const novaLinha = document.createElement("tr");
    let opcoes = "";
    for (const nome in produtosCadastrados) {
        opcoes += `<option value="${nome}">${nome}</option>`;
    }
    novaLinha.innerHTML = `
        <td>
            <select onchange="atualizarPreco(this)">
                <option value="">Selecione...</option>
                ${opcoes}
            </select>
        </td>
        <td><input type="number" value="1" min="0" oninput="calcularTotais()"></td>
        <td><input type="number" value="0" min="0" onclick="exibirTecladoNumerico(this)" readonly></td>
        <td class="total">0</td>
        <td><button class="btn-remover" onclick="removerProduto(this)">Remover</button></td>
    `;
    tbody.appendChild(novaLinha);
}

function finalizarPedido() {
    const linhas = document.querySelectorAll("#tabelaVendas tbody tr");
    if (linhas.length === 0) {
        alert("Adicione pelo menos um produto ao pedido antes de finalizar!");
        return;
    }
    const clienteInfo = {
        razaoSocial: document.getElementById('razaoSocial').value.trim(),
        comprador: document.getElementById('comprador').value.trim(),
        telefone: document.getElementById('telefone').value.trim(),
        vendedor: document.getElementById('vendedor').value.trim()
    };
    let mensagem = "Novo Pedido:\n\n";
    if (clienteInfo.razaoSocial || clienteInfo.comprador) {
        mensagem += `*Cliente:* ${clienteInfo.razaoSocial || clienteInfo.comprador}\n`;
        if (clienteInfo.telefone) { mensagem += `*Telefone:* ${clienteInfo.telefone}\n`; }
        if (clienteInfo.vendedor) { mensagem += `*Vendedor:* ${clienteInfo.vendedor}\n`; }
        mensagem += "\n";
    }
    let totalGeral = 0;
    linhas.forEach(linha => {
        const produtoNome = linha.cells[0].querySelector("select").value;
        const quantidade = parseFloat(linha.cells[1].querySelector("input").value);
        const precoUnitario = parseFloat(linha.cells[2].querySelector("input").value);
        const totalItem = quantidade * precoUnitario;
        if (produtoNome) {
            mensagem += `* ${produtoNome}\n`;
            mensagem += `   - Quantidade: ${quantidade}\n`;
            mensagem += `   - Valor: R$ ${precoUnitario.toFixed(2).replace('.', ',')}\n`;
            mensagem += `   - Total: R$ ${totalItem.toFixed(2).replace('.', ',')}\n\n`;
            totalGeral += totalItem;
        }
    });
    mensagem += `*Total Geral:* R$ ${totalGeral.toFixed(2).replace('.', ',')}`;
    const numeroWhatsApp = "5535999830663";
    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
    const tbody = document.querySelector("#tabelaVendas tbody");
    tbody.innerHTML = '';
    document.getElementById("totalGeral").textContent = "0";
    limparCamposCliente();
    alert("Pedido finalizado! A mensagem foi preparada no WhatsApp.");
}

function exibirTecladoNumerico(input) {
    inputAtivo = input;
    const teclado = document.getElementById('tecladoNumerico');
    if(teclado) { teclado.style.display = 'block'; }
    input.value = '';
    input.focus();
    input.blur();
}

function digitar(digito) {
    if (inputAtivo) {
        if (digito === '.' && inputAtivo.value.includes('.')) { return; }
        inputAtivo.value += digito;
    }
}

function apagar() {
    if (inputAtivo) {
        inputAtivo.value = inputAtivo.value.slice(0, -1);
    }
}

function adicionarValor() {
    if (!inputAtivo) { return; }
    const linha = inputAtivo.closest("tr");
    const selectProduto = linha.cells[0].querySelector("select");
    const produtoSelecionado = selectProduto.value;
    const precoAtacado = produtosCadastrados[produtoSelecionado]?.precoAtacado || 0;
    let novoPreco = parseFloat(inputAtivo.value) || 0;
    if (novoPreco < precoAtacado) {
        inputAtivo.value = precoAtacado;
        alert(`O valor não pode ser menor que o preço de atacado: R$${precoAtacado.toFixed(2).replace('.', ',')}`);
    }
    const teclado = document.getElementById('tecladoNumerico');
    if(teclado) { teclado.style.display = 'none'; }
    calcularTotais();
    inputAtivo = null;
}

function atualizarPreco(select) {
    const produtoSelecionado = select.value;
    const linha = select.closest("tr");
    if (produtoSelecionado && produtosCadastrados[produtoSelecionado] !== undefined) {
        const precoAtacado = produtosCadastrados[produtoSelecionado].precoAtacado;
        linha.cells[2].querySelector("input").value = precoAtacado;
    } else {
        linha.cells[2].querySelector("input").value = 0;
    }
    calcularTotais();
}

function calcularTotais() {
    const linhas = document.querySelectorAll("#tabelaVendas tbody tr");
    let totalGeral = 0;
    linhas.forEach(linha => {
        const qtd = parseFloat(linha.cells[1].querySelector("input").value) || 0;
        const preco = parseFloat(linha.cells[2].querySelector("input").value) || 0;
        const total = qtd * preco;
        linha.querySelector(".total").textContent = total.toFixed(2).replace(".", ",");
        totalGeral += total;
    });
    document.getElementById("totalGeral").textContent = totalGeral.toFixed(2).replace(".", ",");
}

function removerProduto(botao) {
    botao.closest("tr").remove();
    calcularTotais();
}

// Inicia a aplicação
document.addEventListener('DOMContentLoaded', inicializarPagina);