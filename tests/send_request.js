
const beatmap_download_2 = require("../responses/beatmap_download_2");
const { set_args } = require("../tools/process_args");

const _this = async () => {
	set_args(process.argv.slice(2));
	await beatmap_download_2({ beatmapset_id: 312557, output_filename: 'test.test' });
	await _this();
}

_this();