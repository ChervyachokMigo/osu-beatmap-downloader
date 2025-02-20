const beatmap_download_2 = require("../responses/beatmap_download_2.js");
const { get_osu_token, auth_osu } = require("../responses/osu_auth.js");

//const get_beatmap_size = require('../responses/get_beatmap_size.js');
const download_quota = require("../responses/download_quota.js");

	//const id = '2116404';
	//968222
	//const id = '2182821';

beatmap_download_2({ beatmapset_id: 2116404, api_v2_token: null, output_filename: 'test.osz' })

/*(async () => {
	await auth_osu();

	for (let i = 0; i < 1000; i ++) {
		console.log( get_beatmap_size( get_osu_token(), 2116404));
		const res = get_beatmap_size( get_osu_token(), 2116404);
		if (res.size) {
			console.log(res);

		} else if (res.error) {
			console.log(res.error);
			beatmap_download_2({ beatmapset_id: 234242342, api_v2_token: null, output_filename: 'test.osz' })
		}
		
	}
})();*/