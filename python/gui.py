import tkinter as tk
from tkinter import ttk
from tkinter import messagebox
from osu_api import search_beatmaps, download_beatmap
from file_manager import save_beatmap, move_beatmap

class OsuDownloaderGUI(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Osu! Beatmap Downloader")
        self.geometry("400x300")

        # Создание элементов интерфейса
        self.create_widgets()

    def create_widgets(self):
        # Фрейм для ввода параметров
        frame = ttk.Frame(self, padding="10")
        frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))

        # Метка и поле для ввода запроса
        ttk.Label(frame, text="Query:").grid(row=0, column=0, sticky=tk.W)
        self.query_entry = ttk.Entry(frame)
        self.query_entry.grid(row=0, column=1, sticky=(tk.W, tk.E))

        # Метка и поле для выбора статуса
        ttk.Label(frame, text="Status:").grid(row=1, column=0, sticky=tk.W)
        self.status_var = tk.StringVar()
        self.status_combobox = ttk.Combobox(frame, textvariable=self.status_var, values=["any", "ranked", "loved"])
        self.status_combobox.grid(row=1, column=1, sticky=(tk.W, tk.E))

        # Метка и поле для выбора режима игры
        ttk.Label(frame, text="Gamemode:").grid(row=2, column=0, sticky=tk.W)
        self.gamemode_var = tk.StringVar()
        self.gamemode_combobox = ttk.Combobox(frame, textvariable=self.gamemode_var, values=["all", "std", "taiko", "fruits", "mania"])
        self.gamemode_combobox.grid(row=2, column=1, sticky=(tk.W, tk.E))

        # Кнопка для начала скачивания
        self.download_button = ttk.Button(frame, text="Download", command=self.start_download)
        self.download_button.grid(row=3, column=0, columnspan=2, pady=10)

    def start_download(self):
        # Получение значений из полей ввода
        query = self.query_entry.get()
        status = self.status_var.get()
        gamemode = self.gamemode_var.get()

        # Проверка введенных данных
        if not query or not status or not gamemode:
            messagebox.showerror("Error", "Please fill in all fields.")
            return

        # Поиск карт
        beatmaps = search_beatmaps(query, status, gamemode, nsfw="true", cursor=None)

        # Скачивание карт
        for beatmap in beatmaps:
            beatmapset_id = beatmap["id"]
            output_filename = f"{beatmapset_id}.osz"
            download_beatmap(beatmapset_id, output_filename)
            save_beatmap(beatmap, output_filename)
            move_beatmap(output_filename, "path/to/destination")

        messagebox.showinfo("Success", "Download completed!")

if __name__ == "__main__":
    app = OsuDownloaderGUI()
    app.mainloop()