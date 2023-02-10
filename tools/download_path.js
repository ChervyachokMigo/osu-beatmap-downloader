const path = require(`path`);
const config = require('../config');
const mainpath =  path.dirname(process.argv[1]);

module.exports = `${mainpath}\\${config.download_folder}`;
