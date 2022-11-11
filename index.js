const fs = require('fs');
const getpath = require(`path`);

var { v1, v2, mods, tools, auth } = require ('osu-api-extended');

const mainpath = getpath.dirname(process.argv[1]);
const download_path = `${mainpath}\\beatmaps`;

var jsons = require(`./jsons.js`);
var { get_past_day, get_date_string, escapeString, sleep, log, checkDir, get_past_week } = require(`./tools.js`);

checkDir(download_path);

var stop_date = new Date('2007-10-05');
const config = require('./config.js');

var check_date = config.use_start_date==true?config.start_date:get_date_string(new Date());

const sound = require('sound-play');

main();

async function main(){
    var access_token = await auth.login_lazer(config.login, config.password);
    if (config.readOsudb){
        await jsons.read_osu_db();
    } else {
        await download_beatmaps();
    }
}

async function downloadquota(){
    return (await v2.user.me.download.quota()).quota_used;
}

var typemaps = "ranked";//'qualified';//


async function download_beatmaps(){
    var found_maps_counter = 0;
    checkmap: while (1==1){
        log(`checking date: ${check_date}`)
        var new_beatmaps = (await v2.beatmap.search({
            query: `created=${check_date}`,
            mode: "taiko", 
            section: typemaps,
        }));
        console.log(new_beatmaps);
        new_beatmaps = new_beatmaps.beatmapsets
        
        log(`found ${new_beatmaps.length} beatmaps`)

        if (new_beatmaps.length>=50){
            return 
        }

        let founded_beatmaps = 0;

        for (let newbeatmap of new_beatmaps){
            if(!jsons.find(newbeatmap.id)){
                found_maps_counter = 0;
                let newbeatmap_name = `${newbeatmap.id} - ${escapeString(newbeatmap.artist)} - ${escapeString(newbeatmap.title)}.osz`;
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
        if (founded_beatmaps === new_beatmaps.length) {
            found_maps_counter++;
        }
        log(`you have ${founded_beatmaps} of ${new_beatmaps.length} beatmaps`);
        
        //если все успешно, то переходит на предыдущий день
        check_date = get_past_week(check_date);
        if (new Date(check_date)<stop_date || found_maps_counter>config.maps_date_depth){
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
    if (!failed) {
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
