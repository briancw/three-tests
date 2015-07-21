var camera, scene, renderer;
var doc_width = $(window).width();
var doc_height = $(window).height() - $('.ui_container').height();
var doc_diagonal = Math.ceil(Math.sqrt( Math.pow(doc_width,2) + Math.pow(doc_height*2,2) ));
var iso_width = Math.sqrt( Math.pow(doc_width, 2) + Math.pow(doc_width/2, 2) );
var cube_width = 50;

var cube_size = Math.round(doc_diagonal / cube_width * 1.5);

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
	camera.position.set(10, 8, 10);
	camera.lookAt( scene.position );


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

/*
	// Cubes
	var geometry = new THREE.BoxGeometry( 50, 50, 50 );
	var material = new THREE.MeshLambertMaterial( { color: 0xffffff, shading: THREE.FlatShading, overdraw: 0.5 } );

	for ( var i = 0; i < 100; i ++ ) {

		var cube = new THREE.Mesh( geometry, material );

		// cube.scale.y = Math.floor( Math.random() * 2 + 1 );
		// cube.position.y = ( cube.scale.y * 50 ) / 2;

		cube.position.x = Math.floor( ( Math.random() * 1000 - 500 ) / 50 ) * 50 + 25;
		cube.position.y = 25;
		cube.position.z = Math.floor( ( Math.random() * 1000 - 500 ) / 50 ) * 50 + 25;

		scene.add( cube );
	}
*/

	var geometry = new THREE.BoxGeometry( 50, 50, 50 );
	// var material = new THREE.MeshLambertMaterial( { color: 0xffffff, shading: THREE.FlatShading, overdraw: 0.5 } );
	var material = new THREE.MeshLambertMaterial( { color: 0x4C7124 } );

	var start_x = -cube_size / 2;
	var start_z = -cube_size / 2;
	for(var ix = start_x; ix < cube_size/2; ix++){
		for(var iz = start_z; iz < cube_size/2; iz++){
			if(Math.random() > 0.7){
				continue;
			}
			var tmp_cube = new THREE.Mesh( geometry, material );
			tmp_cube.position.x = (ix * 50);
			tmp_cube.position.z = (iz * 50);
			tmp_cube.position.y = 25;
			scene.add( tmp_cube );
		}
	}

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
	// pointLight.position.y = 0;
	// pointLight.position.z = 0;
	// scene.add( pointLight );

}

init();
var ui = new UI();
ui.click_listener();
ui.pan_listener();

function UI(){
	var self = this;
	this.mouse_is_down = false;
	this.last_x;
	this.last_y;
	this.is_click = true;

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
}

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
	// var timer = Date.now() * 0.0001;
	// camera.position.set(Math.cos( timer ) * 10, 7, Math.sin( timer ) * 10);
	// camera.position.y -= Math.sin( timer ) * 10;
	// camera.position.y -= 0.1;
	// camera.lookAt( scene.position );

	renderer.render( scene, camera );
	stats.update();
	// cube.rotation.x += 0.01;
	// cube.rotation.y += 0.01;
})();