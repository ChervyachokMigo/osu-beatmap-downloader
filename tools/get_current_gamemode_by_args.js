
let current_gamemode = null;

module.exports = (mode) => {
	if (mode){
        const modes = mode.split(',');
        if ( modes.length > 1 ){
			for ( let i = 0; i < modes.length; i++ ) {
				if (current_gamemode === null) {
					current_gamemode = modes[0];
					break;
				}
				if (i === modes.length - 1) {
					current_gamemode = modes[0];
					break;
				}
				if (modes[i] === current_gamemode) {
					current_gamemode = modes[i+1];
                    break;
                }
			}
        } else {
            current_gamemode = mode;
        }
    } else {
        current_gamemode = 'all';
    }
	return current_gamemode;
}