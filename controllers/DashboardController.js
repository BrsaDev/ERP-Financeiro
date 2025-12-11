/**
 * Controller do Dashboard
 * Gerencia as requisições e respostas do dashboard
 */

const dashboardService = require('../services/DashboardService')

class DashboardController {
    /**
     * Renderiza a página principal do dashboard
     */
    async index(req, res) {
        try {
            res.render('dashboard/index', {
                titulo: 'Dashboard Financeiro'
            })
        } catch (error) {
            console.error('Erro ao renderizar dashboard:', error)
            req.flash('error_msg', 'Erro ao carregar dashboard')
            res.redirect('/')
        }
    }
    
    /**
     * API: Resumo geral
     */
    async getResumoGeral(req, res) {
        try {
            const filters = {
                periodo: req.query.periodo,
                data_inicio: req.query.data_inicio,
                data_fim: req.query.data_fim,
                situacao: req.query.situacao
            }
            
            const resultado = await dashboardService.getResumoGeral(filters)
            res.json(resultado)
        } catch (error) {
            console.error('Erro ao obter resumo geral:', error)
            res.status(500).json({
                sucesso: false,
                erro: 'Erro ao obter resumo geral',
                detalhes: error.message
            })
        }
    }
    
    /**
     * API: Fluxo de caixa
     */
    async getFluxoCaixa(req, res) {
        try {
            const filters = {
                periodo: req.query.periodo,
                data_inicio: req.query.data_inicio,
                data_fim: req.query.data_fim,
                agrupamento: req.query.agrupamento || 'mes'
            }
            
            const resultado = await dashboardService.getFluxoCaixa(filters)
            res.json(resultado)
        } catch (error) {
            console.error('Erro ao obter fluxo de caixa:', error)
            res.status(500).json({
                sucesso: false,
                erro: 'Erro ao obter fluxo de caixa',
                detalhes: error.message
            })
        }
    }
    
    /**
     * API: DRE por departamento
     */
    async getDrePorDepartamento(req, res) {
        try {
            const filters = {
                periodo: req.query.periodo,
                data_inicio: req.query.data_inicio,
                data_fim: req.query.data_fim,
                limite: parseInt(req.query.limite) || 10
            }
            
            const resultado = await dashboardService.getDrePorDepartamento(filters)
            res.json(resultado)
        } catch (error) {
            console.error('Erro ao obter DRE por departamento:', error)
            res.status(500).json({
                sucesso: false,
                erro: 'Erro ao obter DRE por departamento',
                detalhes: error.message
            })
        }
    }
    
    /**
     * API: Top fornecedores
     */
    async getTopFornecedores(req, res) {
        try {
            const filters = {
                periodo: req.query.periodo,
                data_inicio: req.query.data_inicio,
                data_fim: req.query.data_fim,
                limite: parseInt(req.query.limite) || 10
            }
            
            const resultado = await dashboardService.getTopFornecedores(filters)
            res.json(resultado)
        } catch (error) {
            console.error('Erro ao obter top fornecedores:', error)
            res.status(500).json({
                sucesso: false,
                erro: 'Erro ao obter top fornecedores',
                detalhes: error.message
            })
        }
    }
    
    /**
     * API: Vencimentos
     */
    async getVencimentos(req, res) {
        try {
            const filters = {
                dias: parseInt(req.query.dias) || 30,
                apenas_vencidas: req.query.apenas_vencidas === 'true'
            }
            
            const resultado = await dashboardService.getVencimentos(filters)
            res.json(resultado)
        } catch (error) {
            console.error('Erro ao obter vencimentos:', error)
            res.status(500).json({
                sucesso: false,
                erro: 'Erro ao obter vencimentos',
                detalhes: error.message
            })
        }
    }
    
    /**
     * API: KPIs
     */
    async getKPIs(req, res) {
        try {
            const filters = {
                periodo: req.query.periodo,
                data_inicio: req.query.data_inicio,
                data_fim: req.query.data_fim,
                situacao: req.query.situacao
            }
            
            const resultado = await dashboardService.getKPIs(filters)
            res.json(resultado)
        } catch (error) {
            console.error('Erro ao obter KPIs:', error)
            res.status(500).json({
                sucesso: false,
                erro: 'Erro ao obter KPIs',
                detalhes: error.message
            })
        }
    }
    
    /**
     * API: Comparativo de períodos
     */
    async getComparativoPeriodo(req, res) {
        try {
            const filters = {
                periodo_atual: req.query.periodo_atual || 'mes_atual',
                periodo_anterior: req.query.periodo_anterior || 'mes_anterior'
            }
            
            const resultado = await dashboardService.getComparativoPeriodo(filters)
            res.json(resultado)
        } catch (error) {
            console.error('Erro ao obter comparativo:', error)
            res.status(500).json({
                sucesso: false,
                erro: 'Erro ao obter comparativo',
                detalhes: error.message
            })
        }
    }
    
    /**
     * API: Alertas
     */
    async getAlertas(req, res) {
        try {
            const resultado = await dashboardService.getAlertas()
            res.json(resultado)
        } catch (error) {
            console.error('Erro ao obter alertas:', error)
            res.status(500).json({
                sucesso: false,
                erro: 'Erro ao obter alertas',
                detalhes: error.message
            })
        }
    }
    
    /**
     * API: Limpar cache
     */
    async limparCache(req, res) {
        try {
            const resultado = await dashboardService.limparCache()
            res.json(resultado)
        } catch (error) {
            console.error('Erro ao limpar cache:', error)
            res.status(500).json({
                sucesso: false,
                erro: 'Erro ao limpar cache',
                detalhes: error.message
            })
        }
    }
    
    /**
     * API: Evolução temporal
     */
    async getEvolucaoTemporal(req, res) {
        try {
            const filters = {
                periodo: req.query.periodo,
                data_inicio: req.query.data_inicio,
                data_fim: req.query.data_fim,
                agrupamento: req.query.agrupamento || 'dia'
            }
            
            const resultado = await dashboardService.getEvolucaoTemporal(filters)
            res.json(resultado)
        } catch (error) {
            console.error('Erro ao obter evolução temporal:', error)
            res.status(500).json({
                sucesso: false,
                erro: 'Erro ao obter evolução temporal',
                detalhes: error.message
            })
        }
    }
    
    /**
     * API: Distribuição por categoria
     */
    async getDistribuicaoPorCategoria(req, res) {
        try {
            const filters = {
                periodo: req.query.periodo,
                data_inicio: req.query.data_inicio,
                data_fim: req.query.data_fim,
                tipo: req.query.tipo || 'categoria'
            }
            
            const resultado = await dashboardService.getDistribuicaoPorCategoria(filters)
            res.json(resultado)
        } catch (error) {
            console.error('Erro ao obter distribuição por categoria:', error)
            res.status(500).json({
                sucesso: false,
                erro: 'Erro ao obter distribuição por categoria',
                detalhes: error.message
            })
        }
    }
    
    /**
     * API: Análise por banco
     */
    async getAnalisePorBanco(req, res) {
        try {
            const filters = {
                periodo: req.query.periodo,
                data_inicio: req.query.data_inicio,
                data_fim: req.query.data_fim
            }
            
            const resultado = await dashboardService.getAnalisePorBanco(filters)
            res.json(resultado)
        } catch (error) {
            console.error('Erro ao obter análise por banco:', error)
            res.status(500).json({
                sucesso: false,
                erro: 'Erro ao obter análise por banco',
                detalhes: error.message
            })
        }
    }
    
    /**
     * API: Top contas por valor
     */
    async getTopContasPorValor(req, res) {
        try {
            const filters = {
                periodo: req.query.periodo,
                data_inicio: req.query.data_inicio,
                data_fim: req.query.data_fim,
                limite: parseInt(req.query.limite) || 10
            }
            
            const resultado = await dashboardService.getTopContasPorValor(filters)
            res.json(resultado)
        } catch (error) {
            console.error('Erro ao obter top contas por valor:', error)
            res.status(500).json({
                sucesso: false,
                erro: 'Erro ao obter top contas por valor',
                detalhes: error.message
            })
        }
    }
    
    /**
     * API: Comparativo mensal
     */
    async getComparativoMensal(req, res) {
        try {
            const resultado = await dashboardService.getComparativoMensal()
            res.json(resultado)
        } catch (error) {
            console.error('Erro ao obter comparativo mensal:', error)
            res.status(500).json({
                sucesso: false,
                erro: 'Erro ao obter comparativo mensal',
                detalhes: error.message
            })
        }
    }
}

module.exports = new DashboardController()

