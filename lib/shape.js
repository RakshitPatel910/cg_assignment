import { Transform } from "./transform.js";
import { vec2, mat4 } from 'https://cdn.skypack.dev/gl-matrix';

export class Shape {
  constructor(vertices, color, id) {
    this.id = id;
    this.originalVertices = vertices;
    this.color = color;
    this.transform = new Transform();
    this.vertices = [];
    this.centroid = [0, 0];
    this.calculateCentroid();
    this.convertToLocalSpace();

    if (this.isSelfIntersecting(this.vertices)) {
      const simplePolygons = this.splitSelfIntersectingPolygon(this.vertices);

      let combinedTriangles = [];

      for (let poly of simplePolygons) {
        const tris = this.triangulateWithEarClipping(poly);
        combinedTriangles.push(...tris);
      }

      this.vertexPositions = new Float32Array(combinedTriangles);
    } else {
      this.vertexPositions = new Float32Array(this.triangulateWithEarClipping(this.vertices));
    }
  }

  calculateCentroid() {
    const sum = this.originalVertices.reduce((acc, v) => {
      acc[0] += v[0];
      acc[1] += v[1];
      return acc;
    }, [0, 0]);

    this.centroid = [
      sum[0] / this.originalVertices.length,
      sum[1] / this.originalVertices.length,
    ];
  }

  convertToLocalSpace() {
    this.vertices = this.originalVertices.map(v => [
      v[0] - this.centroid[0],
      v[1] - this.centroid[1],
    ]);

    this.transform.setTranslation(this.centroid[0], this.centroid[1]);
  }

  triangulateWithEarClipping(vertices) {
    if (vertices.length < 3) return [];

    if (vertices.length === 3) {
      return vertices.flatMap(v => [...v, 0]);
    }

    let poly = vertices.map(v => [...v]);
    if (!this.isCounterClockwise(poly)) poly.reverse();

    const triangles = [];
    let index = 0;
    let safety = 0;

    while (poly.length > 3 && safety++ < 1000) {
      const prevIndex = (index - 1 + poly.length) % poly.length;
      const currentIndex = index;
      const nextIndex = (index + 1) % poly.length;
      const [a, b, c] = [poly[prevIndex], poly[currentIndex], poly[nextIndex]];

      if (this.isConvex(a, b, c) && this.isEar(a, b, c, poly)) {
        triangles.push(...a, 0, ...b, 0, ...c, 0);
        poly.splice(currentIndex, 1);
        index = prevIndex % poly.length;
      } else {
        index = nextIndex % poly.length;
      }
    }
    
    if (poly.length === 3) {
      triangles.push(...poly[0], 0, ...poly[1], 0, ...poly[2], 0);
    }
    return triangles;
  }

  isCounterClockwise(vertices) {
    let area = 0;

    for (let i = 0; i < vertices.length; i++) {
      const j = (i + 1) % vertices.length;
      area += (vertices[j][0] - vertices[i][0]) * (vertices[j][1] + vertices[i][1]);
    }
    return area < 0;
  }

  isConvex(a, b, c) {
    const cross = (b[0] - a[0]) * (c[1] - b[1]) -
                  (b[1] - a[1]) * (c[0] - b[0]);
    return cross > 0;
  }

  isEar(a, b, c, vertices) {
    const triangle = [a, b, c];

    return vertices.every(v => {
      if (this.arePointsEqual(v, a) || this.arePointsEqual(v, b) || this.arePointsEqual(v, c)){
        return true;
      }
      
      return !this.pointInTriangle(v, triangle);
    });
  }

  arePointsEqual(p, q) {
    return Math.abs(p[0] - q[0]) < 0.00001 && Math.abs(p[1] - q[1]) < 0.00001;
  }

  pointInTriangle(p, [a, b, c]) {
    const area = this.triangleArea(a, b, c);
    const area1 = this.triangleArea(p, b, c);
    const area2 = this.triangleArea(a, p, c);
    const area3 = this.triangleArea(a, b, p);

    return Math.abs(area - (area1 + area2 + area3)) < 0.0001;
  }

  triangleArea(a, b, c) {
    return Math.abs(
      (a[0] * (b[1] - c[1]) +
       b[0] * (c[1] - a[1]) +
       c[0] * (a[1] - b[1])) / 2
    );
  }

  
  isSelfIntersecting(vertices) {
    const n = vertices.length;
    for (let i = 0; i < n; i++) {
      const a = vertices[i];
      const b = vertices[(i + 1) % n];

      for (let j = i + 1; j < n; j++) {
        if (Math.abs(i - j) <= 1 || (i === 0 && j === n - 1)) continue;
        const c = vertices[j];
        const d = vertices[(j + 1) % n];

        if (this.doLineSegmentsIntersect(a, b, c, d)) {
          return true;
        }
      }
    }
    return false;
  }


  doLineSegmentsIntersect(p, p2, q, q2) {
    function orientation(a, b, c) {
      const val = (b[1] - a[1]) * (c[0] - b[0]) -
                  (b[0] - a[0]) * (c[1] - b[1]);
      if (Math.abs(val) < 0.00001) return 0;
      return val > 0 ? 1 : 2;
    }

    const o1 = orientation(p, p2, q);
    const o2 = orientation(p, p2, q2);
    const o3 = orientation(q, q2, p);
    const o4 = orientation(q, q2, p2);

    return (o1 !== o2 && o3 !== o4);
  }


  lineIntersection(a, b, c, d) {
    const denominator = (a[0] - b[0]) * (c[1] - d[1]) - (a[1] - b[1]) * (c[0] - d[0]);

    if (Math.abs(denominator) < 1e-6) return null;

    const t = ((a[0] - c[0]) * (c[1] - d[1]) - (a[1] - c[1]) * (c[0] - d[0])) / denominator;
    const u = ((a[0] - c[0]) * (a[1] - b[1]) - (a[1] - c[1]) * (a[0] - b[0])) / denominator;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
    }

    return null;
  }


  splitSelfIntersectingPolygon(vertices) {
    const n = vertices.length;

    for (let i = 0; i < n; i++) {
      const a = vertices[i];
      const b = vertices[(i + 1) % n];

      for (let j = i + 2; j < n; j++) {

        if (i === 0 && j === n - 1) continue;

        const c = vertices[j];
        const d = vertices[(j + 1) % n];
        const ip = this.lineIntersection(a, b, c, d);

        if (ip) {
          let poly1 = [ip];

          for (let k = i + 1; k <= j; k++) {
            poly1.push(vertices[k % n]);
          }
          poly1.push(ip);

          let poly2 = [ip];

          for (let k = j + 1; k < i + n + 1; k++) {
            poly2.push(vertices[k % n]);
          }
          poly2.push(ip);

          return [poly1, poly2];
        }
      }
    }
    
    return [vertices];
  }
}
