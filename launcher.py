import os
import json
import subprocess
import sys
from PyQt5.QtWidgets import (QApplication, QMainWindow, QVBoxLayout, QWidget, QComboBox, 
                             QLineEdit, QPushButton, QLabel, QHBoxLayout, QSpinBox, 
                             QDoubleSpinBox, QCheckBox, QMessageBox)
from PyQt5.QtCore import Qt

class OsuDownloaderLauncher(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("OSU Beatmaps Downloader Launcher")
        self.setFixedSize(600, 700)  # Немного увеличил высоту
        
        # Создаем папку data, если ее нет
        if not os.path.exists("data"):
            os.makedirs("data")
        
        # Загружаем конфиг и пресеты
        self.load_config()
        self.load_presets()
        
        # Инициализируем UI
        self.init_ui()
        
    def load_config(self):
        """Загружаем конфигурацию"""
        self.config = {
            "WEBPORT": 8080,
            # Добавьте другие параметры конфига по необходимости
        }
        
    def load_presets(self):
        """Загружаем пресеты или создаем файл, если его нет"""
        self.presets_file = "data/presets.json"
        
        try:
            if os.path.exists(self.presets_file):
                with open(self.presets_file, "r") as f:
                    self.presets = json.load(f)
            else:
                self.presets = []
                with open(self.presets_file, "w") as f:
                    json.dump(self.presets, f)
        except Exception as e:
            QMessageBox.critical(self, "Ошибка", f"Не удалось загрузить пресеты: {str(e)}")
            self.presets = []
            
        # Добавляем Custom preset как первый вариант
        self.presets.insert(0, {"name": "Custom"})
        
    def save_presets(self):
        """Сохраняем пресеты (все кроме первого Custom)"""
        try:
            with open(self.presets_file, "w") as f:
                json.dump(self.presets[1:], f, indent=4)
        except Exception as e:
            QMessageBox.critical(self, "Ошибка", f"Не удалось сохранить пресеты: {str(e)}")
            
    def init_ui(self):
        """Инициализация пользовательского интерфейса"""
        main_widget = QWidget()
        layout = QVBoxLayout()
        
        # ===== Preset Selection =====
        layout.addWidget(QLabel("<b>Preset:</b>"))
        self.preset_combo = QComboBox()
        for preset in self.presets:
            self.preset_combo.addItem(preset["name"])
        self.preset_combo.currentIndexChanged.connect(self.preset_changed)
        layout.addWidget(self.preset_combo)
        
        # ===== Gamemode Selection =====
        layout.addWidget(QLabel("<b>Gamemode:</b>"))
        self.gamemode_combo = QComboBox()
        gamemodes = [
            "all", "std", "taiko", "fruits", "mania", "std,taiko",
            "std,fruits", "std,mania", "taiko,mania", "fruits,mania",
            "taiko,fruits", "std,taiko,mania", "std,fruits,mania", "std,taiko,fruits"
        ]
        self.gamemode_combo.addItems(gamemodes)
        layout.addWidget(self.gamemode_combo)
        
        # ===== Status Selection =====
        layout.addWidget(QLabel("<b>Status:</b>"))
        self.status_combo = QComboBox()
        statuses = [
            "any", "ranked", "loved", "qualified", "graveyard", 
            "pending", "wip", "mine", "favourites"
        ]
        self.status_combo.addItems(statuses)
        layout.addWidget(self.status_combo)
        
        # ===== Numeric Parameters =====
        layout.addWidget(QLabel("<b>Search Parameters:</b>"))
        
        self.maps_depth_spin = QSpinBox()
        self.maps_depth_spin.setRange(1, 100)
        self.maps_depth_spin.setValue(10)
        layout.addWidget(QLabel("Maps depth:"))
        layout.addWidget(self.maps_depth_spin)
        
        self.fav_count_min_spin = QSpinBox()
        self.fav_count_min_spin.setRange(0, 100000)
        layout.addWidget(QLabel("Favorites count min:"))
        layout.addWidget(self.fav_count_min_spin)
        
        self.stars_min_spin = QDoubleSpinBox()
        self.stars_min_spin.setRange(0.0, 12.0)
        self.stars_min_spin.setSingleStep(0.1)
        layout.addWidget(QLabel("Stars min:"))
        layout.addWidget(self.stars_min_spin)
        
        self.stars_max_spin = QDoubleSpinBox()
        self.stars_max_spin.setRange(0.0, 12.0)
        self.stars_max_spin.setSingleStep(0.1)
        self.stars_max_spin.setValue(12.0)
        layout.addWidget(QLabel("Stars max:"))
        layout.addWidget(self.stars_max_spin)
        
        self.min_objects_spin = QSpinBox()
        self.min_objects_spin.setRange(0, 10000)
        layout.addWidget(QLabel("Objects min:"))
        layout.addWidget(self.min_objects_spin)
        
        self.min_length_spin = QSpinBox()
        self.min_length_spin.setRange(0, 1000)
        layout.addWidget(QLabel("Length min (seconds):"))
        layout.addWidget(self.min_length_spin)
        
        self.requests_limit_spin = QSpinBox()
        self.requests_limit_spin.setRange(1, 60)
        self.requests_limit_spin.setValue(5)
        layout.addWidget(QLabel("Requests limit duration:"))
        layout.addWidget(self.requests_limit_spin)
        
        # ===== Checkboxes =====
        self.no_video_check = QCheckBox("No video")
        self.no_video_check.setChecked(True)
        layout.addWidget(self.no_video_check)
        
        self.continue_check = QCheckBox("Continue download")
        layout.addWidget(self.continue_check)
        
        # ===== Save Preset =====
        self.save_preset_layout = QHBoxLayout()
        self.save_name_edit = QLineEdit()
        self.save_name_edit.setPlaceholderText("Enter preset name")
        self.save_button = QPushButton("Save Preset")
        self.save_button.clicked.connect(self.save_current_preset)
        self.save_preset_layout.addWidget(self.save_name_edit)
        self.save_preset_layout.addWidget(self.save_button)
        layout.addLayout(self.save_preset_layout)
        self.update_save_ui()
        
        # ===== Run Button =====
        self.run_button = QPushButton("Run Downloader")
        self.run_button.setStyleSheet("background-color: #4CAF50; color: white; font-weight: bold;")
        self.run_button.clicked.connect(self.run_downloader)
        layout.addWidget(self.run_button)
        
        # ===== Command Preview =====
        layout.addWidget(QLabel("<b>Command Preview:</b>"))
        self.command_preview = QLabel()
        self.command_preview.setWordWrap(True)
        self.command_preview.setStyleSheet("border: 1px solid #ccc; padding: 5px;")
        layout.addWidget(self.command_preview)
        
        # Обновляем предпросмотр команды при изменении параметров
        for widget in [self.preset_combo, self.gamemode_combo, self.status_combo,
                      self.maps_depth_spin, self.fav_count_min_spin, self.stars_min_spin,
                      self.stars_max_spin, self.min_objects_spin, self.min_length_spin,
                      self.requests_limit_spin, self.no_video_check, self.continue_check]:
            if isinstance(widget, QComboBox):
                widget.currentIndexChanged.connect(self.update_command_preview)
            elif isinstance(widget, QSpinBox) or isinstance(widget, QDoubleSpinBox):
                widget.valueChanged.connect(self.update_command_preview)
            elif isinstance(widget, QCheckBox):
                widget.stateChanged.connect(self.update_command_preview)
        
        main_widget.setLayout(layout)
        self.setCentralWidget(main_widget)
        
        # Первоначальное обновление предпросмотра команды
        self.update_command_preview()
        
    def update_save_ui(self):
        """Показываем элементы сохранения только для Custom preset"""
        show_save = self.preset_combo.currentIndex() == 0
        self.save_name_edit.setVisible(show_save)
        self.save_button.setVisible(show_save)
        
    def preset_changed(self, index):
        """Обработка изменения пресета"""
        self.update_save_ui()
        
        if index == 0:  # Custom preset
            # Сброс к значениям по умолчанию
            self.maps_depth_spin.setValue(10)
            self.fav_count_min_spin.setValue(0)
            self.stars_min_spin.setValue(0.0)
            self.stars_max_spin.setValue(12.0)
            self.min_objects_spin.setValue(0)
            self.min_length_spin.setValue(0)
            self.requests_limit_spin.setValue(5)
            self.no_video_check.setChecked(True)
            self.continue_check.setChecked(False)
            self.gamemode_combo.setCurrentIndex(0)
            self.status_combo.setCurrentIndex(0)
        else:
            # Загружаем значения из пресета
            preset = self.presets[index]
            self.maps_depth_spin.setValue(preset.get("maps_depth", 10))
            self.fav_count_min_spin.setValue(preset.get("fav_count_min", 0))
            self.stars_min_spin.setValue(preset.get("stars_min", 0.0))
            self.stars_max_spin.setValue(preset.get("stars_max", 12.0))
            self.min_objects_spin.setValue(preset.get("min_objects", 0))
            self.min_length_spin.setValue(preset.get("min_length", 0))
            self.requests_limit_spin.setValue(preset.get("requests_limit_duration", 5))
            self.no_video_check.setChecked(preset.get("no_video", True))
            self.continue_check.setChecked(preset.get("continue", False))
            self.gamemode_combo.setCurrentIndex(preset.get("gamemode", 0))
            self.status_combo.setCurrentIndex(preset.get("status", 0))
            
    def save_current_preset(self):
        """Сохраняем текущие настройки как новый пресет"""
        name = self.save_name_edit.text().strip()
        if not name:
            QMessageBox.warning(self, "Ошибка", "Пожалуйста, введите имя пресета")
            return
            
        # Проверяем, есть ли уже пресет с таким именем
        for preset in self.presets[1:]:  # Пропускаем Custom
            if preset["name"].lower() == name.lower():
                QMessageBox.warning(self, "Ошибка", "Пресет с таким именем уже существует")
                return
                
        preset = {
            "name": name,
            "gamemode": self.gamemode_combo.currentIndex(),
            "status": self.status_combo.currentIndex(),
            "continue": int(self.continue_check.isChecked()),
            "no_video": int(self.no_video_check.isChecked()),
            "maps_depth": self.maps_depth_spin.value(),
            "fav_count_min": self.fav_count_min_spin.value(),
            "stars_min": self.stars_min_spin.value(),
            "stars_max": self.stars_max_spin.value(),
            "min_objects": self.min_objects_spin.value(),
            "min_length": self.min_length_spin.value(),
            "requests_limit_duration": self.requests_limit_spin.value()
        }
        
        # Добавляем в список пресетов
        self.presets.append(preset)
        self.preset_combo.addItem(name)
        self.save_presets()
        
        # Очищаем поле и выбираем новый пресет
        self.save_name_edit.clear()
        self.preset_combo.setCurrentIndex(len(self.presets) - 1)
        
        QMessageBox.information(self, "Сохранено", "Пресет успешно сохранен")
        
    def build_command(self):
        """Собираем команду для выполнения"""
        gamemodes = [
            "all", "std", "taiko", "fruits", "mania", "std,taiko",
            "std,fruits", "std,mania", "taiko,mania", "fruits,mania",
            "taiko,fruits", "std,taiko,mania", "std,fruits,mania", "std,taiko,fruits"
        ]
        statuses = [
            "any", "ranked", "loved", "qualified", "graveyard", 
            "pending", "wip", "mine", "favourites"
        ]
        
        command = [
            f"mode {gamemodes[self.gamemode_combo.currentIndex()]}",
            f"status {statuses[self.status_combo.currentIndex()]}",
            f"no_video {'true' if self.no_video_check.isChecked() else 'false'}",
            f"continue {'yes' if self.continue_check.isChecked() else 'no'}"
        ]
        
        # Добавляем параметры, если они отличаются от значений по умолчанию
        if self.maps_depth_spin.value() != 10:
            command.append(f"maps_depth {self.maps_depth_spin.value()}")
        if self.fav_count_min_spin.value() != 0:
            command.append(f"fav_count_min {self.fav_count_min_spin.value()}")
        if self.stars_min_spin.value() != 0.0:
            command.append(f"stars_min {self.stars_min_spin.value()}")
        if self.stars_max_spin.value() != 12.0:
            command.append(f"stars_max {self.stars_max_spin.value()}")
        if self.min_objects_spin.value() != 0:
            command.append(f"min_objects {self.min_objects_spin.value()}")
        if self.min_length_spin.value() != 0:
            command.append(f"min_length {self.min_length_spin.value()}")
        if self.requests_limit_spin.value() != 5:
            command.append(f"requests_limit_duration {self.requests_limit_spin.value()}")
            
        return f"start http://localhost:{self.config['WEBPORT']} && node index.js --{' --'.join(command)} && pause"
        
    def update_command_preview(self):
        """Обновляем предпросмотр команды"""
        self.command_preview.setText(self.build_command())
        
    def run_downloader(self):
        """Запускаем загрузчик с выбранными параметрами"""
        command = self.build_command()
        try:
            # Для Windows
            if os.name == 'nt':
                subprocess.Popen(command, shell=True)
            # Для Linux/macOS (может потребоваться адаптация)
            else:
                subprocess.Popen(command, shell=True, executable="/bin/bash")
                
            self.close()  # Закрываем лаунчер после запуска
        except Exception as e:
            QMessageBox.critical(self, "Ошибка", f"Не удалось запустить загрузчик:\n{str(e)}")

def main():
    # Создаем QApplication до любых других Qt-объектов
    app = QApplication(sys.argv)
    
    # Устанавливаем стиль для лучшего вида
    app.setStyle('Fusion')
    
    # Создаем и показываем главное окно
    launcher = OsuDownloaderLauncher()
    launcher.show()
    
    # Запускаем главный цикл приложения
    sys.exit(app.exec_())

if __name__ == "__main__":
    main()