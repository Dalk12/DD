//=============================================================================
// HelpWindowPlus.js
//=============================================================================
/*:
 * @plugindesc Увеличивает окно описания до N строк + автоперенос текста.
 * @author Assistant
 *
 * @param Lines
 * @desc Количество строк окна описания (стандартно 2)
 * @default 4
 *
 * @param Word Wrap
 * @desc Автоперенос длинного текста по словам: true / false
 * @default true
 *
 * @help
 * Окно описания (Help Window) становится выше и переносит текст по словам.
 * Действует в меню предметов, умений, магазине и в бою.
 * Текстовые коды \C[2], \I[1] и т.п. продолжают работать.
 */

(function () {
    'use strict';

    console.log('>>> HelpWindowPlus LOADED');

    var params = PluginManager.parameters('HelpWindowPlus');
    var LINES = Math.max(1, Number(params['Lines'] || 4));
    var WRAP = String(params['Word Wrap'] || 'true').toLowerCase() === 'true';

    // Высота окна: принудительно LINES строк во всех сценах
    var _Window_Help_initialize = Window_Help.prototype.initialize;
    Window_Help.prototype.initialize = function (numLines) {
        _Window_Help_initialize.call(this, LINES);
    };

    Window_Help.prototype.numVisibleRows = function () {
        return LINES;
    };

    // Отрисовка с переносом по словам
    var _Window_Help_refresh = Window_Help.prototype.refresh;
    Window_Help.prototype.refresh = function () {
        this.contents.clear();

        if (!WRAP) {
            this.drawTextEx(this._text, this.textPadding(), 0);
            return;
        }

        var lines = wrapHelpText(this, this._text || '');
        var max = Math.min(lines.length, this.numVisibleRows());
        for (var i = 0; i < max; i++) {
            this.drawTextEx(lines[i], this.textPadding(), i * this.lineHeight());
        }
    };

    // Приблизительная ширина строки с учётом кодов (для переноса)
    function approxWidth(win, text) {
        var t = text
            .replace(/\\[Cc]\[\d+\]/g, '')      // цвета не занимают место
            .replace(/\\[Ii]\[\d+\]/g, '○○')    // иконка ~ 36px
            .replace(/\\[{}]/g, '');            // смена размера шрифта
        return win.contents.measureTextWidth(t);
    }

    function wrapHelpText(win, text) {
        var maxW = win.contents.width - win.textPadding() * 2;
        var paragraphs = String(text).split('\n');
        var lines = [];

        for (var p = 0; p < paragraphs.length; p++) {
            var words = paragraphs[p].split(' ');
            var line = '';

            for (var i = 0; i < words.length; i++) {
                var test = line ? line + ' ' + words[i] : words[i];
                if (approxWidth(win, test) > maxW && line) {
                    lines.push(line);
                    line = words[i];
                } else {
                    line = test;
                }
            }
            lines.push(line);
        }
        return lines;
    }

})();