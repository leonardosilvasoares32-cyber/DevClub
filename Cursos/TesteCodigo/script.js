let produtosCadastrados = {};
let clientesCadastrados = [
    { id: 1, razaoSocial: "Empresa Exemplo Ltda", nomeFantasia: "Exemplo Tec", cnpj: "12.345.678/0001-90", telefone: "11987654321", comprador: "João Silva", email: "joao@exemplo.com", vendedor: "Maria" },
    { id: 2, razaoSocial: "Comércio de Produtos S.A.", nomeFantasia: "Produtos Agora", cnpj: "98.765.432/0001-12", telefone: "21912345678", comprador: "Ana Costa", email: "ana@produtos.com.br", vendedor: "Pedro" }
];
let inputAtivo = null;
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
        // Lista de produtos padrão atualizada
        produtosCadastrados = {
            "Kalamata 500ml": { caixaMaster: { caixa1: 1, caixa2: 12 }, precoAtacado: 15.00, precoVarejo: 18.00 },
            "Kalamata 900ml": { caixaMaster: { caixa1: 1, caixa2: 6 }, precoAtacado: 25.00, precoVarejo: 28.00 },
            "Kalamata 2L": { caixaMaster: { caixa1: 1, caixa2: 4 }, precoAtacado: 45.00, precoVarejo: 50.00 },
            "Kalamata 5L": { caixaMaster: { caixa1: 1, caixa2: 2 }, precoAtacado: 90.00, precoVarejo: 100.00 },
            "Paladino Tipo Unico 500ml": { caixaMaster: { caixa1: 1, caixa2: 12 }, precoAtacado: 12.00, precoVarejo: 15.00 },
            "Paladino Ex. Virgem 500ml": { caixaMaster: { caixa1: 1, caixa2: 12 }, precoAtacado: 18.00, precoVarejo: 22.00 },
            "Paladino Ex. Virgem 5L": { caixaMaster: { caixa1: 1, caixa2: 4 }, precoAtacado: 95.00, precoVarejo: 110.00 },
            "Pergamo Tipo Unico 5L": { caixaMaster: { caixa1: 1, caixa2: 4 }, precoAtacado: 80.00, precoVarejo: 90.00 },
            "Betula Ex. Virgem 1L": { caixaMaster: { caixa1: 1, caixa2: 6 }, precoAtacado: 35.00, precoVarejo: 40.00 },
            "Betula Ec. Virgem 5L": { caixaMaster: { caixa1: 1, caixa2: 4 }, precoAtacado: 150.00, precoVarejo: 170.00 },
            "Portto Tipo Unico 500ml": { caixaMaster: { caixa1: 1, caixa2: 12 }, precoAtacado: 10.00, precoVarejo: 13.00 },
            "Portto Ex. Virgem 500ml": { caixaMaster: { caixa1: 1, caixa2: 12 }, precoAtacado: 16.00, precoVarejo: 20.00 },
            "Vinagre Org. Maca": { caixaMaster: { caixa1: 1, caixa2: 6 }, precoAtacado: 8.00, precoVarejo: 10.00 }
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
        const checkCadastrado = document.getElementById('checkClienteCadastrado');
        const checkNaoCadastrado = document.getElementById('checkClienteNaoCadastrado');
        checkCadastrado.addEventListener('change', () => {
            handleCheckboxChange(checkCadastrado, 'cadastrado');
            verificarEAtivarAdicionarProduto();
        });
        checkNaoCadastrado.addEventListener('change', () => {
            handleCheckboxChange(checkNaoCadastrado, 'naoCadastrado');
            verificarEAtivarAdicionarProduto();
        });
        
        document.getElementById('campoCnpj').addEventListener('input', verificarEAtivarAdicionarProduto);
        const camposNaoCadastrado = document.querySelectorAll('#secaoClienteNaoCadastrado input');
        camposNaoCadastrado.forEach(input => {
            input.addEventListener('input', verificarEAtivarAdicionarProduto);
        });
        
        atualizarDatalistCnpj();

    } else if (document.getElementById('tabelaClientes')) {
        renderizarTabelaClientes();
        document.getElementById('formCliente').addEventListener('submit', salvarCliente);
    }
}

// Funções para a Tabela de Vendas
function adicionarProduto() {
    const tbody = document.querySelector("#tabelaVendas tbody");
    const novaLinha = document.createElement("tr");
    let opcoes = "";
    for (const nome in produtosCadastrados) {
        opcoes += `<option value="${nome}">${nome}</option>`;
    }
    novaLinha.innerHTML = `
        <td>
            <select class="selecionar-produto" onchange="atualizarInformacoes(this)">
                <option value="">Selecione...</option>
                ${opcoes}
            </select>
        </td>
        <td>
            <select class="selecionar-caixa" onchange="atualizarQuantidade(this)">
                <option value="">Selecione...</option>
            </select>
        </td>
        <td><input type="number" value="1" min="0" oninput="calcularTotais()"></td>
        <td><input type="number" value="0" min="0" onclick="exibirTecladoNumerico(this)" readonly></td>
        <td class="total">0</td>
        <td><button class="btn-remover" onclick="removerProduto(this)">Remover</button></td>
    `;
    tbody.appendChild(novaLinha);
}

// Nova função para atualizar todas as informações após a seleção do produto
function atualizarInformacoes(selectProduto) {
    const produtoSelecionado = selectProduto.value;
    const linha = selectProduto.closest("tr");
    const selectCaixa = linha.querySelector(".selecionar-caixa");
    const inputPreco = linha.cells[3].querySelector("input");
    const inputQuantidade = linha.cells[2].querySelector("input");

    // Limpa as opções da caixa master
    selectCaixa.innerHTML = '<option value="">Selecione...</option>';

    if (produtoSelecionado && produtosCadastrados[produtoSelecionado]) {
        const produto = produtosCadastrados[produtoSelecionado];
        
        // Adiciona as opções de caixa master
        selectCaixa.innerHTML += `<option value="${produto.caixaMaster.caixa1}">Opção 1 (${produto.caixaMaster.caixa1} un)</option>`;
        selectCaixa.innerHTML += `<option value="${produto.caixaMaster.caixa2}">Opção 2 (${produto.caixaMaster.caixa2} un)</option>`;

        // Preenche o valor unitário
        inputPreco.value = produto.precoAtacado;
    } else {
        inputPreco.value = 0;
    }

    // Recalcula os totais
    calcularTotais();
}

// Nova função para atualizar a quantidade quando a caixa master é selecionada
function atualizarQuantidade(selectCaixa) {
    const linha = selectCaixa.closest("tr");
    const inputQuantidade = linha.cells[2].querySelector("input");
    const quantidadeSelecionada = parseInt(selectCaixa.value) || 0;
    
    inputQuantidade.value = quantidadeSelecionada;
    calcularTotais();
}

function finalizarPedido() {
    const linhas = document.querySelectorAll("#tabelaVendas tbody tr");
    if (linhas.length === 0) {
        alert("Adicione pelo menos um produto ao pedido antes de finalizar!");
        return;
    }

    const clienteInfo = {
        razaoSocial: document.getElementById('razaoSocial').value.trim(),
        nomeFantasia: document.getElementById('nomeFantasia').value.trim(),
        cnpj: document.getElementById('cnpj').value.trim(),
        comprador: document.getElementById('comprador').value.trim(),
        telefone: document.getElementById('telefone').value.trim(),
        vendedor: document.getElementById('vendedor').value.trim()
    };
    
    if (!clienteInfo.razaoSocial || !clienteInfo.cnpj || !clienteInfo.telefone || !clienteInfo.comprador || !clienteInfo.vendedor) {
        alert("Por favor, preencha todas as informações do cliente antes de finalizar o pedido.");
        return;
    }

    let mensagem = "Novo Pedido:\n\n";
    mensagem += `*Razão Social:* ${clienteInfo.razaoSocial}\n`;
    if (clienteInfo.nomeFantasia) { mensagem += `*Nome Fantasia:* ${clienteInfo.nomeFantasia}\n`; }
    mensagem += `*CNPJ:* ${clienteInfo.cnpj}\n`;
    mensagem += `*Telefone:* ${clienteInfo.telefone}\n`;
    mensagem += `*Comprador:* ${clienteInfo.comprador}\n`;
    mensagem += `*Vendedor:* ${clienteInfo.vendedor}\n\n`;

    let totalGeral = 0;
    linhas.forEach(linha => {
        const produtoNome = linha.cells[0].querySelector("select").value;
        const caixaMaster = linha.cells[1].querySelector("select").value;
        const quantidade = parseFloat(linha.cells[2].querySelector("input").value);
        const precoUnitario = parseFloat(linha.cells[3].querySelector("input").value);
        const totalItem = quantidade * precoUnitario;

        if (produtoNome) {
            mensagem += `* ${produtoNome} (Caixa: ${caixaMaster} un)\n`;
            mensagem += `   - Quantidade: ${quantidade}\n`;
            mensagem += `   - Valor: R$ ${precoUnitario.toFixed(2).replace('.', ',')}\n`;
            mensagem += `   - Total: R$ ${totalItem.toFixed(2).replace('.', ',')}\n\n`;
            totalGeral += totalItem;
        }
    });

    mensagem += `*Total Geral:* R$ ${totalGeral.toFixed(2).replace('.', ',')}`;

    // 1. GERA E FAZ O DOWNLOAD DO ARQUIVO .TXT
    const filename = `Pedido_${clienteInfo.cnpj.replace(/[^0-9]/g, '')}.txt`; // Cria um nome de arquivo a partir do CNPJ
    const blob = new Blob([mensagem], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // 2. ABRE O WHATSAPP COM A MENSAGEM
    const numeroWhatsApp = "5535999830663";
    const whatsappUrl = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;
    window.open(whatsappUrl, '_blank');
    
    // Limpa a tabela e os campos após a finalização
    const tbody = document.querySelector("#tabelaVendas tbody");
    tbody.innerHTML = '';
    document.getElementById("totalGeral").textContent = "0";
    limparCamposCliente();

    alert("Pedido finalizado! Um arquivo .txt foi baixado e a mensagem foi preparada no WhatsApp.");
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

function calcularTotais() {
    const linhas = document.querySelectorAll("#tabelaVendas tbody tr");
    let totalGeral = 0;
    linhas.forEach(linha => {
        const qtd = parseFloat(linha.cells[2].querySelector("input").value) || 0;
        const preco = parseFloat(linha.cells[3].querySelector("input").value) || 0;
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

function handleCheckboxChange(checkbox, tipo) {
    const checkCadastrado = document.getElementById('checkClienteCadastrado');
    const checkNaoCadastrado = document.getElementById('checkClienteNaoCadastrado');
    const secaoCadastrado = document.getElementById('secaoClienteCadastrado');
    const secaoNaoCadastrado = document.getElementById('secaoClienteNaoCadastrado');

    if (checkbox.checked) {
        if (tipo === 'cadastrado') {
            checkNaoCadastrado.checked = false;
            secaoCadastrado.classList.remove('oculto');
            secaoNaoCadastrado.classList.add('oculto');
        } else {
            checkCadastrado.checked = false;
            secaoCadastrado.classList.add('oculto');
            secaoNaoCadastrado.classList.remove('oculto');
        }
    } else {
        secaoCadastrado.classList.add('oculto');
        secaoNaoCadastrado.classList.add('oculto');
    }
}

function verificarEAtivarAdicionarProduto() {
    const checkCadastrado = document.getElementById('checkClienteCadastrado')?.checked;
    const checkNaoCadastrado = document.getElementById('checkClienteNaoCadastrado')?.checked;
    const botaoAdicionar = document.querySelector('.botoes-inferiores button');
    let camposPreenchidos = false;

    if (checkCadastrado) {
        const cnpj = document.getElementById('campoCnpj').value.trim();
        const clienteEncontrado = clientesCadastrados.find(cliente => cliente.cnpj === cnpj);
        if (clienteEncontrado) {
            camposPreenchidos = true;
        }
    } else if (checkNaoCadastrado) {
        const razaoSocial = document.getElementById('razaoSocial').value.trim();
        const cnpj = document.getElementById('cnpj').value.trim();
        const telefone = document.getElementById('telefone').value.trim();
        const comprador = document.getElementById('comprador').value.trim();
        const email = document.getElementById('email').value.trim();
        const vendedor = document.getElementById('vendedor').value.trim();
        
        if (razaoSocial && cnpj && telefone && comprador && email && vendedor) {
            camposPreenchidos = true;
        }
    }

    if(botaoAdicionar) {
        botaoAdicionar.disabled = !camposPreenchidos;
    }
}

function debounceBuscarCnpj() {
    clearTimeout(timeoutBusca);
    timeoutBusca = setTimeout(() => {
        selecionarClientePorCnpj();
        verificarEAtivarAdicionarProduto();
    }, 300);
}

function selecionarClientePorCnpj() {
    const campoCnpj = document.getElementById('campoCnpj');
    const cnpjDigitado = campoCnpj.value.trim();
    const clienteEncontrado = clientesCadastrados.find(cliente => cliente.cnpj.includes(cnpjDigitado));

    if (clienteEncontrado) {
        document.getElementById('razaoSocial').value = clienteEncontrado.razaoSocial;
        document.getElementById('nomeFantasia').value = clienteEncontrado.nomeFantasia || '';
        document.getElementById('cnpj').value = clienteEncontrado.cnpj;
        document.getElementById('telefone').value = clienteEncontrado.telefone;
        document.getElementById('comprador').value = clienteEncontrado.comprador;
        document.getElementById('email').value = clienteEncontrado.email;
        document.getElementById('vendedor').value = clienteEncontrado.vendedor;
    } else {
        document.getElementById('razaoSocial').value = '';
        document.getElementById('nomeFantasia').value = '';
        document.getElementById('cnpj').value = '';
        document.getElementById('telefone').value = '';
        document.getElementById('comprador').value = '';
        document.getElementById('email').value = '';
        document.getElementById('vendedor').value = '';
    }
}

function atualizarDatalistCnpj() {
    const datalist = document.getElementById('listaCnpjs');
    if (!datalist) return;
    datalist.innerHTML = '';
    clientesCadastrados.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente.cnpj;
        datalist.appendChild(option);
    });
}

function limparCamposCliente() {
    const checkCadastrado = document.getElementById('checkClienteCadastrado');
    const checkNaoCadastrado = document.getElementById('checkClienteNaoCadastrado');

    if(checkCadastrado) checkCadastrado.checked = false;
    if(checkNaoCadastrado) checkNaoCadastrado.checked = false;
    
    const secaoCadastrado = document.getElementById('secaoClienteCadastrado');
    const secaoNaoCadastrado = document.getElementById('secaoClienteNaoCadastrado');

    if(secaoCadastrado) secaoCadastrado.classList.add('oculto');
    if(secaoNaoCadastrado) secaoNaoCadastrado.classList.add('oculto');

    const camposNaoCadastrado = document.querySelectorAll('#secaoClienteNaoCadastrado input');
    camposNaoCadastrado.forEach(campo => campo.value = '');
    const campoCnpj = document.getElementById('campoCnpj');
    if(campoCnpj) campoCnpj.value = '';
    
    verificarEAtivarAdicionarProduto();
}

function renderizarTabelaCadastro() { 
    const tbody = document.querySelector("#cadastroProdutos tbody");
    tbody.innerHTML = '';
    for (const nome in produtosCadastrados) {
        const produto = produtosCadastrados[nome];
        const novaLinha = document.createElement("tr");
        novaLinha.dataset.produtoNome = nome;

        novaLinha.innerHTML = `
            <td>${nome}</td>
            <td>${produto.caixaMaster.caixa1} / ${produto.caixaMaster.caixa2}</td>
            <td>${produto.precoAtacado.toFixed(2).replace('.', ',')}</td>
            <td>${produto.precoVarejo.toFixed(2).replace('.', ',')}</td>
            <td>
                <button class="btn-editar" onclick="habilitarEdicao(this)">Editar</button>
                <button class="btn-remover" onclick="removerProdutoCadastro(this)">Remover</button>
            </td>
        `;
        tbody.appendChild(novaLinha);
    }
}

function habilitarEdicao(botao) {
    const linha = botao.closest('tr');
    const nomeProduto = linha.dataset.produtoNome;
    const produto = produtosCadastrados[nomeProduto];
    
    linha.innerHTML = `
        <td><input type="text" class="campo-edicao-nome" value="${nomeProduto}"></td>
        <td>
            <input type="number" class="campo-edicao-caixa1" value="${produto.caixaMaster.caixa1}"> / 
            <input type="number" class="campo-edicao-caixa2" value="${produto.caixaMaster.caixa2}">
        </td>
        <td><input type="number" class="campo-edicao-atacado" step="0.01" value="${produto.precoAtacado}"></td>
        <td><input type="number" class="campo-edicao-varejo" step="0.01" value="${produto.precoVarejo}"></td>
        <td>
            <button class="btn-salvar" onclick="salvarEdicao(this)">Salvar</button>
            <button class="btn-remover" onclick="removerProdutoCadastro(this)">Remover</button>
        </td>
    `;
}

function salvarEdicao(botao) {
    const linha = botao.closest('tr');
    const nomeAntigo = linha.dataset.produtoNome;
    
    const novoNome = linha.querySelector('.campo-edicao-nome').value.trim();
    const novaCaixa1 = parseInt(linha.querySelector('.campo-edicao-caixa1').value);
    const novaCaixa2 = parseInt(linha.querySelector('.campo-edicao-caixa2').value);
    const novoPrecoAtacado = parseFloat(linha.querySelector('.campo-edicao-atacado').value);
    const novoPrecoVarejo = parseFloat(linha.querySelector('.campo-edicao-varejo').value);

    if (!novoNome || isNaN(novaCaixa1) || novaCaixa1 <= 0 || isNaN(novaCaixa2) || novaCaixa2 <= 0 || isNaN(novoPrecoAtacado) || isNaN(novoPrecoVarejo)) {
        alert('Por favor, preencha todos os campos corretamente.');
        return;
    }

    if (novoNome !== nomeAntigo) {
        delete produtosCadastrados[nomeAntigo];
    }

    produtosCadastrados[novoNome] = {
        caixaMaster: { caixa1: novaCaixa1, caixa2: novaCaixa2 },
        precoAtacado: novoPrecoAtacado,
        precoVarejo: novoPrecoVarejo
    };

    salvarProdutosNoStorage();
    renderizarTabelaCadastro();
    alert('Produto atualizado com sucesso!');
}

function cadastrarProduto(event) {
    event.preventDefault();

    const nome = document.getElementById("novoProduto").value.trim();
    const caixa1 = parseInt(document.getElementById("novaCaixaMaster1").value);
    const caixa2 = parseInt(document.getElementById("novaCaixaMaster2").value);
    const precoAtacado = parseFloat(document.getElementById("novoPrecoAtacado").value);
    const precoVarejo = parseFloat(document.getElementById("novoPrecoVarejo").value);
    
    if (!nome || isNaN(caixa1) || caixa1 <= 0 || isNaN(caixa2) || caixa2 <= 0 || isNaN(precoAtacado) || precoAtacado < 0 || isNaN(precoVarejo) || precoVarejo < 0) {
        alert("Preencha todos os campos corretamente!");
        return;
    }
    produtosCadastrados[nome] = { 
        caixaMaster: { caixa1: caixa1, caixa2: caixa2 }, 
        precoAtacado: precoAtacado, 
        precoVarejo: precoVarejo 
    };
    salvarProdutosNoStorage();
    renderizarTabelaCadastro();
    document.getElementById("formCadastro").reset();
    alert("Produto cadastrado com sucesso!");
}

function removerProdutoCadastro(botao) {
    const linha = botao.closest('tr');
    const nomeProduto = linha.dataset.produtoNome;
    if (confirm(`Tem certeza que deseja remover o produto "${nomeProduto}"?`)) {
        delete produtosCadastrados[nomeProduto];
        salvarProdutosNoStorage();
        renderizarTabelaCadastro();
        alert("Produto removido com sucesso!");
    }
}

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

// Inicia a aplicação
document.addEventListener('DOMContentLoaded', inicializarPagina);