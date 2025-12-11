/**
 * Rotas do Dashboard
 * Todas as rotas requerem autenticação
 */

const express = require('express')
const router = express.Router()
const dashboardController = require('../controllers/DashboardController')

// Middleware de autenticação (já aplicado no app.js, mas mantido aqui para segurança)
// Se necessário, pode adicionar middleware específico aqui

/**
 * GET /dashboard
 * Página principal do dashboard
 */
router.get('/', dashboardController.index)

/**
 * GET /dashboard/api/resumo-geral
 * API: Resumo geral do dashboard
 */
router.get('/api/resumo-geral', dashboardController.getResumoGeral)

/**
 * GET /dashboard/api/fluxo-caixa
 * API: Fluxo de caixa por período
 */
router.get('/api/fluxo-caixa', dashboardController.getFluxoCaixa)

/**
 * GET /dashboard/api/dre-departamento
 * API: DRE por departamento
 */
router.get('/api/dre-departamento', dashboardController.getDrePorDepartamento)

/**
 * GET /dashboard/api/top-fornecedores
 * API: Top fornecedores
 */
router.get('/api/top-fornecedores', dashboardController.getTopFornecedores)

/**
 * GET /dashboard/api/vencimentos
 * API: Contas vencidas ou próximas do vencimento
 */
router.get('/api/vencimentos', dashboardController.getVencimentos)

/**
 * GET /dashboard/api/kpis
 * API: KPIs principais
 */
router.get('/api/kpis', dashboardController.getKPIs)

/**
 * GET /dashboard/api/comparativo
 * API: Comparativo entre períodos
 */
router.get('/api/comparativo', dashboardController.getComparativoPeriodo)

/**
 * GET /dashboard/api/alertas
 * API: Alertas do sistema
 */
router.get('/api/alertas', dashboardController.getAlertas)

/**
 * POST /dashboard/api/limpar-cache
 * API: Limpar cache do dashboard
 */
router.post('/api/limpar-cache', dashboardController.limparCache)

/**
 * GET /dashboard/api/evolucao-temporal
 * API: Evolução temporal (receitas vs despesas)
 */
router.get('/api/evolucao-temporal', dashboardController.getEvolucaoTemporal)

/**
 * GET /dashboard/api/distribuicao-categoria
 * API: Distribuição por categoria/grupo/subgrupo
 */
router.get('/api/distribuicao-categoria', dashboardController.getDistribuicaoPorCategoria)

/**
 * GET /dashboard/api/analise-banco
 * API: Análise por banco
 */
router.get('/api/analise-banco', dashboardController.getAnalisePorBanco)

/**
 * GET /dashboard/api/top-contas-valor
 * API: Top contas por valor
 */
router.get('/api/top-contas-valor', dashboardController.getTopContasPorValor)

/**
 * GET /dashboard/api/comparativo-mensal
 * API: Comparativo mensal (mês atual vs mês anterior)
 */
router.get('/api/comparativo-mensal', dashboardController.getComparativoMensal)

module.exports = router

