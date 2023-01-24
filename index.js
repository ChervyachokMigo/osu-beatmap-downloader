const fs = require('fs');
const getpath = require(`path`);
const minimist = require('minimist');

var { v1, v2, mods, tools, auth } = require ('osu-api-extended');

const mainpath = getpath.dirname(process.argv[1]);
const download_path = `${mainpath}\\beatmaps`;

var jsons = require(`./jsons.js`);
var { get_past_day, get_date_string, escapeString, sleep, log, checkDir, get_past_week, get_past_month } = require(`./tools.js`);

checkDir(download_path);

const config = require('./config.js');

var check_date = config.use_start_date==true?config.start_date:get_date_string(new Date()).replaceAll('-', '');

main();

async function main(){
    var access_token = await auth.login_lazer(config.login, config.password);
    if (typeof access_token.access_token == 'undefined'){
        throw new console.error('no auth');
    }
    if (config.readOsudb){
        await jsons.read_osu_db();
    } else {
        await download_beatmaps();
    }
}

async function downloadquota(){
    return (await v2.user.me.download.quota()).quota_used;
}

var typemaps = "ranked";

async function download_beatmaps(){
    const args = minimist(process.argv.slice(2));

    var found_maps_counter = 0;
    var cursor_string = null;
    var total = 0;

    var mode = 0;

    switch (args.mode){
        case '1':
        case 'taiko':
        case 't':
            mode = 1;
            break;
        case '2':
        case 'fruits':
        case 'ctb':
        case 'c':
        case 'f':
            mode = 2;
            break;
        case '3':
        case 'mania':
        case 'm':
            mode = 3;
            break;
        default:
        case 'osu':
        case 'std':
        case 'o':
        case 's':
        case '0':
            mode = 0;
            break;
    }

    log('selected mode: ' + args.mode)

    switch (args.status){
        case 'qualified':
        case 'ranked':
            typemaps = args.status;
            break;
        default:
            typemaps = 'ranked';
            break;
    }

    checkmap: while (1==1){
        log(`checking date: ${check_date}\n` + `cursor: ${cursor_string}`)
        
        var new_beatmaps = (await v2.beatmap.search({
            //query: `ranked>=${Number(check_date)-1} & ranked<=${Number(check_date)+1}`,
            query: ``,
            m: mode,
            s: typemaps,
            cursor_string: cursor_string,
        }));
        
        let founded_maps = new_beatmaps.beatmapsets

        if (founded_maps.length>=50){
            cursor_string = new_beatmaps.cursor_string;
            if (total == 0) total = new_beatmaps.total;
            log('more then 50 beatmaps. go to cursor');
        }
        
        log(`found ${founded_maps.length} beatmaps`)
        
        

        let founded_beatmaps = 0;

        for (let newbeatmap of founded_maps){
            let not_ctb_maps = newbeatmap.beatmaps.filter((val)=>val.mode_int!==2);
            if (not_ctb_maps.length == 0){
                founded_beatmaps++;
                continue;
            }
            if(!jsons.find(newbeatmap.id)){
                found_maps_counter = 0;
                let newbeatmap_name = `${newbeatmap.id} ${escapeString(newbeatmap.artist)} - ${escapeString(newbeatmap.title)}.osz`;
                var response_download = await beatmap_download(newbeatmap.id , `${download_path}\\${newbeatmap_name}`);
                if (response_download) {
                    fs.rmSync(`${download_path}\\${newbeatmap_name}`);
                    var d = new Date();
                    log(`${d.getHours()}:${d.getMinutes()}`);
                    log(`${await downloadquota()} quota used`);
                    log(response_download);
                    log(`waiting 30 minutes for retry.`);
                    //get_news();
                    await sleep(1800);
                    continue checkmap;
                }
            } else {
                founded_beatmaps++;
            }
        }
        if (founded_beatmaps === founded_maps.length) {
            found_maps_counter++;
        }
        log(`you have ${founded_beatmaps} of ${founded_maps.length} beatmaps`);
        total -= founded_maps.length;
        log(`осталось ${total} beatmaps`);
        //если все успешно, то переходит на предыдущий день
        //check_date = get_past_day(check_date).replaceAll('-', '');

        if (check_date<20071005 || found_maps_counter>config.maps_date_depth|| total <= 0 || cursor_string === null || cursor_string === undefined) {
            log('ended');
            return
        }
    }
}

async function beatmap_download(id, path){
    log(`try download ${id} to ${path}`);
    await v2.beatmap.download(id, path);
    var failed = await new Promise ((res,rej)=>{
        try{var stats = fs.statSync(path);
            log(`Filesize: ${stats.size/1024} KB`);
            if(stats.size>3000){
                res(false);
            } else {
                let jsondata = fs.readFileSync(path, {encoding:`utf-8`});
                let jsonparsed = JSON.parse(jsondata);
                res(jsonparsed.error);
            }
        } catch (e){
            res(e);
        }
    });
    if (!failed && typemaps === 'ranked') {
        jsons.add(id);
    }

    return failed;
}

async function get_news(){
    var news = (await v2.news.list()).news_posts;
    log (`NEWS:`);
    for(post of news){
        log(
            post.title, `\n`, post.preview
        );
    }
}
