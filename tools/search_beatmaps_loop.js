const beatmaps_search = require("../responses/beatmaps_search");
const { log } = require("../tools/tools");
const { yellow } = require("colors");
const { save_last_cursor } = require("./cursor");
const dashboard = require('dashboard_framework');

/**
 * @param {Object} args arguments
 * @param {string} args.query any query or null
 * @param {string} args.status graveyard | wip | pending | ranked  | qualified | loved
 * @param {string} args.gamemode
 * @param {string} args.nsfw
 * @param {string} args.cursor_string
 * @param {number} args.maps_depth
 * @param {function( Object, number, number, string )} callback ( beatmapsets, page, total, error )
 */
module.exports = async ( args, callback ) => {

	var old_cursor = null;
	var cursor_string = args.cursor_string || null;
	var page_counter = 0;
	var total = 0;

	while (true) {
		
		page_counter++;

		const res = await beatmaps_search({
			...args,
			cursor_string
		})

		if ( !res ) {
			console.log( 'no response from bancho' );
			break; 
		}

		if ( res === null ) {
			console.log('no founded beatmaps, ended.');
			break;
		}
		
		if ( res?.cursor && (res.cursor?.approved_date || res.cursor?.last_update) ) {
			const date = res.cursor?.approved_date || res.cursor.last_update;
			log('requesting beatmaps by date', yellow(new Date(date).toLocaleString()) ?? yellow('now') );
		}

		if (cursor_string === null && total === 0) {
			const beatmaps_count_max = args.maps_depth * 50;
			total = beatmaps_count_max < res.total ? beatmaps_count_max : res.total;
		}

		await callback(res.beatmapsets, page_counter, total, res.error);

		old_cursor = cursor_string;
		cursor_string = res.cursor_string;

		await dashboard.change_text_item({name: 'cursor_string', item_name: 'last', text: `${res.cursor_string}`});
		save_last_cursor(res.cursor_string);

		//console.log(res);
		//console.log( 'total', res.total );
		//console.log( 'cursor', res.cursor );
		//console.log( 'cursor_string', res.cursor_string );

		if (res.cursor_string === null) {
			console.log('Last page');
			break;
		}

		if (cursor_string === old_cursor && cursor_string !== null) {
			//console.log('old_cursor', old_cursor);
			//console.log('cursor_string', cursor_string);
            log(`last cursor. ended.`)
            break;
        }

		if (page_counter >= args.maps_depth) {
			console.log('maps_depth reached');
            break;
		}

		//break;
	}

}