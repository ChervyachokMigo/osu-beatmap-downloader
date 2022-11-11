const fs = require('fs');
module.exports = {
    get_past_day: function (currentDateString){
        return get_past_day(currentDateString);
    },

    get_past_week: function (currentDateString){
        return get_past_week(currentDateString);
    },

    get_date_string: function (date){
        return get_date_string(date);
    },

    get_time_string: function (date){
        return get_time_string(date);
    },

    escapeString: function (text){
        return text.replace(/[&\/\\#+$~%'":*?<>{}|]/g, '');
    },

    sleep: async function (seconds) {
        return new Promise((resolve) => {
          setTimeout(resolve, seconds*1000);
        });
    },
      
    log: function (string){
        console.log(get_time_string(new Date()), string);
    },

    checkDir: function(path){
        if (!fs.existsSync(`${path}`)) { fs.mkdirSync(`${path}`, {recursive: true});}
    }
    
}

function get_time_string(date){
    return `${formatAddZero(date.getHours(),2)}:${formatAddZero(date.getMinutes(),2)}:${formatAddZero(date.getSeconds(),2)}`;
}

function get_date_string(date){
    return `${date.getFullYear()}-${formatAddZero(date.getMonth()+1, 2)}-${formatAddZero(date.getDate(), 2)}`;
}

function get_past_day(currentdate){
	var onedayms = 86400000;
    var pastDayDate = new Date(new Date(currentdate)-onedayms);
    return get_date_string(pastDayDate);
}

function get_past_week(currentdate){
	var onedayms = 86400000;

    var pastDayDate = new Date(new Date(currentdate) - onedayms * 7);
    return get_date_string(pastDayDate);
}

function formatAddZero(t, symbols = 1){
    var numberZeroed = t.toString();
    var numberLength = t.toString().length;
    if ( numberZeroed.length < symbols){
        for (var i = 0; i < symbols-numberLength; i++){
            numberZeroed = `0${numberZeroed}`;
        }
    }
    return numberZeroed;
}