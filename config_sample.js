module.exports = {
    //Папка osu 
    osuFolder: `D:\\osu!`,

    //временная папка загрузки
    download_folder: `beatmaps`,

    //логин и пароль от осу
	login: 'yourlogin',
	password: 'yourpassword',

    //ручное сканирование базы карт из осу
    readOsudb: false,       //не нужно
    isFullRescan: false,    //не нужно

    //глубина поиска карт по умолчанию 5 * 50 = 250 карт
    //если карт не найдено, то будет столько раз запрошено далее (банчо выдает за раз максимум 50 карт в запросе)
    maps_date_depth: 5,

    //режим по умолчанию
    //osu
    //taiko
    //mania
    //fruits
    mode: 'osu'
    
}