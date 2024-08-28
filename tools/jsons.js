const fs = require('node:fs');
const path = require('node:path');
const {osu_db_load, beatmap_property} = require('osu-tools');

const osu_db_json_path = path.join('data', 'beatmaps_osu_db.json');
const beatmaplist_path =  path.join('data', 'beatmapslist.json'); 

const { osuFolder } = require(`../config.js`);

const beatmaps_downloaded = [];

///////////osu db json
const read_osu_db_and_save_json = () => {
	const osu_db_path = path.join( osuFolder, 'osu!.db' );

	const props = [
		beatmap_property.beatmapset_id
	];

	const data = Array.from(new Set(
		osu_db_load( osu_db_path, props ).beatmaps.map( x => x.beatmapset_id ))
	).sort(( a, b ) => a - b );
	fs.writeFileSync(osu_db_json_path, JSON.stringify(data));
	return data;
}

const load_beatmaps_db_json = () => {
	if(fs.existsSync(osu_db_json_path)){
		const json_data = JSON.parse(fs.readFileSync(osu_db_json_path));
		if (typeof json_data.version !== 'undefined') {
			const data = Array.from(new Set(json_data.beatmaps.map( x => x.setId ))).sort(( a, b ) => a - b );
			fs.writeFileSync(osu_db_json_path, JSON.stringify(data));
			add_new(data);
		} else {
			add_new(json_data);
		}
	} else {
		const data = read_osu_db_and_save_json();
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
		load_beatmaps_db_json();
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