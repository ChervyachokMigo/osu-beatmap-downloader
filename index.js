const { clearInterval } = require('timers');
const minimist = require('minimist');
const { v2 } = require ('osu-api-extended');

const defaults = require('./misc/const_defaults.js');
const jsons = require(`./tools/jsons.js`);
const { escapeString, log, checkDir, sleep, formatPercent } = require(`./tools/tools.js`);
const config = require('./config.js');
const beatmap_download = require('./tools/beatmap_download.js');
const check_response = require('./tools/check_response.js');
const download_path = require('./tools/download_path.js');

const get_beatmap_size = require('./tools/get_beatmap_size.js');
const web = require('./tools/web_controller.js');
const get_file_size = require('./tools/get_file_size.js');
const { existsSync } = require('fs');
const path = require('path');
const { copy_beatmaps } = require('./tools/copy_beatmaps.js');

const dashboard = require('dashboard_framework');
const { save_last_cursor, load_last_cursor, is_continue_from_cursor } = require('./tools/cursor.js');
const { get_osu_token, auth_osu } = require('./tools/osu_auth.js');
const { dashboard_init } = require('./tools/dashboard_init.js');

const osu_db_path = path.join(__dirname, 'data', 'beatmaps_osu_db.json');

checkDir(download_path);
checkDir(path.join(__dirname, 'data'));

const str_modes = ['osu', 'taiko', 'fruits', 'mania'];

async function main(){
    await dashboard_init();
    
    await auth_osu();
    await dashboard.change_status({name: 'osu_auth', status: 'on'});

    await web.init();

    
    if (!existsSync(osu_db_path)){
        await dashboard.change_status({name: 'db_scan', status: 'scaning'});
        await jsons.read_osu_db();
        console.log('scan ended');
    }

    await dashboard.change_status({name: 'db_scan', status: 'ready'});

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

    if (config.is_copy_beatmaps) {
        await copy_beatmaps();
    }

    //process.exit(0);
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

    await dashboard.change_text_item({name: 'fav_count_min', item_name: 'current', text: `${FAV_COUNT_MIN}`});
    await dashboard.change_text_item({name: 'stars', item_name: 'current', text: `★${stars_min}-${stars_max}`});
    await dashboard.change_text_item({name: 'maps_depth', item_name: 'current', text: `${maps_depth} страниц (${maps_depth * 50} карт)`});
    await dashboard.change_text_item({name: 'min_circles', item_name: 'current', text: `${min_circles}`});
    await dashboard.change_text_item({name: 'min_length', item_name: 'current', text: `${min_length} сек`});

    let found_maps_counter = 0;

    is_continue_from_cursor(args.continue || defaults.is_continue)

    let cursor_string = args.cursor || load_last_cursor();

    await dashboard.change_text_item({name: 'cursor_string', item_name: 'last', text: `${cursor_string}`});
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
            mode = 0;
            break;
    }

    let status = 'ranked';

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

    await dashboard.change_status({name: 'download_status', status: status});
    await dashboard.change_status({name: 'download_mode', status: str_modes[mode]});

    log('[settings]','\n',
    'query',query,'\n',
    'mode:',mode,'\n',
    'status',status,'\n',
    'favorite minimum count:', FAV_COUNT_MIN,'\n',
    'stars from',stars_min,'to',stars_max,'\n',
    'maps depth',maps_depth,'\n',)
    
    let total = null;
    let max_maps = 1;

    checkmap: while (1==1){
        log(`requesting for cursor: ${cursor_string}`);
        
        let new_beatmaps = await v2.beatmap.search({
            query: query,
            m: mode,
            s: status,
            cursor_string: cursor_string,
        }).catch( (rej) => {
            throw new Error (rej);
        });
        
        let founded_maps = new_beatmaps?.beatmapsets;
        let old_cursor = cursor_string;

        if (total === null) {
            total = new_beatmaps?.total;
            max_maps = new_beatmaps?.total;
            /*if (total > maps_depth * 50) {
                total = maps_depth * 50;
                max_maps = maps_depth * 50;
            }*/
            await dashboard.change_text_item({name: 'total_maps', item_name: 'current', text: `${total}`});
        }

        if (founded_maps && founded_maps.length>=50){
            cursor_string = new_beatmaps.cursor_string;
            if (founded_maps.length<50){
                log (`comparing ${founded_maps.length} beatmaps`);
            } else {
                log ('comparing next 50 beatmaps');
            }
        } else {
            cursor_string = null
            log('founded maps 0, ended.');
            break;
        }

        await dashboard.change_text_item({name: 'cursor_string', item_name: 'last', text: `${cursor_string}`});
        save_last_cursor(cursor_string);

        let checked_beatmaps = 0;
        let founded_beatmaps = 0;

        for (let idx in founded_maps){

            checked_beatmaps++;

            const beatmaps_selected = founded_maps[idx].beatmaps.filter( val => { 
                return val.mode_int === mode && 
                    val.difficulty_rating>=stars_min && 
                    val.difficulty_rating<=stars_max && 
                    val.total_length>min_length && 
                    val.count_circles>min_circles
            });
            
            if (!beatmaps_selected || beatmaps_selected.length == 0){
                founded_beatmaps++;
                continue;
            }

            let beatmapset_id = founded_maps[idx].id;
            let fav_count = founded_maps[idx].favourite_count;
            let artist = founded_maps[idx].artist;
            let title = founded_maps[idx].title;

            if( !jsons.find(beatmapset_id) && 
                fav_count > FAV_COUNT_MIN &&
                beatmaps_selected.length > 0 ){

                found_maps_counter = 0;

                let osz_name = `${beatmapset_id} ${escapeString(artist)} - ${escapeString(title)}.osz`;
                let osz_full_path = `${download_path}\\${osz_name}`;

                let filesize_response = config.is_file_size_requesting ? get_beatmap_size(get_osu_token(), beatmapset_id) : {size: 0};

                if (filesize_response.error){
                    log(filesize_response.error);
                    log(`waiting 30 minutes for retry.`);
                    await dashboard.change_status({name: 'download_quota', status: 'quota'});

                    await copy_beatmaps();
                    
                    await sleep(1800);

                    await dashboard.change_status({name: 'download_quota', status: 'ready'});
                    
                    continue checkmap;
                }
                
                let beatmap_size = Number(filesize_response.size);
                let downloaded_bytes = 0;

                await dashboard.css_apply({
                    selector: 'body', 
                    prop: 'background-image', 
                    value: `url(https://assets.ppy.sh/beatmaps/${beatmapset_id}/covers/raw.jpg)`
                });

                await dashboard.emit_event({
                    feedname: 'last_beatmaps',
                    type: 'beatmap',
                    title: `${artist} - ${title}`,
                    url: `https://osu.ppy.sh/beatmapsets/${beatmapset_id}`
                });

                web.update_beatmap(beatmapset_id, 
                {
                    mode, 
                    artist, 
                    title,
                    progress: downloaded_bytes,
                    filesize: beatmap_size
                });

                let lastInterval = setInterval( async ()=>{
                    downloaded_bytes = await get_file_size(osz_full_path);
                    web.update_beatmap(beatmapset_id, {progress: downloaded_bytes});
                }, 300);

                let is_download_failed = await beatmap_download(beatmapset_id ,osz_full_path, beatmap_size);                

                if (!is_download_failed && status !== 'qualified') {
                    jsons.add(beatmapset_id);
                }

                clearInterval(lastInterval);
                web.update_beatmap(beatmapset_id, {progress: beatmap_size});
                
                await check_response(is_download_failed, osz_name);

            } else {
                founded_beatmaps++;
            }
        }

        if (checked_beatmaps === founded_maps.length || founded_maps.length === 50 ) {
            found_maps_counter++;
        }

        log ('you have',founded_beatmaps,'of',checked_beatmaps,'beatmaps');

        total -= founded_maps.length;
        log(`${total} beatmaps left`);

        await dashboard.change_text_item({name: 'total_maps', item_name: 'current', text: `${total}/${max_maps} (${formatPercent(total, max_maps, 2)}%)`});

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

main();
