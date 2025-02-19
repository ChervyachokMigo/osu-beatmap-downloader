const { auth } = require ('osu-api-extended');
const { login, password } = require('../config.js');
const path = require('node:path');
const { readFileSync, existsSync, writeFileSync } = require('node:fs');
const { log } = require('../tools/tools.js');

const osu_token_path = path.join('data', 'osu_token.json');

let access_token = null;
let expires_in = null;

const login_osu = async () => {
	console.log(' > login osu');
    access_token = await auth.login_lazer(login, password);

    if (!access_token?.access_token){
        log('no auth osu. trying again...');
        await login_osu();
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
    auth_osu, login_osu,

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