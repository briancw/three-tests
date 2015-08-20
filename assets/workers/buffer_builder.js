self.addEventListener('message', function(e) {
	console.time('t');

	if( typeof(e.data.tilemap) != 'object' || !e.data.tilemap.length ){
		self.postMessage( {success: false, message: 'Missing Tilemap Data'} );
		return false;
	}

	var tilemap = e.data.tilemap;
	var cube_size = e.data.cube_size;
	var adjusted_cube_size = e.data.adjusted_cube_size;
	var tile_width = e.data.tile_width;
	var tilemap_index = e.data.tilemap_index;

	var vertex_positions = [];
	var uv_map = [];

	for(var i = 0; i < tilemap.length; i++){
		if(tilemap[i].x == 0 || tilemap[i].z == 0 || tilemap[i].x == adjusted_cube_size - 1 || tilemap[i].z == adjusted_cube_size - 1){
			continue;
		}

		var this_height = tilemap[i].height;
		var bottom_height = this_height - tile_width;
		var east_height = tilemap[i + 1].height;
		var west_height = tilemap[i - 1].height;
		var south_height = tilemap[i + adjusted_cube_size].height;
		var north_height = tilemap[i - adjusted_cube_size].height;

		var x_min = (tilemap[i].x * tile_width);
		var x_max = (tilemap[i].x * tile_width) + tile_width;
		var z_min = (tilemap[i].z * tile_width);
		var z_max = (tilemap[i].z * tile_width) + tile_width;

		vertex_positions.push(
			[ x_min, this_height, z_min ],
			[ x_max, this_height, z_max ],
			[ x_max, this_height, z_min ],

			[ x_min, this_height, z_min ],
			[ x_min, this_height, z_max ],
			[ x_max, this_height, z_max ]
		);

		uv_map.push(
			[0, 0.5],
			[1, 1],
			[0, 1],

			[0, 0.5],
			[1, 0.5],
			[1, 1]
		);

		if(east_height < this_height){ // If East side lesser
			vertex_positions.push(
				[ x_max, this_height, z_max ],
				[ x_max, bottom_height, z_max ],
				[ x_max, bottom_height, z_min ],

				[ x_max, this_height, z_max ],
				[ x_max, bottom_height, z_min ],
				[ x_max, this_height, z_min ]
			);

			uv_map.push(
				[0, 0.5],
				[0, 0],
				[1, 0],

				[0, 0.5],
				[1, 0],
				[1, 0.5]
			);
		}

		if(west_height < this_height){ // If West side lesser
			vertex_positions.push(
				[ x_min, this_height, z_min ],
				[ x_min, bottom_height, z_min ],
				[ x_min, bottom_height, z_max ],

				[ x_min, this_height, z_min ],
				[ x_min, bottom_height, z_max ],
				[ x_min, this_height, z_max ]
			);

			uv_map.push(
				[0, 0.5],
				[0, 0],
				[1, 0],

				[0, 0.5],
				[1, 0],
				[1, 0.5]
			);
		}

		if(south_height < this_height){ // If South side lesser
			vertex_positions.push(
				[ x_min, this_height, z_max ],
				[ x_min, bottom_height, z_max ],
				[ x_max, bottom_height, z_max ],

				[ x_min, this_height, z_max ],
				[ x_max, bottom_height, z_max ],
				[ x_max, this_height, z_max ]
			);

			uv_map.push(
				[0, 0.5],
				[0, 0],
				[1, 0],

				[0, 0.5],
				[1, 0],
				[1, 0.5]
			);
		}

		if(north_height < this_height){ // If North side lesser
			vertex_positions.push(
				[ x_max, this_height, z_min ],
				[ x_max, bottom_height, z_min ],
				[ x_min, bottom_height, z_min ],

				[ x_max, this_height, z_min ],
				[ x_min, bottom_height, z_min ],
				[ x_min, this_height, z_min ]
			);

			uv_map.push(
				[0, 0.5],
				[0, 0],
				[1, 0],

				[0, 0.5],
				[1, 0],
				[1, 0.5]
			);
		}

	}

	var vertices = new Float32Array( vertex_positions.length * 3 );
	var uvs = new Float32Array( uv_map.length * 2 );

	for ( var i = 0; i < vertex_positions.length; i++ ) {
		vertices[ i*3 + 0 ] = vertex_positions[i][0];
		vertices[ i*3 + 1 ] = vertex_positions[i][1];
		vertices[ i*3 + 2 ] = vertex_positions[i][2];
	}

	for ( var i = 0; i < uv_map.length; i++ ) {
		uvs[ i*2 + 0 ] = uv_map[i][0];
		uvs[ i*2 + 1 ] = uv_map[i][1];
	}

	self.postMessage({uvs, vertices, tilemap_index}, [uvs.buffer, vertices.buffer]);
	// self.postMessage({ uvs: uvs, vertices: vertices, tilemap_index: tilemap_index });

	console.timeEnd('t');

}, false);