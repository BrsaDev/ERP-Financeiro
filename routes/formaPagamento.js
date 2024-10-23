const express = require('express')
const router = express.Router()
const path = require('path')
const FormaPagamento = require('../models/FormaPagamento')
const { eAdmin } = require("../helpers/eAdmin")


router.get('/obter', async (req, res)=> {
    let formasPagamento = await FormaPagamento.findAll()
    res.json({formasPagamento})
})

router.get('/cadastrar', eAdmin, (re, res) => {
    res.render(path.join(__dirname.toString().replace("\\routes", ""), "\\views\\formaPagamento\\cadastrar"))
})

router.post('/cadastrar', eAdmin, async (req, res) => {
    let { nome } = req.body
    let erros = []
    if ( !nome || typeof nome == undefined || nome == null ) erros.push({text: "Forma de pagamento inválida."})

    let formaPagamentoCompare = await FormaPagamento.findOne({where: {nome}})
    if ( !formaPagamentoCompare ) {
        FormaPagamento.create({ nome })
        .then(() => {
            req.flash("success_msg", "Forma de pagamento cadastrado com sucesso!")
            res.redirect("/")
        })
        .catch((erro) => {
            let erros = [{text: erro.errors[0].message}]
            res.render(path.join(__dirname.toString().replace("\\routes", ""), "\\views\\formaPagamento\\cadastrar"), {erros, dados: req.body})
        })
    }else {
        erros.push({text: "Forma pagamento já cadastrada."})
        res.render(path.join(__dirname.toString().replace("\\routes", ""), "\\views\\formaPagamento\\cadastrar"), {erros, dados: req.body})
    }

})

router.get('/listar', async (req, res) => {
    let formasPagamento = await FormaPagamento.findAll()
    formasPagamento = JSON.parse(JSON.stringify(formasPagamento, null, 2))
    if ( formasPagamento.length == 0 ) {
        res.render(path.join(__dirname.toString().replace("\\routes", ""), "\\views\\formaPagamento\\listar"))
    }else {
        res.render(path.join(__dirname.toString().replace("\\routes", ""), "\\views\\formaPagamento\\listar"), {formasPagamento})
    }
})


module.exports = router
