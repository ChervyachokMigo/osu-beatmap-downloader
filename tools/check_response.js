const fs = require('fs');
var { sleep, log } = require(`./tools.js`);
var { downloadquota } = require("./downloadquota.js");
var { download_path } = require("./download_path.js");

module.exports =  async function check_response (response, beatmapname) {
    if (response) {
        fs.rmSync(`${download_path}\\${beatmapname}`);

        log(`${await downloadquota()} quota used`);
        log(response);
        log(`waiting 30 minutes for retry.`);

        return await sleep(1800);
    } else {
        return true
    }
};
