import { Shape } from './threeD.js';

export class KeyboardShapeCreator {
  constructor(renderer, scene, shader, getCurrentColor, pointsArray) {
    this.renderer = renderer;
    this.scene = scene;
    this.shader = shader;
    this.getCurrentColor = getCurrentColor;
    this.pointsArray = pointsArray;
    this.active = false;
    this.currentPoint = null;
    this.ghostPoint = null;
    this.currentAngle = 0;
    this.currentDistance = 0.1;
    this.minDistance = 0.05;
    this.distanceStep = 0.01;
    this.rotationStep = 0.03;
    this.arrowUp = false;
    this.arrowDown = false;
    this.arrowLeft = false;
    this.arrowRight = false;
    this.cursorX = 0;
    this.cursorY = 0;
    this.indicator = true;
    this.initEventListeners();
  }

  flipIndicator() {
    console.log(this.indicator)
    this.indicator = !this.indicator;
  }

  initEventListeners() {
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    document.addEventListener('keyup', (e) => this.onKeyUp(e));
    this.renderer.domElement.addEventListener('contextmenu', (e) => this.onRightClick(e));
    document.addEventListener('mousemove', (e) => {
        const rect = this.renderer.domElement.getBoundingClientRect();
        
        const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
        
        this.cursorX = (x / this.renderer.domElement.width) * 2 - 1;
        this.cursorY = 1 - (y / this.renderer.domElement.height) * 2;
    })
  }

  onKeyDown(e) {
    if (!this.active) {
      if (e.key === 'c') {
        if(this.scene.maxShapes === this.scene.primitives.length) return;

        this.startCreation();
        e.preventDefault();
      }
    } else {
      if (e.key === 'ArrowUp') { 
        this.arrowUp = true; 
      }
      if (e.key === 'ArrowDown') { 
        this.arrowDown = true; 
      }
      if (e.key === 'ArrowLeft') { 
        this.arrowLeft = true; 
      }
      if (e.key === 'ArrowRight') { 
        this.arrowRight = true; 
      }
      e.preventDefault();
    }
  }

  onKeyUp(e) {
    if (this.active) {
      if (e.key === 'ArrowUp') { 
        this.arrowUp = false; 
      }
      if (e.key === 'ArrowDown') { 
        this.arrowDown = false; 
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (e.key === 'ArrowLeft') { this.arrowLeft = false; }
        if (e.key === 'ArrowRight') { this.arrowRight = false; }
        if (!this.arrowLeft && !this.arrowRight) {
          this.commitPoint();
        }
      }
    }
  }
  
  onRightClick(e) {
    if (this.active) {
      e.preventDefault();
      if (this.pointsArray.length >= 2) {
        const shape = new Shape([...this.pointsArray], this.getCurrentColor());
        this.scene.add(shape);
        this.pointsArray.length = 0;
      }
      this.reset();
    }
  }

  startCreation() {
    this.active = true;
    this.pointsArray.length = 0;
    this.currentPoint = [this.cursorX, this.cursorY];
    this.pointsArray.push(this.currentPoint);
    this.currentAngle = 0;
    this.currentDistance = 0.1;
    this.ghostPoint = [
      this.currentPoint[0] + this.currentDistance * Math.cos(this.currentAngle),
      this.currentPoint[1] + this.currentDistance * Math.sin(this.currentAngle)
    ];
  }

  commitPoint() {
    if (this.ghostPoint) {
      this.currentPoint = this.ghostPoint;
      this.pointsArray.push(this.currentPoint);
      this.currentDistance = 0.1;
    }
  }

  update() {
    if (this.active && this.ghostPoint) {
      if (this.arrowUp) { 
        this.currentAngle += this.rotationStep; 
      }
      if (this.arrowDown) { 
        this.currentAngle -= this.rotationStep; 
      }
      if (this.arrowRight) { 
        this.currentDistance += this.distanceStep; 
      }
      if (this.arrowLeft) { 
        this.currentDistance = Math.max(this.minDistance, this.currentDistance - this.distanceStep); 
      }
      this.ghostPoint = [
        this.currentPoint[0] + this.currentDistance * Math.cos(this.currentAngle),
        this.currentPoint[1] + this.currentDistance * Math.sin(this.currentAngle)
      ];
      
      if(this.pointsArray.length > 0) this.currentPoint = this.pointsArray[this.pointsArray.length - 1];

      if(this.indicator) this.drawArrow();
    }
  }

  drawArrow() {
    this.shader.use();

    const arrowVertices = [this.currentPoint, this.ghostPoint];
    const arrowArray = new Float32Array(arrowVertices.flatMap(v => [v[0], v[1], 0]));

    this.shader.bindArrayBuffer(this.shader.vertexAttributesBuffer, arrowArray);
    this.shader.fillAttributeData("aPosition", arrowArray, 3, 0, 0);
    this.shader.setUniformMatrix4fv("uModelMatrix", [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);

    this.renderer.glContext().drawArrays(this.renderer.glContext().LINES, 0, arrowVertices.length);

    const dx = this.ghostPoint[0] - this.currentPoint[0];
    const dy = this.ghostPoint[1] - this.currentPoint[1];

    const len = Math.hypot(dx, dy);

    if (len > 0) {
      const arrowHeadLength = 0.02;
      const arrowHeadAngle = Math.PI / 6;

      const leftAngle = Math.atan2(dy, dx) + arrowHeadAngle;
      const rightAngle = Math.atan2(dy, dx) - arrowHeadAngle;

      const leftX = this.ghostPoint[0] - arrowHeadLength * Math.cos(leftAngle);
      const leftY = this.ghostPoint[1] - arrowHeadLength * Math.sin(leftAngle);
      const rightX = this.ghostPoint[0] - arrowHeadLength * Math.cos(rightAngle);
      const rightY = this.ghostPoint[1] - arrowHeadLength * Math.sin(rightAngle);

      const arrowHeadVertices = [this.ghostPoint, [leftX, leftY], this.ghostPoint, [rightX, rightY]];
      const arrowHeadArray = new Float32Array(arrowHeadVertices.flatMap(v => [v[0], v[1], 0]));

      this.shader.bindArrayBuffer(this.shader.vertexAttributesBuffer, arrowHeadArray);
      this.shader.fillAttributeData("aPosition", arrowHeadArray, 3, 0, 0);
      this.shader.setUniformMatrix4fv("uModelMatrix", [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
      
      this.renderer.glContext().drawArrays(this.renderer.glContext().LINES, 0, arrowHeadVertices.length);
    }
  }

  reset() {
    this.active = false;
    this.currentPoint = null;
    this.ghostPoint = null;
    this.currentAngle = 0;
    this.currentDistance = 0.1;
    this.arrowUp = false;
    this.arrowDown = false;
    this.arrowLeft = false;
    this.arrowRight = false;
  }
  
  isActive() {
    return this.active;
  }
}
