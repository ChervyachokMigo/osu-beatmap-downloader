const fs = require('fs');
var { v2 } = require('osu-api-extended');
var { log } = require(`../tools/tools.js`);
const { yellow, green } = require('colors');

const megabyte = 1024*1024;
const min_filesize = 3000;

module.exports = async function beatmap_download(id, path, size = 0) {
    return await new Promise(async (res, rej) => {
        try {
			const log_size = size > 0 ? 
				'(' + yellow((size/megabyte).toFixed(2)) +'MB)': '';

            log(`downloading ${yellow(id.toString())} to ${green(path)} ${log_size}`);
            
            await v2.beatmap.set.download(id, path, "osu", true);

            const stats = fs.statSync(path);

            if (stats.size > min_filesize) {
                res(false);
            } else {
                const data = JSON.parse(fs.readFileSync(path, { encoding: `utf-8` }));
                res(data.error);
            }
            
        } catch (e) {
            res(e);
        }
    });
}
