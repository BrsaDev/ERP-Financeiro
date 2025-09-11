const express = require('express')
const router = express.Router()
const path = require('path')
const ItensConta = require('../models/ItensConta')
const PaginaHome = require('../models/PaginaHome')
const TipoChavePix = require('../models/TipoChavePix')
const { eAdmin } = require(`../helpers/eAdmin`)
const { backup, restore, list_files_backup } = require(`../models/backup/backup`)
const {resolveRoutes} = require(`../helpers/resolveRoutes`)


const barraRoute = resolveRoutes()


router.get('/pagina-home', eAdmin, async (req, res) => {
    const nickname = req.user.dataValues.nickname
    let paginaHome = await PaginaHome.findOne({where: {usuario: nickname}})
    let dados = JSON.stringify(paginaHome)
    if ( !dados ) {
        // dados = JSON.stringify({campo: 'conta', href: '/conta/listar'})
        return res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}configuracao${barraRoute}paginaHome`))
    }
    res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}configuracao${barraRoute}paginaHome`), {dados})
})

router.post('/pagina-home', async (req, res) => {
    const nickname = req.user.dataValues.nickname
    let erros = []
    let item = req.body//Object.entries(req.body).filter(item => item[1])
    if ( Object.keys(item).length == 0 ) {
        erros.push({ text: `É preciso selecionar pelo menos 1 item!` })
        return res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}configuracao${barraRoute}paginaHome`), {erros})
    }
    let paginaHome = await PaginaHome.findOne({where: {usuario: nickname}})
    paginaHome = JSON.parse(JSON.stringify(paginaHome, null, 2))
    if ( paginaHome ) {        
        await PaginaHome.update({
            campo: Object.keys(item)[0],
            href: `/` + Object.keys(item)[0].replace('_', '-') + `/listar`
        }, {where: {usuario: nickname}})
        .then(() => {
            req.flash(`success_msg`, `Página Home configurada com sucesso!`)
            res.redirect(`/`)
        })
        .catch((erro) => {
            let erros = [{ text: `Erro ao configurar Página Home, se persistir informar o desenvolvedor.` }]
            res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}configuracao${barraRoute}paginaHome`), {erros})
        })
    }else {
        PaginaHome.create({
            campo: Object.keys(item)[0],
            href: `/` + Object.keys(item)[0].replace('_', '-') + `/listar`,
            usuario: nickname
        })
        .then(() => {
            req.flash(`success_msg`, `Página Home configurada com sucesso!`)
            res.redirect(`/`)
        })
        .catch((erro) => {
            let erros = [{ text: `Erro ao configurar Página Home, se persistir informar o desenvolvedor.` }]
            res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}configuracao${barraRoute}paginaHome`), {erros})
        })
    }
})

router.get('/itens-conta', eAdmin, async (req, res) => {
    let item = await ItensConta.findOne({ where: { tipo_situacao: (req.query.situacao || `Aberto`) } })
    let itensConta = JSON.parse(JSON.stringify(item, null, 2))
    if ( item ) {
        itensConta = {...itensConta, tipo_situacao: (req.query.situacao || `Aberto`)}
        res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}configuracao${barraRoute}itensConta`), { itensConta })
    }else {
        res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}configuracao${barraRoute}itensConta`), {itensConta: {tipo_situacao: (req.query.situacao || `Aberto`) }})
    }
    
})

router.post('/itens-conta', eAdmin, async (req, res) => {
    let itens = { historico: false, fornecedor: false, via_pagamento: false, descricao: false, departamento: false, 
        valor_dre: false, rateio_dre: false, vinculado_dre: false, categoria: false, grupo: false, subgrupo: false, 
        forma_pagamento: false, agendamento: false, pagamento: false, agencia: false, conta_corrente: false, 
        num_cartao_cred: false, cheque_compens: false, situacao: false, banco: false,
        protocolo_banco: false, comprovante_pag: false, cadastramento: false, fixar_parcelas: false, 
        numero_parcelas: false, doc_pagamento: false, vencimento: false, referencia: false,
        relacao: false, numero_dias: false, observacao: false, rateio: false, reembolso: false, 
        num_pedido_compra: false, data_compra: false, emissao_nf: false,
        num_comprovante: false, data_entrega_mercad: false, mercadoria_entregue: false, comprovante_mercad: false, 
        sistema_1: false, num_sistema_1: false, sistema_2: false, num_sistema_2: false, sistema_3: false, 
        num_sistema_3: false, vinculado: false, numero_parcela: false, valor_parcela: false, vencimento_parcela: false, chave: false, 
        uf_favorecida: false, numero_documento_origem: false, codigo_barras: false, cpf_cnpj: false
    }

    
    let erros = []
    for ( let entreis of Object.entries(req.body) ) {
        let key = entreis[0]
        let value = entreis[1]
        if ( typeof itens[key] != 'undefined' && key != 'tipo_situacao' ) {
            itens[key] = true
        }
    }
    if ( erros.length == 0 ) {
        itens = {...itens, tipo_situacao: req.body.tipo_situacao }
        let item = await ItensConta.findOne({ where: { tipo_situacao: req.body.tipo_situacao } })
        if ( !item ) {
            ItensConta.create(itens)
            .then(() => {
                req.flash(`success_msg`, `Itens da conta configurados com sucesso!`)
                res.redirect(`/`)
            })
            .catch((erro) => {
                console.log(erro)
                let erros = [{ text: `Erro ao configurar itens da conta, se persistir informar o desenvolvedor.` }]
                res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}configuracao${barraRoute}itensConta`), {erros, dados: req.body})
            })
        }else {
            ItensConta.update(itens, {where: { tipo_situacao: req.body.tipo_situacao }})
            .then(() => {
                req.flash(`success_msg`, `Itens da conta configurados com sucesso!`)
                res.redirect(`/`)
            })
            .catch((erro) => {
                console.log(erro)
                let erros = [{ text: `Erro ao configurar itens da conta, se persistir informar o desenvolvedor.` }]
                res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}configuracao${barraRoute}itensConta`), {erros, dados: req.body})
            })
        }
        
    }else {
        res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}configuracao${barraRoute}itensConta`), {erros, dados: req.body})
    }
})

router.get('/set-page-home', eAdmin, async (req, res) => {
    const nickname = req.user.dataValues.nickname
    let paginaHome = await PaginaHome.findOne({where: {usuario: nickname}})
    paginaHome = JSON.parse(JSON.stringify(paginaHome, null, 2))
    if ( !paginaHome ) {
        res.json({href: `/conta/listar`})
    }else res.json({href: paginaHome.href})
})

router.get('/chave-pix', eAdmin, async (req, res) => {
    return res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}configuracao${barraRoute}chavePix`))
})


router.post('/chave-pix', async (req, res) => {
    let { tipo } = req.body
    let erros = []
    if ( tipo == `` || !tipo ) erros.push({ text: `Campo não pode ser vazio nem nulo.` })
    let item = await TipoChavePix.findOne({ where: { tipo } })
    if ( erros.length > 0 )  return res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}configuracao${barraRoute}chavePix`), {erros})
    if ( !item ) {
        TipoChavePix.create({tipo})
        .then(() => {
            req.flash(`success_msg`, `Tipo de chave pix configurados com sucesso!`)
            res.redirect(`/`)
        })
        .catch((erro) => {
            console.log(erro)
            erros.push({ text: `Erro ao configurar tipo de chave pix, se persistir informar o desenvolvedor.` })
            res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}configuracao${barraRoute}chavePix`), {erros })
        })
    }else {
        erros.push({ text: `Erro ao configurar tipo de chave pix, tipo de chave já existe.` })
        return res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}configuracao${barraRoute}chavePix`), {erros})
    }
})

router.get('/backup', eAdmin, async (req, res) => {
    let response = await list_files_backup()
    if ( !response.erro ) nomesBackup = JSON.stringify(response.nomesArquivos)
    else nomesBackup = JSON.stringify([])
    return res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}configuracao${barraRoute}backup`), {nomesBackup})
})

router.get('/criar-backup', async (req, res) => {
    let response = await backup()
    if ( !response.erro ) {
        let response = await list_files_backup()
        if ( !response.erro ) nomesBackup = response.nomesArquivos
        else nomesBackup = JSON.stringify([])
        return res.json({nomesBackup})
    }
    return res.json({erro: response.erro})
})

router.get('/listar-backups', async (req, res) => {
    let response = await list_files_backup()
    if ( !response.erro ) return res.json({backups: response.nomesArquivos})
    return res.json({erro: response.erro})
})

router.get('/restore-backup', async (req, res) => {
    let { nome, isbackup } = req.query
    if ( !nome || nome == `` ) return res.json({erro: true, message: `Precisa sinalizar qual backup vai restaurar.`})
    var resBackup = null
    if ( isbackup == `sim` ) {
        let responseBackup = await backup()
        if ( !responseBackup.erro ) {
            let response = await list_files_backup()
            if ( !response.erro ) resBackup = response.nomesArquivos
            else resBackup = JSON.stringify([])
        }else {
            resBackup = `ERRO`
        }
    }
    let response = await restore(nome)
    if ( response ) return res.json({resultado: {restore: `OK`, nomesBackup: resBackup}})
    return res.json({erro: `Não conseguimos restaurar o banco de dados nesse momento.`})
})

module.exports = router