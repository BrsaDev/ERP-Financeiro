const express = require('express')
const router = express.Router()
const path = require('path')
const multer = require('multer')
const fs = require('fs')
const conta = require('../models/Conta')
const PosicaoColunaTabConta = require('../models/PosicaoColunaTabConta')
const TamanhoColunaTabConta = require('../models/TamanhoColunaTabConta')
const VisibilidadeColunaTabConta = require('../models/VisibilidadeColunaTabConta')
const ItensConta = require('../models/ItensConta')
const TipoChavePix = require('../models/TipoChavePix')
const bcrypt = require(`bcrypt`)
const { eAdmin } = require(`../helpers/eAdmin`)
const { getVisibleColumns } = require(`../helpers/gets`)
const { Op, literal, fn, col, where } = require('sequelize')
const { Sequelize } = require('sequelize')
const {resolveRoutes} = require(`../helpers/resolveRoutes`)

const {pdfParser} = require("../helpers/extractPdf")


const barraRoute = resolveRoutes()

const uploadDir = path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}public${barraRoute}comprovantes pagamento`)
fs.mkdirSync(uploadDir, { recursive: true });

// Armazenamento configurado para salvar com nome vindo do formulário
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const customName = req.body.nomeArquivo
      ? req.body.nomeArquivo + ext
      : file.originalname;
    cb(null, customName);
  }
});

function fileFilter(req, file, cb) {
  if (file.fieldname === "pdfs") {
    // esse campo só pode receber PDFs
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Somente PDFs são permitidos no campo 'pdfs'."), false);
    }
  } else {
    // no outro campo, aceita qualquer arquivo
    cb(null, true);
  }
}

const upload = multer({ storage, fileFilter });

// Aqui definimos quais campos a rota aceita
const multiUpload = upload.fields([
  { name: "pdfs", maxCount: 50 },     // até 10 PDFs
  { name: "comprovante_pag", maxCount: 10 }    // até 10 arquivos diversos
]);

const tamanhoColunasDefault = {
        numero_conta: '69px', historico: `399px`, valor_conta: '103px', fornecedor: '83px', via_pagamento: '124px', descricao: '399px',
        departamento: '102px', valor_dre: '53px', categoria: '399px', grupo: '157px', subgrupo: '105px', forma_pagamento: '143px',
        agendamento: '100px', pagamento: '83px', agencia: '64px', conta_corrente: '104px', num_cartao_cred: '117px', cheque_compens: '139px',
        situacao: '66px', banco: '115px', protocolo_banco: '113px', comprovante_pag: '167px', cadastramento: '106px', doc_pagamento: '156px',
        vencimento: '86px', referencia: '78px', relacao: '62px', numero_dias: '85px', fixar_parcelas: '96px', numero_parcelas: '101px',
        observacao: '85px', rateio: '59px', reembolso: '81px', num_pedido_compra: '142px', data_compra: '92px', emissao_nf: '80px',
        num_comprovante: '113px', data_entrega_mercad: '164px', mercadoria_entregue: '140px', comprovante_mercad: '167px', sistema_1: '77px',
        num_sistema_1: '90px', sistema_2: '73px', num_sistema_2: '90px', sistema_3: '73px', num_sistema_3: '90px', vinculado: `101px`, 
        chave: `90px`, uf_favorecida: `90px`, numero_documento_origem: `90px`, cpf_cnpj: `90px`, codigo_barra: `164px`
}
const cabecalhoDefaultColunas = {
    id: 'Id', historico: `Histórico`, valor_conta: `Valor da Conta`, numero_conta: 'N° Conta', fornecedor: 'Fornecedor', 
    via_pagamento: 'Via de pagamento', descricao: 'Descricao',
    departamento: 'Departamento', valor_dre: 'Valor', categoria: 'Categoria', grupo: 'Grupo', subgrupo: 'Subgrupo',
    forma_pagamento: 'Forma de pagamento', agendamento: 'Agendamento', pagamento: 'Pagamento', agencia: 'Agencia',
    conta_corrente: 'Conta corrente', num_cartao_cred: 'N° cartao crédito', cheque_compens: 'Cheque compensado', 
    situacao: 'Situação', banco: 'Banco',
    protocolo_banco: 'Protocolo banco', comprovante_pag: 'Comprovante pagamento', cadastramento: 'Cadastramento', 
    doc_pagamento: 'Documento pagamento', vencimento: 'Vencimento', referencia: 'Referência',
    relacao: 'Relacao', fixar_parcelas: 'Fixar Parcelas', numero_parcelas: 'N° de parcelas', numero_dias: 'N° de dias', 
    observacao: 'Observação', rateio: 'Rateio', rateio_dre: 'Rateio Dre', reembolso: 'Reembolso',
    num_pedido_compra: 'N° pedido de compra', data_compra: 'Data compra', emissao_nf: 'Emissão nf',
    num_comprovante: 'N° comprovante', data_entrega_mercad: 'Data entrega mercadoria', vinculado: `Vinculado`, 
    vinculado_dre: `Vinculado Dre`,
    mercadoria_entregue: 'Mercadoria entregue', comprovante_mercad: 'Comprovante mercadoria',
    sistema_1: 'Sistema 1', num_sistema_1: 'N° sistema 1', sistema_2: 'Sistema 2', num_sistema_2: 'N° sistema 2',
    sistema_3: 'Sistema 3', num_sistema_3: 'N° sistema 3', numero_parcela: `N° da parcela`, 
    valor_parcela: `Valor da parcela`, 
    vencimento_parcela: `Vencimento da parcela`, chave: `Chave`, uf_favorecida: `UF Favorecida`, 
    numero_documento_origem: `N° Doc. Origem`, cpf_cnpj: `CPF/CNPJ`, codigo_barras: `Código Barras`
}
const visibilidadeColunasDefault = {
    numero_conta: true,        historico: true,      valor_conta: true,     fornecedor: true,      via_pagamento: true, 
    descricao: false,          departamento: false,  valor_dre: false,      rateio_dre: false,     vinculado_dre: false,
    categoria: false,          grupo: false,         subgrupo: false,       forma_pagamento: true, agendamento: true,
    pagamento: true,           agencia: true,        conta_corrente: true,  num_cartao_cred: true, cheque_compens: true, 
    situacao: true,            banco: true,          protocolo_banco: true, comprovante_pag: true, cadastramento: true, 
    numero_parcelas: true,     fixar_parcelas: true, doc_pagamento: true,   vencimento: true,      referencia: true, 
    relacao: true,             numero_dias: true,    observacao: true,      rateio: true,          reembolso: true, 
    num_pedido_compra: true,   data_compra: true,    emissao_nf: true,      num_comprovante: true, mercadoria_entregue: true,  
    comprovante_mercad: true,  sistema_1: false,     num_sistema_1: false,  sistema_2: false,      num_sistema_2: false,  
    sistema_3: false,          num_sistema_3: false, vinculado: true,       numero_parcela: false, vencimento_parcela: false,
    data_entrega_mercad: true, valor_parcela: false, chave: true,           uf_favorecida: true,   numero_documento_origem: true,
    codigo_barras: true,       cpf_cnpj: true
}
const posicaoDefaultColunas = {
    "1": "numero_conta",         "2":  "historico",           "3":  "valor_conta",         "4":  "fornecedor",          
    "5": "via_pagamento",        "6":  "forma_pagamento",     "7":  "agendamento",         "8":  "pagamento",   
    "9":  "agencia",             "10": "conta_corrente",      "11": "num_cartao_cred",     "12": "cheque_compens",      
    "13": "situacao",            "14": "banco",               "15": "protocolo_banco",     "16": "comprovante_pag",    
    "17": "cadastramento",       "18": "doc_pagamento",       "19": "vencimento",          "20": "referencia",         
    "21": "relacao",             "22": "numero_parcelas",     "23": "numero_dias",         "24": "fixar_parcelas",   
    "25": "observacao",          "26": "rateio",              "27": "reembolso",           "28": "num_pedido_compra", 
    "29": "data_compra",         "30": "emissao_nf",          "31": "num_comprovante",     "32": "data_entrega_mercad",
    "33": "mercadoria_entregue", "34": "comprovante_mercad",  "35": "vinculado",           "36": "chave",      
    "37": "valor_parcela",       "38": "vencimento_parcela",  "39": "numero_parcela",      "40": "descricao",           
    "41": "departamento",        "42": "valor_dre",           "43": "rateio_dre",          "44": "vinculado_dre",       
    "45": "categoria",           "46": "grupo",               "47": "subgrupo",            "48": "sistema_1",           
    "49": "num_sistema_1",       "50": "sistema_2",           "51": "num_sistema_2",       "52": "sistema_3",           
    "53": "num_sistema_3",       "54": "codigo_barras",       "55": "uf_favorecida",       "56": "numero_documento_origem", 
    "57": "cpf_cnpj",            "58": "id"
}
const posicaoDefaultColunasReverse = {
    "numero_conta": "1",          "historico": "2",             "valor_conta": "3",           "fornecedor": "4",          
    "via_pagamento": "5",         "forma_pagamento": "6",       "agendamento": "7",           "pagamento": "8",   
    "agencia": "9",               "conta_corrente": "10",       "num_cartao_cred": "11",      "cheque_compens": "12",      
    "situacao": "13",             "banco": "14",                "protocolo_banco": "15",      "comprovante_pag": "16",    
    "cadastramento": "17",        "doc_pagamento": "18",        "vencimento": "19",           "referencia": "20",         
    "relacao": "21",              "numero_parcelas": "22",      "numero_dias": "23",          "fixar_parcelas": "24",   
    "observacao": "25",           "rateio": "26",               "reembolso": "27",            "num_pedido_compra": "28", 
    "data_compra": "29",          "emissao_nf": "30",           "num_comprovante": "31",      "data_entrega_mercad": "32",
    "mercadoria_entregue": "33",  "comprovante_mercad": "34",   "vinculado": "35",            "chave": "36",      
    "valor_parcela": "37",        "vencimento_parcela": "38",   "numero_parcela": "39",       "descricao": "40",           
    "departamento": "41",         "valor_dre": "42",            "rateio_dre": "43",           "vinculado_dre": "44",       
    "categoria": "45",            "grupo": "46",                "subgrupo": "47",             "sistema_1": "48",           
    "num_sistema_1": "49",        "sistema_2": "50",            "num_sistema_2": "51",        "sistema_3": "52",           
    "num_sistema_3": "53",        "codigo_barra": "54",         "uf_favorecida": "55",        "numero_documento_origem": "56", 
    "cpf_cnpj": "57",             "id": "58"
}
const cabecalhoDefaultColunasReverse = {
    "Valor da Conta": "valor_conta", "Histórico": "historico", 'N° Conta': "numero_conta", 'Fornecedor': "fornecedor",
    'Via de pagamento': "via_pagamento", 'Descricao': "descricao",
    'Departamento': "departamento", "Rateio": "rateio_dre", "Vinculado": "vinculado_dre", 'Valor': "valor_dre", 'Categoria': "categoria", 'Grupo': "grupo", 'Subgrupo': "subgrupo",
    'Forma de pagamento': "forma_pagamento", 'Agendamento': "agendamento", 'Pagamento': "pagamento", 'Agencia': "agencia",
    'Conta corrente': "conta_corrente", 'N° cartao crédito': "num_cartao_cred", 'Cheque compensado': "cheque_compens",
    'Situação': "situacao", 'Banco': "banco",
    'Protocolo banco': "protocolo_banco", 'Comprovante pagamento': "comprovante_pag", 'Cadastramento': "cadastramento",
    'Documento pagamento': "doc_pagamento", 'Vencimento': "vencimento", 'Referência': "referencia",
    'Relacao': "relacao", 'Fixar Parcelas': "fixar_parcelas", 'N° de parcelas': "numero_parcelas", 'N° de dias': "numero_dias",
    'Observação': "observacao", 'Rateio': "rateio", 'Reembolso': "reembolso",
    'N° pedido de compra': "num_pedido_compra", 'Data compra': "data_compra", 'Emissão nf': "emissao_nf",
    'N° comprovante': "num_comprovante", 'Data entrega mercadoria': "data_entrega_mercad",
    'Mercadoria entregue': "mercadoria_entregue", 'Comprovante mercadoria': "comprovante_mercad",
    'Sistema 1': "sistema_1", 'N° sistema 1': "num_sistema_1", 'Sistema 2': "sistema_2", 'N° sistema 2': "num_sistema_2",
    'Sistema 3': "sistema_3", 'N° sistema 3': "num_sistema_3", "Vinculado": "vinculado", "N° da parcela": "numero_parcela",
    "Valor da parcela": "valor_parcela", "Vencimento da parcela": "vencimento_parcela", "Chave": "chave", "UF Favorecida": "uf_favorecida",
    "N° Doc. Origem": "numero_documento_origem", "CPF/CNPJ": "cpf_cnpj",  "Código Barras": "codigo_barra"
}


router.get(`/visibilidade-colunas/obter`, getVisibleColumns, (req, res) => {
    if ( !req.visibleColumns ) return res.json({ resultado: visibilidadeColunasDefault })
    return res.json({ resultado: req.visibleColumns })
})
router.post(`/visibilidade-colunas/cadastrar`, async (req, res) => {
    let itens = {
        numero_conta: false, historico: false, valor_conta: false, fornecedor: false, via_pagamento: false, descricao: false, departamento: false, rateio_dre: false, vinculado_dre: false, valor_dre: false, categoria: false,
        grupo: false, subgrupo: false, forma_pagamento: false, agendamento: false, pagamento: false, agencia: false, conta_corrente: false, num_cartao_cred: false,
        cheque_compens: false, situacao: false, banco: false, protocolo_banco: false, comprovante_pag: false, cadastramento: false, numero_parcelas: false, fixar_parcelas: false,
        doc_pagamento: false, vencimento: false, referencia: false, relacao: false, numero_dias: false, observacao: false, rateio: false, reembolso: false, num_pedido_compra: false,
        data_compra: false, emissao_nf: false, num_comprovante: false, data_entrega_mercad: false, mercadoria_entregue: false, comprovante_mercad: false, sistema_1: false,
        num_sistema_1: false, sistema_2: false, num_sistema_2: false, sistema_3: false, num_sistema_3: false, vinculado: false,
        numero_parcela: false, valor_parcela: false, vencimento_parcela: false, chave: false, uf_favorecida: true, 
        numero_documento_origem: true, codigo_barras: true, cpf_cnpj: true
    }
    for (let item of Object.entries(req.body)) { itens[item[0]] = true }
    let nickname = req.user.dataValues.nickname
    let visibilidadeColunas = await VisibilidadeColunaTabConta.findOne({ where: { usuario: nickname } })
    if (!visibilidadeColunas) {
        VisibilidadeColunaTabConta.create({
            usuario: nickname, ...itens
        })
            .then(() => {
                res.json({ resultado: `SUCESSO` })
            })
            .catch((erro) => {
                res.json({ erro })
            })
    } else {
        VisibilidadeColunaTabConta.update(itens, { where: { usuario: nickname } })
            .then(() => {
                res.json({ resultado: `SUCESSO` })
            })
            .catch((erro) => {
                res.json({ erro })
            })
    }
})

router.post('/tamanho-colunas/cadastrar', async (req, res) => {
    let nickname = req.user.dataValues.nickname
    let visibilidadeColunas = await TamanhoColunaTabConta.findOne({ where: { usuario: nickname } })
    if (!visibilidadeColunas) {
        TamanhoColunaTabConta.create({
            usuario: nickname, ...req.body
        })
            .then(() => {
                res.json({ resultado: `SUCESSO` })
            })
            .catch((erro) => {
                res.json({ erro })
            })
    } else {
        TamanhoColunaTabConta.update(req.body, { where: { usuario: nickname } })
            .then(() => {
                res.json({ resultado: `SUCESSO` })
            })
            .catch((erro) => {
                res.json({ erro })
            })
    }
})

router.post('/posicao-colunas/cadastrar', async (req, res) => {
    if ( req.query.reset ) {
        var newPosicaoColunas = posicaoDefaultColunasReverse
    }else {
        var newPosicaoColunas = {}
        let index = 1
        for (let coluna of req.body.colunas) {
            if (coluna != `id` && coluna != 'undefined') {
                newPosicaoColunas[cabecalhoDefaultColunasReverse[coluna]] = index
                index++
            }
        } 
    }
    // console.log(newPosicaoColunas)
    let nickname = req.user.dataValues.nickname
    let posicaoColunas = await PosicaoColunaTabConta.findOne({ where: { usuario: nickname } })
    if (!posicaoColunas) {
        PosicaoColunaTabConta.create({
            usuario: nickname, ...newPosicaoColunas
        })
            .then((pos) => {
                res.json({ resultado: `SUCESSO` })
            })
            .catch((erro) => {
                res.json({ erro })
            })
    } else {
        PosicaoColunaTabConta.update(newPosicaoColunas, { where: { usuario: nickname } })
            .then((pos) => {
                res.json({ resultado: `SUCESSO` })
            })
            .catch((erro) => {
                res.json({ erro })
            })
    }
})
router.get('/abrir-conta', eAdmin, async (req, res) => {
    let {numero_conta, situacao, dre} = req.query
    let contas = await conta.findAll({ where: { [Op.and]: {numero_conta, situacao} } })
    contas = JSON.parse(JSON.stringify(contas, null, 2))
        
    if ( contas.length == 0 ) {
        let itens = {proximo_numero_conta: 1, tipo_situacao: situacao}
        return res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}conta${barraRoute}cadastrar`), { itens })
    }
    let item = await ItensConta.findOne({ where: { tipo_situacao: situacao } })
    item = JSON.parse(JSON.stringify(item, null, 2))
    if ( item && item.tipo_situacao ) {
        delete item.tipo_situacao
    }
    
    let itens = { ...item }
    let dres = {}
    if ( !dre ) {
        var umRegistro = false
        // var ultimaConta = [contas[contas.length-1]]
        var novaContas = []
        var parcela_atual = ``
        contas = contas.filter((item, index)=>{
            if ( typeof dres[item.numero_conta] == 'undefined' ) {
                dres[item.numero_conta] = []
            }
            item.vencimento = item.vencimento.split('/').reverse().join('-')
            item.vencimento_parcela = item.vencimento_parcela.split('/').reverse().join('-')
            dres[item.numero_conta].push({ 
                departamento: item.departamento,
                descricao: item.descricao,
                valor_dre: item.valor_dre,
                rateio_dre: item.rateio_dre,
                vinculado_dre: item.vinculado_dre,
                categoria: item.categoria,
                grupo: item.grupo,
                subgrupo: item.subgrupo,
                sistema_1: item.sistema_1,
                num_sistema_1: item.num_sistema_1, 
                sistema_2: item.sistema_2, 
                num_sistema_2: item.num_sistema_2, 
                sistema_3: item.sistema_3, 
                num_sistema_3: item.num_sistema_3
            })
            if ( index == 0 ) {
                novaContas[0] = item
            }
            if ( index > 0 ) {
               novaContas[0]['departamento_'+(index+1)] = item.departamento,
               novaContas[0]['descricao_'+(index+1)] = item.descricao,
               novaContas[0]['valor_dre_'+(index+1)] = item.valor_dre,
               novaContas[0]['rateio_dre_'+(index+1)] = item.rateio_dre,
               novaContas[0]['vinculado_dre_'+(index+1)] = item.vinculado_dre,
               novaContas[0]['categoria_'+(index+1)] = item.categoria,
               novaContas[0]['grupo_'+(index+1)] = item.grupo,
               novaContas[0]['subgrupo_'+(index+1)] = item.subgrupo,
               novaContas[0]['sistema_1_'+(index+1)] = item.sistema_1,
               novaContas[0]['num_sistema_1_'+(index+1)] = item.num_sistema_1, 
               novaContas[0]['sistema_2_'+(index+1)] = item.sistema_2, 
               novaContas[0]['num_sistema_2_'+(index+1)] = item.num_sistema_2, 
               novaContas[0]['sistema_3_'+(index+1)] = item.sistema_3, 
               novaContas[0]['num_sistema_3_'+(index+1)] = item.num_sistema_3
            }
            parcela_atual = `${item.numero_parcela}/${item.numero_parcelas}`
            if ( new Date(item.vencimento_parcela) > new Date() && !umRegistro ) {
                umRegistro = true
                parcela_atual = `${item.numero_parcela}/${item.numero_parcelas}`
                return item
            }
            
        })
        // if ( ultimaConta.length && !contas.length ) {
        //     contas = ultimaConta
        // }
        
    }
    contas = novaContas
    qtdeDres = Object.values(dres)[0].length
    // var parcela_atual = contas.length == 0 ? `` : `${contas[0].numero_parcela}/${contas[0].numero_parcelas}`
    console.log(parcela_atual)
    return res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}conta${barraRoute}cadastrar`), { parcela_atual, itens, dados: contas[0], data_script: JSON.stringify(contas) })
})

router.get('/cadastrar', eAdmin, async (req, res) => {
    let tipoChavePix = await TipoChavePix.findAll()
    tipoChavePix = JSON.parse(JSON.stringify(tipoChavePix, null, 2))

    let item = await ItensConta.findOne({ where: { tipo_situacao: (req.query.situacao || `Aberto`) } })
    let contas = await conta.findAll({ where: { situacao: (req.query.situacao || `Aberto`) } })
    contas = JSON.parse(JSON.stringify(contas, null, 2))
    item = JSON.parse(JSON.stringify(item, null, 2))
    let itens = { ...item, tipo_situacao: (req.query.situacao || `Aberto`) }
    if (contas.length > 0) {
        itens.proximo_numero_conta = (contas ? Number(contas[contas.length - 1].numero_conta) : 0) + 1
        // console.log(Number(contas[contas.length - 1].numero_conta) + 1)
    } else { itens.proximo_numero_conta = 1 }

    let optionsChavePix = ``
    for ( registro of tipoChavePix ) {
        optionsChavePix += `
            <option value='${registro.tipo}'>${registro.tipo}</option>
        `
    }
    return res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}conta${barraRoute}cadastrar`), { itens, optionsChavePix})
})



router.get('/listar', getVisibleColumns, async (req, res) => {
    let nickname = req.user.dataValues.nickname
    let posicaoColunas = await PosicaoColunaTabConta.findOne({ where: { usuario: nickname } })
    let tamanhoColunas = await TamanhoColunaTabConta.findOne({ where: { usuario: nickname } })
    let visibilidadeColunas = req.visibleColumns
    let htmlHead = `<tr class='text-center text-nowrap text-light bg-blue-pk'>`
    let htmlBody = ''
    let objHeadDuplicado = {}
    let primeiroItemConta = {}
    let headPageDre = `
        <tr class='text-center text-nowrap text-light bg-blue-pk'>
            <th name='tab-N_Conta'><i class='d-none fas fa-filter me-3 rem0550 cursor-pointer' onclick="popupFiltroColuna('tab-N_Conta')"></i><span><i onclick='sortTable('tab-N_Conta')' style='margin-right: 8px;' class='position-relative fas fa-arrows-alt-v'></i> N° Conta</span></th>
            <th name='tab-Valor'><i class='d-none fas fa-filter me-3 rem0550 cursor-pointer' onclick="popupFiltroColuna('tab-Valor')"></i><span><i onclick='sortTable('tab-Valor')' style='margin-right: 8px;' class='position-relative fas fa-arrows-alt-v'></i> Valor</span></th>
            <th name='tab-Descricao'><i class='d-none fas fa-filter me-3 rem0550 cursor-pointer' onclick="popupFiltroColuna('tab-Descricao')"></i><span><i onclick='sortTable('tab-Descricao')' style='margin-right: 8px;' class='position-relative fas fa-arrows-alt-v'></i> Descrição</span></th>
            <th name='tab-Departamento'><i class='d-none fas fa-filter me-3 rem0550 cursor-pointer' onclick="popupFiltroColuna('tab-Departamento')"></i><span><i onclick='sortTable('tab-Departamento')' style='margin-right: 8px;' class='position-relative fas fa-arrows-alt-v'></i> Departamento</span></th>
            <th name='tab-Vencimento'><i class='d-none fas fa-filter me-3 rem0550 cursor-pointer' onclick="popupFiltroColuna('tab-Vencimento')"></i><span><i onclick='sortTable('tab-Vencimento')' style='margin-right: 8px;' class='position-relative fas fa-arrows-alt-v'></i> Vencimento</span></th>
            <th name='tab-Pagamento'><i class='d-none fas fa-filter me-3 rem0550 cursor-pointer' onclick="popupFiltroColuna('tab-Pagamento')"></i><span><i onclick='sortTable('tab-Pagamento')' style='margin-right: 8px;' class='position-relative fas fa-arrows-alt-v'></i> Pagamento</span></th>
            <th name='tab-Relacao'><i class='d-none fas fa-filter me-3 rem0550 cursor-pointer' onclick="popupFiltroColuna('tab-Relacao')"></i><span><i onclick='sortTable('tab-Relacao')' style='margin-right: 8px;' class='position-relative fas fa-arrows-alt-v'></i> Relação</span></th>
            <th name='tab-Marcador_1'><i class='d-none fas fa-filter me-3 rem0550 cursor-pointer' onclick="popupFiltroColuna('tab-Marcador_1')"></i><span><i onclick='sortTable('tab-Marcador_1')' style='margin-right: 8px;' class='position-relative fas fa-arrows-alt-v'></i> Marcador 1</span></th>
            <th name='tab-Marcador_2'><i class='d-none fas fa-filter me-3 rem0550 cursor-pointer' onclick="popupFiltroColuna('tab-Marcador_2')"></i><span><i onclick='sortTable('tab-Marcador_2')' style='margin-right: 8px;' class='position-relative fas fa-arrows-alt-v'></i> Marcador 2</span></th>
            <th name='tab-Categoria'><i class='d-none fas fa-filter me-3 rem0550 cursor-pointer' onclick="popupFiltroColuna('tab-Categoria')"></i><span><i onclick='sortTable('tab-Categoria')' style='margin-right: 8px;' class='position-relative fas fa-arrows-alt-v'></i> Categoria</span></th>
            <th name='tab-Grupo'><i class='d-none fas fa-filter me-3 rem0550 cursor-pointer' onclick="popupFiltroColuna('tab-Grupo')"></i><span><i onclick='sortTable('tab-Grupo')' style='margin-right: 8px;' class='position-relative fas fa-arrows-alt-v'></i> Grupo</span></th>
            <th name='tab-Sub_Grupo'><i class='d-none fas fa-filter me-3 rem0550 cursor-pointer' onclick="popupFiltroColuna('tab-Sub_Grupo')"></i><span><i onclick='sortTable('tab-Sub_Grupo')' style='margin-right: 8px;' class='position-relative fas fa-arrows-alt-v'></i> Sub Grupo</span></th>
            <th name='tab-Sistema_1'><i class='d-none fas fa-filter me-3 rem0550 cursor-pointer' onclick="popupFiltroColuna('tab-Sistema_1')"></i><span><i onclick='sortTable('tab-Sistema_1')' style='margin-right: 8px;' class='position-relative fas fa-arrows-alt-v'></i> Sistema 1</span></th>
            <th name='tab-N_sistema_1'><i class='d-none fas fa-filter me-3 rem0550 cursor-pointer' onclick="popupFiltroColuna('tab-N_sistema_1')"></i><span><i onclick='sortTable('tab-N_sistema_1')' style='margin-right: 8px;' class='position-relative fas fa-arrows-alt-v'></i> N° sistema 1</span></th>
            <th name='tab-Sistema_2'><i class='d-none fas fa-filter me-3 rem0550 cursor-pointer' onclick="popupFiltroColuna('tab-Sistema_2')"></i><span><i onclick='sortTable('tab-Sistema_2')' style='margin-right: 8px;' class='position-relative fas fa-arrows-alt-v'></i> Sistema 2</span></th>
            <th name='tab-N_sistema_2'><i class='d-none fas fa-filter me-3 rem0550 cursor-pointer' onclick="popupFiltroColuna('tab-N_sistema_2')"></i><span><i onclick='sortTable('tab-N_sistema_2')' style='margin-right: 8px;' class='position-relative fas fa-arrows-alt-v'></i> N° sistema 2</span></th>
            <th name='tab-Sistema_3'><i class='d-none fas fa-filter me-3 rem0550 cursor-pointer' onclick="popupFiltroColuna('tab-Sistema_3')"></i><span><i onclick='sortTable('tab-Sistema_3')' style='margin-right: 8px;' class='position-relative fas fa-arrows-alt-v'></i> Sistema 3</span></th>
            <th name='tab-N_sistema_3'><i class='d-none fas fa-filter me-3 rem0550 cursor-pointer' onclick="popupFiltroColuna('tab-N_sistema_3')"></i><span><i onclick='sortTable('tab-N_sistema_3')' style='margin-right: 8px;' class='position-relative fas fa-arrows-alt-v'></i> N° sistema 3</span></th>
        </tr>
    `
    let bodyPageDre = ``
    if (!tamanhoColunas) {
        var tamColunas = tamanhoColunasDefault
    } else {
        var tamColunas = tamanhoColunas
    }

    if (!posicaoColunas) {
        var posColunas = posicaoDefaultColunas
    } else {
        posicaoColunas = JSON.parse(JSON.stringify(posicaoColunas, null, 2)) 
        var posColunas = {}
        for (let col of Object.entries(posicaoColunas)) {
            if (col[0] != `usuario` && col[0] != `id`) {
                posColunas[col[1]] = col[0]
            }
        }
    }
    // console.log(posColunas)
    conta.findAll({ where: { situacao: (req.query.situacao_select || `Aberto`) } })
        .then((contas) => {
            if ( req.query.page && req.query.page == `page-dre` ) {
                contas = contas.filter(item => {
                    item.dataValues.pagamento = item.dataValues.pagamento == `` ? `` : item.dataValues.pagamento.slice(8) + `/` + item.dataValues.pagamento.slice(5, 7) + `/` + item.dataValues.pagamento.slice(0, 4)
                    item.dataValues.valor_dre = item.dataValues.valor_dre == `` ? `0` : (item.dataValues.valor_dre).toString().indexOf('.') != -1 ? (item.dataValues.valor_dre).toString().replace('.', ',') : (item.dataValues.valor_dre).toString() + ',00'
                    
                    bodyPageDre += `
                        <tr class="text-nowrap">
                            <td name="tab-N_Conta" class="text-center">
                                    <i class="fas fa-search cursor-pointer position-relative" style="left: -20px;" onclick='abrirContaPeloDre("${item.dataValues.numero_conta.trim()}", "${(req.query.situacao_select || "Aberto")}", true)'></i>
                                     ${item.dataValues.numero_conta}
                            </td>
                            <td name="tab-Valor" class="text-center">${item.dataValues.valor_dre}</td>
                            <td name="tab-Descricao" class="text-center">${item.dataValues.descricao}</td>
                            <td name="tab-Departamento" class="text-center">${item.dataValues.departamento}</td>
                            <td name="tab-Vencimento" class="text-center">${item.dataValues.vencimento}</td>
                            <td name="tab-Pagamento" class="text-center">${item.dataValues.pagamento}</td>
                            <td name="tab-Relacao" class="text-center">${item.dataValues.relacao}</td>
                            <td name="tab-Marcador_1" class="text-center">${item.dataValues.rateio_dre}</td>
                            <td name="tab-Marcador_2" class="text-center">${item.dataValues.vinculado_dre}</td>
                            <td name="tab-Categoria" class="text-center">${item.dataValues.categoria}</td>
                            <td name="tab-Grupo" class="text-center">${item.dataValues.grupo}</td>
                            <td name="tab-Sub_Grupo" class="text-center">${item.dataValues.subgrupo}</td>
                            <td name="tab-Sistema_1" class="text-center">${item.dataValues.sistema_1}</td>
                            <td name="tab-N_sistema_1" class="text-center">${item.dataValues.num_sistema_1}</td>
                            <td name="tab-Sistema_2" class="text-center">${item.dataValues.sistema_2}</td>
                            <td name="tab-N_sistema_2" class="text-center">${item.dataValues.num_sistema_2}</td>
                            <td name="tab-Sistema_3" class="text-center">${item.dataValues.sistema_3}</td>
                            <td name="tab-N_sistema_3" class="text-center">${item.dataValues.num_sistema_3}</td>
                        </tr>`
                    return item
                })
                contas = JSON.parse(JSON.stringify(contas, null, 2))
                let dres = JSON.stringify({})
                if (contas.length == 0) {
                    res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}conta${barraRoute}listar`), { dados: { situacao_select: (req.query.situacao_select || `Aberto`), titulo: `DRE´s` }, drePage: true, bodyPageDre, headPageDre, dres })
                } else {
                    res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}conta${barraRoute}listar`), { dados: { situacao_select: (req.query.situacao_select || `Aberto`), titulo: `DRE´s` }, contasDre: contas, drePage: true, bodyPageDre, headPageDre, dres })
                }
            } else {
                let dres = {}
                var indexBtnShowHide = 1
                contas = contas.filter(item => {
                    item.dataValues.cadastramento = item.dataValues.cadastramento == `` ? `` : item.dataValues.cadastramento.slice(8) + `/` + item.dataValues.cadastramento.slice(5, 7) + `/` + item.dataValues.cadastramento.slice(0, 4)
                    item.dataValues.pagamento = item.dataValues.pagamento == `` ? `` : item.dataValues.pagamento.slice(8) + `/` + item.dataValues.pagamento.slice(5, 7) + `/` + item.dataValues.pagamento.slice(0, 4)
                    item.dataValues.data_compra = item.dataValues.data_compra == `` ? `` : item.dataValues.data_compra.slice(8) + `/` + item.dataValues.data_compra.slice(5, 7) + `/` + item.dataValues.data_compra.slice(0, 4)
                    item.dataValues.emissao_nf = item.dataValues.emissao_nf == `` ? `` : item.dataValues.emissao_nf.slice(8) + `/` + item.dataValues.emissao_nf.slice(5, 7) + `/` + item.dataValues.emissao_nf.slice(0, 4)
                    item.dataValues.data_entrega_mercad = item.dataValues.data_entrega_mercad == `` ? `` : item.dataValues.data_entrega_mercad.slice(8) + `/` + item.dataValues.data_entrega_mercad.slice(5, 7) + `/` + item.dataValues.data_entrega_mercad.slice(0, 4)
                    item.dataValues.valor_dre = item.dataValues.valor_dre == `` ? `0` : (item.dataValues.valor_dre).toString().indexOf('.') != -1 ? (item.dataValues.valor_dre).toString().replace('.', ',') : (item.dataValues.valor_dre).toString() + ',00'
                    item.dataValues.valor_conta = item.dataValues.valor_conta == `` ? `0` : (item.dataValues.valor_conta).toString().indexOf('.') != -1 ? (item.dataValues.valor_conta).toString().replace('.', ',') : (item.dataValues.valor_conta).toString() + ',00'
                    item.dataValues.comprovante_pag = !item.dataValues.comprovante_pag || item.dataValues.comprovante_pag == `` ? `` : item.dataValues.comprovante_pag.split('${barraRoute}').pop()

                    if ( typeof primeiroItemConta[item.dataValues.numero_conta] == 'undefined' ) {
                        primeiroItemConta[item.dataValues.numero_conta] = true
                        var htmlBodyPart = `<tr name='${item.dataValues.numero_conta}' class='text-nowrap'>`
                        var primeiraLinhaConta = true
                    }else {
                        //var htmlBodyPart = `<tr name=`${item.dataValues.numero_conta}` class=`d-none text-nowrap table-light`>`
                        var primeiraLinhaConta = false
                    }

                    if( typeof dres[item.dataValues.numero_conta] == 'undefined' ) {
                        dres[item.dataValues.numero_conta] = []
                    }
                    dres[item.dataValues.numero_conta].push({ 
                        departamento: item.dataValues.departamento,
                        descricao: item.dataValues.descricao,
                        valor_dre: item.dataValues.valor_dre,
                        rateio_dre: item.dataValues.rateio_dre,
                        vinculado_dre: item.dataValues.vinculado_dre,
                        categoria: item.dataValues.categoria,
                        grupo: item.dataValues.grupo,
                        subgrupo: item.dataValues.subgrupo,
                        sistema_1: item.dataValues.sistema_1,
                        num_sistema_1: item.dataValues.num_sistema_1, 
                        sistema_2: item.dataValues.sistema_2, 
                        num_sistema_2: item.dataValues.num_sistema_2, 
                        sistema_3: item.dataValues.sistema_3, 
                        num_sistema_3: item.dataValues.num_sistema_3
                    })
                    const itensDre = {
                        departamento: true, descricao: true, valor_dre: true, rateio_dre: true, vinculado_dre: true, 
                        categoria: true, grupo: true, subgrupo: true, sistema_1: true,
                        num_sistema_1: true, sistema_2: true, num_sistema_2: true, sistema_3: true, num_sistema_3: true
                    }
                    let index = 1
                    for (key of Object.keys(item.dataValues)) {
                        if (visibilidadeColunas) {
                        // console.log(visibilidadeColunas[posColunas[index]], visibilidadeColunas, index, '\n\n')
                            var classVisibleColumn = visibilidadeColunas[posColunas[index]] ? `` : `class="d-none"`
                        } else {
                            var classVisibleColumn = visibilidadeColunasDefault[posColunas[index]] ? `` : `class="d-none"`
                        }
                        if ( typeof objHeadDuplicado[cabecalhoDefaultColunas[posColunas[index]]] == "undefined" && typeof itensDre[posColunas[index]] == "undefined" ) {
                            
                            htmlHead += `
                                <th scope="col" ${classVisibleColumn} name="tab-${posColunas[index]}" style="min-width: ${tamColunas[posColunas[index]]} !important"><i class="d-none fas fa-filter me-3 rem0550 cursor-pointer" onclick='popupFiltroColuna("tab-${posColunas[index]}")'></i><span>${cabecalhoDefaultColunas[posColunas[index]]}</span></th>
                            `   
                            objHeadDuplicado[cabecalhoDefaultColunas[posColunas[index]]] = true
                        }
                        if ( posColunas[index] == "historico" ) {
                            var tipoText = 'class="text-start"'
                        }else {
                            var tipoText = 'class="text-center"'
                        }
                        if ( typeof itensDre[posColunas[index]] == 'undefined' && primeiraLinhaConta ) {
                            if ( index == 1 ) {
                                htmlBodyPart += `
                                    <td scope="col" ${classVisibleColumn} name="tab-${posColunas[index]}" ${tipoText}>
                                        <div class="position-relative d-flex gap-2" style="left: 2px; top: 2px;">
                                            <i class="fas fa-search cursor-pointer position-relative" onclick='abrirContaPeloDre("${item.dataValues.numero_conta.trim()}", "${(item.dataValues.situacao || "Aberto")}", false)'></i>
                                            <i id="btn-hide-dre${item.dataValues.numero_conta}" onclick='showHideDre("${item.dataValues.numero_conta.trim()}", "hide", ${indexBtnShowHide})' class="d-none bi bi-dash-square-fill cursor-pointer text-blue-pk"></i>
                                            <i id="btn-show-dre${item.dataValues.numero_conta}" onclick='showHideDre("${item.dataValues.numero_conta.trim()}", "show", ${indexBtnShowHide})' class="bi bi-plus-square-fill cursor-pointer text-blue-pk"></i>
                                            <span>${item.dataValues[posColunas[index]]}</span>
                                        </div>
                                    </td>
                                `
                                indexBtnShowHide++
                            }
                            else {
                                if ( posColunas[index] == `numero_parcelas` ) {
                                    htmlBodyPart += `
                                        <td scope="col" ${classVisibleColumn} name="tab-${posColunas[index]}" ${tipoText}>
                                            ${item.dataValues.numero_parcela}/${item.dataValues.numero_parcelas}
                                        </td>
                                    `
                                }
                                else {
                                    htmlBodyPart += `
                                        <td scope="col" ${classVisibleColumn} name="tab-${posColunas[index]}" ${tipoText}>
                                            ${item.dataValues[posColunas[index]]}
                                        </td>
                                    `
                                }                                
                            }
                        }
                        
                        index++
                    }
                    if ( primeiraLinhaConta ) {
                        htmlBodyPart += `</tr>`
                        htmlBody += htmlBodyPart
                    }                
                    
                    return item
                })
                htmlHead += `</tr>`
                contas = JSON.parse(JSON.stringify(contas, null, 2))
                dres = JSON.stringify(dres)
                if (contas.length == 0) {
                    res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}conta${barraRoute}listar`), { dados: { situacao_select: (req.query.situacao_select || `Aberto`), titulo: `Contas` }, tabHead: htmlHead, tabBody: htmlBody, dres })
                } else {
                    res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}conta${barraRoute}listar`), { dados: { situacao_select: (req.query.situacao_select || `Aberto`), titulo: `Contas` }, contas, tabHead: htmlHead, tabBody: htmlBody, dres })
                }
            }
        })
        .catch((e) => {
            console.error('ERRO PK: ',e)
            res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}conta${barraRoute}listar`), { dados: { situacao_select: (req.query.situacao_select || `Aberto`), titulo: req.query.page == `page-dre` ? `DRE´s` : `Contas` }, tabHead: htmlHead, tabBody: htmlBody })
        })
})

router.get('/obter', async (req, res) => {
    let contas = await conta.findAll()
    if ( !contas ) return res.json({erro: `Não há contas.`})
    contas = JSON.parse(JSON.stringify(contas, null, 2))
    return res.json({contas})
})

router.get("/download/:file", (req, res) => {
  const fileName = req.params.file;
  const filePath = path.join(uploadDir, fileName);

  if (fs.existsSync(filePath)) {
    res.download(filePath, fileName); // força download
  } else {
    res.status(404).json({ erro: "Arquivo não encontrado" });
  }
});

router.post('/cadastrar', eAdmin, multiUpload, async (req, res) => { //single('comprovante_pag')

    
    let { cadastrarDuplicar, qtdeDre } = req.query
    let { numero_conta, historico, valor_conta, fornecedor, via_pagamento, descricao, departamento, 
        valor_dre, rateio_dre, vinculado_dre, categoria, grupo, subgrupo, forma_pagamento,
        agendamento, pagamento, agencia, conta_corrente, num_cartao_cred, cheque_compens, situacao, banco,
        protocolo_banco, comprovante_pag, cadastramento, doc_pagamento, vencimento, referencia,
        relacao, numero_dias, fixar_parcelas, numero_parcelas, observacao, rateio, reembolso, 
        num_pedido_compra, data_compra, emissao_nf, num_comprovante, data_entrega_mercad, 
        mercadoria_entregue, comprovante_mercad, sistema_1, num_sistema_1, sistema_2, num_sistema_2, 
        sistema_3, num_sistema_3, vinculado, parcelas_geradas, chave, numero_documento_origem,
        uf_favorecida, cpf_cnpj, codigo_barras
    } = req.body

    if (req.files["pdfs"]) {

        // let contasGet = await conta.findAll({ where: { situacao } })
        // contasGet = JSON.parse(JSON.stringify(contasGet, null, 2))
        // var proximo_numero_conta = 1
        // if (contasGet.length > 0) {
        //     proximo_numero_conta = (contasGet ? Number(contasGet[contasGet.length - 1].numero_conta) : 0) + 1
        // }

        let respostaProcessamento = null
        for (const file of req.files["pdfs"]) {
            // const pdfBuffer = fs.readFileSync(file.path);

            //chama sua função de parse
            const dadosParseados = await pdfParser(file.path)

            valor_conta = parseFloat(dadosParseados.total_recolher?.replace(/[R$\s.]/g, '').replace(',', '.')).toFixed(2)
            numero_documento_origem = dadosParseados.numero_documento_origem
            cpf_cnpj = dadosParseados.cpf_cnpj_destinatario
            codigo_barras = dadosParseados.codigo_barras
            uf_favorecida = dadosParseados.uf_favorecida
            vencimento = dadosParseados.data_vencimento //?.split("/").reverse().join("-")



            // recria o arquivo convertido
            const fileName = file.filename.replace(/\.pdf$/i, `_NC-${numero_conta}.pdf`);
            const newFilePath = path.join(uploadDir, fileName);


            fs.renameSync(file.path, newFilePath);
            
            let body = { numero_conta, historico, valor_conta, fornecedor, via_pagamento, descricao, departamento, 
                valor_dre, rateio_dre, vinculado_dre, categoria, grupo, subgrupo, forma_pagamento,
                agendamento, pagamento, agencia, conta_corrente, num_cartao_cred, cheque_compens, situacao, banco,
                protocolo_banco, comprovante_pag, cadastramento, doc_pagamento, vencimento, referencia,
                relacao, numero_dias, fixar_parcelas, numero_parcelas, observacao, rateio, reembolso, 
                num_pedido_compra, data_compra, emissao_nf, num_comprovante, data_entrega_mercad, 
                mercadoria_entregue, comprovante_mercad, sistema_1, num_sistema_1, sistema_2, num_sistema_2, 
                sistema_3, num_sistema_3, vinculado, parcelas_geradas, chave, numero_documento_origem,
                uf_favorecida, cpf_cnpj, codigo_barras, fileName
            }

            respostaProcessamento = await processamentoCriacaoContaMassa(req, body, true)
            if ( !respostaProcessamento.erro ) {
                numero_conta = respostaProcessamento.numero_conta
            }
        } 
        const retornos = {
            "1": function(erros){return res.json({ erro: `campos não preenchidos` })},
            "2": function(erros){return res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}conta${barraRoute}cadastrar`), { erros, dados: req.body })},
            "3": function(erros){return res.json({ erro: `situação não cadastrada` })},
            "4": function(erros){return res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}configuracao${barraRoute}itens-conta?situacao=` + situacao))},
            "5": function(erros, numero_conta){return res.json({ numero_conta: numero_conta })},
            "6": function(erros){return res.redirect(`/`)},
            "7": function(erros){return res.json({ erro: `OK` })},
            "8": function(erros){return res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}conta${barraRoute}cadastrar`), { erros, dados: req.body })},
            "9": function(erros){return res.json({ erro: `campos não preenchidos` })},
            "10": function(erros){return res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}conta${barraRoute}cadastrar`), { erros, dados: req.body })},
            "11": function(erros){return res.json({ erro: `OK` })}
        }

        return retornos[respostaProcessamento.codigo](respostaProcessamento.erros, respostaProcessamento?.numero_conta)
    }
    
    //   //////if ( req.file.filename ) comprovante_pag = uploadDir + `${barraRoute}` + req.file.filename // forma antiga
    if (req.files["comprovante_pag"]) {
        for (const file of req.files["comprovante_pag"]) {
            comprovante_pag = path.join(uploadDir, file.filename)
        } 
    }
    let fileName = "" // aqui é porque não teremos arquivos pdfs para enviar o nome dos arquivos

    try {
        let erros = []
        let situacoes = { "Aberto": true, "Pago": true, "Em andamento": true, "Cancelado": true }
        if (typeof situacoes[situacao] == 'undefined') {
            let erros = [{ text: 'O campo `Situação` deve ser preenchido corretamente.' }]
            if (cadastrarDuplicar == `sim` || qtdeDre) {
                return res.json({ erro: `campos não preenchidos` })
            } else {
                return res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}conta${barraRoute}cadastrar`), { erros, dados: req.body })
            }
        }
        let item = await ItensConta.findOne({ where: { tipo_situacao: situacao } })
        if (!item) {
            if (cadastrarDuplicar == `sim` || qtdeDre) {
                return res.json({ erro: `situação não cadastrada` })
            } else {
                return res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}configuracao${barraRoute}itens-conta?situacao=` + situacao))
            }
        }
        item = JSON.parse(JSON.stringify(item, null, 2))

        for (let entreis of Object.entries(req.body)) {
            let key = entreis[0]
            let value = entreis[1]
            if (item[key] && (!value || typeof value == undefined || value == null)) {
                erros.push({ text: key.replaceAll('_', ' ').replace('num', 'número').replace('doc', 'documento').replace('mercad', 'mercadoria') + ` inválido.` })
            }
        }
        if (erros.length == 0) {
            let num_parc = 0
            // console.log(typeof parcelas_geradas)
            for ( let parcela of JSON.parse(parcelas_geradas) ) {
                numero_conta = Number(numero_conta) + num_parc
                if ( num_parc == 0 ) { num_parc = 1 }
                for ( let num_dre = 1; num_dre <= qtdeDre; num_dre++ ) {
                    // console.log(numero_conta, parcela)
                    if (num_dre == 1) {
                        var departamento_edit = `departamento`
                        var descricao_edit = `descricao`
                        var valor_dre_edit = `valor_dre`
                        var rateio_dre_edit = `rateio_dre`
                        var vinculado_dre_edit = `vinculado_dre`
                        var categoria_edit = `categoria`
                        var grupo_edit = `grupo`
                        var subgrupo_edit = `subgrupo`
                        var sistema_1_edit = `sistema_1`
                        var num_sistema_1_edit = `num_sistema_1`
                        var sistema_2_edit = `sistema_2`
                        var num_sistema_2_edit = `num_sistema_2`
                        var sistema_3_edit = `sistema_3`
                        var num_sistema_3_edit = `num_sistema_3`
                    } else {
                        var departamento_edit = `departamento_` + num_dre
                        var descricao_edit = `descricao_` + num_dre
                        var valor_dre_edit = `valor_dre_` + num_dre
                        var rateio_dre_edit = `rateio_dre_` + num_dre
                        var vinculado_dre_edit = `vinculado_dre_` + num_dre
                        var categoria_edit = `categoria_` + num_dre
                        var grupo_edit = `grupo_` + num_dre
                        var subgrupo_edit = `subgrupo_` + num_dre
                        var sistema_1_edit = `sistema_1_` + num_dre
                        var num_sistema_1_edit = `num_sistema_1_` + num_dre
                        var sistema_2_edit = `sistema_2_` + num_dre
                        var num_sistema_2_edit = `num_sistema_2_` + num_dre
                        var sistema_3_edit = `sistema_3_` + num_dre
                        var num_sistema_3_edit = `num_sistema_3_` + num_dre
                    }
                    // console.log('\n\n', parcela, 'num-dre', num_dre)
                    var new_numero_dias = parcela.numero_dias ? (parcela.numero_dias * num_dre) : (parseInt(numero_dias.replace(' dias', '')) * num_dre) 
                    //console.log('\n\n', new_numero_dias, '--', numero_dias, '---', parcela.numero_dias, '\n\n')
                    var contaNova = await conta.create({
                        departamento: req.body[departamento_edit],
                        descricao: req.body[descricao_edit],
                        valor_dre: req.body[valor_dre_edit],
                        rateio_dre: req.body[rateio_dre_edit],
                        vinculado_dre: req.body[vinculado_dre_edit],
                        numero_parcela: parcela.numero_parcela, 
                        valor_parcela: parcela.valor_parcela, 
                        vencimento_parcela: parcela.vencimento_parcela,
                        vencimento: parcela.vencimento_parcela,
                        uf_favorecida,
                        categoria: req.body[categoria_edit],
                        grupo: req.body[grupo_edit],
                        subgrupo: req.body[subgrupo_edit],
                        sistema_1: req.body[sistema_1_edit],
                        num_sistema_1: req.body[num_sistema_1_edit], 
                        sistema_2: req.body[sistema_2_edit], 
                        num_sistema_2: req.body[num_sistema_2_edit], 
                        sistema_3: req.body[sistema_3_edit], 
                        num_sistema_3: req.body[num_sistema_3_edit],
                        numero_dias: new_numero_dias,
                        numero_conta, historico, valor_conta, fornecedor, via_pagamento, forma_pagamento,
                        agendamento, pagamento, agencia, conta_corrente, num_cartao_cred, cheque_compens, situacao, banco,
                        protocolo_banco, comprovante_pag, cadastramento, doc_pagamento, referencia,
                        relacao, numero_parcelas, fixar_parcelas, observacao, rateio, reembolso,
                        num_pedido_compra, data_compra, emissao_nf, vinculado, chave,
                        num_comprovante, data_entrega_mercad, mercadoria_entregue, comprovante_mercad
                    })
                }
            }
            if (contaNova) {
                contaNova = JSON.parse(JSON.stringify(contaNova, null, 2))
                if (cadastrarDuplicar == `sim` || qtdeDre) {
                    res.json({ numero_conta: (Number(contaNova.numero_conta) + 1) })
                } else {
                    req.flash(`success_msg`, `Conta cadastrada com sucesso!`)
                    res.redirect(`/`)
                }
            } else {
                if (cadastrarDuplicar == `sim` || qtdeDre) {
                    res.json({ erro: `OK` })
                } else {
                    let erros = [{ text: `Erro ao cadastrar conta, se persistir informar o desenvolvedor.` }]
                    res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}conta${barraRoute}cadastrar`), { erros, dados: req.body })
                }
            }
        } else {
            if (cadastrarDuplicar == `sim` || qtdeDre) {
                res.json({ erro: `campos não preenchidos` })
            } else {
                return res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}conta${barraRoute}cadastrar`), { erros, dados: req.body })
            }
        }
    } catch (e) {
        console.log(e)
        res.json({ erro: `OK` })
    }
})

module.exports = router


async function processamentoCriacaoContaMassa(req, body, pdf=false) {

    let { cadastrarDuplicar, qtdeDre } = req.query
    let { numero_conta, historico, valor_conta, fornecedor, via_pagamento, descricao, departamento, 
        valor_dre, rateio_dre, vinculado_dre, categoria, grupo, subgrupo, forma_pagamento,
        agendamento, pagamento, agencia, conta_corrente, num_cartao_cred, cheque_compens, situacao, banco,
        protocolo_banco, comprovante_pag, cadastramento, doc_pagamento, vencimento, referencia,
        relacao, numero_dias, fixar_parcelas, numero_parcelas, observacao, rateio, reembolso, 
        num_pedido_compra, data_compra, emissao_nf, num_comprovante, data_entrega_mercad, 
        mercadoria_entregue, comprovante_mercad, sistema_1, num_sistema_1, sistema_2, num_sistema_2, 
        sistema_3, num_sistema_3, vinculado, parcelas_geradas, chave, numero_documento_origem,
        uf_favorecida, cpf_cnpj, codigo_barras, fileName
    } = body

    try {
        let erros = []
        let situacoes = { "Aberto": true, "Pago": true, "Em andamento": true, "Cancelado": true }
        if (typeof situacoes[situacao] == 'undefined') {
            let erros = [{ text: 'O campo `Situação` deve ser preenchido corretamente.' }]
            if (cadastrarDuplicar == `sim` || qtdeDre) {
                return {codigo: "1", erros, erro: true}
            } else {
                return {codigo: "2", erros, erro: false}
            }
        }
        let item = await ItensConta.findOne({ where: { tipo_situacao: situacao } })
        if (!item) {
            if (cadastrarDuplicar == `sim` || qtdeDre) {
                return {codigo: "3", erros, erro: true}
            } else {
                return {codigo: "4", erros, erro: false}
            }
        }
        item = JSON.parse(JSON.stringify(item, null, 2))

        for (let entreis of Object.entries(req.body)) {
            let key = entreis[0]
            let value = entreis[1]
            if (item[key] && (!value || typeof value == undefined || value == null)) {
                erros.push({ text: key.replaceAll('_', ' ').replace('num', 'número').replace('doc', 'documento').replace('mercad', 'mercadoria') + ` inválido.` })
            }
        }
        if (erros.length == 0) {
            let num_parc = 0
            // console.log(typeof parcelas_geradas)
            for ( let parcela of JSON.parse(parcelas_geradas) ) {
                numero_conta = Number(numero_conta) + num_parc
                if ( num_parc == 0 ) { num_parc = 1 }
                for ( let num_dre = 1; num_dre <= qtdeDre; num_dre++ ) {
                    // console.log(numero_conta, parcela)
                    if (num_dre == 1) {
                        var departamento_edit = `departamento`
                        var descricao_edit = `descricao`
                        var valor_dre_edit = `valor_dre`
                        var rateio_dre_edit = `rateio_dre`
                        var vinculado_dre_edit = `vinculado_dre`
                        var categoria_edit = `categoria`
                        var grupo_edit = `grupo`
                        var subgrupo_edit = `subgrupo`
                        var sistema_1_edit = `sistema_1`
                        var num_sistema_1_edit = `num_sistema_1`
                        var sistema_2_edit = `sistema_2`
                        var num_sistema_2_edit = `num_sistema_2`
                        var sistema_3_edit = `sistema_3`
                        var num_sistema_3_edit = `num_sistema_3`
                    } else {
                        var departamento_edit = `departamento_` + num_dre
                        var descricao_edit = `descricao_` + num_dre
                        var valor_dre_edit = `valor_dre_` + num_dre
                        var rateio_dre_edit = `rateio_dre_` + num_dre
                        var vinculado_dre_edit = `vinculado_dre_` + num_dre
                        var categoria_edit = `categoria_` + num_dre
                        var grupo_edit = `grupo_` + num_dre
                        var subgrupo_edit = `subgrupo_` + num_dre
                        var sistema_1_edit = `sistema_1_` + num_dre
                        var num_sistema_1_edit = `num_sistema_1_` + num_dre
                        var sistema_2_edit = `sistema_2_` + num_dre
                        var num_sistema_2_edit = `num_sistema_2_` + num_dre
                        var sistema_3_edit = `sistema_3_` + num_dre
                        var num_sistema_3_edit = `num_sistema_3_` + num_dre
                    }
                    // console.log('\n\n', parcela, 'num-dre', num_dre)
                    var new_numero_dias = parcela.numero_dias ? (parcela.numero_dias * num_dre) : (parseInt(numero_dias.replace(' dias', '')) * num_dre) 
                    //console.log('\n\n', new_numero_dias, '--', numero_dias, '---', parcela.numero_dias, '\n\n')
                    var contaNova = await conta.create({
                        departamento: req.body[departamento_edit],
                        descricao: req.body[descricao_edit],
                        valor_dre: req.body[valor_dre_edit],
                        rateio_dre: req.body[rateio_dre_edit],
                        vinculado_dre: req.body[vinculado_dre_edit],
                        numero_parcela: parcela.numero_parcela, 
                        valor_parcela: parcela.valor_parcela, 
                        vencimento_parcela: parcela.vencimento_parcela,
                        vencimento: (pdf ? vencimento : parcela.vencimento_parcela),
                        file_name: fileName,
                        uf_favorecida,
                        categoria: req.body[categoria_edit],
                        grupo: req.body[grupo_edit],
                        subgrupo: req.body[subgrupo_edit],
                        sistema_1: req.body[sistema_1_edit],
                        num_sistema_1: req.body[num_sistema_1_edit], 
                        sistema_2: req.body[sistema_2_edit], 
                        num_sistema_2: req.body[num_sistema_2_edit], 
                        sistema_3: req.body[sistema_3_edit], 
                        num_sistema_3: req.body[num_sistema_3_edit],
                        numero_dias: new_numero_dias,
                        numero_conta, historico, valor_conta, fornecedor, via_pagamento, forma_pagamento,
                        agendamento, pagamento, agencia, conta_corrente, num_cartao_cred, cheque_compens, situacao, banco,
                        protocolo_banco, comprovante_pag, cadastramento, doc_pagamento, referencia,
                        relacao, numero_parcelas, fixar_parcelas, observacao, rateio, reembolso,
                        num_pedido_compra, data_compra, emissao_nf, vinculado, chave,
                        num_comprovante, data_entrega_mercad, mercadoria_entregue, comprovante_mercad, numero_documento_origem,
                        cpf_cnpj, codigo_barras, uf_favorecida
                    })
                }
            }
                
            if (contaNova) {
                contaNova = JSON.parse(JSON.stringify(contaNova, null, 2))
                console.log(contaNova.numero_conta, '---',)
                if (cadastrarDuplicar == `sim` || qtdeDre) {
                    return {codigo: "5", erros: [], numero_conta: (Number(contaNova.numero_conta) + 1), erro: false }
                } else {
                    req.flash(`success_msg`, `Conta cadastrada com sucesso!`)
                    return {codigo: "6", erros: [], erro: false}
                }
            } else {
                if (cadastrarDuplicar == `sim` || qtdeDre) {
                    return {codigo: "7", erros: [], erro: true}
                } else {
                    let erros = [{ text: `Erro ao cadastrar conta, se persistir informar o desenvolvedor.` }]
                    return {codigo: "8", erros, erro: false}
                }
            }
        } else {
            if (cadastrarDuplicar == `sim` || qtdeDre) {
                return {codigo: "9", erros, erro: true}
            } else {
                return {codigo: "10", erros, erro: false}
            }
        }
    } catch (e) {
        console.log(e)
        return {codigo: "11", erros: [], erro: true}
    }
}

