const { log } = require(`./tools.js`);
const { readdirSync, copyFileSync, rmSync } = require('node:fs');
const path = require('node:path');
const { execFile } = require("child_process");
const { osu_laser_exe_path, download_path } = require('../misc/pathes.js');
const { get_config } = require('./config_web_editor/config_cache.js');

const move_single_file = ({ src, dest }) => {
	const { is_detail_move_log }  = get_config();
    try{
        if (is_detail_move_log){
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
	const { osuFolder }  = get_config();
	for (let filename of files) {
		move_single_file({
			src: path.join(download_path, filename), 
			dest: path.join(osuFolder, 'Songs', filename)
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
	const { is_use_laser }  = get_config();

	if (is_use_laser) {
		move_beatmaps_osulaser(files);
	} else {
		move_beatmaps_osu_stable(files);
	}

}