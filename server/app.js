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
				// console.time('generate map');
				var tilemaps = new Object();
				var origin_points = parsed_message.map_params.origin_points;

				for(var i in origin_points){
					var origin_point = parsed_message.map_params.origin_points[i];
					var tmp_x = Math.floor( origin_point / map_size);
					var tmp_y = origin_point - (tmp_x * map_size);

					parsed_message.map_params.origin = [tmp_x, tmp_y];
					tilemaps[origin_point] = generate_tilemap(parsed_message.map_params);
				}

				ws.send( get_json( {type:'map_data', tilemaps: tilemaps, origin_points:origin_points} ) );
				// console.timeEnd('generate map');
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

function generate_tilemap(map_params){

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

	// console.log( map_params );
	if( typeof(map_params.origin) != 'undefined' && map_params.origin.length ){
		var origin = map_params.origin;
	} else {
		var origin = [0,0];
	}

	// var tilemap = {
	// 	ocean: { tiles: Array(), color: '#254e78'},
	// 	coastline: { tiles: Array(), color: '#326800' },
	// 	inland: { tiles: Array(), color: '#4C7124'},
	// 	highland: { tiles: Array(), color: '#59842A'},
	// 	mountain: { tiles: Array(), color: '#7A8781'}
	// }
	var tilemap = Array();

	var start_x = parseInt(origin[0], 10);
	var start_y = parseInt(origin[1], 10);

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


