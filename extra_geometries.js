/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.TypedGeometry = function ( size ) {

	THREE.BufferGeometry.call( this );

	if ( size !== undefined ) {

		this.setArrays(
			new Float32Array( size * 3 * 3 ),
			new Float32Array( size * 3 * 3 ),
			new Float32Array( size * 3 * 2 )
		);

	}

};

THREE.TypedGeometry.prototype = Object.create( THREE.BufferGeometry.prototype );
THREE.TypedGeometry.prototype.constructor = THREE.TypedGeometry;

THREE.TypedGeometry.prototype.setArrays = function ( vertices, normals, uvs ) {

	this.vertices = vertices;
	this.normals = normals;
	this.uvs = uvs;

	this.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
	this.addAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ) );
	this.addAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ) );

	return this;

};

THREE.TypedGeometry.prototype.merge = ( function () {

	var offset = 0;
	var normalMatrix = new THREE.Matrix3();

	return function ( geometry, matrix, startOffset ) {

		if ( startOffset !== undefined ) offset = startOffset;

		var offset2 = offset * 2;
		var offset3 = offset * 3;

		var vertices = this.attributes.position.array;
		var normals = this.attributes.normal.array;
		var uvs = this.attributes.uv.array;

		if ( geometry instanceof THREE.TypedGeometry ) {

			var vertices2 = geometry.attributes.position.array;
			var normals2 = geometry.attributes.normal.array;
			var uvs2 = geometry.attributes.uv.array;

			for ( var i = 0, l = vertices2.length; i < l; i += 3 ) {

				vertices[ i + offset3     ] = vertices2[ i     ];
				vertices[ i + offset3 + 1 ] = vertices2[ i + 1 ];
				vertices[ i + offset3 + 2 ] = vertices2[ i + 2 ];

				normals[ i + offset3     ] = normals2[ i     ];
				normals[ i + offset3 + 1 ] = normals2[ i + 1 ];
				normals[ i + offset3 + 2 ] = normals2[ i + 2 ];

				uvs[ i + offset2     ] = uvs2[ i     ];
				uvs[ i + offset2 + 1 ] = uvs2[ i + 1 ];

			}

		} else if ( geometry instanceof THREE.IndexedTypedGeometry ) {

			var indices2 = geometry.attributes.index.array;
			var vertices2 = geometry.attributes.position.array;
			var normals2 = geometry.attributes.normal.array;
			var uvs2 = geometry.attributes.uv.array;

			for ( var i = 0, l = indices2.length; i < l; i ++ ) {

				var index = indices2[ i ];

				var index3 = index * 3;
				var i3 = i * 3;

				vertices[ i3 + offset3 ] = vertices2[ index3 ];
				vertices[ i3 + offset3 + 1 ] = vertices2[ index3 + 1 ];
				vertices[ i3 + offset3 + 2 ] = vertices2[ index3 + 2 ];

				normals[ i3 + offset3 ] = normals2[ index3 ];
				normals[ i3 + offset3 + 1 ] = normals2[ index3 + 1 ];
				normals[ i3 + offset3 + 2 ] = normals2[ index3 + 2 ];

				var index2 = index * 2;
				var i2 = i * 2;

				uvs[ i2 + offset2 ] = uvs2[ index2 ];
				uvs[ i2 + offset2 + 1 ] = uvs2[ index2 + 1 ];

			}

			if ( matrix !== undefined ) {

				matrix.applyToVector3Array( vertices, offset3, indices2.length * 3 );

				normalMatrix.getNormalMatrix( matrix );
				normalMatrix.applyToVector3Array( normals, offset3, indices2.length * 3 );

			}

			offset += indices2.length;

		}

	};

} )();

/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.IndexedTypedGeometry = function () {

	THREE.BufferGeometry.call( this );

};

THREE.IndexedTypedGeometry.prototype = Object.create( THREE.BufferGeometry.prototype );
THREE.IndexedTypedGeometry.prototype.constructor = THREE.IndexedTypedGeometry;

THREE.IndexedTypedGeometry.prototype.setArrays = function ( indices, vertices, normals, uvs ) {

	this.indices = indices;
	this.vertices = vertices;
	this.normals = normals;
	this.uvs = uvs;

	this.attributes[ 'index' ] = { array: indices, itemSize: 1 };
	this.attributes[ 'position' ] = { array: vertices, itemSize: 3 };
	this.attributes[ 'normal' ] = { array: normals, itemSize: 3 };
	this.attributes[ 'uv' ] = { array: uvs, itemSize: 2 };

	return this;

};

/**
 * @author mrdoob / http://mrdoob.com/
 * based on http://papervision3d.googlecode.com/svn/trunk/as3/trunk/src/org/papervision3d/objects/primitives/Plane.as
 */

THREE.PlaneTypedGeometry = function ( width, height, widthSegments, heightSegments ) {

	this.parameters = {
		width: width,
		height: height,
		widthSegments: widthSegments,
		heightSegments: heightSegments
	};

	var width_half = width / 2;
	var height_half = height / 2;

	var gridX = widthSegments || 1;
	var gridY = heightSegments || 1;

	var gridX1 = gridX + 1;
	var gridY1 = gridY + 1;

	var segment_width = width / gridX;
	var segment_height = height / gridY;

	var vertices = new Float32Array( gridX1 * gridY1 * 3 );
	var normals = new Float32Array( gridX1 * gridY1 * 3 );
	var uvs = new Float32Array( gridX1 * gridY1 * 2 );

	var offset = 0;
	var offset2 = 0;

	for ( var iy = 0; iy < gridY1; iy ++ ) {

		var y = iy * segment_height - height_half;

		for ( var ix = 0; ix < gridX1; ix ++ ) {

			var x = ix * segment_width - width_half;

			vertices[ offset     ] = x;
			vertices[ offset + 1 ] = - y;

			normals[ offset + 2 ] = 1;

			uvs[ offset2     ] = ix / gridX;
			uvs[ offset2 + 1 ] = 1 - ( iy / gridY );

			offset += 3;
			offset2 += 2;

		}

	}

	offset = 0;

	var indices = new ( ( vertices.length / 3 ) > 65535 ? Uint32Array : Uint16Array )( gridX * gridY * 6 );

	for ( var iy = 0; iy < gridY; iy ++ ) {

		for ( var ix = 0; ix < gridX; ix ++ ) {

			var a = ix + gridX1 * iy;
			var b = ix + gridX1 * ( iy + 1 );
			var c = ( ix + 1 ) + gridX1 * ( iy + 1 );
			var d = ( ix + 1 ) + gridX1 * iy;

			indices[ offset     ] = a;
			indices[ offset + 1 ] = b;
			indices[ offset + 2 ] = d;

			indices[ offset + 3 ] = b;
			indices[ offset + 4 ] = c;
			indices[ offset + 5 ] = d;

			offset += 6;

		}

	}

	THREE.IndexedTypedGeometry.call( this );

	this.setArrays( indices, vertices, normals, uvs );
	this.computeBoundingSphere();

};

THREE.PlaneTypedGeometry.prototype = Object.create( THREE.IndexedTypedGeometry.prototype );
THREE.PlaneTypedGeometry.prototype.constructor = THREE.PlaneTypedGeometry;