
@echo off

chcp 1251
echo =================
echo ������ ������ ����������
echo First run of downloader
echo ���������� ������ ����, ������, ���
echo Run this only once
echo ��������, �������� ���� �������� ����, �������������� ���� ��� � ��������� � config.js
echo WARNING, It erase data of downloaded maps, data of scan osu db and setting from config.js
echo ����� ��������� config.js �������� ���� � ������� ���� ��� ����� � ������, � ����� �������� ����
echo When config.js will open you must change osu path and enter your osu login and password, after that you must close editor window

:loop
set /p input=Type "y" to continue: 
if "%input%"=="y" (
    echo �� ����� "y".
    goto process
) else (
    goto exit
)

:process
md data & del data\beatmapslist.json & del data\beatmaps_osu_db.json & del data\last_cursor.json & npm cache clean --force & npm i & npm i ChervyachokMigo/dashboard_framework & md public & copy node_modules\dashboard_framework\server\public\* public\ & copy misc\presets.json data\presets.json & copy misc\config_sample.js config.js & config.js & start_launcher.bat

:exit
pause