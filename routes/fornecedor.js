const express = require('express')
const router = express.Router()
const path = require('path')
const Fornecedor = require('../models/Fornecedor')
const TipoChavePix = require('../models/TipoChavePix')
const { eAdmin } = require("../helpers/eAdmin")


router.get('/obter', async (req, res)=> {
    let fornecedores = await Fornecedor.findAll()
    res.json({fornecedores})
})

router.get('/cadastrar', eAdmin, async (re, res) => {
    let tipoChavePix = await TipoChavePix.findAll()
    tipoChavePix = JSON.parse(JSON.stringify(tipoChavePix, null, 2))

    let fornecedores = await Fornecedor.findAll()
    fornecedores = JSON.parse(JSON.stringify(fornecedores, null, 2))
    if ( fornecedores.length > 0 ) {
        var proximo_numero_fornecedor = Number(fornecedores[fornecedores.length - 1].id)
    }else {
        var proximo_numero_fornecedor = 1
    }
    let itens = {proximo_numero_fornecedor}
    let optionsChavePix = ""
    for ( registro of tipoChavePix ) {
        optionsChavePix += `
            <option value="${registro.tipo}">${registro.tipo}</option>
        `
    }
    
    res.render(path.join(__dirname.toString().replace("\\routes", ""), "\\views\\fornecedor\\cadastrar"), {itens, optionsChavePix})
})

router.post('/cadastrar', eAdmin, async (req, res) => {
    let { popup } = req.query
    let { 
        nome, chave, via_pagamento, data_cadastro, nome_fantasia, informacao, endereco, bairro, cidade, estado,
        cep, cnpj, insc_estadual, telefone, site, ramo, nome_contato, endereco_contato, cidade_contato,
        estado_contato, telefone_cel_contato, telefone_fixo_contato, observacao 
    } = req.body
    let erros = []
    if ( !nome || typeof nome == undefined || nome == null ) erros.push({text: "Fornecedor inválido."})
    if ( !via_pagamento || typeof via_pagamento == undefined || via_pagamento == null ) erros.push({text: "Via de pagamento inválida."})

    let fornecedorCompare = await Fornecedor.findOne({where: {nome}})
    if ( !fornecedorCompare ) {
        Fornecedor.create(
            { 
                nome, chave, via_pagamento , data_cadastro, nome_fantasia, informacao, endereco, bairro, cidade, estado,
                cep, cnpj, insc_estadual, telefone, site, ramo, nome_contato, endereco_contato, cidade_contato,
                estado_contato, telefone_cel_contato, telefone_fixo_contato, observacao 

            }
        )
        .then(() => {
            if ( popup ) {
                return res.json({resultado: "OK"})
            }
            req.flash("success_msg", "Fornecedor cadastrado com sucesso!")
            res.redirect("/")
        })
        .catch((erro) => {
            if ( popup ) {
                return res.json({erro: "OK"})
            }
            let erros = [{text: erro.errors[0].message}]
            res.render(path.join(__dirname.toString().replace("\\routes", ""), "\\views\\fornecedor\\cadastrar"), {erros, dados: req.body})
        })
    }else {
        if ( popup ) {
            return res.json({erro: "fornecedor já cadastrado."})
        }
        erros.push({text: "fornecedor já cadastrado."})
        res.render(path.join(__dirname.toString().replace("\\routes", ""), "\\views\\fornecedor\\cadastrar"), {erros, dados: req.body})
    }

})

router.get('/listar', async (req, res) => {
    let fornecedores = await Fornecedor.findAll()
    fornecedores = JSON.parse(JSON.stringify(fornecedores, null, 2))
    if ( fornecedores.length == 0 ) {
        res.render(path.join(__dirname.toString().replace("\\routes", ""), "\\views\\fornecedor\\listar"))
    }else {
        fornecedores.forEach(item=>{
            if( item.data_cadastro ) { 
                item.data_cadastro = item.data_cadastro == "" ? "" : item.data_cadastro.slice(8) + "/" + item.data_cadastro.slice(5, 7) + "/" + item.data_cadastro.slice(0, 4)
            }
        })
        res.render(path.join(__dirname.toString().replace("\\routes", ""), "\\views\\fornecedor\\listar"), {fornecedores})
    }
})


module.exports = router
