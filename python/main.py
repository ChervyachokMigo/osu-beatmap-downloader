from osu_api import get_osu_token, search_beatmaps, download_beatmap
from file_manager import save_beatmap, move_beatmap
from gui import OsuDownloaderGUI

def main():
    # Инициализация и запуск приложения
    app = OsuDownloaderGUI()
    app.mainloop()

if __name__ == "__main__":
    main()