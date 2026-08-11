//=============================================================================
// PSV.js v14
//=============================================================================
/*:
 * @plugindesc Просмотр эффектов партии в бою (v14). R / кнопка "Эффекты".
 * @author Assistant
 * @help
 * Открыть: R или кнопка "Эффекты". Закрыть: R / Esc / X / ПКМ.
 * Состояния с приоритетом 0 в списке не показываются.
 */

(function () {
    'use strict';

    var VERSION = 14;

    if (window.__BSV_VERSION) {
        console.warn('!!! РЯДОМ ВИСИТ СТАРЫЙ плагин состояний (v' + window.__BSV_VERSION +
            ')! Удали его из js/plugins и из Plugin Manager!');
    }
    window.__BSV_VERSION = VERSION;
    console.log('>>> PSV v' + VERSION + ' LOADED');

    Input.keyMapper[82] = 'ps_r';

    // Состояния с приоритетом 0 считаем скрытыми и не показываем
    function visibleStates(actor) {
        if (!actor || !actor.states) return [];
        return actor.states().filter(function (st) {
            return st && st.priority !== 0;
        });
    }

    // =========================================================================
    // Список героев
    // =========================================================================
    function Window_StatePartyList() {
        this.initialize.apply(this, arguments);
    }
    Window_StatePartyList.prototype = Object.create(Window_Selectable.prototype);
    Window_StatePartyList.prototype.constructor = Window_StatePartyList;

    Window_StatePartyList.prototype.initialize = function (x, y, width, height) {
        this._actors = [];
        Window_Selectable.prototype.initialize.call(this, x, y, width, height);
    };

    Window_StatePartyList.prototype.refreshList = function () {
        var members = ($gameParty && $gameParty.battleMembers()) ? $gameParty.battleMembers() : [];
        this._actors = members.slice();
        this.refresh();
        if (this._actors.length > 0 && this.index() < 0) this.select(0);
    };

    Window_StatePartyList.prototype.maxItems = function () {
        return this._actors ? this._actors.length : 0;
    };

    Window_StatePartyList.prototype.drawItem = function (index) {
        if (!this._actors || !this._actors[index]) return;
        var actor = this._actors[index];
        var rect = this.itemRectForText(index);

        this.changeTextColor(actor.isDead() ? '#888888' : '#ffffff');
        this.drawText(actor.name(), rect.x, rect.y, rect.width - 110, 'left');
        this.resetTextColor();

        var states = visibleStates(actor);
        for (var i = 0; i < states.length && i < 4; i++) {
            this.drawIcon(
                states[i].iconIndex || 0,
                rect.x + rect.width - (i + 1) * Window_Base._iconWidth - 2,
                rect.y + 2
            );
        }
    };

    Window_StatePartyList.prototype.getActor = function () {
        if (!this._actors) return null;
        return this._actors[this.index()] || null;
    };

    // =========================================================================
    // Детали эффектов
    // =========================================================================
    function Window_StateDetail() {
        this.initialize.apply(this, arguments);
    }
    Window_StateDetail.prototype = Object.create(Window_Base.prototype);
    Window_StateDetail.prototype.constructor = Window_StateDetail;

    Window_StateDetail.prototype.initialize = function (x, y, width, height) {
        Window_Base.prototype.initialize.call(this, x, y, width, height);
        this._actor = null;
    };

    Window_StateDetail.prototype.setActor = function (actor) {
        if (this._actor !== actor) {
            this._actor = actor;
            this.refresh();
        }
    };

    Window_StateDetail.prototype.refresh = function () {
        this.contents.clear();
        var lh = this.lineHeight();

        if (!this._actor) {
            this.changeTextColor('#aaaaaa');
            this.drawText('Выберите героя', 0, 0, this.contents.width, 'center');
            this.resetTextColor();
        } else {
            var actor = this._actor;
            var y = 0;

            this.changeTextColor('#ffd700');
            this.drawText(actor.name(), 0, y, this.contents.width, 'center');
            this.resetTextColor();
            y += lh;

            this.changeTextColor(this.hpColor(actor));
            this.drawText('HP ' + actor.hp + '/' + actor.mhp, 0, y, this.contents.width / 2, 'center');
            this.changeTextColor(this.mpColor(actor));
            this.drawText('MP ' + actor.mp + '/' + actor.mmp, this.contents.width / 2, y, this.contents.width / 2, 'center');
            this.resetTextColor();
            y += lh + 6;

            this.contents.fillRect(0, y, this.contents.width, 2, '#555555');
            y += 10;

            var states = visibleStates(actor);
            if (!states || states.length === 0) {
                this.changeTextColor('#aaaaaa');
                this.drawText('Нет активных эффектов', 0, y, this.contents.width, 'center');
                this.resetTextColor();
            } else {
                for (var i = 0; i < states.length; i++) {
                    if (y + lh * 2 > this.contents.height - lh) break;
                    this.drawStateEntry(states[i], y);
                    y += lh * 2 + 6;
                }
            }
        }

        this.changeTextColor('#66ff66');
        this.drawText('Закрыть: R / Esc / X / ПКМ',
            0, this.contents.height - lh, this.contents.width, 'center');
        this.resetTextColor();
    };

    // Иконка + название + оставшиеся ходы + описание
    Window_StateDetail.prototype.drawStateEntry = function (state, y) {
        if (!state) return;
        var lh = this.lineHeight();
        this.drawIcon(state.iconIndex || 0, 4, y + (lh - Window_Base._iconHeight) / 2);

        var nameX = 4 + Window_Base._iconWidth + 6;
        var maxW = this.contents.width - nameX;

        this.drawText(state.name || '???', nameX, y, maxW - 70, 'left');

        // Реальный оставшийся счётчик ходов движка
        var raw;
        if (this._actor) {
            if (this._actor._stateTurns && this._actor._stateTurns[state.id] !== undefined) {
                raw = this._actor._stateTurns[state.id];
            } else if (typeof this._actor.stateTurns === 'function') {
                raw = this._actor.stateTurns(state.id);
            }
        }
        var turnsText = (raw !== undefined && raw > 0) ? (raw + ' ход.') : '∞';

        this.changeTextColor('#ff9966');
        this.drawText(turnsText, nameX, y, maxW, 'right');
        this.resetTextColor();

        var desc = (state.description || '').replace(/∞/g, '');
        if (desc) {
            this.changeTextColor('#bbbbbb');
            this.drawText(desc, nameX, y + lh, maxW, 'left');
            this.resetTextColor();
        }
    };

    // =========================================================================
    // Scene_Battle
    // =========================================================================
    var _Scene_Battle_createAllWindows = Scene_Battle.prototype.createAllWindows;
    Scene_Battle.prototype.createAllWindows = function () {
        _Scene_Battle_createAllWindows.call(this);
        this._svOpen = false;
        this._svPrev = null;
        this.createStateOverlay();
    };

    Scene_Battle.prototype.createStateOverlay = function () {
        var pad = 20;
        var listW = 200;
        var listH = 180;
        var detailW = Graphics.boxWidth - listW - pad * 3;
        var detailH = Graphics.boxHeight - pad * 2;

        this._svList = new Window_StatePartyList(pad, pad, listW, listH);
        this._svDetail = new Window_StateDetail(pad + listW + pad, pad, detailW, detailH);

        this._svList.hide();
        this._svDetail.hide();
        this._svList.deactivate();

        this.addChild(this._svList);
        this.addChild(this._svDetail);
    };

    var _Window_PartyCommand_makeCommandList = Window_PartyCommand.prototype.makeCommandList;
    Window_PartyCommand.prototype.makeCommandList = function () {
        _Window_PartyCommand_makeCommandList.call(this);
        this.addCommand('Эффекты', 'psStates');
    };

    var _Scene_Battle_createPartyCommandWindow = Scene_Battle.prototype.createPartyCommandWindow;
    Scene_Battle.prototype.createPartyCommandWindow = function () {
        _Scene_Battle_createPartyCommandWindow.call(this);
        this._partyCommandWindow.setHandler('psStates', this.svOpen.bind(this));
    };

    Scene_Battle.prototype.svOpen = function () {
        if (this._svOpen || !this._svList) return;

        this._svPrev = null;
        if (this._partyCommandWindow && this._partyCommandWindow.active) this._svPrev = this._partyCommandWindow;
        if (this._actorCommandWindow && this._actorCommandWindow.active) this._svPrev = this._actorCommandWindow;
        this.svFreeze();

        this._svList.refreshList();
        this._svList.show();
        this._svList.activate();
        this._svDetail.show();
        this._svDetail.setActor(this._svList.getActor());
        this._svOpen = true;
        SoundManager.playOk();
    };

    Scene_Battle.prototype.svClose = function () {
        if (!this._svOpen) return;

        this._svList.hide();
        this._svList.deactivate();
        this._svDetail.hide();
        this._svOpen = false;

        if (this._svPrev) {
            this._svPrev.activate();
            this._svPrev = null;
        }
        SoundManager.playCancel();
    };

    Scene_Battle.prototype.svFreeze = function () {
        var ws = [
            this._partyCommandWindow,
            this._actorCommandWindow,
            this._enemyWindow,
            this._actorWindow,
            this._skillWindow,
            this._itemWindow
        ];
        for (var i = 0; i < ws.length; i++) {
            if (ws[i] && ws[i].active) ws[i].deactivate();
        }
    };

    var _Scene_Battle_update = Scene_Battle.prototype.update;
    Scene_Battle.prototype.update = function () {
        _Scene_Battle_update.call(this);
        if (!this._svList) return;

        if (this._svOpen) {
            this.svFreeze();
            this._svDetail.setActor(this._svList.getActor());
            this._svDetail.refresh();

            if (Input.isTriggered('ps_r') ||
                Input.isTriggered('escape') ||
                Input.isTriggered('cancel') ||
                TouchInput.isCancelled()) {
                this.svClose();
            }
        } else {
            if (Input.isTriggered('ps_r')) {
                this.svOpen();
            }
        }
    };

})();