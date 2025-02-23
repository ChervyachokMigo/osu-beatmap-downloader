
const { log, checkDir } = require('../tools');
const { existsSync, copyFileSync } = require('fs');
const check_pathes = require('../check_pathes');
const { auth_osu } = require('../../responses/osu_auth');
const { config_path, config_sample_path, data_path, download_path } = require('../../misc/pathes');
const { load_config_cache, get_config } = require('./config_cache');
const check_open_port = require('../check_open_port');

const check_open_config_ports = async () => {
	const {WEBPORT, SOCKETPORT} = get_config();
	
	if (!await check_open_port(WEBPORT)){
		console.error('[Error config: WEBPORT] Невозможно открыть порт', WEBPORT);
		process.exit();
	}
	if (!await check_open_port(SOCKETPORT)){
		console.error('[Error config: SOCKETPORT] Невозможно открыть порт', SOCKETPORT);
		process.exit();
	}
}

module.exports = async () => {
	checkDir(data_path);
	checkDir(download_path);

	if (!existsSync(config_path)){
		log(`[Error config: data/config.json] путь ${config_path} не существует`);
		copyFileSync(config_sample_path, config_path);
	}
	
	load_config_cache();

	await check_pathes();

	await auth_osu();
	await check_open_config_ports();
		
	return true;
}