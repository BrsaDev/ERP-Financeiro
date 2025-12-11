/**
 * Utilitário para formatação e manipulação de datas
 */

/**
 * Converte string de data para objeto Date
 * Suporta formatos: DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY
 * @param {string} dateString - String de data
 * @returns {Date|null} - Objeto Date ou null se inválido
 */
function parseDate(dateString) {
    if (!dateString || dateString === '' || dateString === null) {
        return null
    }
    
    // Se já for um objeto Date
    if (dateString instanceof Date) {
        return dateString
    }
    
    const str = String(dateString).trim()
    
    // Formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        return new Date(str + 'T00:00:00')
    }
    
    // Formato DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
        const [day, month, year] = str.split('/')
        return new Date(year, month - 1, day)
    }
    
    // Formato DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
        const [day, month, year] = str.split('-')
        return new Date(year, month - 1, day)
    }
    
    // Tenta parse direto
    const parsed = new Date(str)
    return isNaN(parsed.getTime()) ? null : parsed
}

/**
 * Formata data para exibição brasileira
 * @param {Date|string} date - Data a ser formatada
 * @param {boolean} includeTime - Se deve incluir hora
 * @returns {string} - Data formatada (ex: "15/01/2025")
 */
function formatDate(date, includeTime = false) {
    const dateObj = date instanceof Date ? date : parseDate(date)
    
    if (!dateObj || isNaN(dateObj.getTime())) {
        return '-'
    }
    
    const day = String(dateObj.getDate()).padStart(2, '0')
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const year = dateObj.getFullYear()
    
    if (includeTime) {
        const hours = String(dateObj.getHours()).padStart(2, '0')
        const minutes = String(dateObj.getMinutes()).padStart(2, '0')
        return `${day}/${month}/${year} ${hours}:${minutes}`
    }
    
    return `${day}/${month}/${year}`
}

/**
 * Formata data para formato SQL (YYYY-MM-DD)
 * @param {Date|string} date - Data a ser formatada
 * @returns {string} - Data formatada (ex: "2025-01-15")
 */
function formatDateSQL(date) {
    const dateObj = date instanceof Date ? date : parseDate(date)
    
    if (!dateObj || isNaN(dateObj.getTime())) {
        return null
    }
    
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    
    return `${year}-${month}-${day}`
}

/**
 * Calcula diferença em dias entre duas datas
 * @param {Date|string} date1 - Primeira data
 * @param {Date|string} date2 - Segunda data
 * @returns {number} - Diferença em dias
 */
function daysDifference(date1, date2) {
    const d1 = date1 instanceof Date ? date1 : parseDate(date1)
    const d2 = date2 instanceof Date ? date2 : parseDate(date2)
    
    if (!d1 || !d2) return 0
    
    const diffTime = Math.abs(d2 - d1)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Verifica se data está vencida
 * @param {Date|string} date - Data a verificar
 * @returns {boolean} - True se vencida
 */
function isOverdue(date) {
    const dateObj = date instanceof Date ? date : parseDate(date)
    if (!dateObj) return false
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    dateObj.setHours(0, 0, 0, 0)
    
    return dateObj < today
}

/**
 * Obtém período padrão (último mês, mês atual, etc.)
 * @param {string} period - 'hoje', 'mes_atual', 'mes_anterior', 'ano_atual', 'ano_anterior'
 * @returns {Object} - { inicio, fim }
 */
function getPeriod(period = 'mes_atual') {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    
    let inicio, fim
    
    switch (period) {
        case 'hoje':
            inicio = new Date(year, month, today.getDate())
            fim = new Date(year, month, today.getDate())
            break
            
        case 'mes_atual':
            inicio = new Date(year, month, 1)
            fim = new Date(year, month + 1, 0)
            break
            
        case 'mes_anterior':
            inicio = new Date(year, month - 1, 1)
            fim = new Date(year, month, 0)
            break
            
        case 'ano_atual':
            inicio = new Date(year, 0, 1)
            fim = new Date(year, 11, 31)
            break
            
        case 'ano_anterior':
            inicio = new Date(year - 1, 0, 1)
            fim = new Date(year - 1, 11, 31)
            break
            
        case 'ultimos_30_dias':
            fim = new Date(year, month, today.getDate())
            inicio = new Date(fim)
            inicio.setDate(inicio.getDate() - 30)
            break
            
        case 'ultimos_90_dias':
            fim = new Date(year, month, today.getDate())
            inicio = new Date(fim)
            inicio.setDate(inicio.getDate() - 90)
            break
            
        default:
            inicio = new Date(year, month, 1)
            fim = new Date(year, month + 1, 0)
    }
    
    return {
        inicio: formatDateSQL(inicio),
        fim: formatDateSQL(fim)
    }
}

module.exports = {
    parseDate,
    formatDate,
    formatDateSQL,
    daysDifference,
    isOverdue,
    getPeriod
}



