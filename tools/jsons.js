const fs = require('fs');
const path = require('path');

const dashboard = require('dashboard_framework');

const osu_db_path = path.join('data', 'beatmaps_osu_db.json');
const beatmaplist_path =  path.join('data', 'beatmapslist.json'); 

var beatmaps_downloaded = get_beatmaplist();

var bh = require('./osu-collection-bithexfunctions.js');

const { osuFolder, isFullRescan } = require(`../config.js`);

var db = [];

/////////beatmap json

function get_beatmaplist(){
    if (fs.existsSync(beatmaplist_path)){
        let jsondata = fs.readFileSync(beatmaplist_path, {encoding:`utf-8`});
        let jsonparsed = JSON.parse(jsondata);

        return jsonparsed;
    } else {
        var empty = [];
        save(empty);
        return empty;
    }
}

function save(jsondata){
    fs.writeFileSync(beatmaplist_path, JSON.stringify(jsondata), {encoding:'utf-8'});
}

function add(obj){
    if (Array.isArray(obj)){
        add_many(obj);
    } else {
        add_single(obj);
    }
}

function add_many (ids){
    for (let id of ids){
        var result  = beatmaps_downloaded.filter(function(obj){return obj.id == id;} );
        if (result == false){
            beatmaps_downloaded.push({id: id});
        }
    }
    save(beatmaps_downloaded);
}

function add_single(id){
    if (beatmaps_downloaded.indexOf(id) == -1){
        beatmaps_downloaded.push({id: id});  
        save(beatmaps_downloaded);
    }
}

function findbeatmap(id){
    if (beatmaps_downloaded.length>0){
        for (let checkbeatmap of beatmaps_downloaded){
            if(id === checkbeatmap.id){
                return true;
            }
        }
    }
    return false;
}

///////////osu db json

async function read_osu_db(){
    if (fs.existsSync(osu_db_path)){
        console.log(`reading db`);
        let dbRAW = fs.readFileSync(osu_db_path)
		db = JSON.parse(dbRAW)
    } else {
        //read osu db if beatmaps list not exists
        await readOsuDbAndSaveJson();
    }

    //making beatmaps list
    var bm_sets = [];
    for (let bm of db.beatmaps){
        if (bm_sets.indexOf(bm.setId) == -1){
            bm_sets.push(bm.setId);
        }
    }

    //add list to json
    add(bm_sets);
}


async function readOsuDbAndSaveJson(){

	var osuDbFile = osuFolder + '\\osu!.db';
	var beatmapsDBJsonFile = osu_db_path;

	await bh.openFileDB(osuDbFile)

	db.version = await bh.getInt()

	db.FolderCount = await bh.getInt()

	db.isAcountUnlocked = await bh.getBool()

	db.DateWillUnlocked = await bh.getDate()

	db.PlayerName = await bh.getString()

	db.NumberBeatmaps = await bh.getInt()

	db.beatmaps = [];


	for (let nb = 1; nb <= db.NumberBeatmaps; nb++){
		if (nb % 1000 === 0) {
			let scanning_text = `${(nb/db.NumberBeatmaps*100).toFixed(1)} %`;
			dashboard.change_text_item({name: 'db_scan', item_name: 'scaning', text: `сканирование ${scanning_text}`});
			console.log('scanning', scanning_text);
		}
        
		try{

		let beatmap = {}

		if (isFullRescan == 0){
			await bh.skipString()
			await bh.skipString()
			await bh.skipString()
			await bh.skipString()
			await bh.skipString()
			await bh.skipString()
			await bh.skipString()

			await bh.skipString()
			await bh.skipString()

			await bh.skipByte()
			await bh.skipShort()
			await bh.skipShort()
			await bh.skipShort()
			await bh.skipLong()
			await bh.skipInt()
			await bh.skipInt()
			await bh.skipInt()
			await bh.skipInt()
			await bh.skipDouble()
			await bh.skipIntDoublePair()
			await bh.skipIntDoublePair()
			await bh.skipIntDoublePair()
			await bh.skipIntDoublePair()
			await bh.skipInt()
			await bh.skipInt()
			await bh.skipInt()
		} else {
			beatmap.artist = await bh.getString()
			beatmap.artistUni = await bh.getString()
			beatmap.title = await bh.getString()
			beatmap.titleUni = await bh.getString()
			beatmap.creator = await bh.getString()
			beatmap.difficulty = await bh.getString()

			beatmap.audioFile = await bh.getString()
			beatmap.hash = await bh.getString()

			beatmap.osuFilename = await bh.getString()
			beatmap.ranked = await bh.getByte()
			beatmap.hitcircles = await bh.getShort()
			beatmap.sliders = await bh.getShort()
			beatmap.spinners = await bh.getShort()
			beatmap.lastModify = await bh.getLong()
			beatmap.AR = await bh.getInt()//await bh.getSingle()
			beatmap.CS = await bh.getInt()//await bh.getSingle()
			beatmap.HP = await bh.getInt()//await bh.getSingle()
			beatmap.OD = await bh.getInt()//await bh.getSingle()
			beatmap.sliderVelocity = await bh.getDouble()
			beatmap.stars = await bh.getIntDoublePair()
			beatmap.stars2 = await bh.getIntDoublePair()
			beatmap.stars3 = await bh.getIntDoublePair()
			beatmap.stars4 = await bh.getIntDoublePair()
			beatmap.draintimeSec = await bh.getInt()
			beatmap.draintimeMs = await bh.getInt()
			beatmap.audioPreviewTime = await bh.getInt()
		}

		let timingPointsNumber = await bh.getInt()

		if (isFullRescan== 0){
			await bh.skipTimingPoints(timingPointsNumber)
		} else {
			beatmap.timingPoints = []

			for (let tp=1; tp<=timingPointsNumber; tp++){
					beatmap.timingPoints.push( ...(await bh.getTimingPoint()))
			}

			beatmap.timingPoints = { ...beatmap.timingPoints}
			beatmap.timingPointsNumber = timingPointsNumber;
		}

		if (isFullRescan== 0){
			await bh.skipInt()
		} else {
			beatmap.Id = await bh.getInt()
		}
		
		beatmap.setId = await bh.getInt()

		if (isFullRescan== 0){
			await bh.skipInt()
			await bh.skipByte()
			await bh.skipByte()
			await bh.skipByte()
			await bh.skipByte()
			await bh.skipShort()
			await bh.skipInt()
			await bh.skipByte()
			await bh.skipString()
			await bh.skipString()
			await bh.skipShort()
			await bh.skipString()
			await bh.skipBool()
			await bh.skipLong()
			await bh.skipBool()
			await bh.skipString()
			await bh.skipLong()
			await bh.skipBool()
			await bh.skipBool()
			await bh.skipBool()
			await bh.skipBool()
			await bh.skipBool()
			await bh.skipInt()
			await bh.skipByte()
		} else {
			beatmap.threadId = await bh.getInt()
			beatmap.gradeStd = await bh.getByte()
			beatmap.gradeTaiko = await bh.getByte()
			beatmap.gradeCTB = await bh.getByte()
			beatmap.gradeMania = await bh.getByte()
			beatmap.localOffset = await bh.getShort()
			beatmap.StackLaniency = await bh.getInt()
			beatmap.gamemode = await bh.getByte()
			beatmap.source = await bh.getString()
			beatmap.tags = await bh.getString()
			beatmap.onlineOffset = await bh.getShort()
			beatmap.fontTitle = await bh.getString()
			beatmap.isPlayed = await bh.getBool()
			beatmap.lastTimePlayed = await bh.getLong()
			beatmap.isOsz2 = await bh.getBool()
			beatmap.folderName = await bh.getString()
			beatmap.lastTimeChecked = await bh.getLong()
			beatmap.isIgnoreSounds = await bh.getBool()
			beatmap.isIgnoreSkin = await bh.getBool()
			beatmap.isDisableStoryboard = await bh.getBool()
			beatmap.isDisableVideo = await bh.getBool()
			beatmap.isVisualOverride = await bh.getBool()
			beatmap.UnknownInt = await bh.getInt()
			beatmap.ManiaScrollSpeed = await bh.getByte()
		}

		db.beatmaps.push({ ...beatmap})
		} catch (e){
			console.log (e)
		}
	}

	await bh.closeFileDB()

	var beatmapsJsonData = JSON.stringify({ ...db})
	var beatmapsJsonFile = await fs.promises.open(beatmapsDBJsonFile,'w')
	await beatmapsJsonFile.writeFile(beatmapsJsonData)
	await beatmapsJsonFile.close()

}

module.exports = {
    add: function(ids){
        add(ids);
    },
	
    find: function(id){
        return findbeatmap(id);
    },

    read_osu_db,
}