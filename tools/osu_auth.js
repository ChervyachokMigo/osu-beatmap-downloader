const { auth } = require ('osu-api-extended');
const { login, password } = require('../config.js');
const { writeFileSync } = require('original-fs');
const path = require('path');
const { readFileSync, existsSync } = require('fs');

const osu_token_path = path.join('data', 'osu_token.json');

let access_token = null;
let expires_in = null;

const login_osu = async () => {
    access_token = await auth.login_lazer(login, password);

    if (typeof access_token?.access_token == 'undefined'){
        log('no auth osu. trying again...');
        await login_osu();
    } else {
        expires_in = new Date().getTime() + access_token.expires_in;
        writeFileSync(osu_token_path, JSON.stringify({access_token, time: expires_in}), { encoding: 'utf8'});
    }
}

const auth_osu = async () => {
    const current_time = new Date().getTime();

    if (existsSync(osu_token_path)){
        let data = JSON.parse(readFileSync(osu_token_path, {encoding: 'utf8'}));
        expires_in = data.time;
        access_token = data.access_token;
        if (access_token && expires_in && current_time < expires_in) {
            auth.set_v2(access_token.access_token);
        }
    }

    if (access_token && expires_in && current_time > expires_in) {
        await login_osu();
    }

    if (!access_token || !expires_in){
        await login_osu();
    }

}


module.exports = {
    auth_osu,

    get_osu_token: () => {
        return access_token?.access_token;
    }
}