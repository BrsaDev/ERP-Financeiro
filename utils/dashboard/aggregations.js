/**
 * Funções auxiliares para agregações de dados
 */

const { parseValue } = require('./formatValue')
const { parseDate, formatDateSQL } = require('./formatDate')

/**
 * Agrupa contas por um campo específico
 * @param {Array} contas - Array de contas
 * @param {string} groupBy - Campo para agrupar
 * @param {string} valueField - Campo de valor para somar
 * @returns {Object} - Objeto com agrupamento
 */
function groupBy(contas, groupBy, valueField = 'valor_conta') {
    const grouped = {}
    
    contas.forEach(conta => {
        const key = conta[groupBy] || 'Não informado'
        
        if (!grouped[key]) {
            grouped[key] = {
                key: key,
                quantidade: 0,
                total: 0,
                media: 0,
                items: []
            }
        }
        
        const value = parseValue(conta[valueField])
        grouped[key].quantidade++
        grouped[key].total += value
        grouped[key].items.push(conta)
    })
    
    // Calcula média para cada grupo
    Object.keys(grouped).forEach(key => {
        if (grouped[key].quantidade > 0) {
            grouped[key].media = grouped[key].total / grouped[key].quantidade
        }
    })
    
    return grouped
}

/**
 * Agrupa contas por período (dia, mês, ano)
 * @param {Array} contas - Array de contas
 * @param {string} dateField - Campo de data
 * @param {string} period - 'dia', 'mes', 'ano'
 * @param {string} valueField - Campo de valor
 * @returns {Array} - Array ordenado por período
 */
function groupByPeriod(contas, dateField, period = 'mes', valueField = 'valor_conta') {
    const grouped = {}
    
    contas.forEach(conta => {
        const date = parseDate(conta[dateField])
        if (!date) return
        
        let key
        
        switch (period) {
            case 'dia':
                key = formatDateSQL(date)
                break
            case 'mes':
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
                break
            case 'ano':
                key = String(date.getFullYear())
                break
            default:
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        }
        
        if (!grouped[key]) {
            grouped[key] = {
                periodo: key,
                quantidade: 0,
                total: 0,
                media: 0
            }
        }
        
        const value = parseValue(conta[valueField])
        grouped[key].quantidade++
        grouped[key].total += value
    })
    
    // Calcula média e converte para array
    const result = Object.values(grouped).map(item => ({
        ...item,
        media: item.quantidade > 0 ? item.total / item.quantidade : 0
    }))
    
    // Ordena por período
    return result.sort((a, b) => a.periodo.localeCompare(b.periodo))
}

/**
 * Filtra contas por período
 * @param {Array} contas - Array de contas
 * @param {string} dateField - Campo de data
 * @param {string} inicio - Data início (YYYY-MM-DD)
 * @param {string} fim - Data fim (YYYY-MM-DD)
 * @returns {Array} - Contas filtradas
 */
function filterByPeriod(contas, dateField, inicio, fim) {
    if (!inicio && !fim) return contas
    
    return contas.filter(conta => {
        const date = parseDate(conta[dateField])
        if (!date) return false
        
        const dateStr = formatDateSQL(date)
        
        if (inicio && dateStr < inicio) return false
        if (fim && dateStr > fim) return false
        
        return true
    })
}

/**
 * Filtra contas por situação
 * @param {Array} contas - Array de contas
 * @param {string|Array} situacoes - Situação(ões) para filtrar
 * @returns {Array} - Contas filtradas
 */
function filterBySituacao(contas, situacoes) {
    if (!situacoes || situacoes === '') return contas
    
    const situacoesArray = Array.isArray(situacoes) ? situacoes : [situacoes]
    
    return contas.filter(conta => {
        const situacao = (conta.situacao || '').trim()
        return situacoesArray.some(s => s.trim() === situacao)
    })
}

/**
 * Calcula estatísticas básicas de um array de contas
 * @param {Array} contas - Array de contas
 * @param {string} valueField - Campo de valor
 * @returns {Object} - Estatísticas
 */
function calculateStats(contas, valueField = 'valor_conta') {
    if (!contas || contas.length === 0) {
        return {
            quantidade: 0,
            total: 0,
            media: 0,
            minimo: 0,
            maximo: 0
        }
    }
    
    const values = contas
        .map(conta => parseValue(conta[valueField]))
        .filter(v => v > 0)
    
    if (values.length === 0) {
        return {
            quantidade: contas.length,
            total: 0,
            media: 0,
            minimo: 0,
            maximo: 0
        }
    }
    
    const total = values.reduce((sum, val) => sum + val, 0)
    const media = total / values.length
    const minimo = Math.min(...values)
    const maximo = Math.max(...values)
    
    return {
        quantidade: contas.length,
        total,
        media,
        minimo,
        maximo
    }
}

/**
 * Ordena array por valor (maior para menor)
 * @param {Array} items - Array de itens
 * @param {string} valueField - Campo de valor
 * @param {number} limit - Limite de resultados
 * @returns {Array} - Array ordenado
 */
function sortByValue(items, valueField = 'total', limit = null) {
    const sorted = [...items].sort((a, b) => {
        const valA = parseValue(a[valueField])
        const valB = parseValue(b[valueField])
        return valB - valA
    })
    
    return limit ? sorted.slice(0, limit) : sorted
}

module.exports = {
    groupBy,
    groupByPeriod,
    filterByPeriod,
    filterBySituacao,
    calculateStats,
    sortByValue
}



