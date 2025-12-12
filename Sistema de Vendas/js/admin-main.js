// js/admin-main.js - Controller do Dashboard Administrativo

import { supabase, carregarPerfilVendedor, setVendedorLogado, setEmpresaLogada, setNivelAcesso, nivelAcesso } from './core.js';
import { initCadastros } from './cadastros.js';

// ====================================================================
// 1. LÓGICA DE AUTENTICAÇÃO E PERMISSÃO
// ====================================================================

function aplicarPermissoesAdmin(perfil) {
    if (perfil.nivel_acesso !== 'admin') {
        alert('Acesso negado. Você precisa de nível de Administrador.');
        // Redireciona para o PDV ou login, caso o usuário tente acessar diretamente
        window.location.href = 'vendas.html'; 
        return;
    }
    
    document.getElementById('infoVendedor').innerHTML = `Logado como: ${perfil.empresa_nome} (Admin)`;
    
    // Inicializa os módulos após a permissão
    initCadastros(); 

    // Seleciona a primeira aba ativa
    document.querySelector('.abas-principais .aba.active')?.click();
}

/**
 * Garante que o usuário está logado e tem permissão de administrador.
 */
async function checkAuthAndInit() {
    const session = await supabase.auth.getSession();
    
    if (!session?.data?.session) {
        // Não está logado, redireciona para o login
        window.location.href = 'index.html'; 
        return;
    }
    
    const perfil = await carregarPerfilVendedor(session.data.session.user.id);

    if (perfil) {
        aplicarPermissoesAdmin(perfil);
    } else {
         // Não tem perfil associado (não deveria acontecer com admin, mas para segurança)
        alert('Perfil não encontrado no sistema. Acesso negado.');
        await supabase.auth.signOut();
        window.location.href = 'index.html';
    }
}

// ====================================================================
// 2. LÓGICA DE NAVEGAÇÃO
// ====================================================================

function initNavegacao() {
    document.querySelectorAll('.abas-principais .aba').forEach(aba => {
        aba.addEventListener('click', (e) => {
            // Remove a classe 'active' de todas as abas
            document.querySelectorAll('.abas-principais .aba').forEach(btn => btn.classList.remove('active'));
            // Remove a classe 'active' de todo o conteúdo
            document.querySelectorAll('.conteudo-principal').forEach(content => content.classList.remove('active'));

            // Adiciona a classe 'active' à aba clicada
            e.target.classList.add('active');
            
            // Adiciona a classe 'active' ao conteúdo correspondente
            const alvo = e.target.dataset.aba;
            document.getElementById(`conteudo-${alvo}`).classList.add('active');
        });
    });
}

// ====================================================================
// 3. INICIALIZAÇÃO
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
    initNavegacao();
    checkAuthAndInit();
    
    // Listener de Logout
    document.getElementById('btnLogout')?.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'index.html';
    });
});