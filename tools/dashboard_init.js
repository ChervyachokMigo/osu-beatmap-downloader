const dashboard = require('dashboard_framework');

module.exports = {
    dashboard_init: async () => {
        const colors = { 
            enable: [59, 124, 255], 
            disable: [25, 53, 110], 
            processing: [182, 205, 252],
            neutral: [97, 97, 97]
        };

        dashboard.settings.set({ debug: true });

        await dashboard.run(4441, 4442);
        await dashboard.set_status([
            {
                name: 'osu_auth',
                text: 'Осу логин',
                status: 'off',
                values: [
                    { name: 'on', color: colors.enable, text: 'онлайн' },
                    { name: 'off', color: colors.disable, text: 'оффлайн' }
                ]
            },
            {
                name: 'db_scan',
                text: 'База карт',
                status: 'not',
                values: [
                    { name: 'ready', color: colors.enable, text: 'отсканирована' },
                    { name: 'scaning', color: colors.processing, text: 'сканирование' },
                    { name: 'not', color: colors.disable, text: 'не готова' }
                ]
            },
            {   
                name: 'download_quota',
                text: 'Квота',
                status: 'ready',
                values: [
                    { name: 'ready', color: colors.enable, text: 'доступно' },
                    { name: 'quota', color: colors.disable, text: 'достигнут лимит' }
                ]
            },
            {
                name: 'download_mode',
                text: '[Параметры] Режим игры',
                status: null,
                values: [
                    { name: 'osu', color: colors.neutral, text: 'osu standart' },
                    { name: 'taiko', color: colors.neutral, text: 'osu taiko' },
                    { name: 'fruits', color: colors.neutral, text: 'Catch The Beats' },
                    { name: 'mania', color: colors.neutral, text: 'osu mania' }
                ]
            },
            {
                name: 'download_status',
                text: '[Параметры] Статус',
                status: 'ranked',
                values: [
                    { name: 'ranked', color: colors.neutral, text: 'Ranked' },
                    { name: 'loved', color: colors.neutral, text: 'Loved' },
                    { name: 'pending', color: colors.neutral, text: 'Pending' },
                    { name: 'qualified', color: colors.neutral, text: 'Qualified' },
                    { name: 'graveyard', color: colors.neutral, text: 'Graveyard' }
                ]
            },
            {
                name: 'fav_count_min',
                text: '[Параметры] Минимум фавориты',
                status: 'current',
                values: [
                    { name: 'current', color: colors.neutral, text: '0' }
                ]
            },
            {
                name: 'stars',
                text: '[Параметры] Звёзды',
                status: 'current',
                values: [
                    { name: 'current', color: colors.neutral, text: '' }
                ]
            },
            {
                name: 'maps_depth',
                text: '[Параметры] Глубина поиска',
                status: 'current',
                values: [
                    { name: 'current', color: colors.neutral, text: '' }
                ]
            },
            {
                name: 'min_circles',
                text: '[Параметры] Минимум кругов',
                status: 'current',
                values: [
                    { name: 'current', color: colors.neutral, text: '' }
                ]
            },
            {
                name: 'min_length',
                text: '[Параметры] Минимальная длина',
                status: 'current',
                values: [
                    { name: 'current', color: colors.neutral, text: '' }
                ]
            },
            {
                name: 'cursor_string',
                text: '[Параметры] Курсор',
                status: 'last',
                values: [
                    { name: 'last', color: colors.neutral, text: 'нет' }
                ]
            },
            {
                name: 'total_maps',
                text: 'Осталось карт',
                status: 'current',
                values: [
                    { name: 'current', color: colors.neutral, text: '0' }
                ]
            },
        ]);

    }
}