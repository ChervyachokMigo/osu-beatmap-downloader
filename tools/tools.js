const fs = require('node:fs');
const colors = require('colors');

const formatAddZero = (t, symbols = 1) => {
    var result = t.toString();
    var numberLength = t.toString().length;
    if ( result.length < symbols){
        for (var i = 0; i < symbols-numberLength; i++){
            result = `0${result}`;
        }
    }
    return result;
}

const _this = module.exports = {
	get_time_string: (date) => {
		return `${formatAddZero(date.getHours(),2)}:${formatAddZero(date.getMinutes(),2)}:${formatAddZero(date.getSeconds(),2)}`;
	},

    escapeString: (text) => {
        return text?text.replace(/[&\/\\#+$~%'":*?<>{}|]/g, ''):'';
    },

    sleep: async (seconds) => {
        console.log(' > sleeping for', (seconds/60).toFixed(1), 'mins');
        return await new Promise( (resolve) => {
            setTimeout(resolve, seconds * 1000);
        });
    },

    log: (...string) => {
        console.log( `[${_this.get_time_string(new Date()).yellow}]`, string.join(' ') );
    },

    checkDir: (path) => {
        if (!fs.existsSync(`${path}`)) { fs.mkdirSync(`${path}`, {recursive: true});}
    },

    formatPercent: (current, max, digits) => {
        return (current / max * 100).toFixed(digits)
    },

    formatAddZero,
    
    formatTime: (time_ms) => {
        const time_sec = Math.trunc(time_ms / 1000);
        const time_min = Math.trunc(time_sec / 60);
        const sec = time_sec % 60;
        const min = time_min % 60;
        return `${formatAddZero(min, 2)}:${formatAddZero(sec, 2)}`
    },

	to_boolean: (str) => {
		return str === 'true' || str === true || str === '1' || str === 1;
	},

	check_undefined: (ar) => {
		for (let i = 0; i < ar.length; i++) {
            if (ar[i] === undefined) {
                continue;
            } else {
				return ar[i];
			}
        }
		return null;
	},
	
	print_empty_string: () => process.stdout.write( '                                                                                    \r' ),
}
