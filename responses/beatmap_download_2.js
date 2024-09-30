const axios = require('axios').default;
const path = require('node:path');
const fs = require('node:fs');
const download_path = require('../tools/download_path');
const { auth_osu, get_osu_token } = require('./osu_auth');
const { log, get_time_string } = require('../tools/tools');
const { yellow, green } = require('colors');
const config = require('../config');
const move_beatmaps = require('../tools/move_beatmaps');
const dashboard = require('dashboard_framework');

const _this = module.exports = async ({ beatmapset_id, output_filename, api_v2_token, is_no_video = true, requests_limit_duration = 5 }) => {	
	if (!api_v2_token) {
		await auth_osu();
		return await _this({ beatmapset_id, output_filename, api_v2_token: get_osu_token() });
	}

	return await new Promise( async (resolve, reject) => {
		const url = `https://osu.ppy.sh/api/v2/beatmapsets/${beatmapset_id}/download${is_no_video ? '?noVideo=1' : ''}`;
		const headers = {};
		headers['Referer'] = 'https://osu.ppy.sh/';
		headers['Authorization'] = `Bearer ${api_v2_token}`;
		headers['accept'] = `application/octet-stream`;
		headers['content-Type'] = `application/octet-stream`;
		try{
			log(`downloading ${yellow(beatmapset_id.toString())} to ${green( path.join(config.download_folder, output_filename) )}`);
            
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
					
					process.stdout.write( `[${yellow(get_time_string(new Date()))}] Downloading progress ${(e.progress*100).toFixed(1)} % complete, estimated ${estimated}sec\r`)
				}});
				
			
			fs.writeFileSync( path.join(download_path, output_filename), res.data);

			if (res.status === 200) {
				resolve(true);
			} else {
				console.error( new Error(res.status) );
				console.error( res.status, res.statusText, typeof res.data, res.data.length );
			}
		} catch (e) {
			if (e.code === 'ERR_BAD_REQUEST') {
				console.log('');
				log('Bad request');

				if (e.response.status === 429) {
					//Too Many Requests
					console.error(e.response.statusText);
					await new Promise( res => {
						if (config.is_move_beatmaps) {
							move_beatmaps();
						}
						log(`sleep ${requests_limit_duration} min`);
						setTimeout( res, requests_limit_duration * 60000 );
					});
					return await _this({ beatmapset_id, output_filename, api_v2_token });
				} else {
					console.error(JSON.parse(e.response.data).error.toString('utf8'));
					console.log(e.response)
				}

				await new Promise( res => {
					log('sleep 5 sec');
					setTimeout( res, 5000 );
				});

				resolve(false);
				return false
			}

			if (e.code === 'ECONNRESET') {
				console.log('');
				log('No interntet connection, data loss, retry');
				await new Promise( res => {
					console.log('sleep 5 sec');
					setTimeout( res, 5000 );
				});
				return await _this({ beatmapset_id, output_filename, api_v2_token });
			}

			if (e.code === 'ENOTFOUND') {
				console.log('');
				log('Address not found, retry');
				await new Promise( res => {
					console.log('sleep 5 sec');
					setTimeout( res, 5000 );
				});
				return await _this({ beatmapset_id, output_filename, api_v2_token });
			}

			console.log('');
			console.log( 'download error', e );

			reject({ error: e.code });
		}
	});
}
