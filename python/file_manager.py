import os
import shutil

def save_beatmap(beatmap_data, output_filename):
    # Сохранение карты в файл
    with open(output_filename, 'wb') as file:
        file.write(beatmap_data)

def move_beatmap(source, destination):
    # Перемещение карты в нужную папку
    shutil.move(source, destination)