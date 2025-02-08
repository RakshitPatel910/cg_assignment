import { mat4, vec4 } from 'https://cdn.skypack.dev/gl-matrix';

export class SelectionManager {
    static getShapeAtPosition(scene, gl, x, y) {
        const candidates = [];
        
        const rect = gl.canvas.getBoundingClientRect();
        const webglX = x - rect.left;
        const webglY = gl.canvas.height - (y - rect.top);
        
        scene.primitives.forEach(shape => {
            if (this.isPointInShape(shape, webglX, webglY, gl)) {
                candidates.push(shape);
            }
        });

        return candidates.pop();
    }

    static isPointInShape(shape, x, y, gl) {
        const inverseMatrix = mat4.create();
        mat4.invert(inverseMatrix, shape.transform.modelTransformMatrix);
        
        const point = vec4.fromValues(
            (x / gl.canvas.width) * 2 - 1,
            (y / gl.canvas.height) * 2 - 1,
            0, 1
        );
        vec4.transformMat4(point, point, inverseMatrix);

        const vertices = shape.vertices;

        let intersects = false;
        let j = vertices.length - 1;

        for (let i = 0; i < vertices.length; i++) {
            const xi = vertices[i][0], yi = vertices[i][1];
            const xj = vertices[j][0], yj = vertices[j][1];

            if (((yi > point[1]) !== (yj > point[1])) &&
                (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi)) {
                intersects = !intersects; 
            }

            j = i;
        }

        return intersects;
    }
}