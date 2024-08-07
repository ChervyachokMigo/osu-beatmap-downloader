const axios = require('axios').default;
const { auth_osu, get_osu_token } = require('./osu_auth');
const { log } = require('../tools/tools');

/**
 * @param {Object} args arguments
 * @param {string} args.query any query or null
 * @param {string} args.status graveyard | wip | pending | ranked  | qualified | loved
 * @param {string} args.gamemode
 * @param {string} args.nsfw
 * @param {string} args.cursor_string
 * @param {string} args.api_v2_token
 */

const _this = module.exports = async ( args ) => {

	//console.log('beatmaps_search', args)

	const authing = async (_args) => {
		await auth_osu();
		return await _this({ ..._args, api_v2_token: get_osu_token() });
	}

	if (!args.api_v2_token) {
		return await authing(args);
	}

	return await new Promise( async (resolve, reject) => {
		
		const headers = {};
		headers['Referer'] = 'https://osu.ppy.sh/';
		headers['Authorization'] = `Bearer ${args.api_v2_token}`;
		headers['accept'] = `application/json`;
		headers['content-Type'] = `application/json`;

		const params = { 
			q: args.query || null,
			s: args.status || 'any',
			m: args.gamemode || null,
			nsfw: args.nsfw || null,
			cursor_string: args.cursor_string || null
		}

		const url = 'https://osu.ppy.sh/api/v2/beatmapsets/search';

		try{
			const res = await axios.get( url, { headers, params });

			//console.log(res.status === 200 ? res.data : res );
			
			//console.log(res.request.res.responseUrl)

			if (res.status === 200) {
				resolve(res.data);

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
						log('sleep 5 min');
						setTimeout( res, 5 * 60000 );
					});
					resolve(await authing(args));
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
				resolve(await authing(args));
			}

			if (e.code === 'ENOTFOUND') {
				console.log('');
				log('Address not found, retry');
				await new Promise( res => {
					console.log('sleep 5 sec');
					setTimeout( res, 5000 );
				});
				resolve(await authing(args));
			}

			console.log('');
			console.log( 'search error', e );

			reject({ error: e.code });
		}
	});
}
