var camera, scene, renderer, stats, rstats;
var doc_width = $(window).width();
var doc_height = $(window).height() - $('.ui_container').height();

var auto_pan = location.search.split('auto_pan=')[1];

// var cube_size = Math.round(doc_diagonal / tile_width * 1.5);

// var cube_size = 20;
var cube_size = 36;
var map_size = 2500000;

var origin = [552648, 429251];
var start_origin = [552648, 429251];

// origin = [2500000, 2500000];
// start_origin = [2500000, 2500000];
// var start_x = Math.round(Math.random()*map_size);
// var start_z = Math.round(Math.random()*map_size);
// var origin = [start_x, start_z];
// var start_origin = [start_x, start_z];

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
var models = new Models();

init();

var ui = new UI();
ui.mouse_listeners();
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

	ui.pan_map_loop();

	pointer.position.x = camera.position.x;
	pointer.position.z = camera.position.z;

	if(auto_pan){
		ui.translate_map(-2,4);
	}

	renderer.render( scene, camera );
	stats.update();
	rstats.update(renderer);

})();

var pointer;

function init(){
	models.load_model('assets/models/factory.json', 'factory');

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

	rstats = new THREEx.RendererStats();
	rstats.domElement.style.position = 'absolute';
	rstats.domElement.style.left = '0px';
	rstats.domElement.style.bottom = '0px';
	$('body').append( rstats.domElement );

	scene = new THREE.Scene();

	// Camera
	var aspect = window.innerWidth / window.innerHeight;
	var d = 800;
	camera = new THREE.OrthographicCamera( - d * aspect, d * aspect, d, - d, -2000, 2000 );
	camera_rotation_x = Math.cos( Math.PI ) * 5;
	camera_rotation_z = Math.cos( Math.PI / 2 ) * 5;
	camera.position.set(5, 5, 5);
	camera.lookAt( scene.position );

	// Lights
	var ambient_light = new THREE.AmbientLight( 0x404040 );
	scene.add( ambient_light );

	terrain.sun_light = new THREE.DirectionalLight( 0xffffff );

	terrain.sun_light.position.x = 100;
	terrain.sun_light.position.z = 100;
	terrain.sun_light.position.y = 400;

	terrain.sun_light.position.normalize();
	scene.add( terrain.sun_light );

	pointer = new THREE.Mesh( new THREE.BoxGeometry(10,10,10), new THREE.MeshLambertMaterial({color:0x77543c}) );
	pointer.position.set(0,15,0);
	scene.add(pointer);

	setTimeout(function(){
		for(var i = 0; i < 100; i++){
			// for(var i2 = 0; i2 < 10; i2++){
				var tmp_mesh = models.models.factory.clone();
				tmp_mesh.position.x = (Math.random() * cube_size * terrain.tile_width) + 500;
				tmp_mesh.position.z = (Math.random() * cube_size * terrain.tile_width) + 500;
				tmp_mesh.rotateY( (Math.random() * 360) * (Math.PI / 180) );

				scene.add( tmp_mesh );
			// }
		}
	}, 2000);
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
		} else {
			// No new map data, update ui
			ui.update_active_chunks();
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
		self.textures = {};
		var texture_files = [
			'grass.png',
			'stone.png',
			'sand.jpg',
			'dirt.jpg',
			'water.jpg'
		];

		for(var i in texture_files){
			var basename = texture_files[i].split('.');
			self.textures[basename[0]] = THREE.ImageUtils.loadTexture('assets/img/' + texture_files[i] );
			self.textures[basename[0]].wrapS = self.textures[basename[0]].wrapT = THREE.RepeatWrapping;
			self.textures[basename[0]].repeat.set( cube_size, cube_size );
		}

		var material_array = [];
		material_array.push( new THREE.MeshBasicMaterial( { color: 0xba3a0f } ) ); // Unkown
		material_array.push( new THREE.MeshBasicMaterial({ map: self.textures.water }) ); // Ocean
		material_array.push( new THREE.MeshLambertMaterial({ map: self.textures.sand }) ); // Beach
		material_array.push( new THREE.MeshLambertMaterial({ map: self.textures.dirt }) ); // Beach_dirt
		material_array.push( new THREE.MeshBasicMaterial( { map: self.textures.grass } ) ); // Inland
		material_array.push( new THREE.MeshBasicMaterial( { map: self.textures.grass } ) ); // Inland_costal
		material_array.push( new THREE.MeshBasicMaterial( { map: self.textures.grass } ) ); // Oasis
		material_array.push( new THREE.MeshBasicMaterial( { color: 0x0C1138 } ) ); // Glacier
		material_array.push( new THREE.MeshBasicMaterial( { map: self.textures.water } ) ); // Lake
		material_array.push( new THREE.MeshBasicMaterial( { color: 0x50B948 } ) ); // Jungle
		material_array.push( new THREE.MeshBasicMaterial( { map: self.textures.sand } ) ); // Inland_desert
		material_array.push( new THREE.MeshBasicMaterial( { color: 0x3A3526 } ) ); // Lower_mountain
		material_array.push( new THREE.MeshBasicMaterial( { color: 0xcccccc } ) ); // Upper_mountain
		material_array.push( new THREE.MeshBasicMaterial( { color: 0xeeeeee } ) ); // Mountain_peak

		self.tile_textures = new THREE.MeshFaceMaterial(material_array);

		self.material_map = {
			unkown: 0,
			ocean: 1,
			beach: 2,
			beach_dirt: 3,
			inland: 4,
			inland_costal: 5,
			oasis: 6,
			glacier: 7,
			lake: 8,
			jungle: 9,
			inland_desert: 10,
			lower_mountain: 11,
			upper_mountain: 12,
			mountain_peak: 13
		};
	})();

	(function init_tile_geometry(){
		self.tile_geos = {};

		var tmp_grass = new THREE.BoxGeometry(1,50,2);
		// self.tile_geos.grass = new THREE.BoxGeometry(5,5,50);
		self.tile_geos.grass = new THREE.Mesh( tmp_grass );
		// scene.add( self.tile_geos.grass );


	})();

	this.update_tilemaps = function(tilemaps){

		for(var i in tilemaps){
			this.tilemaps[i] = Array();
			this.render_tiles(tilemaps[i], i);
		}

		this.draw_tilemap( this.tilemaps[origin_point] );
		this.map_ready = true;
		ui.update_active_chunks();
	}

	this.render_tiles = function(tilemap, tilemap_index){

		var chunk_geometry = new THREE.PlaneGeometry( self.tile_width * cube_size, self.tile_width * cube_size, cube_size, cube_size );
		var chunk = new THREE.Mesh(chunk_geometry, self.tile_textures);
		// var tile_decos = new THREE.BoxGeometry();
		chunk.rotateX( Math.PI / 180 * -90 );
		chunk.updateMatrix();

		var origin_x = (index_to_coords(tilemap_index)[0] - start_origin[0]) * terrain.tile_width;
		var origin_z = (index_to_coords(tilemap_index)[1] - start_origin[1]) * terrain.tile_width;

		// var tmp_grass = self.tile_geos.grass.clone();
		// tmp_grass.position.y = -400;
		// tmp_grass.updateMatrix();
		// chunk_geometry.merge(tmp_grass.geometry, tmp_grass.matrix);

		for(var i in tilemap){

			var tmp_height = 0;
			var material_index = 0;


			// if(Math.round(Math.random()*100)==1){
			// 	console.log( tilemap[i].height, tilemap[i].type )
			// }

			if( typeof( self.material_map[tilemap[i].type] ) != 'undefined' ){
				material_index = self.material_map[tilemap[i].type];

				if( tilemap[i].type == 'beach' ){
					var tmp_grass = self.tile_geos.grass.clone();
					tmp_grass.position.x = (tilemap[i].x * self.tile_width) - (self.tile_width * cube_size / 2) + origin_x;
					tmp_grass.position.z = (tilemap[i].z * self.tile_width) - (self.tile_width * cube_size / 2) + origin_z;
					tmp_grass.updateMatrix();
					scene.add( tmp_grass );
				// 	// tmp_grass.position.y = 0;
					// chunk_geometry.merge( tmp_grass.geometry, tmp_grass.matrix );
				// 	// tile_decos.merge( tmp_grass.geometry, tmp_grass.matrix );
				}

			} else {
				material_index = self.material_map.unkown;
			}

			chunk_geometry.faces[i*2].materialIndex = material_index;
			chunk_geometry.faces[(i*2) + 1].materialIndex = material_index;

			// chunk_geometry.vertices[i].z = tmp_height;
		}



		chunk.position.x = origin_x;
		chunk.position.z = origin_z;
		// chunk.position.x *= 1.01;
		// chunk.position.z *= 1.01;

		chunk.is_chunk = true;

		this.tilemaps[tilemap_index] = chunk;
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
	this.camera_zoom = 1;

	this.camera_coords = new THREE.Object3D;
	this.camera_coords.position = camera.position;
	this.rotate_amount = 22;
	this.radius = 7;

	this.raycaster = new THREE.Raycaster();
	this.mouse = new THREE.Vector2();
	this.active_chunks = [];

	this.tilemaps_shown = {
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

	this.keyboard_listener = function(){
		this.move_up = false;
		this.move_up = false;
		this.move_up = false;
		this.move_up = false;
		this.rotate_right = false;

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

			if(e.keyCode == 69){ // E
				self.rotate_right = true;
			} else if(e.keyCode == 81){ // Q
				self.rotate_left = true;
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

			if(e.keyCode == 69){ // E
				self.rotate_right = false;
			} else if(e.keyCode == 81){ // Q
				self.rotate_left = false;
			}

		});

	}

	this.mouse_listeners = function(){
		var rollOverGeo = new THREE.BoxGeometry( terrain.tile_width, 1, terrain.tile_width );
		var rollOverMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, opacity: 0.5, transparent: true } );
		this.rollOverMesh = new THREE.Mesh( rollOverGeo, rollOverMaterial );
		this.rollOverMesh.position.y = 0;
		scene.add( this.rollOverMesh );

		$(renderer.domElement).mousemove(function(event){
			event.preventDefault();

			self.is_click = false;

			var intersect_point = self.raycast(event);
			if( typeof(intersect_point) != 'undefined' ){
				self.rollOverMesh.position.copy( intersect_point[0] )
				self.rollOverMesh.position.y = 0.1;
				self.rollOverMesh.visible = true;
			}

		});

		$(renderer.domElement).click(function(event){
			event.preventDefault();

			var intersect_point = self.raycast(event);
			if( typeof(intersect_point) != 'undefined' ){
				console.log( intersect_point[1] ); // True World coord
			}

		});

		$(renderer.domElement).on('mousewheel', function(event) {
			// console.log(event.deltaX, event.deltaY, event.deltaFactor);
			if(Math.abs(event.deltaY) >= 3){
				self.camera_zoom += (event.deltaY/15);
				self.camera_zoom = self.camera_zoom > 8 ? 8 : self.camera_zoom;
				self.camera_zoom = self.camera_zoom < 1 ? 1 : self.camera_zoom;
				camera.zoom = self.camera_zoom;
				camera.updateProjectionMatrix();
			}
		});

	}

	this.raycast = function(event){
		self.mouse.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );
		self.raycaster.setFromCamera( self.mouse, camera );

		var intersects = self.raycaster.intersectObjects( self.active_chunks );

		if ( intersects.length > 0 ) {
			var intersect = intersects[ 0 ];

			var intersect_point = intersect.point.divideScalar(terrain.tile_width).floor().multiplyScalar(terrain.tile_width).addScalar( terrain.tile_width/2 );
			var output_point = [intersect_point.x - (terrain.tile_width/4), intersect_point.z - (terrain.tile_width/4)];
			var true_coords = [output_point[0] + origin[0], output_point[1] + origin[1]];
			return [intersect_point, true_coords];
		}
	}

	this.check_chunks = function(){
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

			var chunks_updated = true;
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

			var chunks_updated = true;
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

			var chunks_updated = true;
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

			var chunks_updated = true;
		}

		if(chunks_updated){
			this.update_active_chunks();
		}
	}

	this.pan_map_loop = function(){

		if( this.move_up ){
			this.translate_map( -0, -this.pan_amount );
		} else if( this.move_down ){
			this.translate_map( 0, this.pan_amount );
		}

		if( this.move_left ){
			this.translate_map( -this.pan_amount, 0 );
		} else if( this.move_right ){
			this.translate_map( this.pan_amount, -0 );
		}

		if( this.rotate_right ){
			this.rotate_amount ++;
			camera.position.x = (Math.cos( this.rotate_amount/30 ) * this.radius) + this.camera_coords.position.x;
			camera.position.z = (Math.sin( this.rotate_amount/30 ) * this.radius) + this.camera_coords.position.z;
			camera.lookAt( new THREE.Vector3( this.camera_coords.position.x, 0, this.camera_coords.position.z) );

		} else if( this.rotate_left ){
			this.rotate_amount --;
			camera.position.x = (Math.cos( this.rotate_amount/30 ) * this.radius) + this.camera_coords.position.x;
			camera.position.z = (Math.sin( this.rotate_amount/30 ) * this.radius) + this.camera_coords.position.z;
			camera.lookAt( new THREE.Vector3( this.camera_coords.position.x, 0, this.camera_coords.position.z) );
		}
	}

	this.translate_map = function(difference_x, difference_z){
		difference_x /= this.camera_zoom;
		difference_z /= this.camera_zoom;

		camera.translateX( difference_x );
		camera.translateZ( difference_z * 1.5 );
		camera.position.y = 5;

		this.camera_coords.position.x = camera.position.x;
		this.camera_coords.position.z = camera.position.z;

		this.rollOverMesh.visible = false;

		// Probably should make this origin check more cost effective
		var tmp_origin = Array();
		tmp_origin[0] = start_origin[0] + ((Math.round( (camera.position.x - 10) / (cube_size * terrain.tile_width) ) * cube_size * terrain.tile_width) / terrain.tile_width);
		tmp_origin[1] = start_origin[1] + ((Math.round( (camera.position.z - 10) / (cube_size * terrain.tile_width) ) * cube_size * terrain.tile_width) / terrain.tile_width);

		if(tmp_origin[0] != origin[0] || tmp_origin[1] != origin[1]){
			origin = tmp_origin;
			origin_point = coords_to_index( origin );

			network.get_map_data(origin_point, 2);

			this.tilemaps_shown.n = false;
			this.tilemaps_shown.s = false;
			this.tilemaps_shown.e = false;
			this.tilemaps_shown.w = false;
		}

		this.check_chunks();
	}

	this.update_active_chunks = function(){
		this.active_chunks = [];
		for(var i in scene.children){
			if( scene.children[i].type == 'Mesh' && scene.children[i].is_chunk ){
				this.active_chunks.push( scene.children[i] );
			}
		}
	}

}

function Models(){
	this.loader = new THREE.JSONLoader();

	this.models = {};
	var self = this;

	this.load_model = function(load_path, model_name){
		this.loader.load(load_path, function(geometry, material){
			// console.log(geometry, material);
			material = new THREE.MeshLambertMaterial({color: 0x555555});
			var tmp_mesh = new THREE.Mesh(geometry, material);
			self.models[model_name] = tmp_mesh;
			scene.add( tmp_mesh );
		});
	}

}
