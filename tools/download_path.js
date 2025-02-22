const path = require(`path`);
const mainpath =  path.join( __dirname, '..' );

const download_folder = 'beatmaps';

module.exports = {
	download_folder,
	download_path: path.join( mainpath, download_folder ),
}
