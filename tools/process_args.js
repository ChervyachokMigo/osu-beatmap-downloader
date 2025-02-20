const minimist = require("minimist");
const config = require("../config");
const defaults = require("../misc/const_defaults");
const { check_undefined, to_boolean } = require("./tools");
const check_beatmap_status = require("./check_beatmap_status");

const parsed_args = {};

module.exports = {
	set_args: (argv) => {
		const args = minimist(argv);

		parsed_args.FAV_COUNT_MIN = Number(check_undefined([ args.fav_count_min, config.fav_count_min, defaults.fav_count_min ]));
		parsed_args.stars_min = Number(check_undefined([ args.stars_min, config.stars_min, defaults.stars_min ]));
		parsed_args.stars_max = Number(check_undefined([ args.stars_max, config.stars_max, defaults.stars_max ]));
		parsed_args.maps_depth = Number(check_undefined([ args.maps_depth, config.maps_depth, defaults.maps_depth ]));
		parsed_args.min_objects = Number(check_undefined([ args.min_objects, config.min_objects, defaults.min_objects ]));
		parsed_args.min_length = Number(check_undefined([ args.min_length, config.min_length, defaults.min_length ]));
		parsed_args.no_video = check_undefined([ to_boolean(args.no_video), to_boolean(config.no_video), to_boolean(defaults.no_video) ]);
		parsed_args.requests_limit_duration = Number(check_undefined([ args.requests_limit_duration, config.requests_limit_duration, defaults.requests_limit_duration ]));
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