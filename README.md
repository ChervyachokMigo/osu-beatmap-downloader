# osu-beatmap-downloader
<h2>Автоматическая загрузка карт osu</h2>

Установка:

* установить Node.js если нету.

* запустить cmd, создать папку и перейти в неё для загрузки репозитория

* скопировать репозиторий `git clone https://github.com/ChervyachokMigo/osu-beatmap-downloader`

* запустить `first_run.bat`, прочитать и нажать Enter

  * указать путь к osu `osuFolder`
    
  * написать свои логин и пароль от Osu (необходимо для загрузки карт, без логина карты не скачиваются)
    
  * закрыть окно редактора текста
 
  * Запустится лаунчер
 
* Выбрать пресет в лаунчере, или установить свои параметры, нажать Enter для запуска

* `start_launcher.bat` - запустить лаунчер, там можно выставить параметры карт для поиска
* - `TAB` выбор пресета
  - `Q` режим игры
  - `W` статус карты
  - `E` глубина поиска карты (каждая единица - это следующие 50 карт, например значение 5 (5*50) = поиск в первых 250 картах)
  - `R` минимальное количество лайков на карте
  - `T` минимальное количество звёзд
  - `Y` максимальное количество звёзд
  - `U` минимальное количество нот в карте
  - `I` минимальная длина
  - `O` продолжение с предыдущего места, если оно было прервано (в большинстве случаев это не нужно)
  - `ENTER` запустить скачивание (если в первый раз, то будет отсканирована база с картами из папки Osu)
  - `ESC` закрыть
* `start std graveyard.bat` - поиск грейвярд карт по запросу и курсору

скриншот: 

<img src="https://github.com/ChervyachokMigo/osu-beatmap-downloader/blob/main/misc/1.png?raw=true" width="600" />
<img src="https://github.com/ChervyachokMigo/osu-beatmap-downloader/blob/main/misc/2.png?raw=true" width="600" />
