//=============================================================================
// RandomSplash.js (v9 - Plugin Parameters UI)
//=============================================================================
/*:
 * @plugindesc Показывает случайную картинку из img/splash вместо Made with MV.
 * @author Qwen & Liquidize
 *
 * @help
 * ============================================================================
 * ИНСТРУКЦИЯ
 * ============================================================================
 * 1. Отключите стандартный плагин MadeWithMv в менеджере плагинов!
 * 2. Создайте папку img/splash/ в корне вашего проекта.
 * 3. Положите туда картинки (png, jpg, jpeg, webp).
 * 4. Настройте время показа ниже.
 *
 * Если автоматический поиск папки не работает (например, при тесте в браузере),
 * впишите названия файлов в параметр "Fallback Images" через запятую.
 * ============================================================================
 *
 * @param Fade In Time
 * @text Время появления (кадры)
 * @desc Сколько кадров длится плавное появление. 60 кадров = 1 секунда.
 * @type number
 * @min 0
 * @default 60
 *
 * @param Wait Time
 * @text Время показа (кадры)
 * @desc Сколько кадров картинка висит на экране. 60 кадров = 1 секунда.
 * @type number
 * @min 0
 * @default 120
 *
 * @param Fade Out Time
 * @text Время исчезновения (кадры)
 * @desc Сколько кадров длится плавное исчезновение. 60 кадров = 1 секунда.
 * @type number
 * @min 0
 * @default 60
 *
 * @param Fallback Images
 * @text Запасные файлы (через запятую)
 * @desc Если автопоиск папки не сработал, укажите файлы вручную. Пример: 1.png, 2.png
 * @type text
 * @default 
 */

(function() {

    // ========================================================================
    // ЧТЕНИЕ ПАРАМЕТРОВ ИЗ ИНТЕРФЕЙСА MV
    // ========================================================================
    var parameters = PluginManager.parameters('RandomSplash');
    
    var FADE_IN_TIME = Number(parameters['Fade In Time']) || 60;
    var WAIT_TIME = Number(parameters['Wait Time']) || 120;
    var FADE_OUT_TIME = Number(parameters['Fade Out Time']) || 60;
    
    // Парсим строку с файлами (разделяем по запятой и убираем пробелы)
    var fallbackString = String(parameters['Fallback Images'] || '');
    var FALLBACK_IMAGES = fallbackString.split(',').map(function(item) {
        return item.trim();
    }).filter(function(item) {
        return item.length > 0;
    });

    var SPLASH_URL = 'img/splash/';

    // ========================================================================
    // МЕНЕДЖЕР ПОИСКА СЛУЧАЙНОЙ КАРТИНКИ
    // ========================================================================
    var Splash = {};
    Splash._files = null;

    Splash.candidateDirs = function(fs, path) {
        var dirs = [];
        var add = function(p) { if (p && dirs.indexOf(p) === -1) dirs.push(p); };
        try { if (typeof __dirname !== 'undefined') add(path.resolve(__dirname, '..', '..', 'img', 'splash')); } catch (e) {}
        try {
            if (process.mainModule && process.mainModule.filename) {
                var mainDir = path.dirname(process.mainModule.filename);
                add(path.resolve(mainDir, 'img', 'splash'));
                add(path.resolve(mainDir, '..', 'img', 'splash'));
                add(path.resolve(mainDir, '..', '..', 'img', 'splash'));
            }
        } catch (e) {}
        try {
            var cwd = process.cwd();
            add(path.resolve(cwd, 'www', 'img', 'splash'));
            add(path.resolve(cwd, 'img', 'splash'));
            add(path.resolve(cwd, '..', 'img', 'splash'));
        } catch (e) {}
        return dirs;
    };

    Splash.scan = function() {
        var files = [];
        if (typeof require === 'undefined') return files;
        try {
            var fs = require('fs');
            var path = require('path');
            var dirs = this.candidateDirs(fs, path);
            for (var i = 0; i < dirs.length; i++) {
                try {
                    if (!fs.existsSync(dirs[i])) continue;
                    var list = fs.readdirSync(dirs[i]);
                    var found = [];
                    for (var j = 0; j < list.length; j++) {
                        var ext = path.extname(list[j]).toLowerCase();
                        if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.webp') found.push(list[j]);
                    }
                    if (found.length > 0) { files = found; break; }
                } catch (e) {}
            }
        } catch (e) {}
        return files;
    };

    Splash.getFiles = function() {
        if (this._files === null) {
            this._files = this.scan();
            // Если сканирование не нашло файлов, используем те, что указаны в параметрах плагина
            if (this._files.length === 0 && FALLBACK_IMAGES.length > 0) {
                this._files = FALLBACK_IMAGES;
                console.log('[RandomSplash] Используются файлы из параметров плагина: ' + this._files.join(', '));
            }
        }
        return this._files;
    };

    Splash.getRandomUrl = function() {
        var files = this.getFiles();
        if (files.length === 0) return '';
        var file = files[Math.floor(Math.random() * files.length)];
        return SPLASH_URL + file;
    };

    // ========================================================================
    // ПЕРЕХВАТ ЗАГРУЗКИ
    // ========================================================================
    var _Scene_Boot_start = Scene_Boot.prototype.start;
    Scene_Boot.prototype.start = function() {
        if (Splash.getFiles().length > 0 && !DataManager.isBattleTest() && !DataManager.isEventTest()) {
            SceneManager.goto(Scene_RandomSplash);
        } else {
            _Scene_Boot_start.call(this);
        }
    };

    // ========================================================================
    // НАША СЦЕНА СПЛЭША
    // ========================================================================
    function Scene_RandomSplash() {
        this.initialize.apply(this, arguments);
    }

    Scene_RandomSplash.prototype = Object.create(Scene_Base.prototype);
    Scene_RandomSplash.prototype.constructor = Scene_RandomSplash;

    Scene_RandomSplash.prototype.initialize = function() {
        Scene_Base.prototype.initialize.call(this);
        this._waitTime = WAIT_TIME;
        this._fadeoutStarted = false;
        this._fadeinStarted = false;
        this._imageReady = false;
        this._loadCheckFrames = 0;
    };

    Scene_RandomSplash.prototype.create = function() {
        Scene_Base.prototype.create.call(this);
        
        // Чёрный фон
        var bgBitmap = new Bitmap(Graphics.width, Graphics.height);
        bgBitmap.fillAll('black');
        this.addChild(new Sprite(bgBitmap));

        var url = Splash.getRandomUrl();
        if (!url) return;

        var bitmap = Bitmap.load(url);
        this._splashSprite = new Sprite(bitmap);
        
        // Изначально картинка полностью прозрачна
        this._splashSprite.opacity = 0;
        this._splashSprite.x = 0;
        this._splashSprite.y = 0;
        this.addChild(this._splashSprite);

        var self = this;
        bitmap.addLoadListener(function() {
            if (bitmap.width > 0 && bitmap.height > 0) {
                // Растягиваем на весь экран
                self._splashSprite.scale.x = Graphics.width / bitmap.width;
                self._splashSprite.scale.y = Graphics.height / bitmap.height;
                
                self._imageReady = true;
            }
        });
    };

    Scene_RandomSplash.prototype.start = function() {
        Scene_Base.prototype.start.call(this);
        SceneManager.clearStack();
    };

    Scene_RandomSplash.prototype.update = function() {
        if (!this._imageReady) {
            this._loadCheckFrames++;
            if (this._loadCheckFrames > 180) {
                this.gotoTitleOrTest();
                return;
            }
            Scene_Base.prototype.update.call(this);
            return;
        }

        // --- ЛОГИКА ПЛАВНОГО ПОЯВЛЕНИЯ ---
        if (!this._fadeinStarted) {
            this._fadeinStarted = true;
            this._fadeWait = FADE_IN_TIME;
        }

        if (this._fadeWait > 0 && !this._fadeoutStarted) {
            this._fadeWait--;
            // Защита от деления на ноль, если Fade In Time = 0
            if (FADE_IN_TIME > 0) {
                this._splashSprite.opacity = 255 - (this._fadeWait / FADE_IN_TIME * 255);
            } else {
                this._splashSprite.opacity = 255;
            }
        } 
        else if (!this._fadeoutStarted) {
            this._splashSprite.opacity = 255;
            if (this._waitTime > 0) {
                this._waitTime--;
            } else {
                this._fadeoutStarted = true;
                this._fadeWait = FADE_OUT_TIME;
            }
        }

        // --- ЛОГИКА ПЛАВНОГО ИСЧЕЗНОВЕНИЯ ---
        if (this._fadeoutStarted) {
            if (this._fadeWait > 0) {
                this._fadeWait--;
                // Защита от деления на ноль, если Fade Out Time = 0
                if (FADE_OUT_TIME > 0) {
                    this._splashSprite.opacity = (this._fadeWait / FADE_OUT_TIME * 255);
                } else {
                    this._splashSprite.opacity = 0;
                }
            } else {
                this._splashSprite.opacity = 0;
                this.gotoTitleOrTest();
            }
        }

        Scene_Base.prototype.update.call(this);
    };

    Scene_RandomSplash.prototype.gotoTitleOrTest = function() {
        Scene_Base.prototype.start.call(this);
        SoundManager.preloadImportantSounds();
        
        if (DataManager.isBattleTest()) {
            DataManager.setupBattleTest();
            SceneManager.goto(Scene_Battle);
        } else if (DataManager.isEventTest()) {
            DataManager.setupEventTest();
            SceneManager.goto(Scene_Map);
        } else {
            this.checkPlayerLocation();
            DataManager.setupNewGame();
            SceneManager.goto(Scene_Title);
            Window_TitleCommand.initCommandPosition();
        }
        this.updateDocumentTitle();
    };

    Scene_RandomSplash.prototype.updateDocumentTitle = function() {
        document.title = $dataSystem.gameTitle;
    };

    Scene_RandomSplash.prototype.checkPlayerLocation = function() {
        if ($dataSystem.startMapId === 0) {
            throw new Error('Player\'s starting position is not set');
        }
    };

})();