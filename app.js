const express = require('express')
const { engine } = require('express-handlebars')
const path = require('path')
const session = require('express-session')
const flash = require('connect-flash')
const app = express()

const admin = require('./routes/admin')
const usuario = require('./routes/usuario')
const conta = require('./routes/conta')
const categoria = require('./routes/categoria')
const cargo = require('./routes/cargo')
const empresa = require('./routes/empresa')
const fornecedor = require('./routes/fornecedor')
const formaPagamento = require('./routes/formaPagamento')
const banco = require('./routes/banco')
const sistema = require('./routes/sistema')
const descricao = require('./routes/descricao')
const departamento = require('./routes/departamento')
const configuracao = require('./routes/configuracao')

const passport = require("passport")
require("./config/auth")(passport)



/**
 *  middleware autenticação
 */

function authenticationMiddleware(req, res, next) {
    if (req.isAuthenticated()) return next()
    res.redirect("/admin/login")
}

/**
 * config porta
 */
const PORT = 8089

/**
 * config sessions
 */
app.use(session({
    secret: "HVHVHV656435435dcfcccfdFDDFXCgvd4422VVVCGFDczcfskjmdk",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 6 * 60 * 60 * 1000 }
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())

/**
 * middleware para variaveis globais
 */
app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg")
    res.locals.error_msg = req.flash("error_msg")
    res.locals.error_msg_destaque = req.flash("error_msg_destaque")
    res.locals.error = req.flash("error")
    res.locals.set_page_home = req.flash("set_page_home")
    res.locals.user = req.user || null
    next()
})

/**
 * config express json
 */
app.use(express.urlencoded({ extended: false, limit: '50mb' }))
app.use(express.json({ limit: '50mb' }))

/**
 * config handlebars
 */
app.engine("handlebars", engine({ defaultLayout: "main" }))
app.set('view engine', 'handlebars')
app.set('views', path.join(__dirname, 'views'))

/**
 * config arquivos estáticos
 */
app.use(express.static(path.join(__dirname, "public")))


/**
 * config rotas
 */
app.use("/admin", admin)
app.use("/usuario", authenticationMiddleware, usuario)
app.use("/conta", authenticationMiddleware, conta)
app.use("/categoria", authenticationMiddleware, categoria)
app.use("/empresa", authenticationMiddleware, empresa)
app.use("/cargo", authenticationMiddleware, cargo)
app.use("/fornecedor", authenticationMiddleware, fornecedor)
app.use("/forma-pagamento", authenticationMiddleware, formaPagamento)
app.use("/banco", authenticationMiddleware, banco)
app.use("/sistema", authenticationMiddleware, sistema)
app.use("/descricao", authenticationMiddleware, descricao)
app.use("/departamento", authenticationMiddleware, departamento)
app.use("/configuracao", authenticationMiddleware, configuracao)

app.get('/', authenticationMiddleware, (req, res) => {
    res.render("home")
})

/**
 * subindo servidor
 */
app.listen(PORT, () => {
    console.log("Servidor rodando na porta: " + PORT)
})

// let {backup, restore, list_files_backup} = require('./models/backup/backup')
// list_files_backup()