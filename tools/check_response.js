const fs = require('fs');
var { sleep, log } = require(`./tools.js`);
var  downloadquota  = require("./downloadquota.js");
var  download_path  = require("./download_path.js");
const dashboard = require('dashboard_framework');

const { copy_beatmaps } = require('./copy_beatmaps.js');

module.exports =  async function check_response (response, beatmapname) {
    return new Promise ( async ( res, rej) => {
        if (response) {
            fs.rmSync(`${download_path}\\${beatmapname}`);

            log(`${await downloadquota()} quota used`);
            log(response);
            log(`waiting 30 minutes for retry.`);
            
            await dashboard.change_status('download_quota', 'quota');
            
            await copy_beatmaps();
            
            await sleep(1800);
            
            await dashboard.change_status('download_quota', 'ready');
        }

        res (true);
    });
};
