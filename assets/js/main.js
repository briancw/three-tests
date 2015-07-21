var camera, scene, renderer;

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

	camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, - 500, 1000 );
	camera.position.x = 200;
	camera.position.y = 100;
	camera.position.z = 200;

	scene = new THREE.Scene();

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

	// var cubes = Object();
	var cube_size = 15;
	var start_x = -cube_size / 2;
	var start_z = -cube_size / 2;
	for(var ix = start_x; ix < cube_size/2; ix++){
		for(var iz = start_z; iz < cube_size/2; iz++){

			var tmp_cube = new THREE.Mesh( geometry, material );
			tmp_cube.position.x = (ix * 50);
			tmp_cube.position.z = (iz * 50);
			tmp_cube.position.y = 25;
			scene.add( tmp_cube );
		}
	}

	// Lights

	// var ambientLight = new THREE.AmbientLight( Math.random() * 0x10 );
	// scene.add( ambientLight );

	var directionalLight = new THREE.DirectionalLight( Math.random() * 0xffffff );
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

	camera.position.x = Math.cos( timer ) * 200;
	camera.position.z = Math.sin( timer ) * 200;
	// camera.position.y -= Math.sin( timer ) * 10;
	camera.lookAt( scene.position );

	renderer.render( scene, camera );
	stats.update();
	// cube.rotation.x += 0.01;
	// cube.rotation.y += 0.01;
})();