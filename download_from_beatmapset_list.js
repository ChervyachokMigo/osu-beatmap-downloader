const fs = require('fs');
const minimist = require('minimist');
const { v1, v2, mods, tools, auth } = require ('osu-api-extended');
const { escapeString } = require(`./tools/tools.js`);
const download_path = require('./tools/download_path.js');
const check_response = require('./tools/check_response.js');
const beatmap_download = require('./tools/beatmap_download.js');
const config = require('./config.js');

const args = minimist(process.argv.slice(2));

function parse_list(list_filename){
    try{
        var rows = fs.readFileSync(list_filename,{encoding: 'utf8'});
        rows = rows.split('\n').filter( row => {
            row = Number(row);
            return (!isNaN(row) && row>0);
        })
        return rows.filter((value, index) => rows.indexOf(value) === index);

    } catch (e){
        throw new Error(e);
    }
}

async function main(){
    var downloads_list;
    if (args.list){
        downloads_list = args.list;
    } else {
        throw new Error('Usage: --list file');
    }
    if (!fs.existsSync(downloads_list)){
        throw new Error('lsit not exists');
    }

    var access_token = await auth.login_lazer(config.login, config.password);
    if (typeof access_token.access_token == 'undefined'){
        throw new console.error('no auth');
    }

    const beatmapset_ids = parse_list(downloads_list);

    for (let i in beatmapset_ids){
        if (typeof beatmapset_ids[i] ==='undefined' || !beatmapset_ids[i].length > 0 || isNaN(Number(beatmapset_ids[i]))){
            continue;
        }

        var beatmapset = await v2.beatmap.set(beatmapset_ids[i]);    

        await new Promise(async (res,rej)=>{
            let osz_name = 
                `${beatmapset.id} ${escapeString(beatmapset.artist)} - ${escapeString(beatmapset.title)}.osz`;
            var is_download_failed = await beatmap_download(beatmapset.id , `${download_path}\\${osz_name}`);
            if(!is_download_failed){
                let bmset_ids_without_downloaded_map = beatmapset_ids.filter( id => {
                    return !isNaN(Number(id)) && Number(id) !== Number(beatmapset.id)
                });
                
                fs.writeFileSync(downloads_list, bmset_ids_without_downloaded_map.join('\n'));
            }
            res(await check_response(is_download_failed, osz_name));
        })
        
    }
    

}
main();