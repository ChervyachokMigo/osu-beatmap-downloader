const { log } = require(`./tools.js`);
const config = require('../config.js');
const { readdirSync, copyFileSync, rmSync } = require('node:fs');
const path = require('node:path');
const { download_path } = require('./download_path.js');
const { execFile } = require("child_process");

const osu_laser_exe_path = path.join(process.env.LOCALAPPDATA, 'osulazer', 'current', 'osu!.exe');

const move_single_file = ({ src, dest }) => {
    try{
        if (config.is_detail_move_log){
            log('move from',src);
            log('move to', dest);
        }
        copyFileSync(src, dest);
        rmSync(src);
    } catch (e) {
        if (e.code === 'EPERM'){
            console.error('EPERM: operation not permitted', src, dest);
        } else {
            console.error(e);
        }
    }
}

const move_beatmaps_osu_stable = (files) => {
	log('moving files to "Songs" in osu stable..');

	for (let filename of files) {
		move_single_file({
			src: path.join(download_path, filename), 
			dest: path.join(config.osuFolder, 'Songs', filename)
		});
	}
}

const move_beatmaps_osulaser = (files) => {
	log('opening files in osu laser..');
	const files_args = files.map( v => path.join(download_path, v));

	execFile(osu_laser_exe_path, files_args, (error, stdout, stderr) => {
		if (error) {
			console.error(`Error: ${error.message}`);
			return;
		}
		if (stderr) {
			console.error(`stderr: ${stderr}`);
			return;
		}
		console.log(stdout);
	});
	
}

module.exports = () => {
	const files = readdirSync(download_path, { encoding: 'utf8' });
	if (files.length === 0) {
        return;
    }

	if (config.is_use_laser) {
		move_beatmaps_osulaser(files);
	} else {
		move_beatmaps_osu_stable(files);
	}

}