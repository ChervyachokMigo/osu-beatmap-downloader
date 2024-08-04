
const argv = process.argv.slice(2);

if (argv.length > 0) {
	const beatmapset_id = parseInt(argv[0]);
	if (isNaN(beatmapset_id)) {
        console.error('Invalid beatmapset ID.');
        process.exit(1);
    }
    console.log('Beatmapset ID:', beatmapset_id);
	const jsons = require(`./jsons.js`);
	jsons.load_beatmaplist();
	jsons.add_new(beatmapset_id);
}

