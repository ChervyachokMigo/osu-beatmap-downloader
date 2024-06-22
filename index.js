
const minimist = require('minimist');
const { v2 } = require ('osu-api-extended');

const defaults = require('./misc/const_defaults.js');
const jsons = require(`./tools/jsons.js`);
const { escapeString, log, checkDir, sleep, formatPercent, breakpoint } = require(`./tools/tools.js`);
const config = require('./config.js');
const beatmap_download = require('./tools/beatmap_download.js');
const check_response = require('./tools/check_response.js');
const download_path = require('./tools/download_path.js');

const get_beatmap_size = require('./tools/get_beatmap_size.js');

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

const end_process = async () => {
    await dashboard.emit_event({
        feedname: 'last_beatmaps',
        type: 'end',
        title: `Скачивание закончено`,
    });
    await dashboard.change_status({name: 'total_maps', status: 'end'});
}

async function main(){
    if (!existsSync(config.osuFolder)){
        log(`[config: osuFolder] ${config.osuFolder} не существует`);
        await sleep(99999);
    }

    if (!existsSync(path.join(config.osuFolder, 'Songs'))){
        log(`[config: osuFolder/Songs] ${path.join(config.osuFolder, 'Songs')} не существует`);
        await sleep(99999);
    }

    await dashboard_init();
    
    await auth_osu();
    await dashboard.change_status({name: 'osu_auth', status: 'on'});

	jsons.load_beatmaplist();

    /*if (!existsSync(osu_db_path)){
        await dashboard.change_status({name: 'db_scan', status: 'scaning'});
        console.log('scan ended');
    }*/

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

    await end_process();

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

    await dashboard.change_status({name: 'download_status', status});
    await dashboard.change_status({name: 'download_mode', status: str_modes[mode]});

    const strict = args.strict || false;
    const query = args?.query ? strict  ? '"'+args.query+'"' : args.query : null;

    log('[settings]','\n',
    'query',query,'\n',
    'mode:',str_modes[mode],'\n',
    'status',status,'\n',
    'favorite minimum count:', FAV_COUNT_MIN,'\n',
    'stars from',stars_min,'to',stars_max,'\n',
    'maps depth',maps_depth,'\n',)
    
    let total = null;
    let max_maps = 1;
	let is_continue = true;

	const section = status !== 'ranked' ? status: null;

    checkmap: while (is_continue){
        //log(`requesting for cursor: ${cursor_string}`);

        const bancho_res = await v2.beatmaps.search({
            query,
            mode: str_modes[mode],
            section,
            cursor_string,
        }).catch( (rej) => {
            throw new Error (rej);
        });

		if ( !bancho_res ) {
			console.log( 'no response from bancho' );
			break; 
		}

		if (bancho_res === null) {
			console.log('no founded beatmaps, ended.');
			break;
		}
		
		if ( bancho_res?.cursor && bancho_res.cursor?.approved_date ) {
			approved_date = bancho_res.cursor.approved_date;
			log('requesting beatmaps by date', new Date(approved_date).toLocaleString() ?? 'now' );
		}

		const founded_maps = bancho_res?.beatmapsets;
        let old_cursor = cursor_string;

		if (!total){
			total = bancho_res?.total;
			max_maps = bancho_res?.total;
            await dashboard.change_text_item({name: 'total_maps', item_name: 'current', text: `${total}`});
		}

		// last beatmapsets
		if ( !bancho_res?.cursor || bancho_res?.cursor?.approved_date === null ){
			is_continue = false;
		} else {
			if ( founded_maps && founded_maps.length > 0 ) {
				cursor_string = bancho_res?.cursor_string;
			}
		}

        await dashboard.change_text_item({name: 'cursor_string', item_name: 'last', text: `${cursor_string}`});
        save_last_cursor(cursor_string);

        let checked_beatmaps = 0;
        let founded_beatmaps = 0;

        for (let idx = 0; idx < founded_maps.length; idx++){

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

            if( beatmaps_selected.length > 0 && fav_count > FAV_COUNT_MIN && !jsons.find(beatmapset_id) ){

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
                    
                    cursor_string = old_cursor;

                    continue checkmap;
                }
                
                let beatmap_size = Number(filesize_response.size);

                await dashboard.css_apply({
                    selector: 'body', 
                    prop: 'background-image', 
                    value: `url(https://assets.ppy.sh/beatmaps/${beatmapset_id}/covers/raw.jpg)`
                });

                await dashboard.emit_event({
                    feedname: 'last_beatmaps',
                    type: 'beatmap',
                    title: `${title}`,
                    desc: `${artist}`,
                    url: {
                        href: `https://osu.ppy.sh/beatmapsets/${beatmapset_id}`,
                    },
                    icon: `https://assets.ppy.sh/beatmaps/${beatmapset_id}/covers/card.jpg`
                });

                let is_download_failed = await beatmap_download(beatmapset_id ,osz_full_path, beatmap_size);                

                if (is_download_failed) {
                    //failed download map
                    idx--;
                    await check_response(is_download_failed, osz_name);
                } else if (!is_download_failed && status !== 'qualified') {
                    //successful download map not qualified map
                    jsons.add_new(beatmapset_id);
                } else {
                    //successful download qualified map
                    //no action
                }

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
