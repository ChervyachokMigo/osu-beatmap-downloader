const { readFileSync, writeFileSync } = require("original-fs");
const { config_path } = require("../../misc/pathes");
const { log } = require("../tools");

let config_cache = null;

module.exports = {
	load_config_cache: () => {
		config_cache = JSON.parse(readFileSync(config_path, {encoding: 'utf8'}));
	},

	save_config_cache: () => {
		try{
			writeFileSync(config_path, JSON.stringify(config_cache), {encoding: 'utf8'});
		} catch (err) {
            log(`Failed to save config cache:`, err);
        }
	},

	get_config: () => {
        return config_cache;
    },

	set_config: (data) => {
		config_cache = data;
	},

	set_config_option: (name, value) => {
        config_cache[name] = value;
    }
}