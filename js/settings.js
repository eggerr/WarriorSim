var SIM = SIM || {}

SIM.SETTINGS = {

    init: function () {
        var view = this;
        view.variables();
        view.events();
        view.buildSpells();
        view.buildBuffs();
        view.buildTalents();
    },

    variables: function () {
        var view = this;
        view.body = $('body');
        view.buffs = view.body.find('article.buffs');
        view.fight = view.body.find('article.fight');
        view.rotation = view.body.find('article.rotation');
        view.talents = view.body.find('article.talents');
        view.filter = view.body.find('article.filter');
        view.close = view.body.find('section.settings .btn-close');
        view.bg = view.body.find('section.sidebar .bg');
    },

    events: function () {
        var view = this;

        view.close.click(function (e) {
            e.preventDefault();
            $('.js-settings').removeClass('active');
            $('section.settings').removeClass('active');
        });

        view.buffs.on('click', '.icon', function () {
            let obj = $(this).toggleClass('active');
            if (obj.hasClass('active')) {
                if (obj.data('group'))
                    obj.siblings().filter('[data-group="' + obj.data('group') + '"]').removeClass('active');
                if (obj.data('disable-spell'))
                    $('.rotation [data-id="' + obj.data('disable-spell') + '"]').removeClass('active');
            }
            for (let buff of buffs) {
                buff.active = view.buffs.find('[data-id="' + buff.id + '"]').hasClass('active');
            }
            SIM.UI.updateSession();
            SIM.UI.updateSidebar();
        });

        view.talents.on('click', '.icon', function (e) {
            let talent = view.getTalent($(this));
            talent.c = talent.c < talent.m ? talent.c + 1 : talent.m;
            $(this).attr('data-count', talent.c);
            if (talent.c >= talent.m) $(this).addClass('maxed');
            if (talent.enable)
                $('.rotation [data-id="' + talent.enable + '"]').removeClass('hidden');
            $(this).find('a').attr('href', 'https://cn.classic.wowhead.com/spell=' + talent.s[talent.c == 0 ? 0 : talent.c - 1]);
            SIM.UI.updateSession();
            SIM.UI.updateSidebar();
        });

        view.talents.on('contextmenu', '.icon', function (e) {
            e.preventDefault();
            let talent = view.getTalent($(this));
            talent.c = talent.c < 1 ? 0 : talent.c - 1;
            $(this).attr('data-count', talent.c);
            $(this).removeClass('maxed');
            if (talent.c == 0 && talent.enable) {
                $('.rotation [data-id="' + talent.enable + '"]').removeClass('active').addClass('hidden');
                for (let spell of spells)
                    if (spell.id == talent.enable)
                        spell.active = false;
            }
            $(this).find('a').attr('href', 'https://cn.classic.wowhead.com/spell=' + talent.s[talent.c == 0 ? 0 : talent.c - 1]);
            SIM.UI.updateSession();
            SIM.UI.updateSidebar();
        });

        view.filter.on('click', '.sources li', function (e) {
            $(this).toggleClass('active');
            if ($(this).hasClass('active')) {
                let id = $(this).data('id');
                view.filter.find(`.phases [data-sources*="${id}"]`).addClass('active');
            }
            SIM.UI.updateSession();
            SIM.UI.filterGear();
        });

        view.filter.on('click', '.phases li', function (e) {
            $(this).toggleClass('active');
            let sources = $(this).data('sources').split(',');
            let show = $(this).hasClass('active');
            for (let source of sources) {
                if (show) view.filter.find('.sources [data-id="' + source + '"]').addClass('active');
                else view.filter.find('.sources [data-id="' + source + '"]').removeClass('active');
            }
            SIM.UI.updateSession();
            SIM.UI.filterGear();
        });

        view.rotation.on('click', '.spell', function (e) {
            let t = e.target;
            if (t.nodeName == "LI" || t.nodeName == "INPUT")
                return;
            $(this).toggleClass('active');
            let id = $(this).data('id');
            for (let spell of spells) {
                if (spell.id == id)
                    spell.active = $(this).hasClass('active');
            }
            SIM.UI.updateSession();
        });

        view.rotation.on('keyup', 'input[type="text"]', function (e) {
            let id = $(this).parents('.spell').data('id');
            for (let spell of spells) {
                if (spell.id == id)
                    spell[$(this).attr('name')] = $(this).val();
            }
            SIM.UI.updateSession();
        });

        view.fight.on('change', 'select[name="race"]', function (e) {
            var val = $(this).val();
            var bloodfury = view.rotation.find('[data-id="20572"]');
            var berserking = view.rotation.find('[data-id="26296"]');
            var disableSpell;

            if (val == "Orc") {
                bloodfury.removeClass('hidden');
            }
            else {
                bloodfury.addClass('hidden').removeClass('active');
                disableSpell = 20572;
            }
            if (val == "Troll") {
                berserking.removeClass('hidden');
            }
            else {
                berserking.addClass('hidden').removeClass('active');
                disableSpell = 26296;
            }

            for (let spell of spells) {
                if (spell.id == disableSpell)
                    spell.active = false;
            }

            view.bg.attr('data-race', val);

            SIM.UI.updateSession();
            SIM.UI.updateSidebar();
        });

        view.fight.on('change', 'select[name="aqbooks"]', function (e) {
            SIM.UI.updateSession();
            SIM.UI.updateSidebar();
        });

        view.fight.on('keyup', 'input[type="text"]', function (e) {
            SIM.UI.updateSession();
            SIM.UI.updateSidebar();
        });

        view.fight.on('change', 'select[name="weaponrng"]', function (e) {
            SIM.UI.updateSession();
            SIM.UI.updateSidebar();
        });

    },

    buildSpells: function () {
        var view = this;
        for (let spell of spells) {

            let tooltip = spell.id == 115671 ? 11567 : spell.id;
            let div = $(`<div data-id="${spell.id}" class="spell"><div class="icon">
            <img src="dist/img/${spell.iconname.toLowerCase()}.jpg " alt="${spell.name}">
            <a href="https://cn.classic.wowhead.com/spell=${tooltip}" class="wh-tooltip"></a>
            </div><ul class="options"></ul></div>`);

            if (spell.timetoend !== undefined)
                div.find('.options').append(`<li>最后 <input type="text" name="timetoend" value="${spell.timetoend}" data-numberonly="true" /> 秒 使用</li>`);
            if (spell.minrage !== undefined)
                div.find('.options').append(`<li>怒气值大于 <input type="text" name="minrage" value="${spell.minrage}" data-numberonly="true" /> 时使用</li>`);
            if (spell.maxrage !== undefined)
                div.find('.options').append(`<li>怒气低于 <input type="text" name="maxrage" value="${spell.maxrage}" data-numberonly="true" /> 时使用</li>`);
            if (spell.globals !== undefined)
                div.find('.options').append(`<li>仅第一个CD使用 <input type="text" name="globals" value="${spell.globals}" data-numberonly="true" /> 一次</li>`);
            if (spell.maincd !== undefined)
                div.find('.options').append(`<li>嗜血/致死打击的CD大于 <input type="text" name="maincd" value="${spell.maincd}" data-numberonly="true" /> 秒</li>`);
            if (spell.crusaders !== undefined)
                div.find('.options').append(`<li>当激活 <input type="text" name="crusaders" value="${spell.crusaders}" data-numberonly="true" /> 个十字军时</li>`);
            if (spell.haste !== undefined)
                div.find('.options').append(`<li>攻击速度 <input type="text" name="haste" value="${spell.haste}" data-numberonly="true" /> %</li>`);
            if (spell.priorityap !== undefined)
                div.find('.options').append(`<li>当攻击强度大于 <input style="width:25px" type="text" name="priorityap" value="${spell.priorityap}" data-numberonly="true" /> 时优先使用致死打击/嗜血</li>`);
            if (spell.id == 23255)
                div.find('.options').append(`<li>包含重伤伤害</li>`);
            if (spell.id == 11605)
                div.find('.options').append(`<li>使用主手猛击宏</li>`);
            if (spell.id == 2687)
                div.find('.options').append('<li>80怒以下有CD时使用</li>');
            if (spell.reaction !== undefined)
                div.find('.options').append(`<li><input style="width:25px" type="text" name="reaction" value="${spell.reaction}" data-numberonly="true" /> 毫秒反应时间</li>`);
            if (spell.hidden)
                div.addClass('hidden');
            if (localStorage.race == "Orc" && spell.id == 20572)
                div.removeClass('hidden');
            if (localStorage.race == "Troll" && spell.id == 26296)
                div.removeClass('hidden');
            if (spell.active)
                div.addClass('active');

            if (spell.maincd !== undefined) {
                div.find('.options li:first-of-type').append(' 或者');
            }

            if (spell.crusaders !== undefined) {
                div.find('.options li:first-of-type').append(' 或者');
            }

            if (spell.id == 11567) {
                div.find('.options').empty();
                div.find('.options').append(`<li>当怒气大于 <input type="text" name="minrage" value="30" data-numberonly="true"> 或致死打击/嗜血的CD大于 <input type="text" name="maincd" value="4" data-numberonly="true"> 秒时使用，</li>`);
                div.find('.options').append(`<li>如果怒气小于 <input type="text" name="unqueue" value="${spell.unqueue}" data-numberonly="true" /> 则在主手攻击前<input type="text" name="unqueuetimer" value="${spell.unqueuetimer}" data-numberonly="true" />毫秒取消，</li>`);
                div.find('.options').append(`<li><input style="width:25px" type="text" name="reaction" value="${spell.reaction}" data-numberonly="true" /> 毫秒反应时间</li>`);
            }

            if (spell.id == 115671) {
                div.find('.options').empty();
                div.find('.options').before('<label>斩杀阶段的英勇打击:</label>');
                div.find('.options').append(`<li>当怒气大于 <input type="text" name="minrage" value="30" data-numberonly="true"> 时使用，</li>`);
                div.find('.options').append(`<li>如果怒气小于 <input type="text" name="unqueue" value="${spell.unqueue}" data-numberonly="true" /> 则在主手攻击前<input type="text" name="unqueuetimer" value="${spell.unqueuetimer}" data-numberonly="true" /> 毫秒取消，</li>`);
                div.find('.options').append(`<li><input style="width:25px" type="text" name="reaction" value="${spell.reaction}" data-numberonly="true" /> 毫秒反应时间</li>`);
            }

            if (spell.id == 11585) {
                div.find('.options').empty();
                div.find('.options').append(`<li>当怒气小于 <input type="text" name="maxrage" value="${spell.maxrage}" data-numberonly="true" /> 时，并且</li>`);
                div.find('.options').append(`<li>嗜血/致死打击CD大于 <input type="text" name="maincd" value="${spell.maincd}" data-numberonly="true" /> 秒，</li>`);
                div.find('.options').append(`<li><input style="width:25px" type="text" name="reaction" value="${spell.reaction}" data-numberonly="true" /> 毫秒反应时间</li>`);
            }

            view.rotation.append(div);
        }

        view.rotation.children().eq(3).appendTo(view.rotation);
        view.rotation.children().eq(19).appendTo(view.rotation);
    },

    buildBuffs: function () {
        var view = this;
        for (let buff of buffs) {
            let wh = buff.spellid ? 'spell' : 'item';
            let active = buff.active ? 'active' : '';
            let group = buff.group ? `data-group="${buff.group}"` : '';
            let disable = buff.disableSpell ? `data-disable-spell="${buff.disableSpell}"` : '';
            let html = `<div data-id="${buff.id}" class="icon ${active}" ${group} ${disable}>
                            <img src="dist/img/${buff.iconname.toLowerCase()}.jpg " alt="${buff.name}">
                            <a href="https://cn.classic.wowhead.com/${wh}=${buff.id}" class="wh-tooltip"></a>
                        </div>`;
            view.buffs.append(html);
        }
    },

    buildTalents: function () {
        var view = this;
        for (let tree of talents) {
            let table = $('<table><tr><th colspan="4">' + tree.n + '</th></tr></table>');
            for (let i = 0; i < 7; i++) table.prepend('<tr><td></td><td></td><td></td><td></td></tr>');
            for (let talent of tree.t) {
                let div = $('<div class="icon" data-count="' + talent.c + '" data-x="' + talent.x + '" data-y="' + talent.y + '"></div>');
                div.html('<img src="dist/img/' + talent.iconname.toLowerCase() + '.jpg" alt="' + talent.n + '" />');
                if (talent.c >= talent.m) div.addClass('maxed');
                if (talent.enable && talent.c == 0) view.rotation.find('[data-id="' + talent.enable + '"]').addClass('hidden');
                if (talent.enable && talent.c > 0) view.rotation.find('[data-id="' + talent.enable + '"]').removeClass('hidden');
                div.append('<a href="https://cn.classic.wowhead.com/spell=' + talent.s[talent.c == 0 ? 0 : talent.c - 1] + '" class="wh-tooltip"></a>');
                table.find('tr').eq(talent.y).children().eq(talent.x).append(div);
            }
            view.talents.append(table);
        }
    },

    getTalent: function (div) {
        let tree = div.parents('table').index();
        let x = div.data('x');
        let y = div.data('y');
        for (let talent of talents[tree - 1].t)
            if (talent.x == x && talent.y == y)
                return talent;
    }



};