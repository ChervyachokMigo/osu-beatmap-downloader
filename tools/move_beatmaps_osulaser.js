const { readdirSync } = require("fs");
const { execFileSync } = require("child_process");
const path = require("path");
const download_path = require("./download_path");

const _this = module.exports = () => {

	const osu_path = path.join(process.env.LOCALAPPDATA, 'osulazer', 'current', 'osu!.exe');

	const beatmaps = readdirSync(download_path, { encoding: 'utf8' });

	for (let beatmap_name of beatmaps) {
		const res = execFileSync(osu_path, [path.join(download_path, beatmap_name)]);
		console.log(res.toString());
	}
}

_this();