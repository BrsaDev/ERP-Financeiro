const os = require('os');

const platform = os.platform();

module.exports = {
    checkSystem: () => {
        if (platform === 'win32') {
            return "windows"
        } else if (platform === 'linux') {
            return "linux"
        }
    }
}


