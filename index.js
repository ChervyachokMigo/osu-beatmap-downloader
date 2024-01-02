const { clearInterval } = require('timers');
const minimist = require('minimist');
const { v2, auth } = require ('osu-api-extended');

const defaults = require('./const_defaults.js');
const jsons = require(`./tools/jsons.js`);
const { escapeString, log, checkDir, sleep } = require(`./tools/tools.js`);
const config = require('./config.js');
const beatmap_download = require('./tools/beatmap_download.js');
const check_response = require('./tools/check_response.js');
const download_path = require('./tools/download_path.js');

const get_beatmap_size = require('./tools/get_beatmap_size.js');
const web = require('./tools/web_controller.js');
const get_file_size = require('./tools/get_file_size.js');
const { readdirSync, copyFileSync, rmSync, writeFileSync, readFileSync, existsSync } = require('fs');
const path = require('path');

const last_cursor_path = path.join(__dirname, 'data', 'last_cursor.json');
const osu_db_path = path.join(__dirname, 'data', 'beatmaps_osu_db.json');

checkDir(download_path);
checkDir(path.join(__dirname, 'data'));

var access_token = undefined;

const auth_osu = async (login, password)=>{
    let token = await auth.login_lazer(login, password);
    if (typeof token.access_token == 'undefined'){
        log('no auth osu. trying again...');
        return await auth_osu( login, password );
    } else {
        return token
    }
}

main();

async function main(){
    
    access_token = await auth_osu(config.login, config.password);

    await web.init();

    
    if (!existsSync(osu_db_path)){
        await jsons.read_osu_db();
        console.log('scan ended')
    }

    const args = minimist(process.argv.slice(2));
    
    if (args.mode){
        const modes = args.mode.split(',');
        if ( modes.length>1 ){
            for (let mode of modes) {
                await download_beatmaps(mode);
            };
        } else {
            await download_beatmaps(args.mode);
        }
    } else {
        await download_beatmaps();
    }

    copy_beatmaps();

    process.exit(0);
}

const save_last_cursor = (cursor) => {
    writeFileSync(last_cursor_path, JSON.stringify ({cursor}), {encoding: 'utf8'});
}

const load_last_cursor = () => {
    try {
        const res = readFileSync(last_cursor_path, {encoding: 'utf8'});
        return JSON.parse(res);
    } catch (e) {
        return {cursor: null};
    }
}

async function download_beatmaps(mode = 0){
    const args = minimist(process.argv.slice(2));

    const FAV_COUNT_MIN = args.fav_count_min || config.fav_count_min || defaults.fav_count_min;
    const stars_min = args.stars_min || config.stars_min || defaults.stars_min;
    const stars_max = args.stars_max || config.stars_max || defaults.stars_max;
    const maps_depth = args.maps_depth || config.maps_depth || defaults.maps_depth;
    const min_circles = args.min_circles || config.min_circles || defaults.min_circles;
    const min_length = args.min_length || config.min_length || defaults.min_length;

    const strict = args.strict || false;

    const query = strict ? '"'+args.query+'"' : args.query || undefined;

    const down_continue = args.continue || defaults.is_continue;

    var found_maps_counter = 0;

    if (down_continue === 'no') {
        try{ 
            rmSync(last_cursor_path);
        } catch (e) {}
    }

    var cursor_string = args.cursor || load_last_cursor().cursor;

    log(cursor_string)

    switch (mode){
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
        case 'osu':
        case 'std':
        case 'o':
        case 's':
        case '0':
            mode = 0;
        default:
            break;
    }

    var status = 'ranked';

    switch (args.status){
        case 'qualified':
        case 'ranked':
        case 'loved':
        case 'pending':
        case 'graveyard':
            status = args.status;
            break;
        default:
            status = 'ranked';
            break;
    }



    log('[settings]','\n',
    'query',query,'\n',
    'mode:',mode,'\n',
    'status',status,'\n',
    'favorite minimum count:', FAV_COUNT_MIN,'\n',
    'stars from',stars_min,'to',stars_max,'\n',
    'maps depth',maps_depth,'\n',)
    
    var total = null;

    checkmap: while (1==1){
        log(`[query params]`);
        log(`cursor: ${cursor_string}`);
        
        var new_beatmaps = (await v2.beatmap.search({
            query: query,
            m: mode,
            s: status,
            cursor_string: cursor_string,
        }));
        
        let founded_maps = new_beatmaps.beatmapsets
        var old_cursor = cursor_string;

        if (total === null) {
            total = new_beatmaps.total;
        }

        if (founded_maps.length>=50){
            cursor_string = new_beatmaps.cursor_string;
            log('more then 50 beatmaps. go to cursor');
        }

        save_last_cursor(cursor_string);
        
        log(`found ${founded_maps.length} beatmaps`);        

        let founded_beatmaps = 0;

        for (let newbeatmap of founded_maps){

            /*let not_ctb_maps = newbeatmap.beatmaps.filter((val)=>val.mode_int!==2);

            if (not_ctb_maps.length == 0){
                founded_beatmaps++;
                continue;
            }*/
            
            const beatmaps_selected = newbeatmap.beatmaps.filter( val => { 
                return val.mode_int === mode && 
                    val.difficulty_rating>=stars_min && 
                    val.difficulty_rating<=stars_max && 
                    val.total_length>min_length && 
                    val.count_circles>min_circles
            });
            
            if (beatmaps_selected.length == 0){
                continue;
            }

            if( !jsons.find(newbeatmap.id) && 
                newbeatmap.favourite_count > FAV_COUNT_MIN &&
                beatmaps_selected.length > 0 ){

                found_maps_counter = 0;

                let osz_name = `${newbeatmap.id} ${escapeString(newbeatmap.artist)} - ${escapeString(newbeatmap.title)}.osz`;
                let osz_full_path = `${download_path}\\${osz_name}`;

                let filesize_response = get_beatmap_size(access_token.access_token, newbeatmap.id);

                if (filesize_response.error){
                    log(filesize_response.error);
                    log(`waiting 30 minutes for retry.`);
                    copy_beatmaps();
                    await sleep(1800);
                    continue checkmap;
                }
                
                let beatmap_size = Number(filesize_response.size);
                let downloaded_bytes = 0;

                web.update_beatmap(newbeatmap.id, 
                {
                    mode: mode, 
                    artist: newbeatmap.artist, 
                    title: newbeatmap.title,
                    progress: downloaded_bytes,
                    filesize: beatmap_size
                });

                let lastInterval = setInterval( async ()=>{
                    downloaded_bytes = await get_file_size(osz_full_path);
                    web.update_beatmap(newbeatmap.id, {progress: downloaded_bytes});
                }, 300);
                
                log ('starting download',(beatmap_size/(1024*1024)).toFixed(2),'MB');

                let is_download_failed = await beatmap_download(newbeatmap.id , osz_full_path);                

                if (!is_download_failed && status !== 'qualified') {
                    jsons.add(newbeatmap.id);
                }

                clearInterval(lastInterval);
                web.update_beatmap(newbeatmap.id, {progress: beatmap_size});

                if ( ! await check_response(is_download_failed, osz_name)){
                    continue checkmap;
                }

            } else {
                founded_beatmaps++;
            }
        }

        if (founded_beatmaps === founded_maps.length || founded_maps.length === 50 ) {
            found_maps_counter++;
        }

        log(`you have ${founded_beatmaps} of ${founded_maps.length} beatmaps`);

        total -= founded_maps.length;
        
        log(`${total} beatmaps left`);

        if ( found_maps_counter > maps_depth || total <= 0 || cursor_string === null || cursor_string === undefined) {
            log('ended');
            break
        }

        if (cursor_string === old_cursor && cursor_string !== null) {
            log(`last cursor. ended.`)
            break;
        }
    }
}

const move_file_sync = (src, dest) => {
    try{
        log('move from',src);
        log('move to', dest)
        copyFileSync(src, dest);
        rmSync(src);
    } catch (e) {
        console.error(e);
    }
}

const copy_beatmaps = () => {
    log('moving files to Songs..')
    const files = readdirSync(config.download_folder, {encoding: 'utf8'});
    for (const file of files ) {
        move_file_sync(path.join(__dirname, config.download_folder, file), path.join(config.osuFolder, 'Songs', file));
    }
}



