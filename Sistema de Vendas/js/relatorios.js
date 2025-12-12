// js/relatorios.js

import { supabase } from './main.js';

// Variáveis para armazenar instâncias dos gráficos (para destruição)
let quemMaisVendeuChartInstance = null;
let itensMaisVendidosChartInstance = null;

/**
 * Função placeholder (Módulo 8: Edição de Vendas).
 */
function carregarVendaParaEdicao(vendaId) {
    alert(`Funcionalidade de Edição: Carregando detalhes da Venda N° ${vendaId.substring(0, 8)}`);
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
    // 
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
    // 
}

/**
 * Função exportada para carregar todos os dados e renderizar os relatórios na aba 'Gestão'.
 */
export async function carregarRelatorios() {
    console.log("7.1 Carregando relatórios...");

    // 1. Total Vendido (SUM)
    const totalVendidoElement = document.getElementById('totalVendidoValor');
    const { data: totalData } = await supabase.from('vendas').select('total:sum(total_venda)').single();
    const total = totalData ? totalData.total : 0;
    
    const totalFormatado = parseFloat(total).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    totalVendidoElement.textContent = `R$ ${totalFormatado}`;

    // 2. Quem Mais Vendeu (VIEW: vendedores_rank_vendas)
    const { data: vendedoresRank } = await supabase
        .from('vendedores_rank_vendas') 
        .select('nome_vendedor, total_vendido')
        .limit(5);

    const labelsVendedores = vendedoresRank ? vendedoresRank.map(d => d.nome_vendedor) : ["Vendedor A", "Vendedor B"];
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
    
    // Torna a função de edição globalmente acessível
    window.carregarVendaParaEdicao = carregarVendaParaEdicao;

    vendasRecentes.forEach(venda => {
        const li = document.createElement('li');
        const totalVendaFormatado = venda.total_venda.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

        li.innerHTML = `
            Venda N° ${venda.id.substring(0, 8)} | Cliente: ${venda.nome_cliente} | Total: R$ ${totalVendaFormatado}
            <button onclick="carregarVendaParaEdicao('${venda.id}')" style="margin-left: 10px; background-color: #ffc107;">Editar</button>
        `;
        listaVendas.appendChild(li);
    });
}