export class Scene
{
	constructor()
	{
		this.primitives = []
		this.maxShapes = 3;
		this.prevShapeId = 0;
	}

	setMaxShapes(num) {
		this.maxShapes = num;
	}

	add(primitive)
	{
		if( this.primitives && primitive )
		{
			this.primitives.push(primitive)
            console.log(this.primitives)
		}
	}

    remove(primitive) 
	{
		if (this.primitives && primitive) {
			let index = this.primitives.indexOf(primitive);
			if (index > -1) {
				this.primitives.splice(index, 1);
			}
		}
	}

	getPrimitives() 
	{
		return this.primitives;
	}


	getPrimitive(index) 
	{
		return this.primitives[index];
	}


	getPrimitiveIndex(primitive) 
	{
		return this.primitives.indexOf(primitive);
	}

	swap(idx1, idx2) {
		const temp = this.primitives[idx1];
		this.primitives[idx1] = this.primitives[idx2];
		this.primitives[idx2] = temp; 
	}

	bringToFront(shapes) {
		if (!shapes && shapes.length <= 0) return;

		shapes.forEach(shape => {
			const index = this.primitives.indexOf(shape);
			if (index > -1 && index < this.primitives.length - 1) {
				// this.primitives.splice(index, 1);
				// this.primitives.push(shape);
				this.swap(index, index + 1);
			}
		});
		console.log(shapes)
    }

    sendToBack(shapes) {
		if (!shapes && shapes.length <= 0) return;

		for(let i = shapes.length-1; i > -1; i--) {
			const index = this.primitives.indexOf(shapes[i]);
			if (index > 0 && index < this.primitives.length) {
				// this.primitives.splice(index, 1);
				// this.primitives.unshift(shape);
				this.swap(index, index - 1);
				
			}
		}
		console.log(shapes)

    }
}
