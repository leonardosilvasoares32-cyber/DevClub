// js/main.js

import { carregarEmpresaVendedor, initVendas } from './vendas.js';
import { carregarRelatorios } from './relatorios.js'; // Assumindo que você tem este arquivo
import { initCadastros } from './cadastros.js'; // CORREÇÃO: Importando apenas o initCadastros

// ====================================================================
// 1. CONFIGURAÇÃO SUPABASE E VARIÁVEIS GLOBAIS
// ====================================================================

// **ATUALIZE COM SUAS CHAVES DO PROJETO SUPABASE**
const supabaseUrl = 'https://sbfxtoxykwtxiecibkcm.supabase.co'; 
const supabaseKey = 'sb_publishable_85uPynUTx9KKCCSYBsdwIg_cXEXzt0f';

// CERTIFIQUE-SE DE QUE ESTA LINHA FUNCIONE (CDN do Supabase deve estar no index.html)
export const supabase = window.supabase.createClient(supabaseUrl, supabaseKey); 
export const VENDEDOR_ID_LOGADO = '5e2c0dee-4b32-46c3-a240-7da89af8dfff'; 
export let empresaLogada = null; 

export function setEmpresaLogada(id) {
    empresaLogada = id;
}

// ====================================================================
// 2. NAVEGAÇÃO E INICIALIZAÇÃO (Entry Point)
// ====================================================================

/**
 * Configura os listeners para a navegação por abas principais.
 */
function configurarAbas() {
    // Seleciona todas as abas principais (vendas, cadastros, relatorios)
    document.querySelectorAll('.abas-principais .aba').forEach(button => { 
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            const targetId = button.getAttribute('data-aba');
            
            // Esconde todo o conteúdo principal
            document.querySelectorAll('.conteudo-principal').forEach(content => {
                content.classList.remove('active');
                content.style.display = 'none'; 
            });
            
            // Remove a classe 'active' de todos os botões e adiciona ao clicado
            document.querySelectorAll('.abas-principais .aba').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Mostra o conteúdo alvo
            const targetContent = document.getElementById(`conteudo-${targetId}`);
            if (targetContent) {
                 targetContent.classList.add('active');
                 targetContent.style.display = 'block';

                 // Carrega dados específicos ao mudar de aba
                if (targetId === 'relatorios') {
                    await carregarRelatorios(); 
                }
            }
        });
    });

    // Inicia na aba 'Vendas'
    const abaInicial = document.querySelector('.abas-principais .aba[data-aba="vendas"]');
    if (abaInicial) {
        abaInicial.classList.add('active');
    }
    const conteudoInicial = document.getElementById('conteudo-vendas');
    if (conteudoInicial) {
        conteudoInicial.style.display = 'block';
    }
}

/**
 * Função principal que inicializa o sistema
 */
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Carrega o ID da empresa (função assíncrona)
    await carregarEmpresaVendedor();
    
    // 2. Inicializa os listeners de todos os módulos
    initVendas();
    initCadastros(); 
    
    // 3. Configura a navegação por abas
    configurarAbas();
});