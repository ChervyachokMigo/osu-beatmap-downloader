@echo off

echo =================
echo Первый запуск загрузчика
echo First run of downloader
echo Запускайте только один, первый, раз
echo Run this only once
echo ВНИМАНИЕ, сотрется база скачаных карт, отсканированая база осу и настройки в config.js
echo WARNING, It erase data of downloaded maps, data of scan osu db and setting from config.js
echo Когда откроется config.js измените пути и введите свои осу логин и пароль, а затем закройте окно
echo When config.js will open you must change osu path and enter your osu login and password, after that you must close editor window
pause
md data & del data\beatmapslist.json & del data\beatmaps_osu_db.json & del data\last_cursor.json & npm i & md public & copy node_modules\dashboard_framework\server\public\* public\ & copy misc\presets.json data\presets.json & copy misc\config_sample.js config.js & config.js &  start_launcher.bat