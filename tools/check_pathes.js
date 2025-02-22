const { existsSync } = require("fs");
const path = require("path");

const { sleep, log, checkDir } = require("./tools");
const config = require("../config");

const { download_path } = require('../tools/download_path.js');

const exit_process = async () => {
	await sleep(60);
	process.exit();
}

const check_variable = async (config_name, variable) => {
	if (typeof variable === 'undefined' || variable === null) {
        log(`[Error config: ${config_name}] значение "${config_name}" не указано`);
        await exit_process();
    }
}

const check_path = async (config_name, dest) => {
	if (!existsSync(dest)){
		log(`[Error config: ${config_name}] путь ${dest} не существует`);
		await exit_process();
	}
}

const data_path = path.join(__dirname, '..', 'data');

module.exports = async () => {
	
	checkDir(data_path);
	checkDir(download_path);

	await check_variable('is_use_laser', config?.is_use_laser);

	if (config?.is_use_laser) {
		log('Проверка путей osu laser');
		
		await check_variable('laser_files', config?.laser_files);

		const osu_laser = path.join( config?.laser_files, 'client.realm' );
		const osu_laser_exe_path = path.join(process.env.LOCALAPPDATA, 'osulazer', 'current', 'osu!.exe');

		await check_path('osu_laser_exe', osu_laser_exe_path);
		await check_path('laser_files', osu_laser);

	} else {
		log('Проверка путей osu stable');

		await check_variable('osuFolder', config?.osuFolder);

		const osu_stable = path.normalize(config?.osuFolder);
		const osu_stable_songs = path.join(osu_stable, 'Songs');
		const osu_stable_db = path.join( osu_stable, 'osu!.db' );

		await check_path('osuFolder', osu_stable);
		await check_path('osuFolder/Songs', osu_stable_songs);
		await check_path('osuFolder/osu!.db', osu_stable_db);
		
	}

	log('Проверка путей завершена');

}