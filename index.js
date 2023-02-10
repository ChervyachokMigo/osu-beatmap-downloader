const minimist = require('minimist');
const { v1, v2, mods, tools, auth } = require ('osu-api-extended');

const jsons = require(`./tools/jsons.js`);
const { get_date_string, escapeString, log, checkDir } = require(`./tools/tools.js`);
const config = require('./config.js');
const beatmap_download = require('./tools/beatmap_download.js');
const check_response = require('./tools/check_response.js');
const download_path = require('./tools/download_path.js');

checkDir(download_path);

var check_date = config.use_start_date==true?config.start_date:get_date_string(new Date()).replaceAll('-', '');

main();

async function main(){
    var access_token = await auth.login_lazer(config.login, config.password);
    if (typeof access_token.access_token == 'undefined'){
        throw new console.error('no auth');
    }
    if (config.readOsudb){
        await jsons.read_osu_db();
    } else {
        await download_beatmaps();
    }
}

async function download_beatmaps(){
    const args = minimist(process.argv.slice(2));

    var found_maps_counter = 0;
    var cursor_string = null;
    var total = 0;

    var mode = 0;

    switch (args.mode){
        case '1':
        case 'taiko':
        case 't':
            mode = 1;
            break;
        case '2':
        case 'fruits':
        case 'ctb':
        case 'c':
        case 'f':
            mode = 2;
            break;
        case '3':
        case 'mania':
        case 'm':
            mode = 3;
            break;
        default:
        case 'osu':
        case 'std':
        case 'o':
        case 's':
        case '0':
            mode = 0;
            break;
    }

    log('selected mode: ' + args.mode)

    var typemaps = 'ranked';

    switch (args.status){
        case 'qualified':
        case 'ranked':
            typemaps = args.status;
            break;
        default:
            typemaps = 'ranked';
            break;
    }

    checkmap: while (1==1){
        log(`checking date: ${check_date}\n` + `cursor: ${cursor_string}`)
        
        var new_beatmaps = (await v2.beatmap.search({
            query: ``,
            m: mode,
            s: typemaps,
            cursor_string: cursor_string,
        }));
        
        let founded_maps = new_beatmaps.beatmapsets

        if (founded_maps.length>=50){
            cursor_string = new_beatmaps.cursor_string;
            if (total == 0) total = new_beatmaps.total;
            log('more then 50 beatmaps. go to cursor');
        }
        
        log(`found ${founded_maps.length} beatmaps`)
        
        

        let founded_beatmaps = 0;

        for (let newbeatmap of founded_maps){
            let not_ctb_maps = newbeatmap.beatmaps.filter((val)=>val.mode_int!==2);
            if (not_ctb_maps.length == 0){
                founded_beatmaps++;
                continue;
            }
            if(!jsons.find(newbeatmap.id)){
                found_maps_counter = 0;
                let osz_name = `${newbeatmap.id} ${escapeString(newbeatmap.artist)} - ${escapeString(newbeatmap.title)}.osz`;
                let is_download_failed = await beatmap_download(newbeatmap.id , `${download_path}\\${osz_name}`);

                if (!is_download_failed && typemaps === 'ranked') {
                    jsons.add(newbeatmap.id);
                }
                if ( ! await check_response(is_download_failed, osz_name)){
                    continue checkmap;
                }
            } else {
                founded_beatmaps++;
            }
        }
        if (founded_beatmaps === founded_maps.length) {
            found_maps_counter++;
        }
        log(`you have ${founded_beatmaps} of ${founded_maps.length} beatmaps`);
        total -= founded_maps.length;
        log(`осталось ${total} beatmaps`);

        if (check_date<20071005 || found_maps_counter>config.maps_date_depth|| total <= 0 || cursor_string === null || cursor_string === undefined) {
            log('ended');
            return
        }
    }
}


