import { vec3, mat4 } from 'https://cdn.skypack.dev/gl-matrix';

export class Transform {
    constructor() {
        this.translate = vec3.create();
        this.scale = vec3.fromValues(1, 1, 1);
        this.rotationAngle = 0;
        this.rotationAxis = vec3.fromValues(0, 0, 1);
        this.modelTransformMatrix = mat4.create();
        this.updateModelTransformMatrix();
    }

	setTranslation(x, y) {
		vec3.set(this.translate, x, y, 0);
		this.updateModelTransformMatrix();
	}

	setScaling(sx, sy) {
		vec3.set(this.scale, sx, sy, 1);
		this.updateModelTransformMatrix();
	}

	setRotation(angle) {
		this.rotationAngle = angle;
		this.updateModelTransformMatrix();
	}

    updateModelTransformMatrix() {
        mat4.identity(this.modelTransformMatrix);
        mat4.translate(this.modelTransformMatrix, this.modelTransformMatrix, this.translate);
        mat4.rotate(this.modelTransformMatrix, this.modelTransformMatrix, this.rotationAngle, this.rotationAxis);
        mat4.scale(this.modelTransformMatrix, this.modelTransformMatrix, this.scale);
    }
}
