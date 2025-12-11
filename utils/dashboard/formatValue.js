/**
 * Utilitário para formatação de valores monetários
 * Converte strings do banco para números e formata para exibição
 */

/**
 * Converte string de valor para número decimal
 * Trata formatos brasileiros (vírgula) e internacionais (ponto)
 * @param {string|number} value - Valor a ser convertido
 * @returns {number} - Valor numérico ou 0 se inválido
 */
function parseValue(value) {
    if (value === null || value === undefined || value === '') {
        return 0
    }
    
    if (typeof value === 'number') {
        return isNaN(value) ? 0 : value
    }
    
    const str = String(value).trim()
    
    // Se já é um número válido (ex: "1234.56")
    if (/^\d+\.?\d*$/.test(str)) {
        const parsed = parseFloat(str)
        return isNaN(parsed) ? 0 : parsed
    }
    
    // Remove R$, espaços e outros caracteres não numéricos
    let cleaned = str
        .replace(/R\$/gi, '')
        .replace(/\s/g, '')
        .trim()
    
    // Se contém vírgula, assume formato brasileiro (1.234,56)
    if (cleaned.includes(',')) {
        // Remove pontos (separadores de milhar)
        cleaned = cleaned.replace(/\./g, '')
        // Substitui vírgula por ponto (decimal)
        cleaned = cleaned.replace(',', '.')
    } else if (cleaned.includes('.')) {
        // Se tem ponto, verifica se é milhar ou decimal
        // Se tem mais de um ponto ou ponto seguido de 3 dígitos, é milhar
        const parts = cleaned.split('.')
        if (parts.length > 2 || (parts[1] && parts[1].length === 3 && !parts[2])) {
            // Formato de milhar (1.234.567 ou 1.234)
            cleaned = cleaned.replace(/\./g, '')
        }
        // Se não, assume que o ponto é decimal (1.23)
    }
    
    // Remove qualquer caractere não numérico restante (exceto ponto e sinal negativo)
    cleaned = cleaned.replace(/[^\d.-]/g, '')
    
    const parsed = parseFloat(cleaned)
    
    if (isNaN(parsed)) {
        console.warn(`[parseValue] Não foi possível converter valor: "${value}" -> "${cleaned}"`)
        return 0
    }
    
    return parsed
}

/**
 * Formata valor numérico para exibição em Real brasileiro
 * @param {number} value - Valor numérico
 * @param {boolean} showSymbol - Se deve mostrar o símbolo R$
 * @returns {string} - Valor formatado (ex: "R$ 1.234,56")
 */
function formatCurrency(value, showSymbol = true) {
    const numValue = typeof value === 'string' ? parseValue(value) : value
    
    if (isNaN(numValue) || numValue === null || numValue === undefined) {
        return showSymbol ? 'R$ 0,00' : '0,00'
    }
    
    const formatted = numValue.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })
    
    return showSymbol ? `R$ ${formatted}` : formatted
}

/**
 * Formata valor para exibição compacta (K, M, B)
 * @param {number} value - Valor numérico
 * @returns {string} - Valor formatado (ex: "1,5K", "2,3M")
 */
function formatCompact(value) {
    const numValue = typeof value === 'string' ? parseValue(value) : value
    
    if (isNaN(numValue) || numValue === null || numValue === undefined) {
        return 'R$ 0'
    }
    
    if (numValue >= 1000000000) {
        return `R$ ${(numValue / 1000000000).toFixed(2)}B`
    }
    if (numValue >= 1000000) {
        return `R$ ${(numValue / 1000000).toFixed(2)}M`
    }
    if (numValue >= 1000) {
        return `R$ ${(numValue / 1000).toFixed(2)}K`
    }
    
    return formatCurrency(numValue)
}

/**
 * Calcula percentual entre dois valores
 * @param {number} part - Parte
 * @param {number} total - Total
 * @returns {number} - Percentual (0-100)
 */
function calculatePercentage(part, total) {
    if (!total || total === 0) return 0
    const partNum = typeof part === 'string' ? parseValue(part) : part
    const totalNum = typeof total === 'string' ? parseValue(total) : total
    return ((partNum / totalNum) * 100).toFixed(2)
}

module.exports = {
    parseValue,
    formatCurrency,
    formatCompact,
    calculatePercentage
}

