importScripts('/assets/js_libs/three.min.js');

var cube_size = 36;
var tile_width = 100;

var brown = 0x77543c;
var green = 0x326800;
var blue = 0x254e78;

var material_array = [];
// Water Block [0]
material_array.push( new THREE.MeshLambertMaterial( { color: blue } ) );
material_array.push( new THREE.MeshLambertMaterial( { color: blue } ) );
material_array.push( new THREE.MeshLambertMaterial( { color: blue } ) );
material_array.push( new THREE.MeshLambertMaterial( { color: blue } ) );
material_array.push( new THREE.MeshLambertMaterial( { color: blue } ) );
material_array.push( new THREE.MeshLambertMaterial( { color: blue } ) );

// Water Block [6]
material_array.push( new THREE.MeshLambertMaterial( { color: brown } ) );
material_array.push( new THREE.MeshLambertMaterial( { color: brown } ) );
material_array.push( new THREE.MeshLambertMaterial( { color: green } ) );
// material_array.push( new THREE.MeshLambertMaterial( { map: THREE.ImageUtils.loadTexture('assets/img/grass.jpg') } ) );
material_array.push( new THREE.MeshLambertMaterial( { color: brown } ) );
material_array.push( new THREE.MeshLambertMaterial( { color: brown } ) );
material_array.push( new THREE.MeshLambertMaterial( { color: brown } ) );

blocks = new THREE.MeshFaceMaterial(material_array);

// 	map: THREE.ImageUtils.loadTexture('assets/img/stone.png')
// 	map: THREE.ImageUtils.loadTexture('assets/img/water.jpg')

cube_geometry = new THREE.BoxGeometry( self.tile_width, self.tile_width / 4, self.tile_width );

self.addEventListener('message', function(e) {

	for(var i in e.data){
		var tilemap_index = i;
		render_chunk(e.data[i], i);
	}

  // self.postMessage(e.data);
}, false);


function render_chunk(tilemap, tilemap_index){
	// var origin_x = (index_to_coords(tilemap_index)[0] - origin[0]) * terrain.tile_width;
	// var origin_z = (index_to_coords(tilemap_index)[1] - origin[1]) * terrain.tile_width;

	var geometry = new THREE.Geometry();

	for(var i in tilemap){

		var tmp_height = 0;
		var material_index = 0;

		var tmp_cube = new THREE.Mesh( this.cube_geometry );

		if(tilemap[i].height > 0 && tilemap[i].height < 0.57){
			material_index = 0;
		} else if(tilemap[i].height > 0.57 && tilemap[i].height < 0.6 ){
			material_index = 6;
			tmp_height = (tilemap[i].height - 0.57) * 10000000;
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
	// chunk.position.x = origin_x * 1.01;
	// chunk.position.z = origin_z * 1.01;

	// this.tilemaps[tilemap_index] = chunk;
	console.log(chunk);
	var foo = {bar: 'baz'};
	self.postMessage(foo, [foo]);

}