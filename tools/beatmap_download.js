const fs = require('fs');
var { v2 } = require('osu-api-extended');
var { log } = require(`./tools.js`);

module.exports = async function beatmap_download(id, path) {
    return await new Promise(async (res, rej) => {
        try {

            log(`downloading ${id} to ${path}`);

            await v2.beatmap.download(id, path);

            var stats = fs.statSync(path);

            if (stats.size > 3000) {
                res(false);
            } else {
                let jsondata = fs.readFileSync(path, { encoding: `utf-8` });
                let jsonparsed = JSON.parse(jsondata);
                res(jsonparsed.error);
            }
            
        } catch (e) {
            res(e);
        }
    });
}
