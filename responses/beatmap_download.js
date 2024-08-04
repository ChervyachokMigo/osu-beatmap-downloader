const fs = require('fs');
var { v2 } = require('osu-api-extended');
var { log } = require(`../tools/tools.js`);
const { yellow, green } = require('colors');
const path = require('path');


const megabyte = 1024*1024;
const min_filesize = 3000;

const no_video = true;
const download_server = ["osu", 'osu_direct_mirror', 'sayobot', 'nerinyan', 'gatari', 'ripple', 'catboy'];

module.exports = async function beatmap_download(id, output_path, server_id = 0, size = 0) {
    return await new Promise(async (res, rej) => {
        try {
			const log_size = size > 0 ? 
				'(' + yellow((size/megabyte).toFixed(2)) +'MB) ': '';
			const folder = path.basename( path.dirname( output_path ));
			const filename =  path.basename( output_path );
            log(`downloading ${yellow(id.toString())} to ${green( folder + '\\' + filename )} ${log_size}from ${download_server[server_id]}`);
            
			let progress = 0;
			let progress_last_print = -100;

            const error = await v2.beatmap.set.download(id, output_path, download_server[server_id], no_video, (percents) => {
				//console.log(percents);
				progress = percents;
				if (progress_last_print < progress - 5) {
					process.stdout.write('downloading progress: ' + progress.toFixed(0) + '%\r');
					progress_last_print = progress;
				}
			});

			//debug
			if (typeof error === 'string') {
				log('no error:', error);
			} else {
				log('response error:', error.error);
			}

            const stats = fs.statSync(output_path);

            if (stats.size > min_filesize) {
                res(false);
            } else {
                const data = JSON.parse(fs.readFileSync(output_path, { encoding: `utf-8` }));
                res(data.error);
            }
            
        } catch (e) {

			//log('error:', e);
            res(e);
        }
    });
}
