const { readFileSync, existsSync, writeFileSync } = require('fs');
const minimist = require('minimist');
const { v2, auth } = require ('osu-api-extended');
const { escapeString, checkDir } = require(`./tools.js`);
const check_response = require('./check_response.js');
const beatmap_download = require('../responses/beatmap_download.js');
const config = require('../config.js');
const path = require('path');

const args = minimist(process.argv.slice(2));

const downloads_list = args.list || null;

const download_path = path.join( path.dirname(process.argv[1]), '..', config.download_folder );

const auth_osu = async () => {
    const access_token = await auth.login_lazer(config.login, config.password);
    if (typeof access_token.access_token == 'undefined'){
        throw new console.error('no auth');
    }
}

function parse_list(list_filename){
    try{
        const data = readFileSync(list_filename, {encoding: 'utf8'});
        const rows = data.split('\n').map( str => Number( str.match(/^\d+/g) ));
        return rows.filter((v, i) => rows.indexOf(v) === i && v !== 0).sort( (a, b) => a - b);
    } catch (e){
        throw new Error(e);
    }
}


async function main(){

    if (!downloads_list){
        throw new Error('Usage: --list file');
    }

    if (!existsSync(downloads_list)){
        throw new Error('list not exists');
    }

    checkDir(download_path);

    await auth_osu();

    const beatmapset_id_list = parse_list(downloads_list);

    for (let id of beatmapset_id_list){        
        const response_beatmap_info = await v2.beatmap.set.details(id);

		let is_no_info = false;
		if (!response_beatmap_info || !response_beatmap_info.artist || !response_beatmap_info.title) {
            console.log(`[${id}] Beatmapset INFO not responsed.`);
			is_no_info = true;
        }

        const osz_name = 
        `${id}${is_no_info === false ? 
			' ' + [
				escapeString(response_beatmap_info.artist), 
				escapeString(response_beatmap_info.title)
			].join(' - '): ''}.osz`;

        await new Promise( async (res, rej) => {
            const is_download_failed = await beatmap_download(id , path.join(download_path, osz_name));

            if(!is_download_failed){
                const new_list = beatmapset_id_list.filter( v => v !== id);
                writeFileSync(downloads_list, new_list.join('\n'));
            }
            res(await check_response(is_download_failed, osz_name));
        })    
    }
}

main();

