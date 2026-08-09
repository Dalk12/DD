//=============================================================================
// TransformEnemyByState.js (Absolute HP/MP Version)
//=============================================================================
/*:
 * @plugindesc Временно превращает врага в другого врага через состояние.
 * @help
 * Добавьте в заметки состояния строку:
 *   <TransformEnemy:ID>
 *
 * ID - ID врага из базы данных.
 * Длительность состояния определяет время превращения.
 *
 * ВАЖНО: В этой версии HP и MP сохраняются АБСОЛЮТНО.
 * Если у нового врага максимум меньше текущего значения,
 * HP/MP будут обрезаны до нового максимума.
 *
 * Пример:
 * <TransformEnemy:12>
 */
(function() {

    function getTransformEnemyId(state) {
        if (!state || !state.meta) return 0;

        if (state.meta.TransformEnemy !== undefined) {
            return parseInt(state.meta.TransformEnemy, 10) || 0;
        }

        if (state.meta['Transform Enemy'] !== undefined) {
            return parseInt(state.meta['Transform Enemy'], 10) || 0;
        }

        return 0;
    }

    Game_Enemy.prototype.setEnemyIdAndRefresh = function(enemyId) {
        if (!$dataEnemies[enemyId]) {
            console.warn('TransformEnemyByState: enemy ID ' + enemyId + ' not found');
            return;
        }

        this._enemyId = enemyId;

        var scene = SceneManager._scene;
        if (scene && scene._spriteset && scene._spriteset._enemySprites) {
            var sprites = scene._spriteset._enemySprites;
            for (var i = 0; i < sprites.length; i++) {
                if (sprites[i]._battler === this) {
                    sprites[i]._battlerName = '';
                }
            }
        }

        if ($gameTroop && typeof $gameTroop.makeUniqueNames === 'function') {
            $gameTroop.makeUniqueNames();
        }
    };

    Game_Enemy.prototype.applyEnemyTransform = function(newEnemyId) {
        if (!this.isAlive()) return;
        if (!$dataEnemies[newEnemyId]) return;

        // Запоминаем оригинальный ID только при первом превращении
        if (this._baseEnemyId === undefined) {
            this._baseEnemyId = this._enemyId;
        }

        // СОХРАНЯЕМ АБСОЛЮТНЫЕ ЗНАЧЕНИЯ ПЕРЕД СМЕНОЙ
        var currentHp = this.hp;
        var currentMp = this.mp;

        // Меняем врага
        this.setEnemyIdAndRefresh(newEnemyId);

        // ВОССТАНАВЛИВАЕМ АБСОЛЮТНЫЕ ЗНАЧЕНИЯ
        // Math.min гарантирует, что HP/MP не превысят новый максимум
        this.setHp(Math.min(currentHp, this.mhp));
        this.setMp(Math.min(currentMp, this.mmp));
    };

    Game_Enemy.prototype.removeEnemyTransform = function() {
        if (this._baseEnemyId === undefined) return;

        var originalId = this._baseEnemyId;
        delete this._baseEnemyId;

        if (!this.isAlive()) {
            this._enemyId = originalId;
            return;
        }

        // СОХРАНЯЕМ АБСОЛЮТНЫЕ ЗНАЧЕНИЯ ПЕРЕД ВОЗВРАТОМ
        var currentHp = this.hp;
        var currentMp = this.mp;

        // Возвращаем оригинального врага
        this.setEnemyIdAndRefresh(originalId);

        // ВОССТАНАВЛИВАЕМ АБСОЛЮТНЫЕ ЗНАЧЕНИЯ
        this.setHp(Math.min(currentHp, this.mhp));
        this.setMp(Math.min(currentMp, this.mmp));
    };

    var _Game_BattlerBase_addNewState = Game_BattlerBase.prototype.addNewState;
    Game_BattlerBase.prototype.addNewState = function(stateId) {
        var wasAffected = this.isStateAffected(stateId);

        _Game_BattlerBase_addNewState.call(this, stateId);

        if (!wasAffected && this.isStateAffected(stateId) && this.isEnemy()) {
            var newEnemyId = getTransformEnemyId($dataStates[stateId]);
            if (newEnemyId > 0) {
                this.applyEnemyTransform(newEnemyId);
            }
        }
    };

    var _Game_BattlerBase_removeState = Game_BattlerBase.prototype.removeState;
    Game_BattlerBase.prototype.removeState = function(stateId) {
        if (this.isEnemy() && this.isStateAffected(stateId)) {
            var transformEnemyId = getTransformEnemyId($dataStates[stateId]);
            if (transformEnemyId > 0) {
                this.removeEnemyTransform();
            }
        }

        _Game_BattlerBase_removeState.call(this, stateId);
    };

})();