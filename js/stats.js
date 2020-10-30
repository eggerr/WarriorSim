var SIM = SIM || {}

SIM.STATS = {

    init: function () {
        var view = this;
        view.variables();
        view.events();
    },

    variables: function () {
        var view = this;
        view.body = $('body');
        view.stats = view.body.find('section.stats');
        view.dmg = view.stats.find('.container-dmg canvas');
        view.dmglegend = view.stats.find('.container-dmg').siblings('.legend');
        view.aura = view.stats.find('.container-aura canvas');
        view.spread = view.stats.find('.container-spread canvas');
        view.colors = ['#003f5c', '#2f4b7c', '#665191', '#a05195', '#d45087', '#f95d6a', '#ff7c43', '#ffa600'];
        view.close = view.stats.find('.btn-close');
        view.table = view.stats.find('.container-table');
    },

    events: function () {
        var view = this;

        view.close.click(function (e) {
            e.preventDefault();
            $('.js-stats').removeClass('active');
            $('section.stats').removeClass('active');
        });
    },

    initCharts: function (sim) {
        var view = this;
        $('.js-stats').removeClass('disabled');
        view.buildTable(sim);
        view.buildData(sim);
        view.buildAuras();
        view.buildDamage();
        view.buildSpread();
    },

    buildData: function (sim) {
        var view = this;

        // Auras
        let counter = 0;
        let data = [];
        let colors = [];
        view.auradata = {
            labels: [],
            datasets: []
        };
        for (let name in sim.player.auras) {
            let aura = sim.player.auras[name];
            if (!aura.uptime) continue;
            
            let aura_name_cn = aura.name;
            if (aura_name_cn == 'Crusader (MH)') aura_name_cn = '十字军（主手）';
            if (aura_name_cn == 'Crusader (OH)') aura_name_cn = '十字军（副手）';
            if (aura_name_cn == 'Death Wish') aura_name_cn = '死亡之愿';
            if (aura_name_cn == 'Recklessness') aura_name_cn = '鲁莽';
            if (aura_name_cn == 'Bloodrage') aura_name_cn = '血腥狂暴';
            if (aura_name_cn == 'Flurry') aura_name_cn = '乱舞';
            if (aura_name_cn == 'Mighty Rage Potion') aura_name_cn = '强效怒气药水';
            
            view.auradata.labels.push(aura_name_cn);
            data.push((aura.uptime / sim.totalduration / 10).toFixed(2));
            colors.push(view.colors[counter % view.colors.length]);
            counter++;
        }
        view.auradata.datasets.push({
            data: data,
            fill: false,
            backgroundColor: colors,
        });

        // Damage
        counter = 0;
        data = [];
        colors = [];
        view.dmgdata = {
            labels: [],
            datasets: []
        };
        for (let name in sim.player.spells) {
            let spell = sim.player.spells[name];
            if (!spell.totaldmg) continue;
            let spell_name_cn = spell.name;
            if (spell_name_cn == 'Bloodthirst') spell_name_cn = '嗜血';
            if (spell_name_cn == 'Heroic Strike') spell_name_cn = '英勇打击';
            if (spell_name_cn == 'Whirlwind') spell_name_cn = '旋风斩';
            if (spell_name_cn == 'Execute') spell_name_cn = '斩杀';
            view.dmgdata.labels.push(spell_name_cn);
            data.push((spell.totaldmg / sim.totalduration).toFixed(2));
            colors.push(view.colors[counter % view.colors.length]);
            counter++;
        }

        // MH
        view.dmgdata.labels.push('主手');
        data.push((sim.player.mh.totaldmg / sim.totalduration).toFixed(2));
        colors.push(view.colors[counter % view.colors.length]);
        counter++;
        if (sim.player.mh.totalprocdmg) {
            view.dmgdata.labels.push('主手触发');
            data.push((sim.player.mh.totalprocdmg / sim.totalduration).toFixed(2));
            colors.push(view.colors[counter % view.colors.length]);
            counter++;
        }

        // OH
        if (sim.player.oh) {
            view.dmgdata.labels.push('副手');
            data.push((sim.player.oh.totaldmg / sim.totalduration).toFixed(2));
            colors.push(view.colors[counter % view.colors.length]);
            counter++;
            if (sim.player.oh.totalprocdmg) {
                view.dmgdata.labels.push('副手触发');
                data.push((sim.player.oh.totalprocdmg / sim.totalduration).toFixed(2));
                colors.push(view.colors[counter % view.colors.length]);
                counter++;
            }
        }

        // DW
        if (sim.player.auras.deepwounds && sim.player.auras.deepwounds.totaldmg) {
            view.dmgdata.labels.push(sim.player.auras.deepwounds.name);
            data.push((sim.player.auras.deepwounds.totaldmg / sim.totalduration).toFixed(2));
            colors.push(view.colors[counter % view.colors.length]);
        }

        view.dmgdata.datasets.push({
            data: data,
            fill: false,
            backgroundColor: colors,
        });

        data = [];
        view.spreaddata = {
            labels: [],
            datasets: []
        };

        for(let i in sim.spread) {
            view.spreaddata.labels.push(i);
            data.push(sim.spread[i]);
        }

        view.spreaddata.datasets.push({
            data: data,
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgb(255, 99, 132)',
            fill: 'origin'
        });

    },

    buildAuras: function () {
        var view = this;

        if (view.aurachart) view.aurachart.destroy();
        view.aurachart = new Chart(view.aura, {
            type: 'horizontalBar',
            data: view.auradata,
            showTooltips: false,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                legend: {
                    display: false,
                    align: 'center',
                    fullWidth: true
                },
                tooltips: {
                    enabled: false,
                },
                hover: {
                    mode: null
                },
                title: {
                    display: false,
                    text: '光环持续时间',
                    fontColor: '#ccc',
                    position: 'bottom'
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            fontColor: '#ccc',
                        },
                        gridLines: {
                            display: false
                        }
                    }],
                    xAxes: [{
                        ticks: {
                            beginAtZero: true,
                            min: 0,
                            display: false,
                        },
                        gridLines: {
                            display: false
                        }
                    }]
                },
                animation: {
                    onComplete: function () {
                        var chartInstance = this.chart;
                        var ctx = this.chart.ctx;
                        this.data.datasets.forEach(function (dataset, i) {
                            var meta = chartInstance.controller.getDatasetMeta(i);
                            meta.data.forEach(function (bar, index) {
                                var data = dataset.data[index];
                                ctx.fillStyle = "#ddd";
                                ctx.shadowOffsetX = 2;
                                ctx.shadowOffsetY = 2;
                                ctx.shadowColor = "rgba(0,0,0,0.5)";
                                ctx.shadowBlur = 4;
                                ctx.fillText(data + '%', parseInt(data) < 11 ? bar._model.x + 10 : bar._model.x - 50, bar._model.y + 5);
                            });
                        });
                    }
                }
            },

        });
    },

    buildDamage: function () {
        var view = this;

        if (view.dmgchart) view.dmgchart.destroy();
        view.dmgchart = new Chart(view.dmg, {
            type: 'pie',
            data: view.dmgdata,
            options: {
                elements: {
                    arc: {
                        borderWidth: 1,
                    }
                },
                responsive: true,
                maintainAspectRatio: false,
                title: {
                    display: false,
                    text: 'DPS',
                    fontColor: '#ccc',
                    position: 'bottom'
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                },
                legend: {
                    display: false,
                    position: 'bottom',
                    labels: {
                        fontColor: '#ccc',
                    }
                },
                tooltips: {
                    callbacks: {
                        label: (item, obj) => ` ${obj.labels[item.index]}: ${obj.datasets[0].data[item.index]} DPS`,
                    }
                },
            }
        });

        view.dmglegend.html(view.dmgchart.generateLegend());
    },

    buildTable: function (sim) {
        var view = this;
        view.table.empty();
        let html = '<table><thead><tr><th>技能</th><th>普通攻击 %</th><th>暴击 %</th><th>未命中 %</th><th>躲闪 %</th><th>偏斜 %</th><th>次数</th><th>DPS</th></tr></thead><tbody>';


        let i = sim.iterations;
        let data = sim.player.mh.data;
        let total = data.reduce((a, b) => a + b, 0);
        let dps = (sim.player.mh.totaldmg / sim.totalduration).toFixed(2);
        html += `<tr><td>主手</td><td>${(data[0] / total * 100).toFixed(2)}</td><td>${(data[3] / total * 100).toFixed(2)}</td><td>${(data[1] / total * 100).toFixed(2)}</td><td>${(data[2] / total * 100).toFixed(2)}</td><td>${(data[4] / total * 100).toFixed(2)}</td><td>${(total / i).toFixed(2)}</td><td>${dps}</td></tr>`;

        if (sim.player.oh) {
            data = sim.player.oh.data;
            total = data.reduce((a, b) => a + b, 0);
            dps = (sim.player.oh.totaldmg / sim.totalduration).toFixed(2);
            html += `<tr><td>副手</td><td>${(data[0] / total * 100).toFixed(2)}</td><td>${(data[3] / total * 100).toFixed(2)}</td><td>${(data[1] / total * 100).toFixed(2)}</td><td>${(data[2] / total * 100).toFixed(2)}</td><td>${(data[4] / total * 100).toFixed(2)}</td><td>${(total / i).toFixed(2)}</td><td>${dps}</td></tr>`;
        }
        
        for (let name in sim.player.spells) {
            let n = sim.player.spells[name].name;
            let data = sim.player.spells[name].data;
            let total = data.reduce((a, b) => a + b, 0);
            if (!total) continue;
            let dps = (sim.player.spells[name].totaldmg / sim.totalduration).toFixed(2);
            if (n == 'Bloodthirst') n = '嗜血';
            if (n == 'Heroic Strike') n = '英勇打击';
            if (n == 'Execute') n = '斩杀';
            if (n == 'Whirlwind') n = '旋风斩';
            if (n == 'Sunder Armor') n = '破甲攻击';
            html += `<tr><td>${n}</td><td>${(data[0] / total * 100).toFixed(2)}</td><td>${(data[3] / total * 100).toFixed(2)}</td><td>${(data[1] / total * 100).toFixed(2)}</td><td>${(data[2] / total * 100).toFixed(2)}</td><td>${(data[4] / total * 100).toFixed(2)}</td><td>${(total / i).toFixed(2)}</td><td>${dps}</td></tr>`;
        }

        html += '</tbody></table>';

        view.table.append(html);
        view.table.find('table').tablesorter({
            widthFixed: true,
        });
    },

    buildSpread: function () {
        var view = this;

        if (view.spreadchart) view.spreadchart.destroy();
        view.spreadchart = new Chart(view.spread, {
            type: 'bar',
            data: view.spreaddata,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                spanGaps: false,
                legend: {
                    display: false,
                },
                elements: {
                    line: {
                        tension: 0.4
                    },
                    point:{
                        radius: 0
                    }
                },
                plugins: {
                    filler: {
                        propagate: false
                    }
                },
                scales: {
                    xAxes: [{
                        ticks: {
                            beginAtZero:true,
                            autoSkip: true,
                            maxRotation: 0
                        }
                    }],
                },
                tooltips: {
                    callbacks: {
                        label: (item, obj) => ` ${obj.labels[item.index]} DPS: ${obj.datasets[0].data[item.index]}`,
                    }
                },
            }
        });
    },
};