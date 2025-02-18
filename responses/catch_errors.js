const config = require("../config");
const { requests_limit_duration } = require("../misc/const_defaults");
const { get_args } = require("../tools/process_args");
const { log, sleep, check_undefined } = require("../tools/tools");


const catch_errors = async (e) => {
	const { requests_limit_duration } = get_args();
	console.log('');

	if (e.code === 'ERR_BAD_REQUEST') {
		log('Bad request');
		//Too Many Requests
		//UNAUTHORIZED
		if ( e.response.status === 429 || e.response.status === 401 ) {
			console.error(' RESPONSE >', e?.response?.status, e?.response?.statusText);
			return await sleep( requests_limit_duration * 60 );
		} else {
			console.error(JSON.parse( e?.response?.data || {})?.error?.toString('utf8'));
			console.log(e?.response);
			return await sleep(5);
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