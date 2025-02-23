const path = require('path');

module.exports = {
	data_path: path.join(__dirname, '..', 'data'),
	config_path: path.join(__dirname, '..', 'data', 'config.json'),
	config_sample_path: path.join(__dirname, 'config_sample.json'),
	osu_token_path: path.join(__dirname, '..', 'data', 'osu_token.json'),
	presets_path: path.join(__dirname, '..', 'data', 'presets.json'),
	presets_sample_path: path.join(__dirname, 'presets_sample.json'),
	last_cursor_path: path.join(__dirname, '..', 'data', 'last_cursor.json'),
	osu_db_json_path: path.join(__dirname, '..', 'data', 'beatmaps_osu_db.json'),
	beatmaplist_path: path.join(__dirname, '..', 'data', 'beatmapslist.json'),
	osu_laser_exe_path: path.join(process.env.LOCALAPPDATA, 'osulazer', 'current', 'osu!.exe'),
	download_path: path.join( __dirname, '..', 'beatmaps' ),
}