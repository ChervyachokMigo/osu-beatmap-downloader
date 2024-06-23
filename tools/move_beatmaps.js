const { log } = require(`./tools.js`);
const config = require('../config.js');
const { readdirSync, copyFileSync, rmSync } = require('fs');
const path = require('path');

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

	let files = readdirSync(config.download_folder, { encoding: 'utf8' });

	for (let file of files) {
		move_file_sync({
			src: path.join(__dirname, '..', config.download_folder, file), 
			dest: path.join(config.osuFolder, 'Songs', file)
		});
	}
}