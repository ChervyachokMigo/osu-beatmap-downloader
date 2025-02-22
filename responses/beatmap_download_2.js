const axios = require('axios').default;
const path = require('node:path');
const fs = require('node:fs');
const { download_path, download_folder } = require('../tools/download_path');
const { get_osu_token, check_token } = require('./osu_auth');
const { log, get_time_string, print_empty_string, empty_string } = require('../tools/tools');
const { yellow, green } = require('colors');
const config = require('../config');
const move_beatmaps = require('../tools/move_beatmaps');
const dashboard = require('dashboard_framework');

const { catch_errors } = require('./catch_errors');

const _this = module.exports = async ({ beatmapset_id, output_filename, is_no_video = true }) => {	
	const args = { beatmapset_id, output_filename, is_no_video };

	await check_token();

	return await new Promise( async (resolve, reject) => {
		const url = `https://osu.ppy.sh/api/v2/beatmapsets/${beatmapset_id}/download${is_no_video ? '?noVideo=1' : ''}`;
		const headers = {};
		headers['Referer'] = 'https://osu.ppy.sh/';
		headers['Authorization'] = `Bearer ${get_osu_token()}`;
		headers['accept'] = `application/octet-stream`;
		headers['content-Type'] = `application/octet-stream`;
		try{
			log(`downloading ${yellow(beatmapset_id.toString())} to ${green( path.join(download_folder, output_filename) )}`);

			await dashboard.change_status({ name: 'download_estimate', status: 'current'});

			const res = await axios.get( url, {
				headers, 
				responseType: 'arraybuffer', 
				onDownloadProgress: async( e ) => {
					const estimated = (e.estimated || 0).toFixed(1);
					await dashboard.change_progress_value({ name: 'progress_download', prop: 'value', value: e.progress });
					dashboard.change_text_item({ 
						name: 'download_estimate', 
						item_name: 'current',
						text: e.estimated ? `${estimated} сек`: 'нет' 
					});
					process.stdout.write( `[${yellow(get_time_string(new Date()))}] Downloading progress ${(e.progress*100).toFixed(1)} % complete, estimated ${estimated}sec\r`);
				}
			});

			await dashboard.change_status({ name: 'download_estimate', status: 'none'});
			
			fs.writeFileSync( path.join(download_path, output_filename), res.data);

			if (res.status === 200) {
				resolve(true);
			} else {
				console.error( new Error(res.status) );
				console.error( res.status, res.statusText, typeof res.data, res.data.length );
			}
		} catch (e) {
			if (config.is_move_beatmaps) {
				move_beatmaps();
			}

			await catch_errors(e);

			resolve(await _this(args));

			// console.log('');
			// console.log( 'download error', e );

			// reject({ error: e.code });
		}
	});
}
