const express = require('express')
const router = express.Router()
const path = require('path')
const categoria = require('../models/Categoria')
const { eAdmin } = require("../helpers/eAdmin")

router.get('/obter', async (req, res)=> {
    let categorias = await categoria.findAll()
    res.json({categorias})
})

router.get('/cadastrar', eAdmin, (req, res) => {
    res.render(path.join(__dirname.toString().replace("\\routes", ""), "\\views\\categoria\\cadastrar"))
})

router.post('/cadastrar', eAdmin, async (req, res) => {
    let { grupo, subgrupo, nome } = req.body
    let erros = []
    if ( !grupo || typeof grupo == undefined || grupo == null ) erros.push({text: "Grupo inválido."})
    if ( !subgrupo || typeof subgrupo == undefined || subgrupo == null ) erros.push({text: "Subgrupo inválido."})
    if ( !nome || typeof nome == undefined || nome == null ) erros.push({text: "Categoria inválida."})

    let categoriaCompare = await categoria.findOne({where: {nome}})
    if ( !categoriaCompare ) {
        categoria.create({
            nome,
            subgrupo,
            grupo
        })
        .then(() => {
            req.flash("success_msg", "Categoria cadastrada com sucesso!")
            res.redirect("/")
        })
        .catch((erro) => {
            let erros = [{text: erro.errors[0].message}]
            res.render(path.join(__dirname.toString().replace("\\routes", ""), "\\views\\categoria\\cadastrar"), {erros, dados: req.body})
        })
    }else {
        erros.push({text: "Categoria já cadastrada."})
        res.render(path.join(__dirname.toString().replace("\\routes", ""), "\\views\\categoria\\cadastrar"), {erros, dados: req.body})
    }

})

router.get('/listar', async (req, res) => {
    let categorias = await categoria.findAll()
    categorias = JSON.parse(JSON.stringify(categorias, null, 2))
    
    if ( categorias.length == 0 ) {
        res.render(path.join(__dirname.toString().replace("\\routes", ""), "\\views\\categoria\\listar"))
    }else {
        res.render(path.join(__dirname.toString().replace("\\routes", ""), "\\views\\categoria\\listar"), {categorias})
    }
})

module.exports = router