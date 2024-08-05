
const minimist = require('minimist');
const { v2 } = require ('osu-api-extended');

const defaults = require('./misc/const_defaults.js');
const jsons = require(`./tools/jsons.js`);
const { escapeString, log, checkDir, sleep, formatPercent } = require(`./tools/tools.js`);
const config = require('./config.js');

const download_path = require('./tools/download_path.js');

const { existsSync } = require('fs');
const path = require('path');
const move_beatmaps = require('./tools/move_beatmaps.js');

const dashboard = require('dashboard_framework');
const { save_last_cursor, load_last_cursor, is_continue_from_cursor } = require('./tools/cursor.js');
const { get_osu_token, auth_osu } = require('./responses/osu_auth.js');
const { dashboard_init } = require('./tools/dashboard_init.js');
const dashboard_end = require('./tools/dashboard_end.js');

const check_gamemode = require('./tools/check_gamemode.js');
const check_beatmap_status = require('./tools/check_beatmap_status.js');
const { yellow, green } = require('colors');
const beatmap_download_2 = require('./responses/beatmap_download_2.js');

checkDir(download_path);
checkDir(path.join(__dirname, 'data'));

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

	await dashboard.change_status({name: 'db_scan', status: 'checking'});
	jsons.load_beatmaplist();
    await dashboard.change_status({name: 'db_scan', status: 'ready'});

    const args = minimist(process.argv.slice(2));
    
    if (args.mode){
        const modes = args.mode.split(',');
        if ( modes.length > 1 ){
            for (let mode of modes) {
                await download_beatmaps(mode);
            };
        } else {
            await download_beatmaps(args.mode);
        }
    } else {
        await download_beatmaps();
    }

    if (config.is_move_beatmaps) {
        move_beatmaps();
    }

    await dashboard_end();

    //process.exit(0);
}

async function download_beatmaps(mode){
    
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

    const gamemode = check_gamemode(mode);

    const beatmap_status = check_beatmap_status(args.status);

    await dashboard.change_status({ name: 'download_status', status: beatmap_status });
    await dashboard.change_status({ name: 'download_mode', status: gamemode.name });

    const strict = args.strict || false;
    const query = args?.query ? strict  ? '"'+ args.query +'"' : args.query : null;

    log(['', '',
		`start mode ${green(gamemode.name)}`,
		`query: ${query ? green(query) : query }`,
		`status: ${green(beatmap_status)}`,
		`favorite minimum count: ${yellow(FAV_COUNT_MIN)}`,
		`stars: ${yellow(stars_min)}-${yellow(stars_max)}`,
		`maps depth: ${yellow(maps_depth)} (${ yellow( (maps_depth * 50).toString() )})` ]
		.join('\n') + '\n'
	);
    
    let total = null;
    let max_maps = 1;
	let is_continue = true;

	const section = beatmap_status !== 'ranked' ? beatmap_status: null;

    checkmap: while (is_continue){

        const bancho_res = await v2.beatmaps.search({
            query,
            mode: gamemode.name,
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
			log('requesting beatmaps by date', yellow(new Date(approved_date).toLocaleString()) ?? yellow('now') );
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
		let server_id = 0;

        for (let idx = 0; idx < founded_maps.length; idx++){

            checked_beatmaps++;

            const beatmaps_selected = founded_maps[idx].beatmaps.filter( val => { 
                return val.mode_int === gamemode.int && 
                    val.difficulty_rating >= stars_min && 
                    val.difficulty_rating <= stars_max && 
                    val.total_length > min_length && 
                    val.count_circles > min_circles
            });
            
            if ( !beatmaps_selected || beatmaps_selected.length == 0 ){
                founded_beatmaps++;
                continue;
            }

            let beatmapset_id = founded_maps[idx].id;
            let fav_count = founded_maps[idx].favourite_count;
            let artist = founded_maps[idx].artist;
            let title = founded_maps[idx].title;

            if( beatmaps_selected.length > 0 && fav_count > FAV_COUNT_MIN && !jsons.find(beatmapset_id) ){

                found_maps_counter = 0;

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

				const success = await beatmap_download_2({
					beatmapset_id, 
					output_filename: `${beatmapset_id} ${escapeString(artist)} - ${escapeString(title)}.osz`,
					api_v2_token: get_osu_token()
				});

				if (success && beatmap_status !== 'qualified') {
					jsons.add_new(beatmapset_id);
					console.log('download complete');
				}

            } else {
                founded_beatmaps++;
            }
        }

        if (checked_beatmaps === founded_maps.length || founded_maps.length === 50 ) {
            found_maps_counter++;
        }

        log ('you have', yellow(founded_beatmaps.toString()), 'of', yellow(checked_beatmaps.toString()), 'beatmaps');

        total -= founded_maps.length;
        log(yellow(total.toString()), 'beatmaps left');

        await dashboard.change_text_item({name: 'total_maps', item_name: 'current', text: `${total}/${max_maps} (${formatPercent(total, max_maps, 2)}%)`});

        if ( found_maps_counter > maps_depth || total <= 0 || cursor_string === null || cursor_string === undefined) {
            log('ended', green(gamemode.name));
            break
        }

        if (cursor_string === old_cursor && cursor_string !== null) {
            log(`last cursor. ended.`)
            break;
        }
    }
}

main();
