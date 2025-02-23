const { existsSync } = require("node:fs");
const path = require("node:path");

const { log } = require("./tools");

const start_config_editor = require("./config_web_editor/start_config_editor.js");
const { osu_laser_exe_path } = require("../misc/pathes.js");
const { get_config } = require("./config_web_editor/config_cache.js");

const check_variable = async (config_name, variable) => {
	if (typeof variable === 'undefined' || variable === null) {
        log(`[Error config: ${config_name}] значение "${config_name}" не указано`);
        await start_config_editor();
    }
}

const check_path = async (config_name, dest) => {
	if (!existsSync(dest)){
		log(`[Error config: ${config_name}] путь ${dest} не существует`);
		await start_config_editor();
	}
}

module.exports = async () => {

	const { is_use_laser, osuFolder, laser_files }  = get_config();

	await check_variable('is_use_laser', is_use_laser);

	if (is_use_laser) {
		log('Проверка путей osu laser');
		
		await check_variable('laser_files', laser_files);

		const osu_laser = path.join( laser_files, 'client.realm' );

		await check_path('osu_laser_exe', osu_laser_exe_path);
		await check_path('laser_files', osu_laser);

	} else {
		log('Проверка путей osu stable');

		await check_variable('osuFolder', osuFolder);

		const osu_stable = path.normalize(osuFolder);
		const osu_stable_songs = path.join( osu_stable, 'Songs' );
		const osu_stable_db = path.join( osu_stable, 'osu!.db' );

		await check_path('osuFolder', osu_stable);
		await check_path('osuFolder/Songs', osu_stable_songs);
		await check_path('osuFolder/osu!.db', osu_stable_db);
		
	}

	log('Проверка путей завершена');

}