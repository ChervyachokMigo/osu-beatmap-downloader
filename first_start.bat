﻿ 
@echo off

echo #################
echo Первый запуск загрузчика 
echo (First run of downloader)
echo Запускайте только один, первый, раз
echo (Run this only once)
echo ВНИМАНИЕ, сотрется база скачаных карт, отсканированая база осу и настройки (config.js) 
echo (WARNING, It erase data of downloaded maps, data of scan osu db and setting from config.js)
echo Когда откроется config.js измените пути и введите свои осу логин и пароль, а затем закройте окно
echo When config.js will open you must change osu path and enter your osu login and password, after that you must close editor window
pause
del beatmapslist.json & del beatmaps_osu_db.json & del last_cursor.json & npm i & copy config_sample.js config.js & config.js & start_launcher.bat