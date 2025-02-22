
const defaults = require('./misc/const_defaults.js');
const jsons = require(`./tools/jsons.js`);
const { escapeString, log, checkDir, sleep, formatPercent, to_boolean, check_undefined } = require(`./tools/tools.js`);
const config = require('./config.js');

const move_beatmaps = require('./tools/move_beatmaps.js');

const dashboard = require('dashboard_framework');
const { load_last_cursor, is_continue_from_cursor } = require('./tools/cursor.js');
const { auth_osu } = require('./responses/osu_auth.js');
const { dashboard_init } = require('./tools/dashboard_init.js');
const dashboard_end = require('./tools/dashboard_end.js');

const check_gamemode = require('./tools/check_gamemode.js');

const { yellow, green } = require('colors');
const beatmap_download_2 = require('./responses/beatmap_download_2.js');
const search_beatmaps_loop = require('./tools/search_beatmaps_loop.js');
const { set_args, get_args } = require('./tools/process_args.js');
const get_current_gamemode_by_args = require('./tools/get_current_gamemode_by_args.js');
const check_pathes = require('./tools/check_pathes.js');

let is_first = true;

const download_beatmaps = async () => {

	const {FAV_COUNT_MIN, stars_min, stars_max, maps_depth, min_objects, min_length, no_video, 
		cursor, is_continue, beatmap_status, query, mode} = get_args();

	const current_gamemode = get_current_gamemode_by_args(mode);

	const gamemode = check_gamemode(current_gamemode);

    await dashboard.change_text_item({name: 'fav_count_min', item_name: 'current', text: `${FAV_COUNT_MIN}`});
    await dashboard.change_text_item({name: 'stars', item_name: 'current', text: `★${stars_min}-${stars_max}`});
    await dashboard.change_text_item({name: 'maps_depth', item_name: 'current', text: `${maps_depth} страниц (${maps_depth * 50} карт)`});
    await dashboard.change_text_item({name: 'min_objects', item_name: 'current', text: `${min_objects}`});
    await dashboard.change_text_item({name: 'min_length', item_name: 'current', text: `${min_length} сек`});
	await dashboard.change_text_item({name: 'no_video', item_name: 'current', text: `${no_video? 'без видео' : 'с видео'}`});

    is_continue_from_cursor(is_continue || defaults.is_continue);

    let cursor_string = cursor || load_last_cursor();

    await dashboard.change_text_item({name: 'cursor_string', item_name: 'last', text: `${cursor_string ? cursor_string: 'первая страница'}`});

    await dashboard.change_status({ name: 'download_status', status: beatmap_status });
    await dashboard.change_status({ name: 'download_mode', status: gamemode.name });

	log(['', '',
			`start mode ${green(gamemode.name)}`,
			`query: ${query ? green(query) : query }`,
			`status: ${green(beatmap_status)}`,
			`favorite minimum count: ${yellow(FAV_COUNT_MIN)}`,
			`stars: ${yellow(stars_min)}-${yellow(stars_max)}`,
			`maps depth: ${yellow(maps_depth)} (${ yellow( (maps_depth * 50).toString() )})` ,
			`min objects: ${yellow(min_objects)}`,
			`min length: ${yellow(min_length)} сек`,
			`no video: ${no_video}`
		].join('\n') + '\n'
	);

	await search_beatmaps_loop({
		gamemode: gamemode.value,
		status: beatmap_status,
		nsfw: 'true',
		cursor_string: cursor_string,
		maps_depth: is_first ? maps_depth : 1,
		}, async (beatmapsets, page, total, error) => {

			for (let idx = 0; idx < beatmapsets.length; idx++){
				let estimate_maps = total - ((page - 1) * 50) - idx;

				await dashboard.change_text_item({ 
					name: 'total_maps', 
					item_name: 'current', 
					text: `${estimate_maps}/${total} (${formatPercent(estimate_maps, total, 2)}%)` });

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
					const status = beatmapsets[idx].status;

					let current_idx_with_page = (page - 1) * 50 + idx;

					if( fav_count >= FAV_COUNT_MIN && !jsons.find(beatmapset_id) ){
						console.log('[', `${current_idx_with_page}/${total}`,']', '[', 'X'.red, ']', beatmapset_id, artist, title);

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
							is_no_video: no_video
						});

						if (success && status !== 'qualified') {
							console.log('');
							jsons.add_new(beatmapset_id);
						}
					} else {
						console.log('[', `${current_idx_with_page}/${total}`,']', '[', 'V'.green, ']', beatmapset_id, artist, title);
					}

				} else {
					console.error('beatmapsets.availability', beatmapsets[idx].availability)
				}
			}
		}
	)

	await dashboard.change_status({name: 'total_maps', status: 'waiting'});

	if (config?.is_move_beatmaps) {
        move_beatmaps();
    }

	is_first = false;

    //waiting 3 minutes for restart
	await sleep(180);
	await download_beatmaps();
}

const main = async () => {

	set_args(process.argv.slice(2));

	await check_pathes();

    await dashboard_init();
    
    await auth_osu();
    await dashboard.change_status({name: 'osu_auth', status: 'on'});
	await dashboard.change_status({name: 'db_scan', status: 'checking'});

	jsons.load_beatmaplist();
    await dashboard.change_status({name: 'db_scan', status: 'ready'});
	
    await download_beatmaps();

    await dashboard_end();

	await sleep(180);

	process.exit(0);
}

main();