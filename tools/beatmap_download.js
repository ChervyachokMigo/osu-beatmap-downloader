const fs = require('fs');
var { v2 } = require('osu-api-extended');
var { log } = require(`./tools.js`);

module.exports = async function beatmap_download(id, path, size = 0) {
    return await new Promise(async (res, rej) => {
        try {

            log(`downloading ${id} to ${path} (${(size/(1024*1024)).toFixed(2)} MB)`);

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
