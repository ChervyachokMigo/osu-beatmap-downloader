const minimist = require("minimist");
const defaults = require("../misc/const_defaults");
const { check_undefined, to_boolean } = require("./tools");
const check_beatmap_status = require("./check_beatmap_status");
const { get_config } = require("./config_web_editor/config_cache");

const parsed_args = {};

module.exports = {
	set_args: (argv) => {
		const { fav_count_min, stars_min, stars_max, maps_depth, min_objects, 
			min_length, no_video, requests_limit_duration }  = get_config();

		const args = minimist(argv);

		parsed_args.FAV_COUNT_MIN = Number(check_undefined([ args.fav_count_min, fav_count_min, defaults.fav_count_min ]));
		parsed_args.stars_min = Number(check_undefined([ args.stars_min, stars_min, defaults.stars_min ]));
		parsed_args.stars_max = Number(check_undefined([ args.stars_max, stars_max, defaults.stars_max ]));
		parsed_args.maps_depth = Number(check_undefined([ args.maps_depth, maps_depth, defaults.maps_depth ]));
		parsed_args.min_objects = Number(check_undefined([ args.min_objects, min_objects, defaults.min_objects ]));
		parsed_args.min_length = Number(check_undefined([ args.min_length, min_length, defaults.min_length ]));
		parsed_args.no_video = check_undefined([ to_boolean(args.no_video), to_boolean(no_video), to_boolean(defaults.no_video) ]);
		parsed_args.requests_limit_duration = Number(check_undefined([ args.requests_limit_duration, requests_limit_duration, defaults.requests_limit_duration ]));
		parsed_args.mode = check_undefined([args.mode]);
		parsed_args.cursor = check_undefined([args.cursor]);
		parsed_args.is_continue = check_undefined([args.continue]);
		parsed_args.beatmap_status = check_undefined([check_beatmap_status(args.status)]);

		parsed_args.strict = args.strict || false;
		parsed_args.query = args?.query ? (parsed_args.strict ? '"'+ args.query +'"' : args.query) : null;
	},

	set_arg: (name) => parsed_args[name],

	get_args: () => parsed_args,

	get_arg: (name) => parsed_args[name],
}