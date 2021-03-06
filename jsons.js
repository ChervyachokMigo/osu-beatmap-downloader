const fs = require('fs');

module.exports = {
    add: function(ids){
        add(ids);
    },
    find: function(id){
        return findbeatmap(id);
    },

    read_osu_db: async function (){
        await read_osu_db();
    }
}

const beatmaplistFilename = 'beatmapslist.json'; 
var beatmaps_downloaded = get_beatmaplist();

var bh = require('./osu-collection-bithexfunctions.js');

const { osuFolder } = require(`./config.js`);

const osu_db_filename = `beatmaps_osu_db.json`;
var db = [];

/////////beatmap json

function get_beatmaplist(){
    if (fs.existsSync(beatmaplistFilename)){
        let jsondata = fs.readFileSync(beatmaplistFilename, {encoding:`utf-8`});
        let jsonparsed = JSON.parse(jsondata);

        return jsonparsed;
    } else {
        var empty = [];
        save(empty);
        return empty;
    }
}

function save(jsondata){
    fs.writeFileSync(beatmaplistFilename, JSON.stringify(jsondata), {encoding:'utf-8'});
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
    if (fs.existsSync(osu_db_filename)){
        log(`reading db`);
        let dbRAW = fs.readFileSync(osu_db_filename)
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
    jsons.add(bm_sets);
}


async function readOsuDbAndSaveJson(){

	var osuDbFile = config.osuFolder + '\\osu!.db';
	var beatmapsDBJsonFile = osu_db_filename;

	await bh.openFileDB(osuDbFile)

	db.version = await bh.getInt()

	db.FolderCount = await bh.getInt()

	db.isAcountUnlocked = await bh.getBool()

	db.DateWillUnlocked = await bh.getDate()

	db.PlayerName = await bh.getString()

	db.NumberBeatmaps = await bh.getInt()

	db.beatmaps = [];


	for (let nb = 1; nb <= db.NumberBeatmaps; nb++){
        log(`scanning ${nb} of ${db.NumberBeatmaps}`);
		try{

		let beatmap = {}

		if (config.isFullRescan == 0){
			await bh.skipString()
			await bh.skipString()
			await bh.skipString()
			await bh.skipString()
			await bh.skipString()
			await bh.skipString()
		} else {
			beatmap.artist = await bh.getString()
			beatmap.artistUni = await bh.getString()
			beatmap.title = await bh.getString()
			beatmap.titleUni = await bh.getString()
			beatmap.creator = await bh.getString()
			beatmap.difficulty = await bh.getString()
		}

		beatmap.audioFile = await bh.getString()
		beatmap.hash = await bh.getString()

		if (config.isFullRescan == 0){
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

		beatmap.timingPointsNumber = await bh.getInt()

		if (config.isFullRescan == 0){
				await bh.skipTimingPoints(beatmap.timingPointsNumber)
		} else {
			beatmap.timingPoints = []

			for (let tp=1; tp<=beatmap.timingPointsNumber; tp++){
					beatmap.timingPoints.push( ...(await bh.getTimingPoint()))
			}

			beatmap.timingPoints = { ...beatmap.timingPoints}

		}

		if (config.isFullRescan == 0){
			await bh.skipInt()
			await bh.skipInt()
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
		} else {
			beatmap.Id = await bh.getInt()
			beatmap.setId= await bh.getInt()
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
		}

		beatmap.folderName = await bh.getString()
		
		if (config.isFullRescan == 0){
			await bh.skipLong()
			await bh.skipBool()
			await bh.skipBool()
			await bh.skipBool()
			await bh.skipBool()
			await bh.skipBool()
			await bh.skipInt()
			await bh.skipByte()
		} else {
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
			log (e)
		}
	}

	await bh.closeFileDB()

	var beatmapsJsonData = JSON.stringify({ ...db})
	var beatmapsJsonFile = await fs.promises.open(beatmapsDBJsonFile,'w')
	await beatmapsJsonFile.writeFile(beatmapsJsonData)
	await beatmapsJsonFile.close()

}