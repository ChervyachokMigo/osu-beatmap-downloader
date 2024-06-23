const fs = require('fs');
var { sleep, log } = require(`./tools.js`);
var  download_quota  = require("../responses/download_quota.js");
var  download_path  = require("./download_path.js");

const move_beatmaps = require('./move_beatmaps.js');
const { dashboard_waiting_quota_start, dashboard_waiting_quota_end } = require('./dashboard_quota.js');
const config = require('../config.js');

module.exports = async function check_response (response, beatmapname) {
    return new Promise ( async ( res, rej) => {
        if (response) {
            try {
                fs.rmSync(`${download_path}\\${beatmapname}`);
            } catch (e) {
                console.error(e);
            }

			const waiting_mins = 30;

            log(`${await download_quota()} quota used`);
            log(response);
            log(`waiting 30 minutes for retry.`);
            
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
