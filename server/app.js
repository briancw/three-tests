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

var forrest_simplex = new FastSimplexNoise({random: random});
forrest_simplex.octaves = 12;
forrest_simplex.frequency = 0.05;
// forrest_simplex.persistence = 1;

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

	for(y = start_y; y < cube_size + start_y; y++){

		var local_x = 0;

		for(x = start_x; x < cube_size + start_x; x++){

			nx = Math.cos( ((x/cube_size) * scale) * 2 * Math.PI );
			ny = Math.cos( ((y/cube_size) * scale) * 2 * Math.PI );
			nz = Math.sin( ((x/cube_size) * scale) * 2 * Math.PI );
			nw = Math.sin( ((y/cube_size) * scale) * 2 * Math.PI );

			var elevation = fast_simplex.get4DNoise(nx,ny,nz,nw) + 0.55;
			var forrest_density = 0;
			if(elevation > 0.57){
				forrest_density = forrest_simplex.get2DNoise(local_x, local_y);
			}

			var tile_data = {height: elevation, x: local_x, z: local_y};
			tile_data.forrest_density = forrest_density;

			if(elevation > 0 && elevation < 0.57){
				tile_data.type = 'ocean';
			} else if(elevation > 0.57 && elevation < 0.6 ){
				tile_data.type = 'beach';
			} else if(elevation > 0.6 && elevation < 0.7 ){
				tile_data.type = 'beach_dirt';
			} else if(elevation > 0.7 && elevation < 0.8 ){
				tile_data.type = 'inland';
			} else if(elevation > 0.8 && elevation < 1 ){
				tile_data.type = 'highland';
			}

			tilemap.push( tile_data );

			local_x++;
		}

		local_y++;
	}

	return tilemap;
}


