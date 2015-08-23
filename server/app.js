var FastSimplexNoise = require('fast-simplex-noise');
// var crypto = require('crypto');
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ port: 9005 });

var Redis = require('redis');
var redis = Redis.createClient(6379, 'localhost');

redis.on("error", function(err) {
	console.error("Error connecting to redis", err);
});

redis.select(1);

// var world_seed = Math.random();
function random(){
	// return world_seed;
	return 0.4710536374424983;
}

var fast_simplex = new FastSimplexNoise({random: random}); // The old 4d one
fast_simplex.octaves = 12;
fast_simplex.frequency = 0.315;
fast_simplex.persistence = 0.5;

var terrain_simplex = new FastSimplexNoise({random: random});
terrain_simplex.octaves = 12;
terrain_simplex.frequency = 0.315;
terrain_simplex.persistence = 0.5;

// var foliage_simplex = new FastSimplexNoise({random: random});
// foliage_simplex.octaves = 10;
// foliage_simplex.frequency = 3;
// foliage_simplex.persistence = 0.4;

// var lake_simplex = new FastSimplexNoise({random: random});
// lake_simplex.octaves = 10;
// lake_simplex.frequency = 8;
// lake_simplex.persistence = 0.4;

// var temperature_simplex = new FastSimplexNoise({random: random});
// temperature_simplex.octaves = 10;
// temperature_simplex.frequency = 1.1;
// temperature_simplex.persistence = 0.5;

var map_size = 2500000;

// var authenticated_users = Object();

wss.on('connection', function connection(ws) {

	ws.on('message', function incoming(message) {

		try {
			var parsed_message = JSON.parse(message);
			var message_type = parsed_message.type;
		} catch(err) {
			console.log('Invalid client request json');
			console.log(err);
			return false;
		}

		switch (message_type){
			case 'get_map_data':
				console.time('generate map');
				var tilemaps = new Object();

				for(var i in parsed_message.map_params.origin_points){
					var tmp_origin_point = parsed_message.map_params.origin_points[i];
					tilemaps[tmp_origin_point] = generate_tilemap(parsed_message.map_params, tmp_origin_point);
				}

				ws.send( get_json( {type:'map_data', tilemaps: tilemaps} ) );
				console.timeEnd('generate map');
				break;

			case 'world_map_data':
				console.time('g');
				// console.log(parsed_message)
				var world_tilemap = generate_tilemap( {map_size: parsed_message.map_size, cube_size: parsed_message.cube_size}, parsed_message.origin );
				// console.log(world_tilemap.length)
				console.timeEnd('g');
				ws.send( get_json( {type:'world_map_data', world_tilemap: world_tilemap} ));
				break;

			default:
				console.log('Unkown client request. Unknown Type.');
				console.log(parsed_message);
				break;

		}

	});

	// console.log( wss.clients.length );

	// console.log('sending');
	// ws.send( JSON.stringify( ['clients:'+wss.clients.length] ) );
});

function get_json(input){
	try {
		var json_string = JSON.stringify(input);
	} catch(err) {
		console.log('Invalid Json');
		console.log(err);
		return false;
	}

	return json_string;
}

function pad(num, size) {
	var s = "0000000000000" + num;
	return s.substr(s.length-size);
}

function generate_tilemap(map_params, origin_point){

	if( typeof(map_params.cube_size) != 'undefined' ){
		var cube_size = parseInt(map_params.cube_size);
	} else {
		var cube_size = 10;
	}

	if( typeof(map_params.map_size) != 'undefined' ){
		map_size = parseInt(map_params.map_size);
	} else {
		map_size = 2500000;
	}

	var tilemap = Array();

	var start_x = Math.floor( origin_point / map_size);
	var start_y = origin_point - (start_x * map_size);

	var scale = cube_size / map_size;
	var local_y = 0;

terrain_simplex.amplitude = 1;
terrain_simplex.octaves = 12;
terrain_simplex.frequency = 0.01;
terrain_simplex.persistence = 0.2;

	for(y = start_y; y < cube_size + start_y; y++){
		var local_x = 0;

		for(x = start_x; x < cube_size + start_x; x++){
			var tmp_index = (y * map_size) + x;

// random_log( tmp_index, 3000 )

			// nx = Math.cos( ((x/cube_size) * scale) * 2 * Math.PI );
			// ny = Math.cos( ((y/cube_size) * scale) * 2 * Math.PI );
			// nz = Math.sin( ((x/cube_size) * scale) * 2 * Math.PI );
			// nw = Math.sin( ((y/cube_size) * scale) * 2 * Math.PI );
			// var elevation = fast_simplex.get4DNoise(nx,ny,nz,nw) + 0.55;

			var elevation = (terrain_simplex.get2DNoise(x, y) + 1) / 2;
			elevation = Math.round(elevation * 10) * 50;

			var tile_data = {height: elevation, x: local_x, z: local_y};

			tilemap.push( tile_data );

			local_x++;
		}

		local_y++;
	}

	return tilemap;
}

function calculate_temperature(elevation, y, start_y, cube_size){
	var temperature = 60; // In Farenheight
	if(elevation <= 0.57){
		temperature -= 20; // Drop 20* over the ocean
	} else {
		// temp drops 3f per 1k ft, based on max elevation of 20k feet
		// Max altitude in the US is 20,000ft
		// The top of the tallest mountain (alt:1 or 0.43 above sea level, gets a full 60f reduction in temp)
		// temperature -= ((elevation - .57) * 140); // This gets lowest temp at top of mountains 0F
		temperature -= ((elevation - .57) * 210); // This should return a coldest of about -30 (less if very tall mt's)
	}
	// Average temp on the equator is about 90f
	var equator_distance = Math.abs( Math.abs( 1 - ((y-start_y)/cube_size*2) ) - 1 );
	// temperature += (equator_distance * 30); // This will get a max temp of about 90f
	temperature += (equator_distance * 40);
	var temp_variance = (temperature_simplex.get4DNoise(nx,ny,nz,nw) * 30); // +- at most 15f
	// if( Math.round(Math.random()*1000) == 50 ){ console.log( equator_distance )}
	temperature += temp_variance;

	return temperature;
}

function random_log(input, odds){
	odds = typeof(odds) != 'undefined' ? odds : 10;
	if( Math.round( Math.random() * odds ) == 2 ){
		console.log( input );
	}
}