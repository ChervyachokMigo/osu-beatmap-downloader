const axios = require('axios').default;
const { auth_osu, get_osu_token, check_token } = require('./osu_auth');
const { log } = require('../tools/tools');
const { catch_errors } = require('./catch_errors');

/**
 * @param {Object} args arguments
 * @param {string} args.query any query or null
 * @param {string} args.status graveyard | wip | pending | ranked  | qualified | loved
 * @param {string} args.gamemode
 * @param {string} args.nsfw
 * @param {string} args.cursor_string
 */

const _this = module.exports = async ( args ) => {

	await check_token();

	return await new Promise( async (resolve, reject) => {
		
		const headers = {};
		headers['Referer'] = 'https://osu.ppy.sh/';
		headers['Authorization'] = `Bearer ${get_osu_token()}`;
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
			await catch_errors(e);

			resolve(await _this(args));
		}
	});
}
