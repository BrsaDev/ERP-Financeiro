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
const dashboard = require('./routes/dashboard')

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
app.use("/dashboard", authenticationMiddleware, dashboard)

app.get('/', authenticationMiddleware, (req, res) => {
    res.render("home")
})

/**
 * subindo servidor
 */
app.listen(PORT, () => {
    console.log("Servidor rodando na porta: " + PORT)
})

// const PDFDocument = require("pdfkit");
// const fs = require("fs");

// function gerarPDF() {
//   // Cria um novo documento PDF com o tamanho desejado
//   const doc = new PDFDocument({ size: "A4" });

//   // Insere o conteúdo desejado no documento PDF
//   doc.text(`
//   Valor da Conta | Histórico | N° Conta | Fornecedor | Via de pagamento | Forma de pagamento | Agendamento | Pagamento | Agencia | Conta corrente | N° cartao crédito | Cheque compensado | Situação | Banco | Protocolo banco | Comprovante pagamento | Cadastramento | Documento pagamento | Vencimento | Referência | Relacao | N° de parcelas | N° de dias | Fixar Parcelas | Observação | undefined | Reembolso | N° pedido de compra | Data compra | Emissão nf | N° comprovante | Data entrega mercadoria | Mercadoria entregue | Comprovante mercadoria | Vinculado | Chave | Valor da parcela | Vencimento da parcela | N° da parcela
// --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// 50,00 | sdfbsfgsfg | 1 |  |  |  |  |  |  |  |  |  | Aberto |  |  |  |  |  | 28/10/2024 |  |  | 3 | Desabilitado | dia 28 |  | undefined |  |  |  |  |  |  |  |  |  | telefone | 50,00 | 28/10/2024 | 1 | undefined | undefined | undefined | undefined | undefined | undefined | undefined | undefined | undefined | undefined | undefined | undefined | undefined | undefined | undefined
// 50,00 | sdfbsfgsfg | 2 |  |  |  |  |  |  |  |  |  | Aberto |  |  |  |  |  | 28/11/2024 |  |  | 3 | Desabilitado | dia 28 |  | undefined |  |  |  |  |  |  |  |  |  | telefone | 50,00 | 28/11/2024 | 2 | undefined | undefined | undefined | undefined | undefined | undefined | undefined | undefined | undefined | undefined | undefined | undefined | undefined | undefined | undefined
// 50,00 | sdfbsfgsfg | 3 |  |  |  |  |  |  |  |  |  | Aberto |  |  |  |  |  | 28/12/2024 |  |  | 3 | Desabilitado | dia 28 |  | undefined |  |  |  |  |  |  |  |  |  | telefone | 50,00 | 28/12/2024 | 3 | undefined | undefined | undefined | undefined | undefined | undefined | undefined | undefined | undefined | undefined | undefined | undefined | undefined | undefined | undefined
// 60,00 | dydtdu | 4 |  |  |  |  |  |  |  |  |  | Aberto |  |  |  |  |  | 31/10/2024 |  |  | 1 | 17 dias | Desabilitado |  | undefined |  |  |  |  |  |  |  |  |  | telefone | 60,00 | 31/10/2024 | 1 | undefined | undefined | undefined | undefined | undefined | undefined | undefined | undefined | undefined | undefined | undefined | undefined | undefined | undefined | undefined
//   `);

//   // Salva o documento PDF em um arquivo
//   doc.pipe(fs.createWriteStream("meu-pdf.pdf"));
//   doc.end();
// }

// gerarPDF()