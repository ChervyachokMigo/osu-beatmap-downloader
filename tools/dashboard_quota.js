const dashboard = require('dashboard_framework');

const { formatTime } = require("./tools");

const get_waiting_quota_time = (start_time, waiting_mins) => {
    const waiting_ms = waiting_mins * 60 * 1000;
    let current_time = new Date().getTime();
    let diff_time = current_time - start_time;
    let reverse_diff_time = waiting_ms - diff_time;
    if (reverse_diff_time > waiting_ms) {
        return formatTime(0);
    } else {
        return formatTime(reverse_diff_time);
    }
}

let waiting_quota_interval = null;

const dashboard_waiting_quota_start = async (time_min) => {
    await dashboard.change_status({name: 'download_quota', status: 'quota'});
    let start_waiting_time = new Date().getTime();
    waiting_quota_interval = setInterval( async () => {
        await dashboard.change_text_item({
            name: 'download_quota', 
            item_name: 'quota', 
            text: `предел, ожидание ${get_waiting_quota_time(start_waiting_time, time_min)}`
        });
    }, 1000);
}

const dashboard_waiting_quota_end = async () => {
    await dashboard.change_status({name: 'download_quota', status: 'ready'});
    await dashboard.change_text_item({
        name: 'download_quota', 
        item_name: 'quota', 
        text: `предел`
    });
    clearInterval(waiting_quota_interval);
}

module.exports = {
	dashboard_waiting_quota_start, 
	dashboard_waiting_quota_end
}