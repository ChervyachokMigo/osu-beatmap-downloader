const check_config = require("./config_web_editor/check_config");
const start_config_editor = require("./config_web_editor/start_config_editor");

const open_config_editor = async () => {
	await check_config();
	await start_config_editor();
}

open_config_editor();