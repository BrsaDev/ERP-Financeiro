const mysqldump = require('mysqldump')
const { exec, spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const { sequelize } = require('../db')
 
// dump the result straight to a file
module.exports = {
    backup: () => {
        try {
            let date = new Date().toLocaleString("pt-BR")
            return mysqldump({
                connection: {
                    host: 'localhost',
                    user: 'root',
                    password: 'deus2127',
                    database: 'erp_financeiro',
                },
                dumpToFile: path.resolve(__dirname, `./dump ${date.replaceAll("/", '-').replace(",", "").replaceAll(":", '-')}.sql`)
            })
        }catch(erro) {
            return {erro}
        }
        
    },
    restore: async (nomeArquivo) => {
        const queryInterface = sequelize.getQueryInterface()
        const tables = await queryInterface.showAllTables()
        for ( let table of tables ) { await queryInterface.bulkDelete(table, null, {}) }
        
        let dumpFile = path.resolve(__dirname, `dump ${nomeArquivo.replaceAll("/", '-').replaceAll(":", '-')}.sql`)

        var resultado = false
        exec(`mysql -u root -p"deus2127" erp_financeiro < "${dumpFile}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Erro ao restaurar o banco de dados: ${error.message}`);
                return false
            }
            // if (stderr) {
            // // console.error(`Erro: ${stderr}`);
            // // return;
            // }
            console.log(`Saída: ${stdout}`);
            console.log('Restauro do banco de dados concluído com sucesso!')
            resultado = true
            return true
        })
        await sleep(7000)
        return resultado
        
    },
    list_files_backup: async () => {
        try {
            let files = fs.readdirSync(path.resolve(__dirname, ""))
            var nomesArquivos = []
            files.forEach((file) => {
                if (file.endsWith('.sql')) {
                    let nameSplit = file.split(" ")
                    nameSplit[1] = nameSplit[1].replaceAll("-", "/")
                    nameSplit[2] = nameSplit[2].replaceAll("-", ":")
                    nomesArquivos.push( nameSplit.slice(1).join(" ").replace(".sql", "") )
                }
            })
            return {nomesArquivos}
        }catch(erro) {
            return {erro}
        }
        
    }
}
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// mysql -u root -p teste-restore < /home/fabio/db_Biblioteca.sql