const { auth } = require ('osu-api-extended');

const path = require('node:path');
const { readFileSync, existsSync, writeFileSync } = require('node:fs');
const { log } = require('../tools/tools.js');
const { get_config } = require('../tools/config_web_editor/config_cache.js');
const { osu_token_path } = require('../misc/pathes.js');
const start_config_editor = require('../tools/config_web_editor/start_config_editor.js');


let access_token = null;
let expires_in = null;

const login_osu = async () => {
	log('logining osu...');
	const { login, password } = get_config();

    access_token = await auth.login_lazer(login, password);
    if (typeof access_token.access_token === 'undefined'){
        log('no auth osu.');
		await start_config_editor();
    } else {
        expires_in = new Date().getTime() + access_token.expires_in * 1000;
        writeFileSync(osu_token_path, JSON.stringify({ access_token, time: expires_in }), { encoding: 'utf8'});
    }
}

const auth_osu = async () => {
    const current_time = new Date().getTime();

	if ( (!access_token || !expires_in) || (current_time < expires_in) ){
		if ( existsSync(osu_token_path) ) {
			const last_token = JSON.parse(readFileSync(osu_token_path, {encoding: 'utf8'}));
			expires_in = last_token.time;
			access_token = last_token.access_token;
			if (current_time < expires_in) {
				auth.set_v2(access_token.access_token);
				return;
			}
		}
	}

    await login_osu();

}

module.exports = {
    auth_osu, 
	login_osu,

    get_osu_token: () => {
        return access_token?.access_token;
    },

	check_token: async (force = false) => {
		if (force) {
            await login_osu();
        }

		if (new Date().getTime() > expires_in) {
			await auth_osu();
		}

		// else token actual
		
	}
}