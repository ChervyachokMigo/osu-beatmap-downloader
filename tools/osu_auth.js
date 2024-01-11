const { auth } = require ('osu-api-extended');
const { login, password } = require('../config.js');

let access_token = undefined;

const auth_osu = async () => {
    access_token = await auth.login_lazer(login, password);
    if (typeof access_token?.access_token == 'undefined'){
        log('no auth osu. trying again...');
        await auth_osu();
    }
}

module.exports = {
    auth_osu,

    get_osu_token: () => {
        return access_token?.access_token;
    }
}