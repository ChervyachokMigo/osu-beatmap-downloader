# osu-beatmap-downloader
<h2>Автоматическая загрузка карт osu</h2>

Установка:

* установить Node.js если нету.

* запустить cmd, создать папку и перейти в неё для загрузки репозитория

* скопировать репозиторий `git clone https://github.com/ChervyachokMigo/osu-beatmap-downloader`

* переименовать config-sample.js в config.js

* написать свои логин и пароль от Osu (необходимо для загрузки карт, без логина карты не скачиваются)

* указать путь к osu `osuFolder`

* оставить `readOsudb: true`, в следующий запуск можно поставить `false`, чтобы не было повторной проверки osu.db

* удалить `beatmapslist.json` - там хранится список уже загруженых карт (мой), помимо сканированой базы из осу

* установить зависимости `npm install`

* запустить один из bat файлов либо `npm run start`

все батники (bat файлы) можно отредактировать блокнотом, как минимум выставить необходимую глубину поиска, аргумент: `--maps_depth число`

* `start all loved.bat` - все лавед карты всех модов
* `start std loved.bat` - осу лавед карты
* `start taiko loved.bat` - тайко лавед карты
  
* `start std.bat` - ранкед карты осу
* `start mania.bat` - ранкед карты мании
* `start taiko.bat` - ранкед карты тайко
* `start_all.bat` - все ранкед карты

* `start taiko qualified.bat` - квалифицированые карты в тайко (они не будут записываться в список загруженых)

* `start std graveyard 10 likes, 5 stars begin.bat` - грейвярд карты из осу с 10 лайками, 30 объектами и минимум 30 секундами
* `start std graveyard.bat` - поиск грейвярд карт по запросу и курсору

скриншот: 

<img src="https://github.com/ChervyachokMigo/osu-beatmap-downloader/blob/main/1.png?raw=true" width="600" />
