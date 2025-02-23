const { execSync } = require('node:child_process');
const defaults = require('./misc/const_defaults.js');
const keypress = require('keypress');
const { readFileSync, writeFileSync, copyFileSync, existsSync } = require('node:fs');
const colors = require('colors');
const { presets_path, presets_sample_path } = require('./misc/pathes.js');
const { get_config } = require('./tools/config_web_editor/config_cache.js');
const check_config = require('./tools/config_web_editor/check_config.js');
const { log } = require('./tools/tools.js');

const menu_props = {
    preset: 1,
    gamemode: 0,
    status: 0,
    continue: 0,
	no_video: 1
};

const enter_keys = {
    maps_depth: {
        type: 'numbers',
        enable: false,
        text: defaults.maps_depth
    },
    fav_count_min: {
        type: 'numbers',
        enable: false,
        text: defaults.fav_count_min
    },
    stars_min: {
        type: 'numbers',
        enable: false,
        text: defaults.stars_min
    },
    stars_max: {
        type: 'numbers',
        enable: false,
        text: defaults.stars_max
    },
    min_objects: {
        type: 'numbers',
        enable: false,
        text: defaults.min_objects
    },
    min_length: {
        type: 'numbers',
        enable: false,
        text: defaults.min_length
    },
	requests_limit_duration: {
        type: 'numbers',
        enable: false,
        text: defaults.requests_limit_duration
    },
    save: {
        type: 'text',
        enable: false,
        text: ''
    }
}

const enter_keys_actions = Object.keys(enter_keys);

const command_props = {
    gamemode: { 
        variants: [
            { text: 'all', args: 'mode all' },       					//gamemode: 0
            { text: 'std', args: 'mode std' },                          //gamemode: 1
            { text: 'taiko', args: 'mode taiko' },                      //gamemode: 2
            { text: 'fruits', args: 'mode fruits' },                    //gamemode: 3
			{ text: 'mania', args: 'mode mania' },                      //gamemode: 4
            { text: 'std,taiko', args: 'mode std,taiko' },              //gamemode: 5
			{ text: 'std,fruits', args: 'mode std,fruits' },            //gamemode: 6
			{ text: 'std,mania', args: 'mode std,mania' },              //gamemode: 7
			{ text: 'taiko,mania', args: 'mode taiko,mania' },          //gamemode: 8
			{ text: 'fruits,mania', args: 'mode fruits,mania' },        //gamemode: 9
			{ text: 'taiko,fruits', args: 'mode taiko,fruits' },        //gamemode: 10
			{ text: 'std,taiko,mania', args: 'mode std,taiko,mania' },  //gamemode: 11
			{ text: 'std,fruits,mania', args: 'mode std,fruits,mania' },//gamemode: 12
			{ text: 'std,taiko,fruits', args: 'mode std,taiko,fruits' },//gamemode: 13
        ],
        inc: () => {
            menu_props.gamemode += 1;
            if ( menu_props.gamemode >= command_props.gamemode.variants.length){
                menu_props.gamemode = 0;
            }
        }
    },
    status: {
        variants: [
			{ text: 'any', args: 'status any'},						//status 0
            { text: 'ranked', args: 'status ranked' },				//status 1
            { text: 'loved', args: 'status loved' },				//status 2
            { text: 'qualified', args: 'status qualified' },		//status 3
            { text: 'graveyard', args: 'status graveyard' },		//status 4
			{ text: 'pending', args: 'status pending' },			//status 5
			{ text: 'wip', args: 'status wip'},						//status 6
			{ text: 'mine', args: 'status mine'},					//status 7
			{ text: 'favourites', args: 'status favourites'}		//status 8
        ],
        inc: () => {
            menu_props.status += 1;
            if ( menu_props.status >= command_props.status.variants.length){
                menu_props.status = 0;
            }
        }
    },
    is_continue: {
        variants: [
            { text: 'no', 	args: 'continue no' },
            { text: 'yes', 	args: 'continue yes' }
        ],
        toggle: () => {
            menu_props.continue += 1;
            if ( menu_props.continue >= command_props.is_continue.variants.length){
                menu_props.continue = 0;
            }
        }
    },
	no_video: {
		variants: [
			{ text: 'no', args: 'no_video false' },
			{ text: 'yes', args: 'no_video true' }
		],
		toggle: () => {
            menu_props.no_video += 1;
            if ( menu_props.no_video >= command_props.no_video.variants.length){
                menu_props.no_video = 0;
            }
        }
	},
    presets: {
        variants: [
            { name: 'Custom' }
        ],
        inc: () => {
            menu_props.preset += 1;
            if ( menu_props.preset >= command_props.presets.variants.length){
                menu_props.preset = 1;
            }
        },
        current: () => {
            let res = {
                name: enter_keys['save'].text,
                gamemode: menu_props.gamemode,
                status: menu_props.status,
                continue: menu_props.continue
            }
            for (let action of enter_keys_actions){
                if (action !== 'save'){
                    if (enter_keys[action].text !== defaults[action]){
                        res[action] = enter_keys[action].text;
                    }
                }
            }
            return res;
        },
        apply: () => {
            if (menu_props.preset > 0){
                const current_preset = command_props.presets.variants[menu_props.preset];
                menu_props.gamemode = current_preset.gamemode;
                menu_props.status = current_preset.status;
                menu_props.continue = current_preset.continue? current_preset.continue: 0;
                for (let action of enter_keys_actions){
                    enter_keys[action].enable = false;
                    if (current_preset[action]){
                        enter_keys[action].text = current_preset[action];
                    } else {
                        enter_keys[action].text = defaults[action];
                    }
                }
            } else {
                menu_props.gamemode = 0;
                menu_props.status = 0;
                menu_props.continue = 0;
                for (let action of enter_keys_actions){
                    enter_keys[action].enable = false;
                    enter_keys[action].text = defaults[action];
                }
            }
        }
    }
};

const load_presets = async () => {
	if (!existsSync(presets_path)){
		log(`[Error launcher: data/presets.json] путь ${presets_path} не существует, установка пресетов по умолчанию`);
		copyFileSync(presets_sample_path, presets_path);
    }
    command_props.presets.variants = command_props.presets.variants.concat(JSON.parse(readFileSync(presets_path, {encoding: 'utf8'})));
    command_props.presets.apply();
}

const save_presets = () => {
    const data = command_props.presets.variants.filter( v => v.name !== 'Custom');
    writeFileSync(presets_path, JSON.stringify(data), {encoding: 'utf8'});
}

const numbers = '0123456789';
const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const symbols = ' _,.[]()-+*:;{}!#$%^&?|';

const command_build = () => {
	const { WEBPORT } = get_config();

    let command = [];

    command.push(command_props.gamemode.variants[menu_props.gamemode].args);

    command.push(command_props.status.variants[menu_props.status].args);

    for (let action of enter_keys_actions){
        if (action !== 'save' && enter_keys[action].text !== defaults[action]){
            command.push(`${action} ${enter_keys[action].text}`);
        }
    }

	command.push(command_props.no_video.variants[menu_props.no_video].args);

    command.push(command_props.is_continue.variants[menu_props.continue].args);

    return `start http://localhost:${WEBPORT} && node index.js --${command.join(' --')} && pause`;
}

const refresh = () => {
    console.clear();
    console.log(`LAUNCHER > OSU BEATMAPS DOWNLOADER`.white);
    console.log(`Hint: [Button] Action`.gray);
    console.log(`[ESC]`.yellow,`QUIT`.white);
    console.log(`[TAB]`.yellow, `PRESET:`.white, `[${menu_props.preset}]`.green ,`${command_props.presets.variants[menu_props.preset].name}`.green);
    console.log(`[Q]`.yellow, `Gamemode:`.white, `${command_props.gamemode.variants[menu_props.gamemode].text}`.green);
    console.log(`[W]`.yellow, `Status:`.white, `${command_props.status.variants[menu_props.status].text}`.green);
    console.log(`${enter_keys.maps_depth.enable?'> ':''}[E]`.yellow, `Maps depth:`.white, `${enter_keys.maps_depth.text.toString().green}${enter_keys.maps_depth.enable?'_':''}`);
    console.log(`${enter_keys.fav_count_min.enable?'> ':''}[R]`.yellow, `Favorites count min:`.white, `${enter_keys.fav_count_min.text.toString().green}${enter_keys.fav_count_min.enable?'_':''}`);
    console.log(`${enter_keys.stars_min.enable?'> ':''}[T]`.yellow, `Stars min:`.white, `${enter_keys.stars_min.text.toString().green}${enter_keys.stars_min.enable?'_':''}`);
    console.log(`${enter_keys.stars_max.enable?'> ':''}[Y]`.yellow, `Stars max:`.white, `${enter_keys.stars_max.text.toString().green}${enter_keys.stars_max.enable?'_':''}`);
    console.log(`${enter_keys.min_objects.enable?'> ':''}[U]`.yellow, `Objects min:`.white, `${enter_keys.min_objects.text.toString().green}${enter_keys.min_objects.enable?'_':''}`);
    console.log(`${enter_keys.min_length.enable?'> ':''}[I]`.yellow, `Length min:`.white, `${enter_keys.min_length.text.toString().green}${enter_keys.min_length.enable?'_':''}`);
    console.log(`[V]`.yellow, `No video:`.white, `${command_props.no_video.variants[menu_props.no_video].text}`.green);
    console.log(`${enter_keys.requests_limit_duration.enable?'> ':''}[L]`.yellow, `Requests limit duration:`.white, `${enter_keys.requests_limit_duration.text.toString().green}${enter_keys.requests_limit_duration.enable?'_':''}`);
	console.log(`[O]`.yellow, `Is continue:`.white, `${command_props.is_continue.variants[menu_props.continue].text}`.green);
    console.log(`[ENTER]`.yellow, `Run command:`.white, `${command_build()}`.green);
    if (menu_props.preset === 0) {
        console.log(`[S]`.yellow, `SAVE`.white, `${(enter_keys.save.text?enter_keys.save.text:'').toString().green}${enter_keys.save.enable?'_':''}` );
    }
}

const toggle_action_input = (key_name, action_name, ch, key) => {

	if (typeof enter_keys[action_name] === 'undefined') {
		return;
	}

    if (enter_keys['save'].enable === false && key && key.name == key_name) {
        for (let action of enter_keys_actions){
            if (action !== action_name){
                enter_keys[action].enable = false;
            } else {
                enter_keys[action].enable = !enter_keys[action].enable;
            }
        }
        menu_props.preset = 0;
    }

    if (enter_keys[action_name].enable) {
        if (enter_keys[action_name].type === 'numbers') {

            if ( ch && numbers.includes(ch) ){
                enter_keys[action_name].text += ch;
                enter_keys[action_name].text = Number(enter_keys[action_name].text);
            }

            if ( key && key.name == 'backspace') {
                enter_keys[action_name].text = Number(enter_keys[action_name].text.toString().slice( 0, -1));
            }

            if (isNaN(enter_keys[action_name].text)){
                enter_keys[action_name].text = defaults[action_name];
            }

        } else if (enter_keys[action_name].type === 'text') {
            if ( ch && (numbers.includes(ch) || chars.includes(ch) || symbols.includes(ch)) ){

                enter_keys[action_name].text = enter_keys[action_name].text ? enter_keys[action_name].text : '';
                enter_keys[action_name].text += ch;
            }

            if ( key && key.name == 'backspace') {
                if (enter_keys[action_name].text.length > 0){
                    enter_keys[action_name].text = enter_keys[action_name].text.toString().slice( 0, -1);
                }
            }

            if (key && key.name == 'return') {
                if (enter_keys[action_name].text){
                    command_props.presets.variants = 
                        command_props.presets.variants.concat(command_props.presets.current() );
                    save_presets();
                    menu_props.preset = command_props.presets.variants.length - 1;
                    command_props.presets.apply();
                }
                enter_keys[action_name].text = '';
                enter_keys['save'].enable = false;

            }
        }
    }
}

const action_inputs = [
    {key: 'e', action: 'maps_depth'},
    {key: 'r', action: 'fav_count_min'},
    {key: 't', action: 'stars_min'},
    {key: 'y', action: 'stars_max'},
    {key: 'u', action: 'min_objects'},
    {key: 'i', action: 'min_length'},
	{key: 'v', action: 'no_video'},
	{key: 'l', action: 'requests_limit_duration'},
    {key: 's', action: 'save'},
];

const init_key_events = async () => {

    keypress(process.stdin);

    process.stdin.on('keypress', async (ch, key) => {
        if (enter_keys['save'].enable === false){
            if (key && key.name == 'tab') {
                command_props.presets.inc();
                command_props.presets.apply();
            }

            if (key && key.name == 'q') {
                command_props.gamemode.inc();
                menu_props.preset = 0;
            }

            if (key && key.name == 'w') {
                command_props.status.inc();
                menu_props.preset = 0;
            }

            if (key && key.name == 'o') {
                command_props.is_continue.toggle();
                menu_props.preset = 0;
            }

			if (key && key.name == 'v') {
                command_props.no_video.toggle();
                menu_props.preset = 0;
            }

            if (key && key.name == 'return') {
                process.stdin.pause();
                process.stdin.setRawMode(false);
                console.clear();
                execSync(command_build(), {stdio: 'inherit'});
            }
        }

        for (let action_input of action_inputs){
            toggle_action_input(action_input.key, action_input.action, ch, key);
        }

        if (key || ch){
            refresh();
        }

        if (key && key.name == 'escape') {
            process.exit(0);
        }

        
    });

    process.stdin.setRawMode(true);
    process.stdin.resume();

    refresh();

}

const laucher_init = async () => {
	await check_config();

	await load_presets();
	await init_key_events();
}

laucher_init();
