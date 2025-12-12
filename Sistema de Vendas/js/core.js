// js/core.js - Módulo central de comunicação e estado

const SUPABASE_URL = 'SUA_URL_SUPABASE_AQUI'; // *ATUALIZE SUA URL*
const SUPABASE_ANON_KEY = 'SUA_CHAVE_ANON_AQUI'; // *ATUALIZE SUA CHAVE*

export const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variáveis de Estado Global
let vendedorLogado = null; 
let empresaLogada = null;
let nivelAcesso = 'publico'; // 'publico', 'usuario', 'admin'

// Exporta as variáveis de estado
export { vendedorLogado, empresaLogada, nivelAcesso };

// Setters (Para serem usados pelos módulos que leem o perfil)
export function setVendedorLogado(id) { vendedorLogado = id; }
export function setEmpresaLogada(id) { empresaLogada = id; }
export function setNivelAcesso(nivel) { nivelAcesso = nivel; }


// ====================================================================
// FUNÇÃO CENTRAL DE PERFIL
// ====================================================================

/**
 * Carrega o perfil do vendedor (ID, Empresa e Nível de Acesso) após o login.
 * Usa a VIEW que criamos no BD para resolver a ambiguidade.
 */
export async function carregarPerfilVendedor(user_id) {
    const { data, error } = await supabase
        .from('vendedor_empresa_view') 
        .select('empresa_id_fk, empresa_nome, nivel_acesso')
        .eq('vendedor_id', user_id)
        .single();

    if (error && error.code === 'PGRST116') {
        console.warn('Vendedor não associado ou perfil incompleto.');
        setVendedorLogado(user_id);
        setEmpresaLogada(null);
        setNivelAcesso('usuario'); // Acesso padrão de quem só tem login
        return null;
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