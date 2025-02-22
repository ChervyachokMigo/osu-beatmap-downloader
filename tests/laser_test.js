const { open_realm, get_realm_objects, beatmap_property, osu_db_load, RankedStatus, laser_beatmap_status } = require('osu-tools');
const path = require('path');
const { laser_files, osuFolder } = require('../config');


	const realm_path = path.join( laser_files, 'client.realm' );
	console.log(realm_path)
	const realm = open_realm(realm_path);
	const data = Array.from(new Set(
		[...get_realm_objects(realm, 'BeatmapSet')]
		.filter ( v => v.Status === laser_beatmap_status.Loved || v.Status === laser_beatmap_status.Approved || v.Status === laser_beatmap_status.Ranked)
		.map( v => v.OnlineID)
		.filter( v => v > 0 )))
		.sort(( a, b ) => a - b );

	console.log(data);

	// const osu_db_path = path.join( osuFolder, 'osu!.db' );

	// const props = [
	// 	beatmap_property.beatmapset_id
	// ];

	// const data = Array.from(new Set(
	// 	osu_db_load( osu_db_path, props ).beatmaps.map( x => x.beatmapset_id ))
	// ).sort(( a, b ) => a - b );

	// console.log (data);