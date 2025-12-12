// js/core.js - Módulo central de comunicação e estado (CORRIGIDO)

// Linha 1: Importa a função createClient diretamente da URL da CDN.
// Isso garante que a função 'createClient' esteja disponível no escopo do módulo.
// import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'; 

const SUPABASE_URL = 'https://sbfxtoxykwtxiecibkcm.supabase.co'; // *ATUALIZE SUA URL*
const SUPABASE_ANON_KEY = 'sb_publishable_85uPynUTx9KKCCSYBsdwIg_cXEXzt0f'; // *ATUALIZE SUA CHAVE*


// Exporta as chaves
export { SUPABASE_URL, SUPABASE_ANON_KEY };

// Variável que será preenchida (será NULL até a inicialização no HTML)
export let supabase = null; 

// Função que será chamada pelo HTML para injetar o cliente inicializado
export function setSupabaseClient(client) {
    supabase = client;
    console.log("Supabase Client injetado no core.js com sucesso.");
}


// Variáveis de Estado Global
let vendedorLogado = null; 
let empresaLogada = null;
let nivelAcesso = 'publico'; 

export { vendedorLogado, empresaLogada, nivelAcesso };

// Setters (Para serem usados pelos módulos que leem o perfil)
export function setVendedorLogado(id) { vendedorLogado = id; }
export function setEmpresaLogada(id) { empresaLogada = id; }
export function setNivelAcesso(nivel) { nivelAcesso = nivel; }


// ====================================================================
// FUNÇÃO CENTRAL DE PERFIL (Mantida, mas agora usa a variável 'supabase')
// ====================================================================

export async function carregarPerfilVendedor(user_id) {
    if (!supabase) {
        console.error("Supabase não inicializado ao carregar perfil.");
        return null;
    }
    
    const { data, error } = await supabase
        .from('vendedor_empresa_view') 
        .select('empresa_id_fk, empresa_nome, nivel_acesso')
        .eq('vendedor_id', user_id)
        .single();

    // ... (lógica de tratamento de erro) ...
    if (error && error.code === 'PGRST116') {
        console.warn('Vendedor não associado ou perfil incompleto.');
        setVendedorLogado(user_id);
        setNivelAcesso('usuario');
        return { nivel_acesso: 'usuario' }; 
    }

    if (error) {
        console.error('Erro ao carregar perfil do vendedor:', error);
        setNivelAcesso('publico');
        return null;
    }
    
    // Define o estado global
    setVendedorLogado(user_id);
    setEmpresaLogada(data.empresa_id_fk);
    setNivelAcesso(data.nivel_acesso);
    
    return data;
}

// Helper para formatação
export function formatarMoeda(valor) {
    const valorNumerico = parseFloat(valor);
    if (isNaN(valorNumerico)) return 'R$ 0,00';
    return valorNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}