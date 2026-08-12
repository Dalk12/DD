//=============================================================================
// PlayAnim.js v1
//=============================================================================
/*:
 * @plugindesc Вызов анимаций по ID на врагов или членов партии (Plugin Command).
 * @author Assistant
 *
 * @help
 * === КОМАНДЫ ПЛАГИНА ===
 *
 *   anim 47 enemy 1          анимация 47 на врага №1 (по позиции в отряде)
 *   anim 47 enemy 3          анимация 47 на врага №3
 *   anim 47 enemy all        анимация 47 на ВСЕХ врагов
 *   anim 12 party 2          анимация 12 на члена партии №2
 *   anim 12 party all        анимация 12 на всю партию
 *   anim 47 self             анимация 47 на текущего говорящего (в событии)
 *
 *   animWait 60              ждать 60 кадров (1 сек) после анимации
 *   animWait                 ждать пока все запущенные анимации закончатся
 *
 * Цели:
 *   enemy N   - враг по позиции в отряде (1..8)
 *   enemy all - все видимые враги
 *   party N   - член партии по индексу (1..4 обычно)
 *   party all - вся партия
 *   self      - событие, вызвавшее команду
 */

(function () {
    'use strict';

    console.log('>>> PlayAnim v1 LOADED');

    var findEnemy = function (idx) {
        if (!$gameTroop) return null;
        var enemies = $gameTroop.members().filter(function (e) {
            return e && !e.isHidden();
        });
        if (idx < 1 || idx > enemies.length) return null;
        return enemies[idx - 1];
    };

    var findParty = function (idx) {
        var members = $gameParty ? $gameParty.members() : [];
        if (idx < 1 || idx > members.length) return null;
        return members[idx - 1];
    };

    var playAnim = function (target, animId) {
        if (!target || !animId) return;
        if (target.startAnimation) {
            target.startAnimation(animId, false, 0);
        }
    };

    var _pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function (command, args) {
        _pluginCommand.call(this, command, args);

        if (String(command).toLowerCase() === 'anim') {
            var id = parseInt(args[0], 10);
            var type = String(args[1] || '').toLowerCase();
            var param = String(args[2] || '').toLowerCase();

            if (isNaN(id) || id <= 0) return;

            if (type === 'enemy') {
                if (param === 'all') {
                    if ($gameTroop) {
                        $gameTroop.members().forEach(function (e) {
                            if (e && !e.isHidden()) playAnim(e, id);
                        });
                    }
                } else {
                    var n = parseInt(param, 10);
                    if (!isNaN(n)) {
                        var e = findEnemy(n);
                        if (e) playAnim(e, id);
                    }
                }
            } else if (type === 'party') {
                if (param === 'all') {
                    $gameParty.members().forEach(function (m) {
                        playAnim(m, id);
                    });
                } else {
                    var n2 = parseInt(param, 10);
                    if (!isNaN(n2)) {
                        var m = findParty(n2);
                        if (m) playAnim(m, id);
                    }
                }
            } else if (type === 'self') {
                // Текущее событие
                var self = this.character();
                if (self) playAnim(self, id);
            }
        }

        if (String(command).toLowerCase() === 'animwait') {
            var frames = parseInt(args[0], 10);
            if (isNaN(frames) || frames <= 0) {
                // Ждать пока все анимации закончатся
                this.wait(1);
                var interp = this;
                interp._waitAnimCheck = true;
            } else {
                this.wait(frames);
            }
        }
    };

    // Если animWait без числа — ждём завершения всех анимаций
    var _updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
    Game_Interpreter.prototype.updateWaitMode = function () {
        if (this._waitAnimCheck) {
            var busy = false;

            if ($gameTroop) {
                $gameTroop.members().forEach(function (e) {
                    if (e && e._animations && e._animations.length > 0) busy = true;
                });
            }
            if ($gameParty) {
                $gameParty.members().forEach(function (m) {
                    if (m && m._animations && m._animations.length > 0) busy = true;
                });
            }
            if ($gameMap) {
                $gameMap.events().forEach(function (ev) {
                    if (ev._animationQueue && ev._animationQueue.length > 0) busy = true;
                });
                if ($gamePlayer._animationQueue && $gamePlayer._animationQueue.length > 0) busy = true;
            }

            if (!busy) {
                this._waitAnimCheck = false;
                return false;
            }
            return true;
        }
        return _updateWaitMode.call(this);
    };

})();