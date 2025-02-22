const { log } = require(`./tools.js`);
const config = require('../config.js');
const { readdirSync, copyFileSync, rmSync } = require('node:fs');
const path = require('node:path');
const { download_path } = require('./download_path.js');

const move_file_sync = ({ src, dest }) => {
    try{
        if (config.is_detail_move_log){
            log('move from',src);
            log('move to', dest);
        }
        copyFileSync(src, dest);
        rmSync(src);
    } catch (e) {
        if (e.code === 'EPERM'){
            console.error('EPERM: operation not permitted', src, dest);
        } else {
            console.error(e);
        }
    }
}

module.exports = () => {
	log('moving files to Songs..');

	const files = readdirSync(download_path, { encoding: 'utf8' });

	for (let filename of files) {

		move_file_sync({
			src: path.join(download_path, filename), 
			dest: path.join(config.osuFolder, 'Songs', filename)
		});

	}
}