var camera, scene, renderer, controls;
var doc_width = $(window).width();
var doc_height = $(window).height() - $('.ui_container').height();
// var doc_diagonal = Math.ceil(Math.sqrt( Math.pow(doc_width,2) + Math.pow(doc_height*2,2) ));
// var iso_width = Math.sqrt( Math.pow(doc_width, 2) + Math.pow(doc_width/2, 2) );
// var cube_width = 50;

// var cube_size = Math.round(doc_diagonal / cube_width * 1.5);

var cube_size = 80;
var map_size = 2500000;
var origin = [552648, 429251];
var origin_point = coords_to_index(origin);

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

function coords_to_index(coords){
	return (coords[0] * map_size) + coords[1];
}

var network = new Network();
var terrain = new Terrain();
init();
var ui = new UI();
// ui.click_listener();
// ui.pan_listener();

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

	// camera.position.x += 5;
	var timer = Date.now() * 0.0001;
	camera.position.set(Math.cos( timer ) * 10, 7, Math.sin( timer ) * 10);
	camera.lookAt( scene.position );
	// camera.position.y -= Math.sin( timer ) * 10;
	// camera.position.y -= 0.1;

	renderer.render( scene, camera );
	stats.update();
	// cube.rotation.x += 0.01;
	// cube.rotation.y += 0.01;
})();

function init(){
	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor( 0xf0f0f0 );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );

	var three_canvas = renderer.domElement;
	$(three_canvas).addClass('canvas');
	$('body').append(three_canvas);

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
	camera.position.set(-10, 8, -10);
	camera.lookAt( scene.position );

	// controls = new THREE.OrbitControls( camera );
	// controls.damping = 0.2;

/*
	// Grid
	var size = 500, step = 50;
	var geometry = new THREE.Geometry();
	for ( var i = - size; i <= size; i += step ) {
		geometry.vertices.push( new THREE.Vector3( - size, 0, i) );
		geometry.vertices.push( new THREE.Vector3(   size, 0, i) );
		geometry.vertices.push( new THREE.Vector3( i, 0, - size) );
		geometry.vertices.push( new THREE.Vector3( i, 0,   size) );
	}
	var material = new THREE.LineBasicMaterial( { color: 0x000000, opacity: 0.2 } );
	var line = new THREE.Line( geometry, material, THREE.LinePieces );
	scene.add( line );
*/

	// var tmp_cube = new THREE.Mesh( geometry, material );
	// tmp_cube.position.x = 0;
	// tmp_cube.position.z = 0;
	// scene.add( tmp_cube );

	// Lights

	// var ambientLight = new THREE.AmbientLight( Math.random() * 0x10 );
	// scene.add( ambientLight );

	var directionalLight = new THREE.DirectionalLight( 0xffffff );
	directionalLight.position.x = Math.random() - 0.5;
	directionalLight.position.y = 400;
	directionalLight.position.z = Math.random() - 0.5;
	directionalLight.position.normalize();
	scene.add( directionalLight );

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

	if(current_env == 'simple-rts.zimmerloe.com'){
		var server_url = 'ws://simple-rts.zimmerloe.com:9005';
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
		// self.get_map_data( origin_points() );
		self.get_map_data( [origin_point] );
	};

	this.get_map_data = function(origin_points){
		var map_params = {cube_size: cube_size, map_size: map_size, origin_points: origin_points};
		ws.send( get_json({type:'get_map_data', map_params:map_params}) );
	};

	ws.onmessage = function (ret){
		var received_msg = JSON.parse(ret.data);
		var message_type = received_msg.type;

		switch (message_type){

			case 'map_data':
				terrain.update_tilemaps(received_msg.tilemaps);
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

	this.update_tilemaps = function(tilemaps){

		for(var foo in tilemaps){

			var geometry = new THREE.BoxGeometry( 50, 50, 50 );
			var color_index = 0;
			var materials = Object();
			materials[0] = new THREE.MeshLambertMaterial( { color: 0x254e78 } );
			materials[1] = new THREE.MeshLambertMaterial( { color: 0x326800 } );
			materials[2] = new THREE.MeshLambertMaterial( { color: 0x4C7124 } );
			materials[3] = new THREE.MeshLambertMaterial( { color: 0x59842A } );
			materials[4] = new THREE.MeshLambertMaterial( { color: 0x7A8781 } );

			for(var i in tilemaps[foo]){

				var tmp_height = 25;

				if(tilemaps[foo][i].height > 0 && tilemaps[foo][i].height < 0.57){
					color_index = 0;
					tmp_height = 0;
				} else if(tilemaps[foo][i].height > 0.57 && tilemaps[foo][i].height < 0.6 ){
					color_index = 1;
					tmp_height = (tilemaps[foo][i].height - 0.57) * 10000000;
					// if(Math.round(Math.random()) > 0.9){ cl(tmp_height)}
					// console.log(height);
				} else if(tilemaps[foo][i].height > 0.6 && tilemaps[foo][i].height < 0.7 ){
					color_index = 2;
				} else if(tilemaps[foo][i].height > 0.7 && tilemaps[foo][i].height < 0.8 ){
					color_index = 3;
				} else if(tilemaps[foo][i].height > 0.8 && tilemaps[foo][i].height < 1 ){
					color_index = 4;
				}

				var tmp_cube = new THREE.Mesh( geometry, materials[color_index] );
				tmp_cube.position.x = ((tilemaps[foo][i].x - (cube_size/2)) * 50);
				tmp_cube.position.z = ((tilemaps[foo][i].z - (cube_size/2)) * 50);
				tmp_cube.position.y = tmp_height;
				scene.add( tmp_cube );
			}

		}


	}

}

function UI(){
	var self = this;
	this.mouse_is_down = false;
	this.last_x;
	this.last_y;
	this.is_click = true;

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

	// $('#'+this.ui_id).mouseup(function(e){
	// 	self.mouse_is_down = false;

	// 	if(self.is_click && typeof(self.click_callback) == 'function'){
	// 		var iso_coords = self.iso_to_cartesian( [e.pageX, e.pageY] );
	// 		iso_coords[0] = Math.floor( (iso_coords[0] - self.translation[0]) / terrain.tile_width) * terrain.tile_width;
	// 		iso_coords[1] = Math.floor( (iso_coords[1] - self.translation[1]) / terrain.tile_width) * terrain.tile_width;

	// 		var true_coords = Array();
	// 		true_coords[0] = (iso_coords[0]/terrain.tile_width) + (cube_size/2) + origin[0];
	// 		true_coords[1] = (iso_coords[1]/terrain.tile_width) + (cube_size/2) + origin[1];

	// 		self.click_callback(true_coords);
	// 		self.click_callback = null;
	// 	}

	// });

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