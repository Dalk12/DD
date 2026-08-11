//=============================================================================
// BattleStateViewer.js v3.0
//=============================================================================
/*:
 * @plugindesc Просмотр эффектов партии в бою по кнопке R. Исправлена ошибка length.
 * @author Assistant
 * @help
 * ============================================================================
 * НАЖМИТЕ R (латинская) В БОЮ чтобы открыть/закрыть панель состояний.
 * Выберите героя стрелками или мышью → справа появятся его эффекты.
 * Esc или повторное R — закрыть.
 * Описания берутся из поля "Описание" состояния в Базе Данных.
 * ============================================================================
 */

(function () {
    'use strict';

    // =========================================================================
    // Window_StatePartyList
    // =========================================================================
    function Window_StatePartyList() {
        this.initialize.apply(this, arguments);
    }
    Window_StatePartyList.prototype = Object.create(Window_Selectable.prototype);
    Window_StatePartyList.prototype.constructor = Window_StatePartyList;

    Window_StatePartyList.prototype.initialize = function (x, y, width, height) {
        // Инициализируем массив ДО вызова родительского initialize,
        // чтобы maxItems() не упал при первом refresh()
        this._actors = [];
        Window_Selectable.prototype.initialize.call(this, x, y, width, height);
    };

    Window_StatePartyList.prototype.refreshList = function () {
        var members = $gameParty ? $gameParty.battleMembers() : [];
        this._actors = members ? members.slice() : [];
        this.refresh();
        if (this._actors.length > 0 && this.index() < 0) {
            this.select(0);
        }
    };

    Window_StatePartyList.prototype.maxItems = function () {
        return this._actors ? this._actors.length : 0;
    };

    Window_StatePartyList.prototype.drawItem = function (index) {
        if (!this._actors || !this._actors[index]) return;
        var actor = this._actors[index];
        var rect = this.itemRectForText(index);
        this.changeTextColor(actor.isDead() ? '#888888' : '#ffffff');
        this.drawText(actor.name(), rect.x, rect.y, rect.width, 'left');
        this.resetTextColor();
    };

    Window_StatePartyList.prototype.getActor = function () {
        if (!this._actors) return null;
        return this._actors[this.index()] || null;
    };

    // =========================================================================
    // Window_StateDetail
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
        if (!this._actor) {
            this.changeTextColor('#aaaaaa');
            this.drawText('Выберите героя', 0, 0, this.contents.width, 'center');
            this.resetTextColor();
            return;
        }

        var lh = this.lineHeight();
        var y = 0;

        this.changeTextColor('#ffd700');
        this.drawText(this._actor.name(), 0, y, this.contents.width, 'center');
        this.resetTextColor();
        y += lh + 8;

        this.contents.fillRect(0, y, this.contents.width, 2, '#555555');
        y += 10;

        var states = this._actor.states ? this._actor.states() : [];
        if (!states || states.length === 0) {
            this.changeTextColor('#aaaaaa');
            this.drawText('Нет активных эффектов', 0, y, this.contents.width, 'center');
            this.resetTextColor();
            return;
        }

        for (var i = 0; i < states.length; i++) {
            if (y + lh * 2 > this.contents.height) break;
            this.drawStateEntry(states[i], y);
            y += lh * 2 + 6;
        }
    };

    Window_StateDetail.prototype.drawStateEntry = function (state, y) {
        if (!state) return;
        var lh = this.lineHeight();
        var iconY = y + (lh - Window_Base._iconHeight) / 2;
        this.drawIcon(state.iconIndex || 0, 4, iconY);

        var nameX = 4 + Window_Base._iconWidth + 6;
        var maxW = this.contents.width - nameX;

        this.drawText(state.name || '???', nameX, y, maxW - 60, 'left');

        var turnsText = '';
        if (this._actor && this._actor.isStateTurns && this._actor.isStateTurns(state.id)) {
            turnsText = (this._actor.stateTurns ? this._actor.stateTurns(state.id) : '?') + ' ход.';
        } else {
            turnsText = '∞';
        }
        this.changeTextColor('#ff9966');
        this.drawText(turnsText, nameX, y, maxW, 'right');
        this.resetTextColor();

        var desc = state.description || '';
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
        this._svKeyLock = false;
        this.createStateOverlay();
    };

    Scene_Battle.prototype.createStateOverlay = function () {
        var pad = 20;
        var listW = 180;
        var detailW = Graphics.boxWidth - listW - pad * 3;
        var winH = Graphics.boxHeight - pad * 2;
        var winY = pad;

        this._svList = new Window_StatePartyList(pad, winY, listW, winH);
        this._svDetail = new Window_StateDetail(pad + listW + pad, winY, detailW, winH);

        this._svList.hide();
        this._svDetail.hide();
        this._svList.deactivate();

        this.addChild(this._svList);
        this.addChild(this._svDetail);
    };

    Scene_Battle.prototype.svOpen = function () {
        this._svList.refreshList();
        this._svList.show();
        this._svList.activate();
        this._svDetail.show();
        this._svDetail.setActor(this._svList.getActor());
        this._svOpen = true;
        SoundManager.playOk();
    };

    Scene_Battle.prototype.svClose = function () {
        this._svList.hide();
        this._svList.deactivate();
        this._svDetail.hide();
        this._svOpen = false;
        SoundManager.playCancel();
    };

    Scene_Battle.prototype.svUpdateDetail = function () {
        var actor = this._svList.getActor();
        this._svDetail.setActor(actor);
    };

    // =========================================================================
    // Клавиатурный listener
    // =========================================================================
    var _Scene_Battle_start = Scene_Battle.prototype.start;
    Scene_Battle.prototype.start = function () {
        _Scene_Battle_start.call(this);

        var self = this;
        this._svKeyDownHandler = function (e) {
            if (!self.active) return;

            if (e.keyCode === 82) { // R
                e.preventDefault();
                e.stopPropagation();
                if (self._svKeyLock) return;
                self._svKeyLock = true;

                if (self._svOpen) {
                    self.svClose();
                } else {
                    self.svOpen();
                }
            }

            if (e.keyCode === 27 && self._svOpen) { // Esc
                e.preventDefault();
                e.stopPropagation();
                self.svClose();
            }
        };

        this._svKeyUpHandler = function (e) {
            if (e.keyCode === 82) {
                self._svKeyLock = false;
            }
        };

        document.addEventListener('keydown', this._svKeyDownHandler, true);
        document.addEventListener('keyup', this._svKeyUpHandler, true);
    };

    var _Scene_Battle_terminate = Scene_Battle.prototype.terminate;
    Scene_Battle.prototype.terminate = function () {
        _Scene_Battle_terminate.call(this);
        if (this._svKeyDownHandler) {
            document.removeEventListener('keydown', this._svKeyDownHandler, true);
        }
        if (this._svKeyUpHandler) {
            document.removeEventListener('keyup', this._svKeyUpHandler, true);
        }
    };

    var _Scene_Battle_update = Scene_Battle.prototype.update;
    Scene_Battle.prototype.update = function () {
        _Scene_Battle_update.call(this);
        if (this._svOpen) {
            this.svUpdateDetail();
        }
    };

})();