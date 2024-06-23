const dashboard = require('dashboard_framework');
module.exports = async () => {
    await dashboard.emit_event({
        feedname: 'last_beatmaps',
        type: 'end',
        title: `Скачивание закончено`,
    });
    await dashboard.change_status({name: 'total_maps', status: 'end'});
}