module.exports = {
    //Папка osu 
    osuFolder: `D:\\osu!`,

    //временная папка загрузки
    download_folder: `beatmaps`,

    //логин пароль осу
	login: 'yourlogin',
	password: 'yourpassword',

    //сканирование базы карт из осу
    readOsudb: true,    //изменить на false после сканирования
    isFullRescan: true,

    //глубина поиска карт по умолчанию 5 * 50 = 250 карт
    //если карт не найдено, то будет столько раз запрошено далее (банчо выдает за раз максимум 50 карт в запросе)
    maps_date_depth: 5,

    //режим по умолчанию
    //osu
    //taiko
    //mania
    //fruits (отключены фрукты)
    mode: 'osu'
    
}