class Vertex {
  constructor(x, y, state) {
    this.x = round(x);
    this.y = round(y);
    this.checkBoundaries();
    
    this.state = state;
    this.dragging = false;
    this.selected=false;
  }

  display() {
    push();
    strokeWeight(r);
    if (this.mouseOver() && moving) {
      stroke(0, 255, 0);
    } else if (this.mouseOver()&&deleting){
      stroke(0,255,255);
    } else if(deleting){
      stroke(255,165,0);
    } else if (moving) {
      stroke(0, 0, 255);
    } else if(this.selected){
      stroke(0,255,255);
    } else if(switching){
      stroke(148,0,211);
    } else {
      stroke(255, 0, 0);
    }
    point(this.x + gameX, this.y + gameY);
    pop();
  }
  mouseOver() {
    return dist(this.x + gameX, this.y + gameY, mouseX, mouseY) <= r;
  }
  
  checkBoundaries(){
    if(this.y<-60){
      this.y=-60;
    }
    if(this.y>540){
      this.y=540;
    }
    if(this.x<-80){
      this.x=-80;
    } 
    if(this.x>720){
      this.x=720;
    }
  }

  /*
00 00 - memory map/standard (shootable under tunnel - state 2)
00 01 - shootable over tunnel (state 3)
01 00 - unshootable tunnel under (state 1)
01 01 - unshootable over tunnel - useless (state 4)
*/
}
