/**
 * Serviço de Dashboard - Agregações e análises de dados financeiros
 * Centraliza toda a lógica de negócio para o dashboard
 */

const Conta = require('../models/Conta')
const { Op, fn, col, literal, where } = require('sequelize')
const { parseValue, formatCurrency } = require('../utils/dashboard/formatValue')
const { parseDate, formatDateSQL, getPeriod, isOverdue } = require('../utils/dashboard/formatDate')
const { 
    groupBy, 
    groupByPeriod, 
    filterByPeriod, 
    filterBySituacao,
    calculateStats,
    sortByValue
} = require('../utils/dashboard/aggregations')
const cache = require('../config/cache')

class DashboardService {
    /**
     * Processa contas removendo duplicatas (múltiplos DREs)
     */
    processarContas(contas) {
        const contasUnicas = new Map()
        contas.forEach(conta => {
            const numConta = conta.numero_conta
            if (!contasUnicas.has(numConta)) {
                contasUnicas.set(numConta, conta)
            }
        })
        return Array.from(contasUnicas.values())
    }
    
    /**
     * Obtém resumo geral do dashboard
     * @param {Object} filters - Filtros (periodo, data_inicio, data_fim, situacao)
     * @returns {Promise<Object>}
     */
    async getResumoGeral(filters = {}) {
        try {
            const { periodo, data_inicio, data_fim, situacao } = filters
            
            // Verifica cache
            const cacheKey = cache.generateKey('resumo-geral', filters)
            const cached = await cache.get(cacheKey)
            if (cached) {
                console.log('[Dashboard] Cache hit: resumo-geral')
                return cached
            }
            
            // Determina período se não fornecido
            let inicio = data_inicio
            let fim = data_fim
            if (!inicio && !fim && periodo) {
                const periodData = getPeriod(periodo)
                inicio = periodData.inicio
                fim = periodData.fim
            }
            
            // Query base - SEMPRE busca TODAS as contas do período para o total_geral
            // O filtro de situação não é aplicado aqui para garantir que o total sempre
            // mostre todas as contas cadastradas no período
            const whereClauseTotal = {}
            
            if (inicio || fim) {
                whereClauseTotal.cadastramento = {}
                if (inicio) whereClauseTotal.cadastramento[Op.gte] = inicio
                if (fim) whereClauseTotal.cadastramento[Op.lte] = fim
            }
            
            // Busca TODAS as contas do período (sem filtro de situação)
            const contas = await Conta.findAll({
                where: whereClauseTotal,
                raw: true
            })
            
            // Debug: Log de amostra de dados
            console.log('[Dashboard] Resumo Geral - Query executada:', {
                whereClause: whereClauseTotal,
                total_registros_encontrados: contas.length
            })
            
            if (contas.length > 0) {
                console.log('[Dashboard] Resumo Geral - Amostra de dados:', {
                    total_contas_encontradas: contas.length,
                    primeira_conta: {
                        id: contas[0].id,
                        numero_conta: contas[0].numero_conta,
                        valor_conta_original: contas[0].valor_conta,
                        valor_conta_parseado: parseValue(contas[0].valor_conta),
                        situacao: contas[0].situacao,
                        cadastramento: contas[0].cadastramento,
                        fornecedor: contas[0].fornecedor
                    }
                })
            }
            
            // Processa contas (remove duplicatas de DREs)
            let contasProcessadas = []
            try {
                contasProcessadas = this.processarContas(contas || [])
            } catch (error) {
                console.error('[Dashboard] Erro ao processar contas:', error)
                contasProcessadas = []
            }
            
            // Normaliza situação antes de agrupar
            contasProcessadas.forEach(conta => {
                try {
                    if (conta.situacao) {
                        const situacaoTrim = String(conta.situacao).trim()
                        // Normaliza para formato padrão
                        if (situacaoTrim.toLowerCase() === 'pago') {
                            conta.situacao = 'Pago'
                        } else if (situacaoTrim.toLowerCase() === 'aberto') {
                            conta.situacao = 'Aberto'
                        } else if (situacaoTrim.toLowerCase() === 'em andamento' || situacaoTrim.toLowerCase() === 'em_andamento') {
                            conta.situacao = 'Em andamento'
                        } else if (situacaoTrim.toLowerCase() === 'cancelado') {
                            conta.situacao = 'Cancelado'
                        } else {
                            conta.situacao = situacaoTrim
                        }
                    } else {
                        conta.situacao = 'Aberto' // Default
                    }
                } catch (error) {
                    console.warn('[Dashboard] Erro ao normalizar situação da conta:', error)
                    conta.situacao = 'Aberto' // Default em caso de erro
                }
            })
            
            console.log('[Dashboard] Resumo Geral - Contas processadas (sem duplicatas):', contasProcessadas.length)
            
            // Agrupa por situação
            let porSituacao = {}
            try {
                porSituacao = groupBy(contasProcessadas, 'situacao', 'valor_conta')
                console.log('[Dashboard] Resumo Geral - Agrupamento por situação:', Object.keys(porSituacao).map(s => ({
                    situacao: s,
                    quantidade: porSituacao[s].quantidade,
                    total: porSituacao[s].total
                })))
            } catch (error) {
                console.error('[Dashboard] Erro ao agrupar por situação:', error)
                porSituacao = {}
            }
            
            // Calcula totais
            let stats = { quantidade: 0, total: 0, media: 0, minimo: 0, maximo: 0 }
            try {
                stats = calculateStats(contasProcessadas, 'valor_conta')
                console.log('[Dashboard] Resumo Geral - Estatísticas:', stats)
            } catch (error) {
                console.error('[Dashboard] Erro ao calcular estatísticas:', error)
            }
            
            console.log('[Dashboard] Resumo Geral - Estatísticas:', stats)
            
            // Contas vencidas
            const vencidas = contasProcessadas.filter(conta => {
                if (!conta.vencimento) return false
                if (conta.situacao === 'Pago') return false
                return isOverdue(conta.vencimento)
            })
            
            const statsVencidas = calculateStats(vencidas, 'valor_conta')
            
            const resultado = {
                sucesso: true,
                dados: {
                    periodo: { inicio, fim },
                    total_geral: stats,
                    por_situacao: porSituacao,
                    vencidas: {
                        quantidade: statsVencidas.quantidade,
                        total: statsVencidas.total
                    },
                    resumo: {
                        total_contas: stats.quantidade,
                        total_valor: stats.total,
                        valor_medio: stats.media,
                        contas_vencidas: statsVencidas.quantidade,
                        valor_vencido: statsVencidas.total
                    }
                }
            }
            
            // Salva no cache
            await cache.set(cacheKey, resultado, 300) // 5 minutos
            
            return resultado
        } catch (error) {
            console.error('Erro ao obter resumo geral:', error)
            throw error
        }
    }
    
    /**
     * Obtém fluxo de caixa por período
     * @param {Object} filters - Filtros
     * @returns {Promise<Object>}
     */
    async getFluxoCaixa(filters = {}) {
        try {
            const { periodo, data_inicio, data_fim, agrupamento = 'mes' } = filters
            
            // Verifica cache
            const cacheKey = cache.generateKey('fluxo-caixa', filters)
            const cached = await cache.get(cacheKey)
            if (cached) {
                console.log('[Dashboard] Cache hit: fluxo-caixa')
                return cached
            }
            
            let inicio = data_inicio
            let fim = data_fim
            if (!inicio && !fim && periodo) {
                const periodData = getPeriod(periodo)
                inicio = periodData.inicio
                fim = periodData.fim
            }
            
            const whereClause = {}
            if (inicio || fim) {
                whereClause.vencimento = {}
                if (inicio) whereClause.vencimento[Op.gte] = inicio
                if (fim) whereClause.vencimento[Op.lte] = fim
            }
            
            const contas = await Conta.findAll({
                where: whereClause,
                raw: true
            })
            
            // Processa contas
            const contasProcessadas = this.processarContas(contas)
            
            // Agrupa por período e situação
            const fluxo = {}
            
            contasProcessadas.forEach(conta => {
                if (!conta.vencimento) return
                
                const date = parseDate(conta.vencimento)
                if (!date) return
                
                let key
                switch (agrupamento) {
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
                
                if (!fluxo[key]) {
                    fluxo[key] = {
                        periodo: key,
                        aberto: 0,
                        pago: 0,
                        em_andamento: 0,
                        cancelado: 0,
                        total: 0
                    }
                }
                
                const valor = parseValue(conta.valor_conta)
                const situacao = (conta.situacao || '').trim()
                
                fluxo[key].total += valor
                
                switch (situacao) {
                    case 'Aberto':
                        fluxo[key].aberto += valor
                        break
                    case 'Pago':
                        fluxo[key].pago += valor
                        break
                    case 'Em andamento':
                        fluxo[key].em_andamento += valor
                        break
                    case 'Cancelado':
                        fluxo[key].cancelado += valor
                        break
                }
            })
            
            const resultado = Object.values(fluxo).sort((a, b) => 
                a.periodo.localeCompare(b.periodo)
            )
            
            const response = {
                sucesso: true,
                dados: {
                    periodo: { inicio, fim },
                    agrupamento,
                    fluxo: resultado
                }
            }
            
            // Salva no cache
            await cache.set(cacheKey, response, 300)
            
            return response
        } catch (error) {
            console.error('Erro ao obter fluxo de caixa:', error)
            throw error
        }
    }
    
    /**
     * Obtém análise de DRE por departamento
     * @param {Object} filters - Filtros
     * @returns {Promise<Object>}
     */
    async getDrePorDepartamento(filters = {}) {
        try {
            const { periodo, data_inicio, data_fim, limite = 10 } = filters
            
            // Verifica cache
            const cacheKey = cache.generateKey('dre-departamento', filters)
            const cached = await cache.get(cacheKey)
            if (cached) {
                console.log('[Dashboard] Cache hit: dre-departamento')
                return cached
            }
            
            let inicio = data_inicio
            let fim = data_fim
            if (!inicio && !fim && periodo) {
                const periodData = getPeriod(periodo)
                inicio = periodData.inicio
                fim = periodData.fim
            }
            
            const whereConditions = [
                { departamento: { [Op.ne]: null } },
                { departamento: { [Op.ne]: '' } }
            ]
            
            if (inicio || fim) {
                const dateClause = {}
                if (inicio) dateClause[Op.gte] = inicio
                if (fim) dateClause[Op.lte] = fim
                whereConditions.push({ cadastramento: dateClause })
            }
            
            const whereClause = whereConditions.length > 0 
                ? { [Op.and]: whereConditions }
                : {}
            
            const contas = await Conta.findAll({
                where: whereClause,
                raw: true
            })
            
            console.log('[Dashboard] DRE por departamento - Total de registros:', contas.length)
            
            // Para DRE, não remove duplicatas pois queremos somar todos os DREs
            // Mas filtra apenas registros com departamento válido
            const contasComDepartamento = contas.filter(c => 
                c.departamento && 
                c.departamento.trim() !== '' && 
                parseValue(c.valor_dre) > 0
            )
            
            console.log('[Dashboard] DRE por departamento - Registros com departamento válido:', contasComDepartamento.length)
            
            const porDepartamento = groupBy(contasComDepartamento, 'departamento', 'valor_dre')
            const resultado = sortByValue(
                Object.values(porDepartamento),
                'total',
                limite
            )
            
            const response = {
                sucesso: true,
                dados: {
                    periodo: { inicio, fim },
                    departamentos: resultado
                }
            }
            
            // Salva no cache
            await cache.set(cacheKey, response, 300)
            
            return response
        } catch (error) {
            console.error('Erro ao obter DRE por departamento:', error)
            throw error
        }
    }
    
    /**
     * Obtém top fornecedores
     * @param {Object} filters - Filtros
     * @returns {Promise<Object>}
     */
    async getTopFornecedores(filters = {}) {
        try {
            const { periodo, data_inicio, data_fim, limite = 10 } = filters
            
            // Verifica cache
            const cacheKey = cache.generateKey('top-fornecedores', filters)
            const cached = await cache.get(cacheKey)
            if (cached) {
                console.log('[Dashboard] Cache hit: top-fornecedores')
                return cached
            }
            
            let inicio = data_inicio
            let fim = data_fim
            if (!inicio && !fim && periodo) {
                const periodData = getPeriod(periodo)
                inicio = periodData.inicio
                fim = periodData.fim
            }
            
            const whereConditions = [
                { fornecedor: { [Op.ne]: null } },
                { fornecedor: { [Op.ne]: '' } }
            ]
            
            if (inicio || fim) {
                const dateClause = {}
                if (inicio) dateClause[Op.gte] = inicio
                if (fim) dateClause[Op.lte] = fim
                whereConditions.push({ cadastramento: dateClause })
            }
            
            const whereClause = whereConditions.length > 0 
                ? { [Op.and]: whereConditions }
                : {}
            
            const contas = await Conta.findAll({
                where: whereClause,
                raw: true
            })
            
            console.log('[Dashboard] Top fornecedores - Total de registros:', contas.length)
            
            // Processa contas (remove duplicatas)
            const contasProcessadas = this.processarContas(contas)
            
            console.log('[Dashboard] Top fornecedores - Contas processadas:', contasProcessadas.length)
            
            // Filtra apenas contas com fornecedor válido e valor > 0
            const contasComFornecedor = contasProcessadas.filter(c => 
                c.fornecedor && 
                c.fornecedor.trim() !== '' && 
                parseValue(c.valor_conta) > 0
            )
            
            console.log('[Dashboard] Top fornecedores - Contas com fornecedor válido:', contasComFornecedor.length)
            
            const porFornecedor = groupBy(contasComFornecedor, 'fornecedor', 'valor_conta')
            const resultado = sortByValue(
                Object.values(porFornecedor),
                'total',
                limite
            )
            
            const response = {
                sucesso: true,
                dados: {
                    periodo: { inicio, fim },
                    fornecedores: resultado
                }
            }
            
            // Salva no cache
            await cache.set(cacheKey, response, 300)
            
            return response
        } catch (error) {
            console.error('Erro ao obter top fornecedores:', error)
            throw error
        }
    }
    
    /**
     * Obtém contas vencidas ou próximas do vencimento
     * @param {Object} filters - Filtros
     * @returns {Promise<Object>}
     */
    async getVencimentos(filters = {}) {
        try {
            const { dias = 30, apenas_vencidas = false } = filters
            
            // Cache menor para vencimentos (1 minuto) pois muda frequentemente
            const cacheKey = cache.generateKey('vencimentos', filters)
            const cached = await cache.get(cacheKey)
            if (cached) {
                console.log('[Dashboard] Cache hit: vencimentos')
                return cached
            }
            
            const hoje = new Date()
            hoje.setHours(0, 0, 0, 0)
            
            const dataLimite = new Date(hoje)
            dataLimite.setDate(dataLimite.getDate() + parseInt(dias))
            
            const whereClause = {
                situacao: { [Op.in]: ['Aberto', 'Em andamento'] },
                vencimento: { [Op.ne]: null }
            }
            
            if (apenas_vencidas) {
                whereClause.vencimento = { [Op.lt]: formatDateSQL(hoje) }
            } else {
                whereClause.vencimento = { 
                    [Op.between]: [formatDateSQL(hoje), formatDateSQL(dataLimite)]
                }
            }
            
            const contas = await Conta.findAll({
                where: whereClause,
                order: [['vencimento', 'ASC']],
                raw: true
            })
            
            // Processa contas
            const contasProcessadas = this.processarContas(contas)
            
            const resultado = contasProcessadas.map(conta => {
                const vencimento = parseDate(conta.vencimento)
                const diasAteVencimento = vencimento 
                    ? Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24))
                    : null
                
                return {
                    numero_conta: conta.numero_conta,
                    fornecedor: conta.fornecedor,
                    valor_conta: parseValue(conta.valor_conta),
                    vencimento: conta.vencimento,
                    situacao: conta.situacao,
                    dias_ate_vencimento: diasAteVencimento,
                    vencida: diasAteVencimento < 0
                }
            })
            
            const response = {
                sucesso: true,
                dados: {
                    dias,
                    apenas_vencidas,
                    contas: resultado,
                    total: resultado.length,
                    valor_total: resultado.reduce((sum, c) => sum + c.valor_conta, 0)
                }
            }
            
            // Cache de 1 minuto para vencimentos
            await cache.set(cacheKey, response, 60)
            
            return response
        } catch (error) {
            console.error('Erro ao obter vencimentos:', error)
            throw error
        }
    }
    
    /**
     * Obtém KPIs principais
     * @param {Object} filters - Filtros
     * @returns {Promise<Object>}
     */
    async getKPIs(filters = {}) {
        try {
            // Verifica cache
            const cacheKey = cache.generateKey('kpis', filters)
            const cached = await cache.get(cacheKey)
            if (cached) {
                console.log('[Dashboard] Cache hit: kpis')
                return cached
            }
            
            const resumo = await this.getResumoGeral(filters)
            
            // Verifica se resumo tem dados válidos
            if (!resumo || !resumo.dados) {
                throw new Error('Resumo geral não retornou dados válidos')
            }
            
            let vencimentos = { dados: { contas: [] } }
            try {
                vencimentos = await this.getVencimentos({ dias: 30 })
            } catch (error) {
                console.warn('[Dashboard] Erro ao obter vencimentos, continuando sem eles:', error.message)
            }
            
            const dados = resumo.dados
            
            // Calcula taxa de pagamento
            const totalAberto = dados.por_situacao && dados.por_situacao['Aberto'] 
                ? (dados.por_situacao['Aberto'].total || 0) 
                : 0
            const totalPago = dados.por_situacao && dados.por_situacao['Pago'] 
                ? (dados.por_situacao['Pago'].total || 0) 
                : 0
            const totalGeral = dados.total_geral ? (dados.total_geral.total || 0) : 0
            
            console.log('[Dashboard] KPIs - Valores calculados:', {
                totalGeral,
                totalPago,
                totalAberto,
                por_situacao: dados.por_situacao
            })
            
            const taxaPagamento = totalGeral > 0 
                ? ((totalPago / totalGeral) * 100).toFixed(2)
                : 0
            
            const response = {
                sucesso: true,
                dados: {
                    periodo: dados.periodo,
                    kpis: {
                        total_contas: dados.total_geral ? (dados.total_geral.quantidade || 0) : 0,
                        total_valor: dados.total_geral ? (dados.total_geral.total || 0) : 0,
                        valor_medio: dados.total_geral ? (dados.total_geral.media || 0) : 0,
                        total_pago: totalPago,
                        total_aberto: totalAberto,
                        taxa_pagamento: parseFloat(taxaPagamento),
                        contas_vencidas: vencimentos.dados && vencimentos.dados.contas 
                            ? vencimentos.dados.contas.filter(c => c.vencida).length 
                            : 0,
                        valor_vencido: vencimentos.dados && vencimentos.dados.contas
                            ? vencimentos.dados.contas
                                .filter(c => c.vencida)
                                .reduce((sum, c) => sum + (parseFloat(c.valor_conta) || 0), 0)
                            : 0
                    }
                }
            }
            
            // Salva no cache
            await cache.set(cacheKey, response, 300)
            
            return response
        } catch (error) {
            console.error('Erro ao obter KPIs:', error)
            throw error
        }
    }
    
    /**
     * Comparativo entre períodos
     * @param {Object} filters - Filtros
     * @returns {Promise<Object>}
     */
    async getComparativoPeriodo(filters = {}) {
        try {
            const { periodo_atual, periodo_anterior } = filters
            
            const cacheKey = cache.generateKey('comparativo', filters)
            const cached = await cache.get(cacheKey)
            if (cached) return cached
            
            const periodoAtualData = getPeriod(periodo_atual || 'mes_atual')
            const periodoAnteriorData = getPeriod(periodo_anterior || 'mes_anterior')
            
            const [atual, anterior] = await Promise.all([
                this.getResumoGeral({ 
                    data_inicio: periodoAtualData.inicio, 
                    data_fim: periodoAtualData.fim 
                }),
                this.getResumoGeral({ 
                    data_inicio: periodoAnteriorData.inicio, 
                    data_fim: periodoAnteriorData.fim 
                })
            ])
            
            const totalAtual = atual.dados.total_geral.total
            const totalAnterior = anterior.dados.total_geral.total
            const variacao = totalAnterior > 0 
                ? (((totalAtual - totalAnterior) / totalAnterior) * 100).toFixed(2)
                : 0
            
            const response = {
                sucesso: true,
                dados: {
                    periodo_atual: periodoAtualData,
                    periodo_anterior: periodoAnteriorData,
                    atual: atual.dados.total_geral,
                    anterior: anterior.dados.total_geral,
                    variacao: parseFloat(variacao),
                    variacao_valor: totalAtual - totalAnterior
                }
            }
            
            await cache.set(cacheKey, response, 300)
            return response
        } catch (error) {
            console.error('Erro ao obter comparativo:', error)
            throw error
        }
    }
    
    /**
     * Obtém alertas do sistema com dados reais e links
     * @returns {Promise<Object>}
     */
    async getAlertas() {
        try {
            // Cache de 30 segundos para alertas
            const cacheKey = cache.generateKey('alertas', {})
            const cached = await cache.get(cacheKey)
            if (cached) {
                console.log('[Dashboard] Cache hit: alertas')
                return cached
            }
            
            const alertas = []
            
            // 1. Contas vencidas - DADOS REAIS
            const hoje = new Date()
            hoje.setHours(0, 0, 0, 0)
            
            const contasVencidas = await Conta.findAll({
                where: {
                    situacao: { [Op.in]: ['Aberto', 'Em andamento'] },
                    vencimento: { 
                        [Op.ne]: null,
                        [Op.lt]: formatDateSQL(hoje)
                    }
                },
                order: [['vencimento', 'ASC']],
                raw: true
            })
            
            console.log('[Dashboard] Alertas - Contas vencidas encontradas:', contasVencidas.length)
            
            if (contasVencidas.length > 0) {
                // Processa contas vencidas (remove duplicatas) e filtra apenas as realmente vencidas
                const contasVencidasUnicas = this.processarContas(contasVencidas)
                    .filter(conta => {
                        // Validação adicional: garantir que a conta está realmente vencida
                        const dataVencimento = parseDate(conta.vencimento)
                        if (!dataVencimento) return false
                        
                        const dataVencimentoLimpa = new Date(dataVencimento)
                        dataVencimentoLimpa.setHours(0, 0, 0, 0)
                        
                        return dataVencimentoLimpa < hoje
                    })
                
                if (contasVencidasUnicas.length > 0) {
                    const valorTotal = contasVencidasUnicas.reduce((sum, c) => sum + parseValue(c.valor_conta), 0)
                    
                    alertas.push({
                        tipo: 'vencidas',
                        severidade: 'alta',
                        titulo: 'Contas Vencidas',
                        mensagem: `${contasVencidasUnicas.length} conta(s) vencida(s) não pagas`,
                        valor: valorTotal,
                        quantidade: contasVencidasUnicas.length,
                        contas: contasVencidasUnicas.map(conta => {
                            const dataVencimento = parseDate(conta.vencimento)
                            const diasAtraso = dataVencimento ? Math.ceil((hoje - dataVencimento) / (1000 * 60 * 60 * 24)) : 0
                            
                            return {
                                numero_conta: conta.numero_conta,
                                fornecedor: conta.fornecedor || 'Não informado',
                                valor_conta: parseValue(conta.valor_conta),
                                vencimento: conta.vencimento,
                                situacao: conta.situacao,
                                historico: conta.historico || '',
                                dias_atraso: diasAtraso > 0 ? diasAtraso : 0
                            }
                        })
                    })
                }
            }
            
            // 2. Contas próximas do vencimento (7 dias) - DADOS REAIS
            const dataLimite7Dias = new Date(hoje)
            dataLimite7Dias.setDate(dataLimite7Dias.getDate() + 7)
            
            const contasProximas = await Conta.findAll({
                where: {
                    situacao: { [Op.in]: ['Aberto', 'Em andamento'] },
                    vencimento: { 
                        [Op.ne]: null,
                        [Op.between]: [formatDateSQL(hoje), formatDateSQL(dataLimite7Dias)]
                    }
                },
                order: [['vencimento', 'ASC']],
                raw: true
            })
            
            console.log('[Dashboard] Alertas - Contas próximas do vencimento encontradas:', contasProximas.length)
            
            if (contasProximas.length > 0) {
                const contasProximasUnicas = this.processarContas(contasProximas)
                const valorTotal = contasProximasUnicas.reduce((sum, c) => sum + parseValue(c.valor_conta), 0)
                
                alertas.push({
                    tipo: 'proximas_vencimento',
                    severidade: 'media',
                    titulo: 'Contas Próximas do Vencimento',
                    mensagem: `${contasProximasUnicas.length} conta(s) vence(m) nos próximos 7 dias`,
                    valor: valorTotal,
                    quantidade: contasProximasUnicas.length,
                    contas: contasProximasUnicas.map(conta => {
                        const vencimento = parseDate(conta.vencimento)
                        const diasAteVencimento = vencimento 
                            ? Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24))
                            : null
                        
                        return {
                            numero_conta: conta.numero_conta,
                            fornecedor: conta.fornecedor || 'Não informado',
                            valor_conta: parseValue(conta.valor_conta),
                            vencimento: conta.vencimento,
                            situacao: conta.situacao,
                            historico: conta.historico || '',
                            dias_ate_vencimento: diasAteVencimento
                        }
                    })
                })
            }
            
            // 3. Valores muito altos (acima de 3 desvios padrão) - DADOS REAIS
            const periodo = getPeriod('mes_atual')
            const contasMesAtual = await Conta.findAll({
                where: {
                    cadastramento: {
                        [Op.between]: [periodo.inicio, periodo.fim]
                    },
                    valor_conta: { [Op.ne]: null }
                },
                raw: true
            })
            
            if (contasMesAtual.length > 0) {
                const contasUnicas = this.processarContas(contasMesAtual)
                const valores = contasUnicas.map(c => parseValue(c.valor_conta)).filter(v => v > 0)
                
                if (valores.length > 0) {
                    const media = valores.reduce((a, b) => a + b, 0) / valores.length
                    const variancia = valores.reduce((sum, v) => sum + Math.pow(v - media, 2), 0) / valores.length
                    const desvioPadrao = Math.sqrt(variancia)
                    const limite = media + (3 * desvioPadrao)
                    
                    const valoresAltos = contasUnicas.filter(c => {
                        const valor = parseValue(c.valor_conta)
                        return valor > limite && valor > 0
                    })
                    
                    if (valoresAltos.length > 0) {
                        alertas.push({
                            tipo: 'valores_altos',
                            severidade: 'baixa',
                            titulo: 'Valores Acima do Normal',
                            mensagem: `${valoresAltos.length} conta(s) com valor muito acima da média (R$ ${formatCurrency(limite, false)})`,
                            quantidade: valoresAltos.length,
                            valor_limite: limite,
                            contas: valoresAltos.map(conta => ({
                                numero_conta: conta.numero_conta,
                                fornecedor: conta.fornecedor || 'Não informado',
                                valor_conta: parseValue(conta.valor_conta),
                                situacao: conta.situacao,
                                historico: conta.historico || '',
                                cadastramento: conta.cadastramento
                            }))
                        })
                    }
                }
            }
            
            // 4. Contas sem fornecedor - DADOS REAIS
            const contasSemFornecedor = await Conta.findAll({
                where: {
                    [Op.or]: [
                        { fornecedor: null },
                        { fornecedor: '' }
                    ],
                    situacao: { [Op.in]: ['Aberto', 'Em andamento'] }
                },
                raw: true
            })
            
            console.log('[Dashboard] Alertas - Contas sem fornecedor encontradas:', contasSemFornecedor.length)
            
            if (contasSemFornecedor.length > 0) {
                const contasSemFornecedorUnicas = this.processarContas(contasSemFornecedor)
                
                alertas.push({
                    tipo: 'sem_fornecedor',
                    severidade: 'media',
                    titulo: 'Contas sem Fornecedor',
                    mensagem: `${contasSemFornecedorUnicas.length} conta(s) sem fornecedor cadastrado`,
                    quantidade: contasSemFornecedorUnicas.length,
                    contas: contasSemFornecedorUnicas.map(conta => ({
                        numero_conta: conta.numero_conta,
                        valor_conta: parseValue(conta.valor_conta),
                        situacao: conta.situacao,
                        historico: conta.historico || '',
                        cadastramento: conta.cadastramento
                    }))
                })
            }
            
            const response = {
                sucesso: true,
                dados: {
                    alertas,
                    total: alertas.length
                }
            }
            
            await cache.set(cacheKey, response, 30)
            return response
        } catch (error) {
            console.error('Erro ao obter alertas:', error)
            throw error
        }
    }
    
    /**
     * Limpa cache do dashboard
     */
    async limparCache() {
        try {
            await cache.clear('dashboard')
            return { sucesso: true, mensagem: 'Cache limpo com sucesso' }
        } catch (error) {
            console.error('Erro ao limpar cache:', error)
            throw error
        }
    }
    
    /**
     * Obtém evolução temporal (receitas vs despesas)
     * @param {Object} filters - Filtros
     * @returns {Promise<Object>}
     */
    async getEvolucaoTemporal(filters = {}) {
        try {
            const { periodo, data_inicio, data_fim, agrupamento = 'dia' } = filters
            
            const cacheKey = cache.generateKey('evolucao-temporal', filters)
            const cached = await cache.get(cacheKey)
            if (cached) {
                console.log('[Dashboard] Cache hit: evolucao-temporal')
                return cached
            }
            
            let inicio = data_inicio
            let fim = data_fim
            if (!inicio && !fim && periodo) {
                const periodData = getPeriod(periodo)
                inicio = periodData.inicio
                fim = periodData.fim
            }
            
            const whereClause = {}
            if (inicio || fim) {
                whereClause.cadastramento = {}
                if (inicio) whereClause.cadastramento[Op.gte] = inicio
                if (fim) whereClause.cadastramento[Op.lte] = fim
            }
            
            const contas = await Conta.findAll({
                where: whereClause,
                raw: true
            })
            
            const contasProcessadas = this.processarContas(contas)
            const evolucao = {}
            
            contasProcessadas.forEach(conta => {
                if (!conta.cadastramento) return
                
                const date = parseDate(conta.cadastramento)
                if (!date) return
                
                let key
                switch (agrupamento) {
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
                        key = formatDateSQL(date)
                }
                
                if (!evolucao[key]) {
                    evolucao[key] = {
                        periodo: key,
                        receitas: 0,
                        despesas: 0,
                        total: 0
                    }
                }
                
                const valor = parseValue(conta.valor_conta)
                const situacao = (conta.situacao || '').trim()
                
                evolucao[key].total += valor
                
                // Considera receitas como contas pagas e despesas como contas abertas
                if (situacao === 'Pago') {
                    evolucao[key].receitas += valor
                } else {
                    evolucao[key].despesas += valor
                }
            })
            
            const resultado = Object.values(evolucao).sort((a, b) => 
                a.periodo.localeCompare(b.periodo)
            )
            
            const response = {
                sucesso: true,
                dados: {
                    periodo: { inicio, fim },
                    agrupamento,
                    evolucao: resultado
                }
            }
            
            await cache.set(cacheKey, response, 300)
            return response
        } catch (error) {
            console.error('Erro ao obter evolução temporal:', error)
            throw error
        }
    }
    
    /**
     * Obtém distribuição por categoria/grupo
     * @param {Object} filters - Filtros
     * @returns {Promise<Object>}
     */
    async getDistribuicaoPorCategoria(filters = {}) {
        try {
            const { periodo, data_inicio, data_fim, tipo = 'categoria' } = filters
            
            const cacheKey = cache.generateKey('distribuicao-categoria', filters)
            const cached = await cache.get(cacheKey)
            if (cached) {
                console.log('[Dashboard] Cache hit: distribuicao-categoria')
                return cached
            }
            
            let inicio = data_inicio
            let fim = data_fim
            if (!inicio && !fim && periodo) {
                const periodData = getPeriod(periodo)
                inicio = periodData.inicio
                fim = periodData.fim
            }
            
            const whereClause = {}
            if (inicio || fim) {
                whereClause.cadastramento = {}
                if (inicio) whereClause.cadastramento[Op.gte] = inicio
                if (fim) whereClause.cadastramento[Op.lte] = fim
            }
            
            const campo = tipo === 'grupo' ? 'grupo' : tipo === 'subgrupo' ? 'subgrupo' : 'categoria'
            whereClause[campo] = { [Op.ne]: null, [Op.ne]: '' }
            
            const contas = await Conta.findAll({
                where: whereClause,
                raw: true
            })
            
            const contasProcessadas = this.processarContas(contas)
            const distribuicao = {}
            
            contasProcessadas.forEach(conta => {
                const valor = parseValue(conta.valor_conta)
                const categoria = conta[campo] || 'Não informado'
                
                if (!distribuicao[categoria]) {
                    distribuicao[categoria] = {
                        nome: categoria,
                        valor: 0,
                        quantidade: 0
                    }
                }
                
                distribuicao[categoria].valor += valor
                distribuicao[categoria].quantidade += 1
            })
            
            const resultado = Object.values(distribuicao)
                .sort((a, b) => b.valor - a.valor)
                .slice(0, 10)
            
            const response = {
                sucesso: true,
                dados: {
                    periodo: { inicio, fim },
                    tipo,
                    distribuicao: resultado
                }
            }
            
            await cache.set(cacheKey, response, 300)
            return response
        } catch (error) {
            console.error('Erro ao obter distribuição por categoria:', error)
            throw error
        }
    }
    
    /**
     * Obtém análise por banco
     * @param {Object} filters - Filtros
     * @returns {Promise<Object>}
     */
    async getAnalisePorBanco(filters = {}) {
        try {
            const { periodo, data_inicio, data_fim } = filters
            
            const cacheKey = cache.generateKey('analise-banco', filters)
            const cached = await cache.get(cacheKey)
            if (cached) {
                console.log('[Dashboard] Cache hit: analise-banco')
                return cached
            }
            
            let inicio = data_inicio
            let fim = data_fim
            if (!inicio && !fim && periodo) {
                const periodData = getPeriod(periodo)
                inicio = periodData.inicio
                fim = periodData.fim
            }
            
            const whereClause = {
                banco: { [Op.ne]: null, [Op.ne]: '' }
            }
            
            if (inicio || fim) {
                whereClause.cadastramento = {}
                if (inicio) whereClause.cadastramento[Op.gte] = inicio
                if (fim) whereClause.cadastramento[Op.lte] = fim
            }
            
            const contas = await Conta.findAll({
                where: whereClause,
                raw: true
            })
            
            const contasProcessadas = this.processarContas(contas)
            const bancos = {}
            
            contasProcessadas.forEach(conta => {
                const valor = parseValue(conta.valor_conta)
                const banco = conta.banco || 'Não informado'
                const situacao = (conta.situacao || '').trim()
                
                if (!bancos[banco]) {
                    bancos[banco] = {
                        nome: banco,
                        total: 0,
                        pago: 0,
                        aberto: 0,
                        quantidade: 0
                    }
                }
                
                bancos[banco].total += valor
                bancos[banco].quantidade += 1
                
                if (situacao === 'Pago') {
                    bancos[banco].pago += valor
                } else {
                    bancos[banco].aberto += valor
                }
            })
            
            const resultado = Object.values(bancos)
                .sort((a, b) => b.total - a.total)
            
            const response = {
                sucesso: true,
                dados: {
                    periodo: { inicio, fim },
                    bancos: resultado
                }
            }
            
            await cache.set(cacheKey, response, 300)
            return response
        } catch (error) {
            console.error('Erro ao obter análise por banco:', error)
            throw error
        }
    }
    
    /**
     * Obtém top 10 contas por valor
     * @param {Object} filters - Filtros
     * @returns {Promise<Object>}
     */
    async getTopContasPorValor(filters = {}) {
        try {
            const { periodo, data_inicio, data_fim, limite = 10 } = filters
            
            const cacheKey = cache.generateKey('top-contas-valor', filters)
            const cached = await cache.get(cacheKey)
            if (cached) {
                console.log('[Dashboard] Cache hit: top-contas-valor')
                return cached
            }
            
            let inicio = data_inicio
            let fim = data_fim
            if (!inicio && !fim && periodo) {
                const periodData = getPeriod(periodo)
                inicio = periodData.inicio
                fim = periodData.fim
            }
            
            const whereClause = {}
            if (inicio || fim) {
                whereClause.cadastramento = {}
                if (inicio) whereClause.cadastramento[Op.gte] = inicio
                if (fim) whereClause.cadastramento[Op.lte] = fim
            }
            
            const contas = await Conta.findAll({
                where: whereClause,
                raw: true
            })
            
            const contasProcessadas = this.processarContas(contas)
            
            const resultado = contasProcessadas
                .map(conta => ({
                    numero_conta: conta.numero_conta,
                    fornecedor: conta.fornecedor || 'Não informado',
                    valor_conta: parseValue(conta.valor_conta),
                    situacao: conta.situacao || 'Aberto',
                    vencimento: conta.vencimento,
                    cadastramento: conta.cadastramento
                }))
                .sort((a, b) => b.valor_conta - a.valor_conta)
                .slice(0, limite)
            
            const response = {
                sucesso: true,
                dados: {
                    periodo: { inicio, fim },
                    contas: resultado
                }
            }
            
            await cache.set(cacheKey, response, 300)
            return response
        } catch (error) {
            console.error('Erro ao obter top contas por valor:', error)
            throw error
        }
    }
    
    /**
     * Obtém comparativo mensal
     * @param {Object} filters - Filtros
     * @returns {Promise<Object>}
     */
    async getComparativoMensal(filters = {}) {
        try {
            const cacheKey = cache.generateKey('comparativo-mensal', filters)
            const cached = await cache.get(cacheKey)
            if (cached) {
                console.log('[Dashboard] Cache hit: comparativo-mensal')
                return cached
            }
            
            const hoje = new Date()
            const mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
            const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
            const fimMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0)
            
            const [contasMesAtual, contasMesAnterior] = await Promise.all([
                Conta.findAll({
                    where: {
                        cadastramento: {
                            [Op.gte]: formatDateSQL(mesAtual),
                            [Op.lte]: formatDateSQL(hoje)
                        }
                    },
                    raw: true
                }),
                Conta.findAll({
                    where: {
                        cadastramento: {
                            [Op.gte]: formatDateSQL(mesAnterior),
                            [Op.lte]: formatDateSQL(fimMesAnterior)
                        }
                    },
                    raw: true
                })
            ])
            
            const processarMes = (contas) => {
                const processadas = this.processarContas(contas)
                const total = processadas.reduce((sum, c) => sum + parseValue(c.valor_conta), 0)
                const pago = processadas
                    .filter(c => (c.situacao || '').trim() === 'Pago')
                    .reduce((sum, c) => sum + parseValue(c.valor_conta), 0)
                const aberto = processadas
                    .filter(c => (c.situacao || '').trim() === 'Aberto')
                    .reduce((sum, c) => sum + parseValue(c.valor_conta), 0)
                
                return {
                    quantidade: processadas.length,
                    total,
                    pago,
                    aberto,
                    media: processadas.length > 0 ? total / processadas.length : 0
                }
            }
            
            const mesAtualData = processarMes(contasMesAtual)
            const mesAnteriorData = processarMes(contasMesAnterior)
            
            const variacao = {
                quantidade: mesAnteriorData.quantidade > 0 
                    ? ((mesAtualData.quantidade - mesAnteriorData.quantidade) / mesAnteriorData.quantidade * 100).toFixed(2)
                    : 0,
                total: mesAnteriorData.total > 0
                    ? ((mesAtualData.total - mesAnteriorData.total) / mesAnteriorData.total * 100).toFixed(2)
                    : 0
            }
            
            const response = {
                sucesso: true,
                dados: {
                    mes_atual: mesAtualData,
                    mes_anterior: mesAnteriorData,
                    variacao: {
                        quantidade: parseFloat(variacao.quantidade),
                        total: parseFloat(variacao.total)
                    }
                }
            }
            
            await cache.set(cacheKey, response, 300)
            return response
        } catch (error) {
            console.error('Erro ao obter comparativo mensal:', error)
            throw error
        }
    }
}

module.exports = new DashboardService()
