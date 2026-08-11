//=============================================================================
// DotaQuiz.js v2.1 (с отладкой)
//=============================================================================
/*:
 * @plugindesc Викторина по Dota 2: 155 вопросов, 10 за игру, таймер 15 сек.
 * @author Assistant
 *
 * @param Questions Per Game
 * @desc Сколько вопросов за одну викторину
 * @default 10
 *
 * @param Time Limit
 * @desc Секунд на один вопрос
 * @default 15
 *
 * @param Gold Correct
 * @desc Награда за верный ответ
 * @default 300
 *
 * @param Gold Wrong
 * @desc Штраф за неверный ответ
 * @default 350
 *
 * @param Currency Name
 * @desc Название валюты в тексте (например, "золота", "ММР", "очков")
 * @default ММР
 *
 * @param Result Variable ID
 * @desc Переменная: 1 если все ответы верны, иначе 0
 * @default 10
 *
 * @help
 * Plugin Command:  quiz
 * Script:          SceneManager.push(Scene_DotaQuiz);
 *
 * После викторины в указанную переменную пишется 1 (всё верно) или 0.
 */

var Imported = Imported || {};
Imported.DotaQuiz = true;

(function () {
    'use strict';

    console.log('>>> DotaQuiz v2.1 LOADED');

    var parameters = PluginManager.parameters('DotaQuiz');
    
    // === ОТЛАДКА: выводим что реально читается из параметров ===
    console.log('>>> Параметры плагина:');
    console.log('  Gold Correct (raw):', parameters['Gold Correct']);
    console.log('  Gold Wrong (raw):', parameters['Gold Wrong']);
    console.log('  Currency Name (raw):', parameters['Currency Name']);
    
    var CONFIG = {
        perGame: Number(parameters['Questions Per Game'] || 10),
        timeSec: Number(parameters['Time Limit'] || 15),
        goldOk: Number(parameters['Gold Correct'] || 300),
        goldNo: Number(parameters['Gold Wrong'] || 350),
        currency: String(parameters['Currency Name'] || 'ММР'),
        varId: Number(parameters['Result Variable ID'] || 10)
    };
    
    // === ОТЛАДКА: выводим что получилось после парсинга ===
    console.log('>>> CONFIG после парсинга:');
    console.log('  CONFIG.goldOk:', CONFIG.goldOk);
    console.log('  CONFIG.goldNo:', CONFIG.goldNo);
    console.log('  CONFIG.currency:', CONFIG.currency);

    // ... (остальной код без изменений) ...
    var QUESTIONS = [
        // EASY (40)
        { q: "Угадай героя: 'Зелёный мясник с крюком и тесаком'.", a: ["Pudge", "Axe", "Undying", "Lifestealer"], correct: 0, diff: "easy" },
        { q: "Угадай героя: 'Эльфийка-лучница с ледяными стрелами'.", a: ["Drow Ranger", "Windranger", "Mirana", "Luna"], correct: 0, diff: "easy" },
        { q: "Угадай героя: 'Маг, собирающий заклинания из трёх сфер'.", a: ["Invoker", "Rubick", "Tinker", "Zeus"], correct: 0, diff: "easy" },
        { q: "Угадай героя: 'Рыцарь, внутри которого живёт дракон'.", a: ["Dragon Knight", "Sven", "Abaddon", "Chaos Knight"], correct: 0, diff: "easy" },
        { q: "Угадай героя: 'Хитрый убийца с двумя кинжалами и вечной невидимостью'.", a: ["Riki", "Bounty Hunter", "Clinkz", "Phantom Assassin"], correct: 0, diff: "easy" },
        { q: "Угадай героя: 'Пьяный мастер, распадающийся на трёх стихийных воинов'.", a: ["Brewmaster", "Lone Druid", "Ember Spirit", "Storm Spirit"], correct: 0, diff: "easy" },
        { q: "Угадай героя: 'Гоблин с бензопилой и крюком-лезвием'.", a: ["Timbersaw", "Clockwerk", "Tinker", "Techies"], correct: 0, diff: "easy" },
        { q: "Угадай героя: 'Пиратский адмирал, командующий призрачным кораблём'.", a: ["Kunkka", "Tidehunter", "Slardar", "Medusa"], correct: 0, diff: "easy" },
        { q: "Угадай героя: 'Двухголовый дракон, дышащий льдом и огнём'.", a: ["Jakiro", "Winter Wyvern", "Viper", "Phoenix"], correct: 0, diff: "easy" },
        { q: "Угадай героя: 'Лучница на белом тигре со священной стрелой через всю карту'.", a: ["Mirana", "Luna", "Drow Ranger", "Windranger"], correct: 0, diff: "easy" },
        { q: "Какой предмет мгновенно телепортирует героя на короткое расстояние?", a: ["Blink Dagger", "Force Staff", "Town Portal Scroll", "Aether Lens"], correct: 0, diff: "easy" },
        { q: "Какой предмет воскрешает героя на месте после смерти?", a: ["Aegis of the Immortal", "Cheese", "Refresher Orb", "Heart of Tarrasque"], correct: 0, diff: "easy" },
        { q: "Какой предмет превращает врага в безобидное животное?", a: ["Scythe of Vyse", "Lotus Orb", "Eul's Scepter", "Orchid"], correct: 0, diff: "easy" },
        { q: "Какой предмет даёт постоянный обзор невидимых юнитов вокруг себя?", a: ["Gem of True Sight", "Dust of Appearance", "Sentry Ward", "Shadow Blade"], correct: 0, diff: "easy" },
        { q: "Что даёт Black King Bar при активации?", a: ["Невосприимчивость к магии", "Невидимость", "Огромную броню", "Вампиризм"], correct: 0, diff: "easy" },
        { q: "Какой основной атрибут у Axe?", a: ["Сила", "Ловкость", "Интеллект", "Удача"], correct: 0, diff: "easy" },
        { q: "Какой основной атрибут у Crystal Maiden?", a: ["Интеллект", "Сила", "Ловкость", "Нет атрибута"], correct: 0, diff: "easy" },
        { q: "Какой основной атрибут у Juggernaut?", a: ["Ловкость", "Сила", "Интеллект", "Все сразу"], correct: 0, diff: "easy" },
        { q: "Кто роняет Aegis of the Immortal?", a: ["Roshan", "Древний", "Курьер", "Нейтральный крип"], correct: 0, diff: "easy" },
        { q: "Что роняет Roshan во второй раз помимо Аегиса?", a: ["Cheese", "Refresher Shard", "Divine Rapier", "Gem of True Sight"], correct: 0, diff: "easy" },
        { q: "Сколько героев играет в одной команде?", a: ["5", "4", "6", "10"], correct: 0, diff: "easy" },
        { q: "Как называется фракция Света?", a: ["Radiant", "Dire", "Scourge", "Sentinel"], correct: 0, diff: "easy" },
        { q: "Угадай героя: 'Снежная дева, замораживающая прикосновением'.", a: ["Crystal Maiden", "Winter Wyvern", "Lich", "Ancient Apparition"], correct: 0, diff: "easy" },
        { q: "Угадай героя: 'Рыжая ведьма, испепеляющая огнём'.", a: ["Lina", "Luna", "Morgana", "Witch Doctor"], correct: 0, diff: "easy" },
        { q: "Угадай героя: 'Мечник в маске с лечащим вихрем клинков'.", a: ["Juggernaut", "Phantom Assassin", "Sven", "Kunkka"], correct: 0, diff: "easy" },
        { q: "Угадай героя: 'Бородатый бог, карающий молниями с неба'.", a: ["Zeus", "Disruptor", "Skywrath Mage", "Storm Spirit"], correct: 0, diff: "easy" },
        { q: "Угадай героя: 'Каменный великан, швыряющий валуны и деревья'.", a: ["Tiny", "Earthshaker", "Sand King", "Golem"], correct: 0, diff: "easy" },
        { q: "Угадай героя: 'Жнец с косой, добивающий раненых'.", a: ["Necrophos", "Undying", "Bane", "Shadow Demon"], correct: 0, diff: "easy" },
        { q: "Угадай героя: 'Шаман со змеиными вардами и превращением в овцу'.", a: ["Shadow Shaman", "Witch Doctor", "Rubick", "Chen"], correct: 0, diff: "easy" },
        { q: "Угадай героя: 'Ледяной лич с прыгающим шаром смерти'.", a: ["Lich", "Crystal Maiden", "Bane", "Lion"], correct: 0, diff: "easy" },
        { q: "Какой предмет даёт урон и обжигает врагов вокруг героя?", a: ["Radiance", "Crimson Guard", "Shiva's Guard", "Blade Mail"], correct: 0, diff: "easy" },
        { q: "Какой предмет создаёт две иллюзии героя при активации?", a: ["Manta Style", "Diffusal Blade", "Eye of Skadi", "Butterfly"], correct: 0, diff: "easy" },
        { q: "Какой предмет подбрасывает героя в воздух вихрем, делая неуязвимым?", a: ["Eul's Scepter", "Cyclone", "Tornado Rod", "Aether Lens"], correct: 0, diff: "easy" },
        { q: "Какой предмет отражает направленное заклинание обратно во врага?", a: ["Lotus Orb", "Linken's Sphere", "Blade Mail", "Ghost Scepter"], correct: 0, diff: "easy" },
        { q: "На какую линию идёт 'мидер'?", a: ["Средняя", "Верхняя", "Нижняя", "В лес"], correct: 0, diff: "easy" },
        { q: "Как называют крипов, живущих в лесу вне линий?", a: ["Нейтральные", "Лейтовые", "Мегакрипы", "Древние"], correct: 0, diff: "easy" },
        { q: "Угадай героя: 'Друид с боевым медведем-напарником'.", a: ["Lone Druid", "Beastmaster", "Lycan", "Chen"], correct: 0, diff: "easy" },
        { q: "Что делает Town Portal Scroll?", a: ["Телепорт к союзному зданию", "Лечит героя", "Даёт обзор", "Ускоряет бег"], correct: 0, diff: "easy" },
        { q: "База какой фракции находится в правом верхнем углу карты?", a: ["Dire", "Radiant", "Нейтралов", "Roshan"], correct: 0, diff: "easy" },
        { q: "Угадай героя: 'Охотник с капканом и топором, зовущий на дуэль'.", a: ["Legion Commander", "Axe", "Sven", "Ursa"], correct: 0, diff: "easy" },

        // MEDIUM (40)
        { q: "У какого героя способность 'Meat Hook'?", a: ["Pudge", "Clockwerk", "Timbersaw", "Slark"], correct: 0, diff: "medium" },
        { q: "У какого героя ультимейт 'Omnislash'?", a: ["Juggernaut", "Phantom Assassin", "Sven", "Ember Spirit"], correct: 0, diff: "medium" },
        { q: "У какого героя способность 'Finger of Death'?", a: ["Lion", "Lina", "Necrophos", "Bane"], correct: 0, diff: "medium" },
        { q: "У какого героя ультимейт 'Mana Void'?", a: ["Anti-Mage", "Silencer", "Outworld Devourer", "Nyx Assassin"], correct: 0, diff: "medium" },
        { q: "У какого героя ультимейт 'Echo Slam'?", a: ["Earthshaker", "Earth Spirit", "Sand King", "Magnus"], correct: 0, diff: "medium" },
        { q: "У какого героя ультимейт 'Chronosphere'?", a: ["Faceless Void", "Weaver", "Enigma", "Oracle"], correct: 0, diff: "medium" },
        { q: "У какого героя ультимейт 'Duel'?", a: ["Legion Commander", "Axe", "Sven", "Troll Warlord"], correct: 0, diff: "medium" },
        { q: "У какого героя ультимейт 'Track'?", a: ["Bounty Hunter", "Bloodseeker", "Riki", "Clinkz"], correct: 0, diff: "medium" },
        { q: "У какого героя ультимейт 'Assassinate'?", a: ["Sniper", "Phantom Assassin", "Bounty Hunter", "Windranger"], correct: 0, diff: "medium" },
        { q: "У какого героя ультимейт 'Requiem of Souls'?", a: ["Shadow Fiend", "Necrophos", "Spectre", "Bane"], correct: 0, diff: "medium" },
        { q: "У какого героя способность 'Pounce'?", a: ["Slark", "Slardar", "Riki", "Weaver"], correct: 0, diff: "medium" },
        { q: "У какого героя способность 'Rip Tide'?", a: ["Tidehunter", "Kunkka", "Slardar", "Naga Siren"], correct: 0, diff: "medium" },
        { q: "У какого героя ультимейт 'Laguna Blade'?", a: ["Lina", "Lion", "Leshrac", "Zeus"], correct: 0, diff: "medium" },
        { q: "У какого героя способность 'Lucent Beam'?", a: ["Luna", "Mirana", "Lina", "Skywrath Mage"], correct: 0, diff: "medium" },
        { q: "У какого героя способность 'Hex' (превращение в животное)?", a: ["Shadow Shaman", "Witch Doctor", "Rubick", "Lion"], correct: 0, diff: "medium" },
        { q: "У какого героя способность 'Ice Path'?", a: ["Jakiro", "Crystal Maiden", "Lich", "Tusk"], correct: 0, diff: "medium" },
        { q: "У какого героя ультимейт 'Static Storm'?", a: ["Disruptor", "Zeus", "Skywrath Mage", "Storm Spirit"], correct: 0, diff: "medium" },
        { q: "У какого героя ультимейт 'Flaming Lasso'?", a: ["Batrider", "Phoenix", "Ember Spirit", "Doom"], correct: 0, diff: "medium" },
        { q: "У какого героя ультимейт 'Life Break'?", a: ["Huskar", "Lifestealer", "Bristleback", "Ursa"], correct: 0, diff: "medium" },
        { q: "У какого героя способность 'Phantom Strike'?", a: ["Phantom Assassin", "Phantom Lancer", "Riki", "Spectre"], correct: 0, diff: "medium" },
        { q: "У какого героя способность 'Dragon Tail'?", a: ["Dragon Knight", "Viper", "Jakiro", "Winter Wyvern"], correct: 0, diff: "medium" },
        { q: "У какого героя способность 'Sprout' (стена деревьев)?", a: ["Nature's Prophet", "Treant Protector", "Tiny", "Enchantress"], correct: 0, diff: "medium" },
        { q: "У какого героя ультимейт 'Viper Strike'?", a: ["Viper", "Medusa", "Venomancer", "Slark"], correct: 0, diff: "medium" },
        { q: "У какого героя способность 'Frost Arrows'?", a: ["Drow Ranger", "Crystal Maiden", "Mirana", "Luna"], correct: 0, diff: "medium" },
        { q: "У какого героя способность 'Skewer' (протыкание врага)?", a: ["Magnus", "Sand King", "Earth Spirit", "Centaur"], correct: 0, diff: "medium" },
        { q: "У какого героя ультимейт 'Reverse Polarity'?", a: ["Magnus", "Enigma", "Tidehunter", "Vacuum"], correct: 0, diff: "medium" },
        { q: "У какого героя способность 'Sacred Arrow'?", a: ["Mirana", "Drow Ranger", "Windranger", "Luna"], correct: 0, diff: "medium" },
        { q: "У какого героя способность 'Rocket Flare'?", a: ["Clockwerk", "Tinker", "Gyrocopter", "Timbersaw"], correct: 0, diff: "medium" },
        { q: "У какого героя способность 'Overpower'?", a: ["Ursa", "Lifestealer", "Troll Warlord", "Juggernaut"], correct: 0, diff: "medium" },
        { q: "У какого героя аура 'Heartstopper Aura'?", a: ["Axe", "Bristleback", "Pudge", "Undying"], correct: 0, diff: "medium" },
        { q: "У какого героя способность 'Purification'?", a: ["Omniknight", "Chen", "Oracle", "Dazzle"], correct: 0, diff: "medium" },
        { q: "У какого героя способность 'Soul Rip'?", a: ["Undying", "Necrophos", "Abaddon", "Lich"], correct: 0, diff: "medium" },
        { q: "У какого героя способность 'Tornado'?", a: ["Invoker", "Storm Spirit", "Disruptor", "Windranger"], correct: 0, diff: "medium" },
        { q: "У какого героя способность 'Scream of Pain'?", a: ["Queen of Pain", "Bane", "Death Prophet", "Vengeful Spirit"], correct: 0, diff: "medium" },
        { q: "У какого героя способность 'Venomous Gale'?", a: ["Venomancer", "Viper", "Alchemist", "Plague Ward"], correct: 0, diff: "medium" },
        { q: "Какой предмет при активации даёт безумие: скорость атаки, но больше урона по себе?", a: ["Mask of Madness", "Helm of the Dominator", "Vladmir's Offering", "Sange"], correct: 0, diff: "medium" },
        { q: "Какие ботинки дают активацию с прохождением сквозь юнитов и ускорением?", a: ["Phase Boots", "Power Treads", "Tranquil Boots", "Arcane Boots"], correct: 0, diff: "medium" },
        { q: "Какой предмет при активации лечит и даёт броню союзникам вокруг?", a: ["Mekansm", "Pipe of Insight", "Guardian Greaves", "Vladmir's Offering"], correct: 0, diff: "medium" },
        { q: "Какой предмет при активации сбрасывает перезарядку способностей?", a: ["Refresher Orb", "Aghanim's Scepter", "Octarine Core", "Linken's Sphere"], correct: 0, diff: "medium" },
        { q: "Какой предмет при активации отталкивает героя вперёд (двигает сквозь препятствия)?", a: ["Force Staff", "Blink Dagger", "Hurricane Pike", "Eul's Scepter"], correct: 0, diff: "medium" },

        // HARD (50)
        { q: "У какого героя способность 'Maledict'?", a: ["Witch Doctor", "Necrophos", "Venomancer", "Bane"], correct: 0, diff: "hard" },
        { q: "У какого героя способность 'Astral Imprisonment'?", a: ["Outworld Devourer", "Pugna", "Obsidian Destroyer", "Shadow Demon"], correct: 0, diff: "hard" },
        { q: "У какого героя ультимейт 'Sanity's Eclipse'?", a: ["Outworld Devourer", "Silencer", "Enigma", "Rubick"], correct: 0, diff: "hard" },
        { q: "У какого героя способность 'Last Word'?", a: ["Silencer", "Oracle", "Drow Ranger", "Invoker"], correct: 0, diff: "hard" },
        { q: "У какого героя ультимейт 'Global Silence'?", a: ["Silencer", "Death Prophet", "Drow Ranger", "Skywrath Mage"], correct: 0, diff: "hard" },
        { q: "У какого героя способность 'Nethertoxin'?", a: ["Viper", "Venomancer", "Ursa", "Slark"], correct: 0, diff: "hard" },
        { q: "У какого героя способность 'Relocate'?", a: ["Io", "Nature's Prophet", "Chen", "Oracle"], correct: 0, diff: "hard" },
        { q: "У какого героя способность 'Tether'?", a: ["Io", "Oracle", "Dazzle", "Chen"], correct: 0, diff: "hard" },
        { q: "У какого героя ультимейт 'Solar Guardian'?", a: ["Oracle", "Io", "Abaddon", "Omniknight"], correct: 0, diff: "hard" },
        { q: "У какого героя способность 'Fortune's End'?", a: ["Oracle", "Bounty Hunter", "Chen", "Silencer"], correct: 0, diff: "hard" },
        { q: "У какого героя способность 'Laser'?", a: ["Tinker", "Zeus", "Skywrath Mage", "Leshrac"], correct: 0, diff: "hard" },
        { q: "У какого героя способность 'March of the Machines'?", a: ["Tinker", "Clockwerk", "Techies", "Gyrocopter"], correct: 0, diff: "hard" },
        { q: "У какого героя способность 'Rearm' (перезарядка всего)?", a: ["Tinker", "Clockwerk", "Techies", "Rubick"], correct: 0, diff: "hard" },
        { q: "У какого героя способность 'Sand Storm'?", a: ["Sand King", "Earth Spirit", "Nyx Assassin", "Clinkz"], correct: 0, diff: "hard" },
        { q: "У какого героя способность 'Caustic Finale'?", a: ["Sand King", "Venomancer", "Viper", "Alchemist"], correct: 0, diff: "hard" },
        { q: "У какого героя способность 'Spiked Carapace'?", a: ["Nyx Assassin", "Slardar", "Bristleback", "Centaur"], correct: 0, diff: "hard" },
        { q: "У какого героя ультимейт 'Vendetta'?", a: ["Nyx Assassin", "Riki", "Bounty Hunter", "Clinkz"], correct: 0, diff: "hard" },
        { q: "У какого героя способность 'Brain Sap'?", a: ["Bane", "Shadow Demon", "Necrophos", "Pugna"], correct: 0, diff: "hard" },
        { q: "У какого героя ультимейт 'Fiend's Grip'?", a: ["Bane", "Enigma", "Shadow Shaman", "Witch Doctor"], correct: 0, diff: "hard" },
        { q: "У какого героя способность 'Nightmare'?", a: ["Bane", "Dark Willow", "Naga Siren", "Hypnos"], correct: 0, diff: "hard" },
        { q: "Какой предмет отражает направленные заклинания обратно в заклинателя?", a: ["Lotus Orb", "Linken's Sphere", "Blade Mail", "Aeon Disk"], correct: 0, diff: "hard" },
        { q: "Какой предмет делает героя нематериальным (иммунитет к физике, уязвимость к магии)?", a: ["Ghost Scepter", "Eul's Scepter", "Shadow Blade", "Glimmer Cape"], correct: 0, diff: "hard" },
        { q: "Какой предмет сжигает ману врага при каждой атаке?", a: ["Diffusal Blade", "Maelstrom", "Desolator", "Abyssal Blade"], correct: 0, diff: "hard" },
        { q: "Какой предмет при активации выпускает ледяную волну, замедляющую врагов вокруг?", a: ["Shiva's Guard", "Radiance", "Crimson Guard", "Heart of Tarrasque"], correct: 0, diff: "hard" },
        { q: "Какой предмет при активации даёт ускорение и скорость атаки союзникам вокруг?", a: ["Drum of Endurance", "Mekansm", "Pipe of Insight", "Vladmir's Offering"], correct: 0, diff: "hard" },
        { q: "Какая руна делает героя невидимым?", a: ["Rune of Invisibility", "Rune of Haste", "Rune of Illusion", "Rune of Bounty"], correct: 0, diff: "hard" },
        { q: "Какая руна восстанавливает здоровье и ману со временем?", a: ["Rune of Regeneration", "Rune of Arcane", "Rune of Bounty", "Rune of Haste"], correct: 0, diff: "hard" },
        { q: "Какая руна даёт максимальную скорость передвижения?", a: ["Rune of Haste", "Rune of Speed", "Rune of Wind", "Rune of Swift"], correct: 0, diff: "hard" },
        { q: "Какая руна создаёт иллюзии твоего героя?", a: ["Rune of Illusion", "Rune of Mischief", "Rune of Double Damage", "Rune of Phantom"], correct: 0, diff: "hard" },
        { q: "Что даёт руна Bounty?", a: ["Золото команде", "Опыт", "Урон", "Обзор"], correct: 0, diff: "hard" },
        { q: "На патче 7.00 сколько секунд длится активная способность Сатаника (Unholy Rage)?", a: ["5 секунд", "4 секунды", "6 секунд", "3 секунды"], correct: 0, diff: "hard" },
        { q: "На патче 6.88 сколько брони снижал Desolator?", a: ["-7 брони", "-6 брони", "-5 брони", "-8 брони"], correct: 0, diff: "hard" },
        { q: "Сколько урона в секунду наносила аура Radiance на патче 6.88?", a: ["45", "40", "50", "60"], correct: 0, diff: "hard" },
        { q: "Сколько секунд длится хекс (Scythe of Vyse) на героях в классических патчах?", a: ["3.5 секунды", "3 секунды", "4 секунды", "2.5 секунды"], correct: 0, diff: "hard" },
        { q: "Сколько дополнительного урона давал Divine Rapier на патче 7.00?", a: ["+330", "+300", "+350", "+250"], correct: 0, diff: "hard" },
        { q: "Сколько урона давал Monkey King Bar на патче 7.00?", a: ["+88", "+66", "+99", "+100"], correct: 0, diff: "hard" },
        { q: "Сколько секунд длится эффект 'Break' от Silver Edge на патче 7.07?", a: ["5 секунд", "4 секунды", "6 секунд", "3 секунды"], correct: 0, diff: "hard" },
        { q: "Сколько урона наносил Shadow Blade (активация Backstab) на патче 7.00?", a: ["175", "150", "200", "125"], correct: 0, diff: "hard" },
        { q: "Сколько секунд действует активная способность Pipe of Insight (барьер) на патче 7.00?", a: ["15 секунд", "12 секунд", "10 секунд", "20 секунд"], correct: 0, diff: "hard" },
        { q: "Угадай героя: 'Я демон, заточенный в Фолфелле, сбежавший, украв своё отражение'.", a: ["Terrorblade", "Shadow Fiend", "Doom", "Lifestealer"], correct: 0, diff: "hard" },
        { q: "У какого героя есть способность 'Split Earth'?", a: ["Leshrac", "Earthshaker", "Sand King", "Tiny"], correct: 0, diff: "hard" },
        { q: "У какого героя есть способность 'Essence Shift'?", a: ["Slark", "Anti-Mage", "Silencer", "Outworld Devourer"], correct: 0, diff: "hard" },
        { q: "У какого героя есть способность 'Hand of God'?", a: ["Chen", "Omniknight", "Abaddon", "Dazzle"], correct: 0, diff: "hard" },
        { q: "У какого героя есть способность 'Diabolic Edict'?", a: ["Leshrac", "Lina", "Invoker", "Tinker"], correct: 0, diff: "hard" },
        { q: "У какого героя есть способность 'Borrowed Time'?", a: ["Abaddon", "Oracle", "Dazzle", "Omniknight"], correct: 0, diff: "hard" },
        { q: "У какого героя есть способность 'False Promise'?", a: ["Oracle", "Abaddon", "Dazzle", "Io"], correct: 0, diff: "hard" },
        { q: "У какого героя есть способность 'Overcharge'?", a: ["Io (Wisp)", "Oracle", "Abaddon", "Omniknight"], correct: 0, diff: "hard" },
        { q: "У какого героя есть способность 'Ice Vortex'?", a: ["Ancient Apparition", "Crystal Maiden", "Lich", "Winter Wyvern"], correct: 0, diff: "hard" },
        { q: "У какого героя есть способность 'Chilling Touch'?", a: ["Ancient Apparition", "Lich", "Crystal Maiden", "Jakiro"], correct: 0, diff: "hard" },
        { q: "У какого героя есть способность 'Cold Feet'?", a: ["Ancient Apparition", "Crystal Maiden", "Lich", "Winter Wyvern"], correct: 0, diff: "hard" },

        // ULTRA (25)
        { q: "У какого героя способность 'Enfeeble'?", a: ["Bane", "Silencer", "Shadow Shaman", "Witch Doctor"], correct: 0, diff: "ultra" },
        { q: "У какого героя способность 'Sinister Gaze'?", a: ["Shadow Shaman", "Bane", "Shadow Fiend", "Dazzle"], correct: 0, diff: "ultra" },
        { q: "У какого героя ультимейт 'Primal Split'?", a: ["Brewmaster", "Lone Druid", "Earth Spirit", "Storm Spirit"], correct: 0, diff: "ultra" },
        { q: "У какого героя способность 'Drunken Brawler'?", a: ["Brewmaster", "Troll Warlord", "Ursa", "Juggernaut"], correct: 0, diff: "ultra" },
        { q: "У какого героя способность 'Storm Hammer'?", a: ["Sven", "Tiny", "Magnus", "Wraith King"], correct: 0, diff: "ultra" },
        { q: "У какого героя ультимейт 'God's Strength'?", a: ["Sven", "Axe", "Troll Warlord", "Chaos Knight"], correct: 0, diff: "ultra" },
        { q: "У какого героя ультимейт 'Borrowed Time'?", a: ["Abaddon", "Oracle", "Dazzle", "Omniknight"], correct: 0, diff: "ultra" },
        { q: "У какого героя способность 'Mist Coil'?", a: ["Abaddon", "Wraith King", "Lich", "Undying"], correct: 0, diff: "ultra" },
        { q: "У какого героя ультимейт 'Haunt'?", a: ["Spectre", "Phantom Lancer", "Nyx Assassin", "Riki"], correct: 0, diff: "ultra" },
        { q: "У какого героя способность 'Dispersion'?", a: ["Spectre", "Medusa", "Abaddon", "Axe"], correct: 0, diff: "ultra" },
        { q: "Какая способность Invoker требует комбинации всех трёх сфер (Quas, Wex, Exort)?", a: ["Deafening Blast", "Chaos Meteor", "Sun Strike", "Tornado"], correct: 0, diff: "ultra" },
        { q: "Как называется ульта героя Meepo?", a: ["Divided We Stand", "Earthbind", "Poof", "Megameepo"], correct: 0, diff: "ultra" },
        { q: "Какой герой имеет способность Relocate, телепортирующую его и союзника?", a: ["Io", "Nature's Prophet", "Enigma", "Chen"], correct: 0, diff: "ultra" },
        { q: "Как называется ульта героя Grimstroke?", a: ["Dark Portrait", "Stroke of Fate", "Phantom's Embrace", "Ink Creature"], correct: 0, diff: "ultra" },
        { q: "Какой герой имеет наибольшее количество способностей в игре?", a: ["Invoker", "Rubick", "Morphling", "Chen"], correct: 0, diff: "ultra" },
        { q: "У какого героя есть способность 'Cold Embrace'?", a: ["Winter Wyvern", "Crystal Maiden", "Lich", "Abaddon"], correct: 0, diff: "ultra" },
        { q: "У какого героя есть способность 'Splinter Blast'?", a: ["Winter Wyvern", "Lich", "Crystal Maiden", "Ancient Apparition"], correct: 0, diff: "ultra" },
        { q: "У какого героя есть способность 'Magnetic Field'?", a: ["Arc Warden", "Tinker", "Invoker", "Zeus"], correct: 0, diff: "ultra" },
        { q: "У какого героя есть способность 'Tempest Double'?", a: ["Arc Warden", "Meepo", "Phantom Lancer", "Naga Siren"], correct: 0, diff: "ultra" },
        { q: "У какого героя есть способность 'Spark Wraith'?", a: ["Arc Warden", "Tinker", "Zeus", "Disruptor"], correct: 0, diff: "ultra" },
        { q: "У какого героя есть способность 'Flux'?", a: ["Arc Warden", "Tinker", "Invoker", "Zeus"], correct: 0, diff: "ultra" },
        { q: "У какого героя есть способность 'Geostrike'?", a: ["Meepo", "Sand King", "Earthshaker", "Brewmaster"], correct: 0, diff: "ultra" },
        { q: "У какого героя есть способность 'Juxtapose'?", a: ["Phantom Lancer", "Naga Siren", "Chaos Knight", "Meepo"], correct: 0, diff: "ultra" },
        { q: "У какого героя есть способность 'Doppelganger'?", a: ["Phantom Lancer", "Shadow Fiend", "Naga Siren", "Meepo"], correct: 0, diff: "ultra" },
        { q: "У какого героя есть способность 'Stifling Dagger'?", a: ["Bounty Hunter", "Riki", "Clinkz", "Phantom Assassin"], correct: 0, diff: "ultra" }
    ];

    function shuffle(a) {
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

    function prepareQuestion(q) {
        var answers = q.a.slice();
        var correctText = answers[q.correct];
        var idx = shuffle([0, 1, 2, 3]);
        var newAnswers = idx.map(function (i) { return answers[i]; });
        return { q: q.q, a: newAnswers, correct: newAnswers.indexOf(correctText), diff: q.diff };
    }

    function pickQuestions() {
        var total = CONFIG.perGame;
        var plan = [
            { diff: 'easy', count: Math.floor(total * 0.4) },
            { diff: 'medium', count: Math.floor(total * 0.3) },
            { diff: 'hard', count: Math.floor(total * 0.2) },
            { diff: 'ultra', count: Math.floor(total * 0.1) }
        ];
        var sum = plan.reduce(function (s, p) { return s + p.count; }, 0);
        var i = 0;
        while (sum < total) { plan[i % plan.length].count++; sum++; i++; }

        var result = [];
        plan.forEach(function (p) {
            var pool = QUESTIONS.filter(function (q) { return q.diff === p.diff; }).slice();
            shuffle(pool);
            result = result.concat(pool.slice(0, p.count).map(prepareQuestion));
        });
        return shuffle(result);
    }

    function drawWrappedText(win, text) {
        var c = win.contents, maxW = c.width, lines = [];
        var paras = text.split('\n');
        for (var p = 0; p < paras.length; p++) {
            var words = paras[p].split(' '), line = '';
            for (var i = 0; i < words.length; i++) {
                var test = line ? line + ' ' + words[i] : words[i];
                if (c.measureTextWidth(test) > maxW && line) { lines.push(line); line = words[i]; }
                else line = test;
            }
            if (line) lines.push(line);
        }
        for (var j = 0; j < lines.length; j++) {
            win.drawText(lines[j], 0, j * win.lineHeight(), maxW, 'center');
        }
    }

    function Window_DQHeader() { this.initialize.apply(this, arguments); }
    Window_DQHeader.prototype = Object.create(Window_Base.prototype);
    Window_DQHeader.prototype.constructor = Window_DQHeader;
    Window_DQHeader.prototype.initialize = function (x, y, w) {
        Window_Base.prototype.initialize.call(this, x, y, w, this.fittingHeight(1));
        this._n = 0; this._t = 0; this._d = '';
        this.refresh();
    };
    Window_DQHeader.prototype.setContent = function (n, t, d) { this._n = n; this._t = t; this._d = d; this.refresh(); };
    Window_DQHeader.prototype.refresh = function () {
        this.contents.clear();
        var names = { easy: 'Лёгкий', medium: 'Средний', hard: 'Сложный', ultra: 'Ультрасложный' };
        var text = this._d === 'end' ? 'Викторина завершена'
            : 'Вопрос ' + this._n + '/' + this._t + '   Сложность: ' + (names[this._d] || '');
        this.drawText(text, 0, 0, this.contents.width, 'center');
    };

    function Window_DQTimer() { this.initialize.apply(this, arguments); }
    Window_DQTimer.prototype = Object.create(Window_Base.prototype);
    Window_DQTimer.prototype.constructor = Window_DQTimer;
    Window_DQTimer.prototype.initialize = function (x, y, w) {
        Window_Base.prototype.initialize.call(this, x, y, w, 80);
        this._rem = 0; this._max = CONFIG.timeSec * 60;
        this.refresh();
    };
    Window_DQTimer.prototype.setRemaining = function (f) { if (this._rem !== f) { this._rem = f; this.refresh(); } };
    Window_DQTimer.prototype.refresh = function () {
        this.contents.clear();
        var sec = Math.max(0, Math.ceil(this._rem / 60));
        this.drawText('Время: ' + sec + ' сек', 0, 0, this.contents.width, 'center');
        var ratio = Math.max(0, this._rem / this._max);
        var bw = this.contents.width - 20, bh = 14, x = 10, y = this.contents.height - bh - 10;
        this.contents.fillRect(x, y, bw, bh, '#555555');
        var col = ratio > 0.5 ? '#4caf50' : (ratio > 0.25 ? '#ff9800' : '#f44336');
        this.contents.fillRect(x, y, Math.floor(bw * ratio), bh, col);
    };

    function Window_DQQuestion() { this.initialize.apply(this, arguments); }
    Window_DQQuestion.prototype = Object.create(Window_Base.prototype);
    Window_DQQuestion.prototype.constructor = Window_DQQuestion;
    Window_DQQuestion.prototype.initialize = function (x, y, w) {
        Window_Base.prototype.initialize.call(this, x, y, w, this.fittingHeight(5));
        this._text = '';
        this.refresh();
    };
    Window_DQQuestion.prototype.setText = function (t) { this._text = t; this.refresh(); };
    Window_DQQuestion.prototype.refresh = function () { this.contents.clear(); drawWrappedText(this, this._text); };

    function Window_DQChoices() { this.initialize.apply(this, arguments); }
    Window_DQChoices.prototype = Object.create(Window_Command.prototype);
    Window_DQChoices.prototype.constructor = Window_DQChoices;
    Window_DQChoices.prototype.initialize = function (x, y) {
        this._question = null; this._cb = null;
        Window_Command.prototype.initialize.call(this, x, y);
    };
    Window_DQChoices.prototype.windowWidth = function () { return Graphics.boxWidth - 40; };
    Window_DQChoices.prototype.numVisibleRows = function () { return 4; };
    Window_DQChoices.prototype.makeCommandList = function () {
        if (this._question) {
            for (var i = 0; i < this._question.a.length; i++) this.addCommand(this._question.a[i], 'ans');
        }
    };
    Window_DQChoices.prototype.setQuestion = function (q) { this._question = q; this.refresh(); };
    Window_DQChoices.prototype.setAnswerCallback = function (cb) { this._cb = cb; };
    Window_DQChoices.prototype.callOkHandler = function () { if (this._cb) this._cb(this.index()); };
    Window_DQChoices.prototype.processCancel = function () { };

    function Window_DQResult() { this.initialize.apply(this, arguments); }
    Window_DQResult.prototype = Object.create(Window_Base.prototype);
    Window_DQResult.prototype.constructor = Window_DQResult;
    Window_DQResult.prototype.initialize = function (x, y, w) {
        Window_Base.prototype.initialize.call(this, x, y, w, this.fittingHeight(5));
        this._text = '';
        this.refresh();
    };
    Window_DQResult.prototype.setText = function (t) { this._text = t; this.refresh(); };
    Window_DQResult.prototype.refresh = function () { this.contents.clear(); drawWrappedText(this, this._text); };

    function Scene_DotaQuiz() { this.initialize.apply(this, arguments); }
    Scene_DotaQuiz.prototype = Object.create(Scene_Base.prototype);
    Scene_DotaQuiz.prototype.constructor = Scene_DotaQuiz;

    Scene_DotaQuiz.prototype.initialize = function () { Scene_Base.prototype.initialize.call(this); };

    Scene_DotaQuiz.prototype.create = function () {
        Scene_Base.prototype.create.call(this);
        this._qs = pickQuestions();
        this._i = 0; this._ok = 0; this._no = 0;
        this._state = 'q'; this._wait = 0;
        this._timerFrames = CONFIG.timeSec * 60;

        this._bg = new Sprite(new Bitmap(Graphics.boxWidth, Graphics.boxHeight));
        this._bg.bitmap.fillRect(0, 0, Graphics.boxWidth, Graphics.boxHeight, '#16213e');
        this.addChild(this._bg);

        var w = Graphics.boxWidth - 40, x = 20, y = 20;
        this._wHead = new Window_DQHeader(x, y, w); y += this._wHead.height + 10;
        this._wTime = new Window_DQTimer(x, y, w); y += this._wTime.height + 10;
        this._wQ = new Window_DQQuestion(x, y, w); y += this._wQ.height + 10;
        this._wC = new Window_DQChoices(x, y);
        this._wC.setAnswerCallback(this.onAnswer.bind(this));
        this._wR = new Window_DQResult(x, y, w);
        this._wR.hide();

        this.addChild(this._wHead); this.addChild(this._wTime);
        this.addChild(this._wQ); this.addChild(this._wC); this.addChild(this._wR);

        this.showQuestion();
    };

    Scene_DotaQuiz.prototype.showQuestion = function () {
        var q = this._qs[this._i];
        this._state = 'q';
        this._timerFrames = CONFIG.timeSec * 60;
        this._wHead.setContent(this._i + 1, this._qs.length, q.diff);
        this._wQ.setText(q.q);
        this._wC.setQuestion(q);
        this._wTime.setRemaining(this._timerFrames);
        this._wTime.show();
        this._wR.hide();
        this._wC.show();
        this._wC.activate();
        this._wC.select(0);
    };

    Scene_DotaQuiz.prototype.onAnswer = function (idx) {
        if (this._state !== 'q') return;
        var q = this._qs[this._i];
        var good = (idx === q.correct);
        var text = '';
        this._wC.deactivate();

        if (good) {
            $gameParty.gainGold(CONFIG.goldOk);
            text = 'Верно! +' + CONFIG.goldOk + ' ' + CONFIG.currency;
            this._ok++;
            SoundManager.playOk();
        } else {
            $gameParty.loseGold(CONFIG.goldNo);
            text = (idx === -1 ? 'Время вышло! ' : 'Неверно! ') +
                '-' + CONFIG.goldNo + ' ' + CONFIG.currency + '\nПравильный ответ: ' + q.a[q.correct];
            this._no++;
            SoundManager.playBuzzer();
        }

        this._state = 'r';
        this._wait = 120;
        this._wC.hide();
        this._wR.setText(text);
        this._wR.show();
    };

    Scene_DotaQuiz.prototype.update = function () {
        Scene_Base.prototype.update.call(this);

        if (this._state === 'q') {
            if (this._timerFrames > 0) {
                this._timerFrames--;
                this._wTime.setRemaining(this._timerFrames);
                if (this._timerFrames <= 0) this.onAnswer(-1);
            }
        } else if (this._state === 'r') {
            if (this._wait > 0) {
                this._wait--;
                if (this._wait <= 0) {
                    this._i++;
                    if (this._i >= this._qs.length) this.showEnd();
                    else this.showQuestion();
                }
            }
        } else if (this._state === 'end') {
            if (Input.isTriggered('ok') || TouchInput.isTriggered()) this.popScene();
        }
    };

    Scene_DotaQuiz.prototype.showEnd = function () {
        this._state = 'end';
        var total = this._qs.length;
        var allOk = (this._no === 0);

        $gameVariables.setValue(CONFIG.varId, allOk ? 1 : 0);

        var net = this._ok * CONFIG.goldOk - this._no * CONFIG.goldNo;
        var text = 'Викторина завершена!\n' +
            'Правильных ответов: ' + this._ok + ' из ' + total + '\n' +
            'Изменение ' + CONFIG.currency + ': ' + (net >= 0 ? '+' : '') + net + '\n' +
            (allOk ? 'ИДЕАЛЬНО! Переменная = 1\n' : '') +
            'Нажмите OK, чтобы выйти.';

        this._wHead.setContent(total, total, 'end');
        this._wQ.setText(text);
        this._wTime.hide();
        this._wC.hide();
        this._wR.hide();
    };

    var _pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function (command, args) {
        _pluginCommand.call(this, command, args);
        if (String(command).toLowerCase() === 'quiz') {
            SceneManager.push(Scene_DotaQuiz);
        }
    };

})();