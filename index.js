
const minimist = require('minimist');

const defaults = require('./misc/const_defaults.js');
const jsons = require(`./tools/jsons.js`);
const { escapeString, log, checkDir, sleep, formatPercent } = require(`./tools/tools.js`);
const config = require('./config.js');

const download_path = require('./tools/download_path.js');

const { existsSync } = require('fs');
const path = require('path');
const move_beatmaps = require('./tools/move_beatmaps.js');

const dashboard = require('dashboard_framework');
const { load_last_cursor, is_continue_from_cursor } = require('./tools/cursor.js');
const { get_osu_token, auth_osu } = require('./responses/osu_auth.js');
const { dashboard_init } = require('./tools/dashboard_init.js');
const dashboard_end = require('./tools/dashboard_end.js');

const check_gamemode = require('./tools/check_gamemode.js');
const check_beatmap_status = require('./tools/check_beatmap_status.js');
const { yellow, green } = require('colors');
const beatmap_download_2 = require('./responses/beatmap_download_2.js');
const search_beatmaps_loop = require('./tools/search_beatmaps_loop.js');

checkDir(download_path);
checkDir(path.join(__dirname, 'data'));

const download_beatmaps = async (mode) => {
    
    const args = minimist(process.argv.slice(2));

    const FAV_COUNT_MIN = args.fav_count_min || config.fav_count_min || defaults.fav_count_min;
    const stars_min = args.stars_min || config.stars_min || defaults.stars_min;
    const stars_max = args.stars_max || config.stars_max || defaults.stars_max;
    const maps_depth = args.maps_depth || config.maps_depth || defaults.maps_depth;
    const min_objects = args.min_objects || config.min_objects || defaults.min_objects;
    const min_length = args.min_length || config.min_length || defaults.min_length;

    await dashboard.change_text_item({name: 'fav_count_min', item_name: 'current', text: `${FAV_COUNT_MIN}`});
    await dashboard.change_text_item({name: 'stars', item_name: 'current', text: `★${stars_min}-${stars_max}`});
    await dashboard.change_text_item({name: 'maps_depth', item_name: 'current', text: `${maps_depth} страниц (${maps_depth * 50} карт)`});
    await dashboard.change_text_item({name: 'min_objects', item_name: 'current', text: `${min_objects}`});
    await dashboard.change_text_item({name: 'min_length', item_name: 'current', text: `${min_length} сек`});

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

	await search_beatmaps_loop({
		gamemode: gamemode.value,
		status: beatmap_status,
		nsfw: 'true',
		cursor_string: cursor_string,
		maps_depth: maps_depth
		}, async (beatmapsets, page, total, error) => {

			await dashboard.change_text_item({ 
				name: 'total_maps', 
				item_name: 'current', 
				text: `${page*50}/${total} (${formatPercent(page*50, total, 2)}%)` });

			for (let idx = 0; idx < beatmapsets.length; idx++){
				if (beatmapsets[idx]?.availability && beatmapsets[idx]?.availability?.download_disabled === false ) {
					const beatmaps_selected = beatmapsets[idx].beatmaps.filter( val => { 
						return (gamemode.name === 'all' || val.mode === gamemode.name) && 
							val.difficulty_rating >= stars_min && 
							val.difficulty_rating <= stars_max && 
							val.hit_length >= min_length && 
							(val.count_circles + val.count_sliders + val.count_spinners) >= min_objects
					});
					
					if ( !beatmaps_selected || beatmaps_selected.length == 0 ){
						continue;
					}

					const beatmapset_id = beatmapsets[idx].id;
					const fav_count = beatmapsets[idx].favourite_count;
					const artist = beatmapsets[idx].artist;
					const title = beatmapsets[idx].title;

					if( fav_count >= FAV_COUNT_MIN && !jsons.find(beatmapset_id) ){

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
					}

				} else {
					console.error('beatmapsets.availability', beatmapsets[idx].availability)
				}
			}
		}
	)
}

const main = async () => {
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
        await download_beatmaps('all');
    }

    if (config.is_move_beatmaps) {
        move_beatmaps();
    }

    await dashboard_end();

}

main();
