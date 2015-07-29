var FastSimplexNoise = require('fast-simplex-noise');
// var crypto = require('crypto');
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ port: 9005 });

// var Redis = require('redis');
// var redis = Redis.createClient(6379, 'localhost');

// redis.on("error", function(err) {
// 	console.error("Error connecting to redis", err);
// });

// redis.select(1);

// var world_seed = Math.random();
function random(){
	// return world_seed;
	return 0.4710536374424983;
}

var fast_simplex = new FastSimplexNoise({random: random});
fast_simplex.octaves = 12;
fast_simplex.frequency = 0.315;
fast_simplex.persistence = 0.5;

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
				var origin_point = parsed_message.map_params.origin_point;
				var distance = parsed_message.map_params.distance;
				var cube_size = parsed_message.map_params.cube_size;

				var start_origin = origin_point - (map_size * cube_size * distance) - (cube_size * distance);

				for(var ix = 0; ix < (distance * 2) + 1; ix++){
					for(var iz = 0; iz < (distance * 2) + 1; iz++){
						var tmp_index = start_origin + (map_size * cube_size * ix) + (iz * cube_size);
						tilemaps[tmp_index] = generate_tilemap( parsed_message.map_params, tmp_index );
					}
				}

				ws.send( get_json( {type:'map_data', tilemaps: tilemaps} ) );
				console.timeEnd('generate map');
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
	var local_x = 0;

	for(x = start_x; x < cube_size + start_x; x++){
		var local_y = 0;

		for(y = start_y; y < cube_size + start_y; y++){

			nx = Math.cos( ((x/cube_size) * scale) * 2 * Math.PI );
			ny = Math.cos( ((y/cube_size) * scale) * 2 * Math.PI );
			nz = Math.sin( ((x/cube_size) * scale) * 2 * Math.PI );
			nw = Math.sin( ((y/cube_size) * scale) * 2 * Math.PI );

			var tmp_elevation = fast_simplex.get4DNoise(nx,ny,nz,nw) + 0.55;

			tilemap.push( {height: tmp_elevation, x: local_x, z: local_y} );

			// if(tmp_elevation > 0 && tmp_elevation < 0.57){
			// 	tilemap.ocean.tiles.push( {height: tmp_elevation, x: local_x, y: local_y} );
			// } else if(tmp_elevation > 0.57 && tmp_elevation < 0.6 ){
			// 	tilemap.coastline.tiles.push( {height: tmp_elevation, x: local_x, y: local_y} );
			// } else if(tmp_elevation > 0.6 && tmp_elevation < 0.7 ){
			// 	tilemap.inland.tiles.push( {height: tmp_elevation, x: local_x, y: local_y} );
			// } else if(tmp_elevation > 0.7 && tmp_elevation < 0.8 ){
			// 	tilemap.highland.tiles.push( {height: tmp_elevation, x: local_x, y: local_y} );
			// } else if(tmp_elevation > 0.8 && tmp_elevation < 1 ){
			// 	tilemap.mountain.tiles.push( {height: tmp_elevation, x: local_x, y: local_y} );
			// }

			local_y++;
		}

		local_x++;
	}

	return tilemap;
}


