var camera, scene, renderer, controls;
var doc_width = $(window).width();
var doc_height = $(window).height() - $('.ui_container').height();
// var doc_diagonal = Math.ceil(Math.sqrt( Math.pow(doc_width,2) + Math.pow(doc_height*2,2) ));
// var iso_width = Math.sqrt( Math.pow(doc_width, 2) + Math.pow(doc_width/2, 2) );
// var tile_width = 50;
var do_rotate = location.search.split('rotate=')[1];
var halt = location.search.split('halt=')[1];

if(halt){
 catch_fire
}

// var cube_size = Math.round(doc_diagonal / tile_width * 1.5);

// var cube_size = 18;
// var cube_size = 60;
var cube_size = 36;
var map_size = 2500000;
var start_origin = [552648, 429251];
var origin = [552648, 429251];
// origin[0] += 20;
var origin_point = coords_to_index(origin);

function coords_to_index(coords){
	return (coords[0] * map_size) + coords[1];
}

function index_to_coords(index){
	var tmp_x = Math.floor(index / map_size);
	var tmp_z = index - (tmp_x * map_size);
	return [ tmp_x, tmp_z ];
}

function origin_points(){
	var origin_points = Array();
	origin_points[0] = ((origin[0] - cube_size) * map_size) + (origin[1] - cube_size);
	origin_points[1] = ((origin[0] - cube_size) * map_size) + origin[1];
	origin_points[2] = ((origin[0] - cube_size) * map_size) + (origin[1] + cube_size);
	origin_points[3] = ((origin[0] * map_size)) + (origin[1] - cube_size);
	origin_points[4] = ((origin[0] * map_size)) + origin[1];
	origin_points[5] = ((origin[0] * map_size)) + (origin[1] + cube_size);
	origin_points[6] = ((origin[0] + cube_size) * map_size) + (origin[1] - cube_size);
	origin_points[7] = ((origin[0] + cube_size) * map_size) + origin[1];
	origin_points[8] = ((origin[0] + cube_size) * map_size) + (origin[1] + cube_size);

	return origin_points;
}

var network = new Network();
var terrain = new Terrain();
init();
var ui = new UI();
// ui.click_listener();
// ui.pan_listener();
ui.keyboard_listener();

window.requestAnimFrame = (function(){
	return window.requestAnimationFrame		||
		window.webkitRequestAnimationFrame	||
		window.mozRequestAnimationFrame		||
		function( callback ){
			window.setTimeout(callback, 1000 / 60);
		};
})();

(function animloop(){
	requestAnimFrame(animloop);

	if(do_rotate){
		var timer = Date.now() * 0.0001;
		camera.position.set(Math.cos( timer ) * 10, 7, Math.sin( timer ) * 10);
		camera.lookAt( scene.position );
	}

	// camera.rotation.x += 0.001;

	// camera.position.y -= Math.sin( timer ) * 10;
	// camera.position.y -= 0.1;

	// terrain.cube.rotation.x += 0.01;
	// terrain.cube.rotation.y += 0.01;

	ui.pan_map_loop();

	pointer.position.x = camera.position.x;
	pointer.position.z = camera.position.z;

	renderer.render( scene, camera );
	stats.update();
	// cube.rotation.x += 0.01;
	// cube.rotation.y += 0.01;
})();

var pointer;

function init(){
	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor( 0xf0f0f0 );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );

	$(renderer.domElement).addClass('canvas');
	$('body').append(renderer.domElement);

	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	$('body').append(stats.domElement);

	// camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, -2000, 2000 );
	// camera.position.x = 200;
	// camera.position.z = 200;
	// camera.position.y = 100;

	scene = new THREE.Scene();

	var aspect = window.innerWidth / window.innerHeight;
	var d = 800;
	camera = new THREE.OrthographicCamera( - d * aspect, d * aspect, d, - d, -2000, 2000 );
	// camera.position.set(10, 8, 10);
	camera.position.set(5, 5, 5);
	camera.lookAt( scene.position );

	// controls = new THREE.OrbitControls( camera );
	// controls.damping = 0.2;

	// Lights

	var ambient_light = new THREE.AmbientLight( 0x404040 );
	scene.add( ambient_light );

	terrain.sun_light = new THREE.DirectionalLight( 0xffffff );
	terrain.sun_light.position.x = 0;
	terrain.sun_light.position.z = 0;
	terrain.sun_light.position.y = 400;
	terrain.sun_light.position.normalize();
	scene.add( terrain.sun_light );

	pointer = new THREE.Mesh( new THREE.BoxGeometry(10,10,10), new THREE.MeshLambertMaterial({color:0x77543c}) );
	pointer.position.set(0,50,0);
	scene.add(pointer);

	// var pointLight = new THREE.PointLight(0xFFFFFF);
	// pointLight.position.x = 0;
	// pointLight.position.y = 200;
	// pointLight.position.z = 0;
	// scene.add( pointLight );

}

function Network(){

	var self = this;

	if (!"WebSocket" in window){
		alert("Browser doesn't support WebSockets. Go kick rocks.");
	}

	var init_socket_connect = false;
	var current_env = window.location.host;

	if(current_env == 'three.zimmerloe.com'){
		var server_url = 'ws://three.zimmerloe.com:9005';
	} else {
		var server_url = 'ws://localhost:9005';
	}
	var ws = new WebSocket(server_url);

	ws.onclose = function(){
		if(!init_socket_connect){
			ui.visual_error( 'Unable to establish WebSocket connection.');
		} else {
			ui.visual_error( 'WebSocket Connection closed');
		}
	};

	ws.onerror = function(e){
		ui.visual_error('There was an error with the WebSocket connection.');
	}

	ws.onopen = function(){
		init_socket_connect = true;
		self.get_map_data( origin_point, 1 );
		// self.get_map_data( origin_point, 4 );
	};

	this.get_map_data = function(origin_point, distance){

		// time_start('map_data');

		var tmp_origin_points = Array();
		var start_origin = origin_point - (map_size * cube_size * distance) - (cube_size * distance);
		for(var ix = 0; ix < (distance * 2) + 1; ix++){
			for(var iz = 0; iz < (distance * 2) + 1; iz++){
				var tmp_index = start_origin + (map_size * cube_size * ix) + (iz * cube_size);

				if( typeof(terrain.tilemaps[tmp_index]) != 'object' ){
					tmp_origin_points.push(tmp_index);
				}
			}
		}

		if( tmp_origin_points.length ){
			var map_params = {cube_size: cube_size, map_size: map_size, origin_points: tmp_origin_points};
			ws.send( get_json({type:'get_map_data', map_params:map_params}) );
		}
	};

	ws.onmessage = function (ret){
		var received_msg = JSON.parse(ret.data);
		var message_type = received_msg.type;

		switch (message_type){

			case 'map_data':
				terrain.update_tilemaps(received_msg.tilemaps);
				// time_end('map_data');
				break;

			default:
				console.log('Unkown server response');
				break;

		}
	};

	function get_json(input){
		try {
			var json_string = JSON.stringify(input);
		} catch(err) {
			console.log('Invalid Json');
			console.log(err);
			return false;
		}

		return json_string;
	};
}

function Terrain(){

	this.tilemaps = Object();
	this.tile_width = 100;
	var self = this;
	this.map_ready = false;
	this.active_tile_offset = [0,0];

	(function init_assets(){
		self.brown = 0x77543c;
		self.green = 0x326800;
		self.blue = 0x254e78;

		var material_array = [];
		// Water Block [0]
		material_array.push( new THREE.MeshLambertMaterial( { color: self.blue } ) );
		material_array.push( new THREE.MeshLambertMaterial( { color: self.blue } ) );
		material_array.push( new THREE.MeshLambertMaterial( { color: self.blue } ) );
		material_array.push( new THREE.MeshLambertMaterial( { color: self.blue } ) );
		material_array.push( new THREE.MeshLambertMaterial( { color: self.blue } ) );
		material_array.push( new THREE.MeshLambertMaterial( { color: self.blue } ) );

		// Water Block [6]
		material_array.push( new THREE.MeshLambertMaterial( { color: self.brown } ) );
		material_array.push( new THREE.MeshLambertMaterial( { color: self.brown } ) );
		material_array.push( new THREE.MeshLambertMaterial( { color: self.green } ) );
		// material_array.push( new THREE.MeshLambertMaterial( { map: THREE.ImageUtils.loadTexture('assets/img/grass.jpg') } ) );
		material_array.push( new THREE.MeshLambertMaterial( { color: self.brown } ) );
		material_array.push( new THREE.MeshLambertMaterial( { color: self.brown } ) );
		material_array.push( new THREE.MeshLambertMaterial( { color: self.brown } ) );

		self.blocks = new THREE.MeshFaceMaterial(material_array);

		// 	map: THREE.ImageUtils.loadTexture('assets/img/stone.png')
		// 	map: THREE.ImageUtils.loadTexture('assets/img/water.jpg')

		self.cube_geometry = new THREE.BoxGeometry( self.tile_width, self.tile_width / 4, self.tile_width );
	})();

	this.update_tilemaps = function(tilemaps){

		for(var i in tilemaps){
			// this.tilemaps[i] = tilemaps[i];

			console.log(i);
			this.tilemaps[i] = Array();
			this.render_tiles(tilemaps[i], i);
		}

		this.draw_tilemap( this.tilemaps[origin_point] );
		this.map_ready = true;
	}

	this.render_tiles = function(tilemap, tilemap_index){

		var origin_x = (index_to_coords(tilemap_index)[0] - start_origin[0]) * terrain.tile_width;
		var origin_z = (index_to_coords(tilemap_index)[1] - start_origin[1]) * terrain.tile_width;

		var geometry = new THREE.Geometry();

		for(var i in tilemap){

			var tmp_height = 0;
			var material_index = 0;

			var tmp_cube = new THREE.Mesh( this.cube_geometry );

			if(tilemap[i].height > 0 && tilemap[i].height < 0.57){
				material_index = 0;
			} else if(tilemap[i].height > 0.57 && tilemap[i].height < 0.6 ){
				material_index = 6;
				// tmp_height = (tilemap[i].height - 0.57) * 10000000;
			}

			// } else if(tilemap[i].height > 0.6 && tilemap[i].height < 0.7 ){
			// } else if(tilemap[i].height > 0.7 && tilemap[i].height < 0.8 ){
			// } else if(tilemap[i].height > 0.8 && tilemap[i].height < 1 ){
			// }

			tmp_cube.position.x = ((tilemap[i].x - (cube_size/2)) * this.tile_width);
			tmp_cube.position.z = ((tilemap[i].z - (cube_size/2)) * this.tile_width);
			tmp_cube.position.y = tmp_height;

			tmp_cube.matrixAutoUpdate = false;
			tmp_cube.updateMatrix();

			geometry.merge( tmp_cube.geometry, tmp_cube.matrix, material_index );

		}

		var chunk = new THREE.Mesh( geometry, self.blocks );
		chunk.position.x = origin_x * 1.01;
		chunk.position.z = origin_z * 1.01;

		this.tilemaps[tilemap_index] = chunk;
		// scene.add(chunk);

		// this.draw_tilemap( this.tilemaps[tilemap_index] );

	}

	this.draw_tilemap = function(tilemap){

		scene.add( tilemap );

	}

}

function UI(){
	var self = this;
	this.mouse_is_down = false;
	this.last_x;
	this.last_y;
	this.is_click = true;
	this.pan_amount = 15;
	this.half_map = (cube_size * terrain.tile_width / 2);
	this.buffer = 10;
	this.tilemaps_shown = {
		// nw: false,
		// ne: false,
		// sw: false,
		// se: false,
		n: false,
		s: false,
		e: false,
		w: false
	};

	this.is_updating = false;

	this.visual_error = function(error_message){
		$('.error_message_box .error_message').html(error_message);
		$('.error_message_box').fadeIn(600);

		setTimeout(function(){
			$('.error_message_box').fadeOut(500);
		}, 3000);
	}

	this.click_listener = function(){
		$(renderer.domElement).mousedown(function(e){
			if(e.which === 1){
				var mouse_coords = self.iso_to_cartesian([e.pageX, e.pageY]);

				self.last_x = mouse_coords[0];
				self.last_y = mouse_coords[1];
				self.mouse_is_down = true;
				self.is_click = true;
			}
		});
	}

	this.keyboard_listener = function(){
		this.move_up = false;
		this.move_up = false;
		this.move_up = false;
		this.move_up = false;

		$(document).keydown(function(e){
			if(e.keyCode == 87){ // Up
				self.move_up = true;
			} else if(e.keyCode == 83){ // Down
				self.move_down = true;
			} else if(e.keyCode == 65){ // Left
				self.move_left = true;
			} else if(e.keyCode == 68){ // Right
				self.move_right = true;
			}

		});

		$(document).keyup(function(e){

			if(e.keyCode == 87){ // Up
				self.move_up = false;
			} else if(e.keyCode == 83){ // Down
				self.move_down = false;
			} else if(e.keyCode == 65){ // Left
				self.move_left = false;
			} else if(e.keyCode == 68){ // Right
				self.move_right = false;
			}

		});

	}

	this.check_chunks = function(){
		// return false;
		if(!terrain.map_ready){
			return false;
		}

		var camera_offset = Array();
		camera_offset[0] = ( camera.position.x + ((start_origin[0] - origin[0]) * terrain.tile_width) );
		camera_offset[1] = ( camera.position.z + ((start_origin[1] - origin[1]) * terrain.tile_width) );

		if(camera_offset[0] < 0 && camera_offset[1] < 0 && !this.tilemaps_shown.n){
			scene.add( terrain.tilemaps[ origin_points()[0] ] );
			scene.add( terrain.tilemaps[ origin_points()[1] ] );
			scene.add( terrain.tilemaps[ origin_points()[3] ] );

			scene.remove( terrain.tilemaps[ origin_points()[5] ] );
			scene.remove( terrain.tilemaps[ origin_points()[7] ] );
			scene.remove( terrain.tilemaps[ origin_points()[8] ] );

			this.tilemaps_shown.n = true;
			this.tilemaps_shown.s = false;
			this.tilemaps_shown.e = false;
			this.tilemaps_shown.w = false;
			// console.log('n');
		} else if(camera_offset[0] < 0 && camera_offset[1] > 0 && !this.tilemaps_shown.w){
			scene.add( terrain.tilemaps[ origin_points()[1] ] );
			scene.add( terrain.tilemaps[ origin_points()[2] ] );
			scene.add( terrain.tilemaps[ origin_points()[5] ] );

			scene.remove( terrain.tilemaps[ origin_points()[3] ] );
			scene.remove( terrain.tilemaps[ origin_points()[6] ] );
			scene.remove( terrain.tilemaps[ origin_points()[7] ] );

			this.tilemaps_shown.w = true;
			this.tilemaps_shown.n = false;
			this.tilemaps_shown.s = false;
			this.tilemaps_shown.e = false;
			// console.log('w');
		} else if(camera_offset[0] > 0 && camera_offset[1] > 0 && !this.tilemaps_shown.s){
			scene.add( terrain.tilemaps[ origin_points()[5] ] );
			scene.add( terrain.tilemaps[ origin_points()[7] ] );
			scene.add( terrain.tilemaps[ origin_points()[8] ] );

			scene.remove( terrain.tilemaps[ origin_points()[0] ] );
			scene.remove( terrain.tilemaps[ origin_points()[1] ] );
			scene.remove( terrain.tilemaps[ origin_points()[3] ] );

			this.tilemaps_shown.s = true;
			this.tilemaps_shown.n = false;
			this.tilemaps_shown.w = false;
			this.tilemaps_shown.e = false;
			// console.log('s');
		} else if(camera_offset[0] > 0 && camera_offset[1] < 0 && !this.tilemaps_shown.e){
			scene.add( terrain.tilemaps[ origin_points()[3] ] );
			scene.add( terrain.tilemaps[ origin_points()[6] ] );
			scene.add( terrain.tilemaps[ origin_points()[7] ] );

			scene.remove( terrain.tilemaps[ origin_points()[1] ] );
			scene.remove( terrain.tilemaps[ origin_points()[2] ] );
			scene.remove( terrain.tilemaps[ origin_points()[5] ] );

			this.tilemaps_shown.e = true;
			this.tilemaps_shown.n = false;
			this.tilemaps_shown.s = false;
			this.tilemaps_shown.w = false;
		}
	}

	this.pan_map_loop = function(){

		if( this.move_up ){
			this.translate_map( -this.pan_amount, -this.pan_amount );
		} else if( this.move_down ){
			this.translate_map( this.pan_amount, this.pan_amount );
		}

		if( this.move_left ){
			this.translate_map( -this.pan_amount, this.pan_amount );
		} else if( this.move_right ){
			this.translate_map( this.pan_amount, -this.pan_amount );
		}

	}

	this.translate_map = function(difference_x, difference_z){
		camera.position.x += difference_x;
		camera.position.z += difference_z;


		// if( Math.abs(pointer.position.x - 10) > (terrain.tile_width * cube_size / 2) ){
		//	var new_origin = Array();
		// }

		// Probably should make this origin check more cost effective
		var tmp_origin = Array();
		tmp_origin[0] = start_origin[0] + ((Math.round( (camera.position.x - 10) / (cube_size * terrain.tile_width) ) * cube_size * terrain.tile_width) / terrain.tile_width);
		tmp_origin[1] = start_origin[1] + ((Math.round( (camera.position.z - 10) / (cube_size * terrain.tile_width) ) * cube_size * terrain.tile_width) / terrain.tile_width);

		if(tmp_origin[0] != origin[0] || tmp_origin[1] != origin[1]){
			origin = tmp_origin;
			origin_point = coords_to_index( origin );

			network.get_map_data(origin_point, 1);

			this.tilemaps_shown.n = false;
			this.tilemaps_shown.s = false;
			this.tilemaps_shown.e = false;
			this.tilemaps_shown.w = false;
		}

		this.check_chunks();
	}

	this.pan_listener = function(){
		$(renderer.domElement).mousemove(function(e){
			self.is_click = false;

			if(self.mouse_is_down){

				if(e.which === 0){
					self.mouse_is_down = false;
					return false;
				}

				var mouse_coords = self.iso_to_cartesian([e.pageX, e.pageY]);
				var tmp_difference_x = mouse_coords[0] - self.last_x;
				var tmp_difference_y = mouse_coords[1] - self.last_y;

				camera.position.x -= tmp_difference_x;
				camera.position.z -= tmp_difference_y;

				self.last_x = mouse_coords[0];
				self.last_y = mouse_coords[1];
			}
		});
	}

	this.iso_to_cartesian = function(coords){
		var angle = -45 * Math.PI / 180;
		var x = coords[0] - (doc_width/2);
		var y = (coords[1] - (doc_height/2)) * 2;

		var cos = Math.cos(angle);
		var sin = Math.sin(angle);

		var new_x = x*cos - y*sin;
		var new_y = x*sin + y*cos;

		return [Math.round(new_x), Math.round(new_y)];
	}
}