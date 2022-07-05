module.exports = {
    get_past_day: function (currentDateString){
        return get_past_day(currentDateString);
    },

    escapeString: function (text){
        return text.replace(/[&\/\\#+$~%'":*?<>{}]/g, '');
    },

    sleep: async function (seconds) {
        return new Promise((resolve) => {
          setTimeout(resolve, seconds*1000);
        });
    },
      
    log: function (string){
        console.log(string);
    },
}



function get_past_day(currentdate){
	var onedayms = 86400000;
    var pastDayDate = new Date(new Date(currentdate)-onedayms);
    return `${pastDayDate.getFullYear()}-${formatAddZero(pastDayDate.getMonth()+1, 2)}-${formatAddZero(pastDayDate.getDate(), 2)}`;
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