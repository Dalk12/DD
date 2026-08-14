//=============================================================================
// EnemyHPViewer.js v7
//=============================================================================
/*:
 * @plugindesc Полосы HP/брони под врагами (с порогами) + команды управления EHP.
 * @author Assistant
 *
 * @param HP Threshold
 * @desc Показывать HP бар если HP врага > этого значения
 * @default 0
 *
 * @param HP Bar Width
 * @desc Ширина полосы HP по умолчанию
 * @default 140
 *
 * @param HP Bar Color
 * @desc Цвет полосы HP по умолчанию (hex: #rrggbb)
 * @default #4caf50
 *
 * @param Y Offset
 * @desc Вертикальное смещение по умолчанию
 * @default 0
 *
 * @param Armor Threshold
 * @desc Показывать полосу брони если значение > этого
 * @default 0
 *
 * @param Armor Max
 * @desc Значение брони, считаемое полной полосой
 * @default 200
 *
 * @param Armor Bar Color
 * @desc Цвет полосы брони по умолчанию
 * @default #d0d0d0
 *
 * @param Magic Armor Threshold
 * @desc Показывать полосу маг. брони если значение > этого
 * @default 0
 *
 * @param Magic Armor Max
 * @desc Значение маг. брони, считаемое полной полосой
 * @default 200
 *
 * @param Magic Armor Bar Color
 * @desc Цвет полосы маг. брони по умолчанию
 * @default #7f7fff
 *
 * @help
 * Полосы показываются только если значение > порога (настраивается).
 * Полоса HP исчезает после смерти врага.
 *
 * === КОМАНДЫ (Plugin Command) ===
 * Номер врага = позиция в отряде (1..8). 0 = все враги.
 *
 *   EHP on / EHP off          включить/выключить ВСЕ полосы глобально
 *   EHP hide 2 / EHP show 2   скрыть/показать полосу врага №2
 *   EHP color 2 #ff00ff       цвет полосы HP врага №2
 *   EHP width 2 220           ширина полосы HP (20..800)
 *   EHP height 2 8            толщина полосы HP (1..40)
 *   EHP offset 2 -10          сдвиг по вертикали (+ вниз, - вверх)
 *   EHP armor 0 on            включить полоски брони всем
 *   EHP armor 2 off           выключить полоску брони врагу №2
 *   EHP marmor 0 on           включить полоски маг. брони всем
 *   EHP marmor 1 off          выключить полоску маг. брони врагу №1
 *   EHP armorcolor #ffa500    цвет полоски брони (глобально)
 *   EHP marmorcolor #6666ff   цвет полоски маг. брони (глобально)
 *   EHP reset 2               сброс настроек врага №2
 *   EHP resetAll              сброс всех настроек врагов
 *
 * Настройки врагов сбрасываются в конце боя. EHP on/off и цвета — постоянные.
 */

(function () {
    'use strict';

    console.log('>>> EnemyHPViewer v7 LOADED');

    var params = PluginManager.parameters('EnemyHPViewer');
    var HP_THRESHOLD = Number(params['HP Threshold'] || 0);
    var BAR_W = Number(params['HP Bar Width'] || 140);
    var HP_COLOR = String(params['HP Bar Color'] || '#4caf50');
    var Y_OFFSET = Number(params['Y Offset'] || 0);
    var ARMOR_THRESHOLD = Number(params['Armor Threshold'] || 0);
    var ARMOR_MAX = Number(params['Armor Max'] || 200);
    var MARMOR_THRESHOLD = Number(params['Magic Armor Threshold'] || 0);
    var MARMOR_MAX = Number(params['Magic Armor Max'] || 200);
    var BAR_H = 5;

    var MASTER_ON = true;
    var COLORS = { 
        armor: String(params['Armor Bar Color'] || '#d0d0d0'), 
        marmor: String(params['Magic Armor Bar Color'] || '#7f7fff') 
    };
    var SETTINGS = {};

    function cfgFor(idx) {
        if (!SETTINGS[idx]) SETTINGS[idx] = {};
        return SETTINGS[idx];
    }

    function eachIdx(idx, fn) {
        if (idx === 0) {
            for (var i = 1; i <= 8; i++) fn(cfgFor(i));
        } else if (idx >= 1 && idx <= 8) {
            fn(cfgFor(idx));
        }
    }

    // =========================================================================
    // Plugin Commands: EHP ...
    // =========================================================================
    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function (command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command !== 'EHP') return;

        var sub = String(args[0] || '').toLowerCase();
        var idx = parseInt(args[1], 10) || 0;

        if (sub === 'on')  { MASTER_ON = true;  return; }
        if (sub === 'off') { MASTER_ON = false; return; }
        if (sub === 'resetall') {
            for (var k in SETTINGS) delete SETTINGS[k];
            return;
        }
        if (sub === 'armorcolor' && /^#[0-9a-fA-F]{6}$/.test(args[1] || '')) {
            COLORS.armor = args[1];
            return;
        }
        if (sub === 'marmorcolor' && /^#[0-9a-fA-F]{6}$/.test(args[1] || '')) {
            COLORS.marmor = args[1];
            return;
        }

        eachIdx(idx, function (cfg) {
            switch (sub) {
                case 'hide':  cfg.hidden = true;  break;
                case 'show':  cfg.hidden = false; break;
                case 'armor':  cfg.armor  = (String(args[2] || '').toLowerCase() === 'on'); break;
                case 'marmor': cfg.marmor = (String(args[2] || '').toLowerCase() === 'on'); break;
                case 'color':
                    if (/^#[0-9a-fA-F]{6}$/.test(args[2] || '')) cfg.color = args[2];
                    break;
                case 'width':
                    var w = parseInt(args[2], 10);
                    if (w >= 20 && w <= 800) cfg.width = w;
                    break;
                case 'height':
                    var h = parseInt(args[2], 10);
                    if (h >= 1 && h <= 40) cfg.height = h;
                    break;
                case 'offset':
                    var o = parseInt(args[2], 10);
                    if (!isNaN(o)) cfg.offset = o;
                    break;
                case 'reset':
                    for (var key in cfg) delete cfg[key];
                    break;
            }
        });
    };

    var _Scene_Battle_terminate = Scene_Battle.prototype.terminate;
    Scene_Battle.prototype.terminate = function () {
        _Scene_Battle_terminate.call(this);
        for (var k in SETTINGS) delete SETTINGS[k];
    };

    // =========================================================================
    // Видимый низ картинки врага
    // =========================================================================
    function visibleBottom(bitmap) {
        if (bitmap._ehpVB !== undefined) return bitmap._ehpVB;
        var vb = bitmap.height;
        try {
            var w = bitmap.width, h = bitmap.height;
            var data = bitmap._context.getImageData(0, 0, w, h).data;
            outer:
            for (var y = h - 1; y >= 0; y -= 2) {
                for (var x = 0; x < w; x += 4) {
                    if (data[(y * w + x) * 4 + 3] > 10) {
                        vb = y + 1;
                        break outer;
                    }
                }
            }
        } catch (e) {
            vb = bitmap.height;
        }
        bitmap._ehpVB = vb;
        return vb;
    }

    function drawStatBar(bmp, value, max, color, label, x0, barW, y) {
        var h = 4;
        bmp.fontSize = 10;
        bmp.textColor = color;
        bmp.drawText(label, x0 - 16, y - 3, 12, 12, 'center');
        bmp.fillRect(x0, y, barW, h, '#333333');
        var rate = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
        if (rate > 0) bmp.fillRect(x0, y, Math.floor(barW * rate), h, color);
        bmp.textColor = '#ffffff';
        bmp.drawText(String(value), x0 + barW + 6, y - 4, 40, 12, 'left');
    }

    // =========================================================================
    // Sprite_Enemy
    // =========================================================================
    var _Sprite_Enemy_initialize = Sprite_Enemy.prototype.initialize;
    Sprite_Enemy.prototype.initialize = function (battler) {
        _Sprite_Enemy_initialize.call(this, battler);

        this._ehpSprite = new Sprite(new Bitmap(BAR_W + 90, BAR_H + 40));
        this._ehpSprite.anchor.x = 0.5;
        this._ehpSprite.anchor.y = 0;
        this._ehpSig = '';
        this._ehpBmpW = 0;
        this._ehpBmpH = 0;
    };

    var _Sprite_Enemy_update = Sprite_Enemy.prototype.update;
    Sprite_Enemy.prototype.update = function () {
        _Sprite_Enemy_update.call(this);
        this.ehpUpdate();
    };

    Sprite_Enemy.prototype.ehpUpdate = function () {
        var e = this._enemy;
        if (!e || !this._ehpSprite) return;

        if (!this._ehpSprite.parent && this.parent) {
            this.parent.addChild(this._ehpSprite);
        }

        // Глобальный выключатель
        if (!MASTER_ON) {
            this._ehpSprite.visible = false;
            return;
        }

        var bmp = this.bitmap;
        if (!bmp || !bmp.isReady() || bmp.height <= 0) {
            this._ehpSprite.visible = false;
            return;
        }

        var idx = (typeof e.index === 'function') ? e.index() + 1 : 0;
        var cfg = SETTINGS[idx] || {};

        var barW = cfg.width || BAR_W;
        var barH = cfg.height || BAR_H;
        var off = (cfg.offset !== undefined) ? cfg.offset : Y_OFFSET;

        var frac = visibleBottom(bmp) / bmp.height;
        this._ehpSprite.x = this.x;
        this._ehpSprite.y = this.y + (frac - this.anchor.y) * this.height + off;

        // Мёртвый / скрытый — полос нет
        var show = !e.isHidden() && !cfg.hidden && !e.isDead();
        this._ehpSprite.visible = show;
        if (!show) return;

        // Проверяем пороги
        var showHP = e.hp > HP_THRESHOLD;
        var showArmor = cfg.armor && e.def > ARMOR_THRESHOLD;
        var showMarmor = cfg.marmor && e.mdf > MARMOR_THRESHOLD;
        
        // Если ничего не показывать, скрываем спрайт
        if (!showHP && !showArmor && !showMarmor) {
            this._ehpSprite.visible = false;
            return;
        }

        var bmpW = barW + 90;
        var bmpH = barH + 40;
        if (this._ehpBmpW !== bmpW || this._ehpBmpH !== bmpH) {
            this._ehpSprite.bitmap = new Bitmap(bmpW, bmpH);
            this._ehpBmpW = bmpW;
            this._ehpBmpH = bmpH;
            this._ehpSig = '';
        }

        var sig = [e.hp, e.mhp, e.def, e.mdf, barW, barH,
            cfg.color || '', cfg.armor ? 1 : 0, cfg.marmor ? 1 : 0,
            COLORS.armor, COLORS.marmor].join('|');
        if (sig === this._ehpSig) return;
        this._ehpSig = sig;

        var bar = this._ehpSprite.bitmap;
        bar.clear();

        var x0 = (bmpW - barW) / 2;
        var ay = barH + 22;
        var currentY = 0;

        // HP (если выше порога)
        if (showHP) {
            var rate = e.mhp > 0 ? Math.max(0, e.hp / e.mhp) : 0;
            bar.fillRect(x0, currentY, barW, barH, '#333333');
            if (rate > 0) {
                var color = cfg.color || HP_COLOR;
                bar.fillRect(x0, currentY, Math.floor(barW * rate), barH, color);
            }
            bar.fontSize = 12;
            bar.textColor = '#ffffff';
            bar.drawText(e.hp + '/' + e.mhp, 0, currentY + barH + 2, bmpW, 16, 'center');
            currentY += barH + 20;
        }

        // Броня (если включена и выше порога)
        if (showArmor) {
            drawStatBar(bar, e.def, ARMOR_MAX, COLORS.armor, 'Ф', x0, barW, currentY);
            currentY += 9;
        }

        // Маг. броня (если включена и выше порога)
        if (showMarmor) {
            drawStatBar(bar, e.mdf, MARMOR_MAX, COLORS.marmor, 'М', x0, barW, currentY);
        }
    };

})();