const fs = require('node:fs');
var { sleep, log } = require(`./tools.js`);
var  download_quota  = require("../responses/download_quota.js");

const move_beatmaps = require('./move_beatmaps.js');
const { dashboard_waiting_quota_start, dashboard_waiting_quota_end } = require('./dashboard_quota.js');
const path = require('node:path');
const { get_config } = require('./config_web_editor/config_cache.js');
const { download_path } = require('../misc/pathes.js');

const waiting_secs = 120;

module.exports = async function check_response (response, beatmapname) {
	const filepath = path.join(download_path, beatmapname);

    return new Promise ( async ( res, rej) => {

        if (response) {

            if (response.toString().indexOf('time out') > -1) {
				log(`request is timeout after ${waiting_secs} secs, retry`);
				await sleep(waiting_secs);
				res('timeout');
				return;
			}

			try {
                fs.rmSync(filepath);
            } catch (e) {
				if (e.code === 'EBUSY') {
					console.error(`[${filepath}]`,'can not delete, file is locked');
				} else if (e.code === 'EPERM') {
					console.error(`[${filepath}]`,'can not delete, permission denied');
				} else {
					console.error(`[${filepath}] Error:`, e);
				}
            }

            log(`${await download_quota()} quota used`);
            log(response);
            log(`waiting ${waiting_secs} secs for retry.`);
            
            await dashboard_waiting_quota_start(waiting_secs);

			const { is_move_beatmaps } = get_config();

			if (is_move_beatmaps) {
				move_beatmaps();
			}
			
            await sleep(waiting_secs);
            await dashboard_waiting_quota_end();
        }

        res (true);

    });
};
