const str_modes = ['osu', 'taiko', 'fruits', 'mania'];

module.exports = (val) => {
	let mode = 0;

	switch (val){
        case '1':
        case 'taiko':
        case 't':
            mode = 1;
            break;

        case '2':
        case 'fruits':
        case 'ctb':
        case 'c':
        case 'f':
            mode = 2;
            break;

        case '3':
        case 'mania':
        case 'm':
            mode = 3;
            break;

        case 'osu':
        case 'std':
        case 'o':
        case 's':
        case '0':
            mode = 0;

        default:
            mode = 0;
            break;
    }

	return { 
		int: mode, 
		name: str_modes[mode] 
	};
}