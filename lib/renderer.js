export class WebGLRenderer 
{
	constructor() 
	{
		this.domElement = document.createElement("canvas");
		this.gl =
			this.domElement.getContext("webgl",{preserveDrawingBuffer: true}) ||
			this.domElement.getContext("experimental-webgl");

		if (!this.gl) throw new Error("WebGL is not supported");

		this.setSize(50, 50);
		this.clear(1.0, 1.0, 1.0, 1.0);
	}


	setSize(width, height) 
	{
		this.domElement.width = width;
		this.domElement.height = height;
		this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
	}

	clear(r, g, b, a) 
	{
		this.gl.clearColor(r, g, b, a);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
	}

	setAnimationLoop(animation) 
	{
		function renderLoop() {
			animation();
			window.requestAnimationFrame(renderLoop);
		}

		renderLoop();
	}

	render(scene, shader) 
	{
		scene.primitives.forEach(shape => {
			
			const originalColor = [...shape.color];
        
			if (shape.isSelected === true) {
				shape.color = [1, 1, 1, 1];
			}

			shape.transform.updateModelTransformMatrix();
			shader.setUniformMatrix4fv("uModelMatrix", shape.transform.modelTransformMatrix);
			shader.bindArrayBuffer(shader.vertexAttributesBuffer, shape.vertexPositions);
			shader.fillAttributeData("aPosition", shape.vertexPositions, 3, 0, 0);
			shader.setUniform4f("uColor", shape.color);
			shader.drawArrays(shape.vertexPositions.length / 3);

			shape.color = originalColor;
		});
	}

	glContext() 
	{
		return this.gl;
	}

	getCanvas() 
	{
		return this.domElement;
	}

	mouseToClipCoord(mouseEvent) {
		const rect = this.domElement.getBoundingClientRect();
		const x = mouseEvent.clientX - rect.left;
		const y = mouseEvent.clientY - rect.top;
		
		const clipX = (x / this.domElement.width) * 2 - 1;
		const clipY = 1 - (y / this.domElement.height) * 2;
		
		return [clipX, clipY];
	}	
}
