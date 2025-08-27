const fs = require('fs')
const pdf2table = require('pdf2table')

/**
 * Extrai tabelas de um PDF e salva em um arquivo .xlsx
 * @param {string} caminhoPdf - Caminho para o PDF.
 */

module.exports = {
    pdfParser: async (caminhoPdf) => {
        return new Promise((resolve, reject) => {
            fs.readFile(caminhoPdf, (err, buffer) => {
            if (err) {
                console.error("Erro ao ler o PDF:", err)
                return reject(err);
            }

            pdf2table.parse(buffer, (err, rows) => {
                if (err) {
                console.error("Erro ao extrair a tabela:", err)
                return reject(err);
                }

                if (!rows || rows.length === 0) {
                console.log("Nenhuma tabela encontrada no PDF.")
                return resolve(null);
                }

                let dados = null;

                if (rows[0][0] === "Guia Nacional de Recolhimento de Tributos Estaduais -") {
                dados = {
                    numero_documento_origem: rows[9][4],
                    uf_favorecida: rows[0][1],
                    cpf_cnpj_destinatario: rows[11][1],
                    data_vencimento: rows[2][2],
                    total_recolher: rows[14][2].replace("R$ ", ""),
                    codigo_barras: rows[6][0],
                }
                } else {
                if (rows[10][1] === "PB" || rows[10][1] === "BA") {
                    dados = {
                    numero_documento_origem: "",
                    uf_favorecida: rows[10][1],
                    cpf_cnpj_destinatario: rows[0][1] === "ã" ? "" : rows[0][1],
                    data_vencimento: rows[12][2],
                    total_recolher: rows[14][1].replace("R$ ", ""),
                    codigo_barras: rows[19][0],
                    };
                } else {
                    dados = {
                    numero_documento_origem: rows[13][3],
                    uf_favorecida: rows[10][1],
                    cpf_cnpj_destinatario: rows[0][1] === "ã" ? "" : rows[0][1],
                    data_vencimento: rows[12][2],
                    total_recolher: rows[14][1].replace("R$ ", ""),
                    codigo_barras: rows[19][0],
                    }
                }
                }
                resolve(dados)
            })
            })
        })
    }
} 

// Exemplo de uso:
async function asas(){
  let itens = ["page_12.pdf", "48948 (88).pdf", "page_17.pdf", "page_23.pdf"]//
  for ( let item of itens ) {
    let response = await pdfParser(item)
    console.log(response)
  }
}
//asas()