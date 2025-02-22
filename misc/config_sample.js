module.exports = {
    // ОБЯЗАТЕЛЬНЫЕ ПАРАМЕТРЫ:
	//osuFolder если используете osu stable
	//laser_files если используете osu laser
    osuFolder: `D:\\osu!`,
	laser_files: 'D:\\osu!laser',

    //логин и пароль от осу
	login: 'yourlogin',
	password: 'yourpassword',

    //НИЖЕ НЕОБЯЗАТЕЛЬНЫЕ ПАРАМЕТРЫ:

   	//использовать osu laser вместо osu stable
	is_use_laser: false,
    //автоманическое перемещение скачаных карт
    is_move_beatmaps: true,
	//подробная информация о перемещении
    is_detail_move_log: false,

    //режим по умолчанию
    //osu
    //taiko
    //mania
    //fruits
    mode: 'osu',

    //глубина поиска карт по умолчанию 10 * 50 = 500 карт
    //если карт не найдено, то будет столько раз запрошено далее (банчо выдает за раз максимум 50 карт в запросе)
    maps_date_depth: 10,

    //порт для локального вебсервера
    WEBPORT: 4451,
    //порт для внуреней передачи данных между веб сервером и страницей
    SOCKETPORT: 4452,
    //показывать в консоле данные которые передаются по сокету
    DEBUG_DASHBOARD: false,
}