const fs = require('fs');
var { sleep, log } = require(`./tools.js`);
var  downloadquota  = require("./downloadquota.js");
var  download_path  = require("./download_path.js");
const config = require('../config.js');
const { copy_beatmaps } = require('./copy_beatmaps.js');

module.exports =  async function check_response (response, beatmapname) {
    if (response) {
        fs.rmSync(`${download_path}\\${beatmapname}`);

        log(`${await downloadquota()} quota used`);
        log(response);
        log(`waiting 30 minutes for retry.`);

        await copy_beatmaps();

        return await sleep(1800);
    } else {
        return true
    }
};
