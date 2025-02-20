@echo off
set /p query=write query:
set /p cursor=last cursor:
node index.js --mode std --status graveyard --fav_count_min 5 --min_objects 30 --min_length 30 --stars_min 5  --maps_depth 500 --strict true --query "%query%" --cursor %cursor%
pause