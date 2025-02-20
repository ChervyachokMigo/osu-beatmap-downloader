@echo off
set /p id=Beatmapset ID:
node tools\add_beatmapset_manually.js %id%
pause