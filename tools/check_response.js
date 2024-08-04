const fs = require('fs');
var { sleep, log } = require(`./tools.js`);
var  download_quota  = require("../responses/download_quota.js");
var  download_path  = require("./download_path.js");

const move_beatmaps = require('./move_beatmaps.js');
const { dashboard_waiting_quota_start, dashboard_waiting_quota_end } = require('./dashboard_quota.js');
const config = require('../config.js');
const path = require('path');

module.exports = async function check_response (response, beatmapname) {
	const filepath = path.join(download_path, beatmapname);

    return new Promise ( async ( res, rej) => {

        if (response) {

            if (response.toString().indexOf('time out') > -1) {
				log(`request is timeout after 60, retry`);
				await sleep(120);
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

			const waiting_mins = 2;

            log(`${await download_quota()} quota used`);
            log(response);
            log(`waiting ${waiting_mins} minutes for retry.`);
            
            await dashboard_waiting_quota_start(waiting_mins);

			if (config.is_move_beatmaps) {
				move_beatmaps();
			}
			
            await sleep(60 * waiting_mins);
            await dashboard_waiting_quota_end();
        }

        res (true);

    });
};
