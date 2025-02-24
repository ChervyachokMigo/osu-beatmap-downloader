const fs = require('node:fs');
const path = require('node:path');
const { osu_db_load, beatmap_property, open_realm, get_realm_objects, laser_beatmap_status } = require('osu-tools');

const { beatmaplist_path, osu_db_json_path } = require('../misc/pathes.js');
const { get_config } = require('./config_web_editor/config_cache.js');

const beatmaps_downloaded = [];

const get_beatmapsets_from_osu_stable = () => {
	const { osuFolder } = get_config();
	const osu_db_path = path.join( osuFolder, 'osu!.db' );
	const props = [ beatmap_property.beatmapset_id ];

	const data = Array.from(new Set(
		osu_db_load( osu_db_path, props )
		.beatmaps.map( x => x.beatmapset_id ))
	).sort(( a, b ) => a - b );

	return data;
}

const get_beatmapsets_from_osu_laser = () => {
	const { laser_files } = get_config();
	const realm_path = path.join( laser_files, 'client.realm' );
	const realm = open_realm(realm_path);

	const data = Array.from(new Set(
		[...get_realm_objects(realm, 'BeatmapSet')]
		.filter ( v => v.Status === laser_beatmap_status.Loved || v.Status === laser_beatmap_status.Approved || v.Status === laser_beatmap_status.Ranked)
		.map( v => v.OnlineID)
		.filter( v => v > 0 )))
		.sort(( a, b ) => a - b );

	realm.close();

	return data;
}

const load_beatmaps_db_json = () => {
	if(fs.existsSync(osu_db_json_path)){
		const json_data = JSON.parse(fs.readFileSync(osu_db_json_path));
		if (typeof json_data.version === 'undefined') {
			add_new(json_data);
		} else {
			const data = Array.from(new Set(json_data.beatmaps.map( x => x.setId ))).sort(( a, b ) => a - b );
			fs.writeFileSync(osu_db_json_path, JSON.stringify(data));
			add_new(data);
		}
	} else {
		const data = get_beatmapsets_from_osu_stable();
		fs.writeFileSync(osu_db_json_path, JSON.stringify(data));
		add_new(data);
	}
}

const load_beatmaplist = () => {
    if (fs.existsSync(beatmaplist_path)){
        const json_data = JSON.parse(fs.readFileSync(beatmaplist_path));
		if (json_data.length > 0) {
			if (typeof json_data[0] === 'object') {
				const data = Array.from(new Set(json_data.map( x => x.id ))).sort(( a, b ) => a - b );
				add_new(data);
			} else {
				load_values(json_data);
			}
		}
    } else {
		const { is_use_laser } = get_config();
		if (is_use_laser) {
			const data = get_beatmapsets_from_osu_laser();
			fs.writeFileSync(osu_db_json_path, JSON.stringify(data));
			add_new(data);
		} else {
			load_beatmaps_db_json();
		}
	}
}

const load_values = (data) => {
	//multiple values
	if (Array.isArray(data)){
        for (let val of data){
			if (beatmaps_downloaded.indexOf(val) === -1){
				beatmaps_downloaded.push(val);
			}
		}
	//single value
    } else {
        if (beatmaps_downloaded.indexOf(data) == -1){
			beatmaps_downloaded.push(data);  
		}
    }
}

const add_new = (data) => {
    load_values(data);
	fs.writeFileSync( beatmaplist_path, 
		JSON.stringify( Array.from( new Set(beatmaps_downloaded ))));
}

module.exports = {
	load_beatmaps_db_json,
	load_beatmaplist,

    add_new,
	load_values,
	
    find: (val) => beatmaps_downloaded.indexOf(val) > -1,

}