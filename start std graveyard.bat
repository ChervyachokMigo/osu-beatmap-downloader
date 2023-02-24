@echo off
set /p query=write query:
node index.js --mode std --status graveyard --fav_count_min 5 --stars_min 5  --maps_depth 500 --query "%query%"
pause