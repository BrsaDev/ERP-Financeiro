const {checkSystem} = require("./checkSystem")

module.exports = {
    resolveRoutes: () => {
        const system = checkSystem()
        if ( system == "linux" ) return "/"
        if ( system == "windows" ) return "\\"
    }
}



