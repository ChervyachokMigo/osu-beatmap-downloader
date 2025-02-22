const { dashboard_waiting_quota_start, dashboard_waiting_quota_end } = require("../tools/dashboard_quota");
const { get_args } = require("../tools/process_args");
const { log, sleep } = require("../tools/tools");
const { login_osu } = require("./osu_auth");

const catch_errors = async (e) => {
	const { requests_limit_duration } = get_args();
	console.log('');

	if (e.code === 'ERR_BAD_REQUEST') {
		log('Bad request');
		//Too Many Requests
		if ( e.response.status === 429 ) {
			console.error(' RESPONSE >', e?.response?.status, e?.response?.statusText);
			await dashboard_waiting_quota_start(requests_limit_duration * 60);			
            await sleep(requests_limit_duration * 60);
            await dashboard_waiting_quota_end();
			return true;
		//UNAUTHORIZED
		} else if ( e.response.status === 401 ){
			console.error(' RESPONSE >', e?.response?.status, e?.response?.statusText);
			await login_osu();
			return await sleep( 5 );
		} else {
			console.error(JSON.parse( e?.response?.data || {})?.error?.toString('utf8'));
			console.log(e?.response);
			return await sleep( 5 );
		}
	}

	if (e.code === 'ECONNRESET') {
		log('No interntet connection, data loss, retry');
		return await sleep(5);
	}

	if (e.code === 'ENOTFOUND') {
		log('Address not found, retry');
		return await sleep(5);
	}

}

exports.catch_errors = catch_errors;