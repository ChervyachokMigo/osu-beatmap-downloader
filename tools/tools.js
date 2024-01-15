const fs = require('fs');
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

const get_time_string = (date) => {
    return `${formatAddZero(date.getHours(),2)}:${formatAddZero(date.getMinutes(),2)}:${formatAddZero(date.getSeconds(),2)}`;
}

const get_date_string = (date) => {
    return `${date.getFullYear()}-${formatAddZero(date.getMonth()+1, 2)}-${formatAddZero(date.getDate(), 2)}`;
}

const get_past_day = (currentdate) => {
	var onedayms = 86400000;
    var pastDayDate = new Date(new Date(currentdate)-onedayms);
    return get_date_string(pastDayDate);
}

const get_past_week = (currentdate) => {
	var onedayms = 86400000;

    var pastWeekDate = new Date(new Date(currentdate) - onedayms * 7);
    return get_date_string(pastWeekDate);
}

const get_past_month = (currentdate) => {
	var onedayms = 86400000;

    var pastMonthDate = new Date(new Date(currentdate) - onedayms * 30);
    return get_date_string(pastMonthDate);
}

module.exports = {
    get_past_day,

    get_past_week,

    get_past_month,

    get_date_string,

    get_time_string,

    escapeString: (text) => {
        return text?text.replace(/[&\/\\#+$~%'":*?<>{}|]/g, ''):'';
    },

    sleep: async (seconds) => {
        console.log('sleep for', (seconds/60).toFixed(1), 'mins');
        return new Promise( (resolve) => {
            setTimeout(resolve, seconds * 1000);
        });
    },

    log: (...string) => {
        console.log( `[${get_time_string(new Date()).yellow}]`, string.join(' ') );
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

    get_value_by_key: (object, value) => {
        if(Object.keys(object).find( key => key === value)){
            return object[value];
        } else {
            return null;
        }
    }

}
