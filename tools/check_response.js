const fs = require('fs');
var { sleep, log } = require(`./tools.js`);
var  downloadquota  = require("./downloadquota.js");
var  download_path  = require("./download_path.js");

const { copy_beatmaps } = require('./copy_beatmaps.js');

module.exports =  async function check_response (response, beatmapname) {
    return new Promise ( async ( res, rej) => {
        if (response) {
            try {
                fs.rmSync(`${download_path}\\${beatmapname}`);
            } catch (e) {
                console.error(e);
            }

            log(`${await downloadquota()} quota used`);
            log(response);
            log(`waiting 30 minutes for retry.`);
            
            await copy_beatmaps();
            
            await sleep(1800);
            
        }

        res (true);
    });
};
