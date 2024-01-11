const { log } = require(`./tools.js`);
const config = require('../config.js');
const { readdirSync, copyFileSync, rmSync } = require('fs');
const path = require('path');

const move_file_sync = ({ src, dest }) => {
    try{
        log('move from',src);
        log('move to', dest)
        copyFileSync(src, dest);
        rmSync(src);
    } catch (e) {
        if (e.code === 'EPERM'){
            console.error('EPERM: operation not permitted', src, dest);
        } else {
            console.error(e);
        }
    }
};

const copy_beatmaps = () => {
    if (config.is_copy_beatmaps) {
        return new Promise((res, rej) => {

            log('moving files to Songs..');
            let files = readdirSync(config.download_folder, { encoding: 'utf8' });
            for (let file of files) {
                move_file_sync({
                    src: path.join(__dirname, '..', config.download_folder, file), 
                    dest: path.join(config.osuFolder, 'Songs', file)
                });
            }

            res(true);
        });
    } else {
        res (false);
    }
};

module.exports = {
    copy_beatmaps
}
