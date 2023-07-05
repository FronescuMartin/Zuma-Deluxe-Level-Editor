let vertices = [];
let generate;
let textarea;
let pathObj = "";
let reset;
let moveVertices;
let moving = false;
let deleting = false;
let tunnelState = 2;
let dragging = false;
let selectedPoint = null;
let previousSelectedPoint = -1;
let r = 6;
let btn;
let str = null;
let inputBox;
let strings = [];
let canvas;
let pathLength = 0;
const gameWidth = 640;
const gameHeight = 480;
let gameX, gameY;
let imageInput;
let img;
let fileInputsDom;
let textX;
let textY;
let switching = false;
let qualityArray;

let tunnelChar = [" ", "01 00 ", "00 00 ", "00 01 ", "01 01 "];

function setup() {
  canvas = createCanvas(800, 600);
  pathInput();
  fileInputsDom = document.getElementById("fileInputsPicture");
  imageInput = createFileInput(handleInput);
  imageInput.parent(fileInputsDom);
  gameX = (width - gameWidth) / 2;
  gameY = (height - gameHeight) / 2;

  canvas.parent("sketch");
  renderButtons();
  textBox();
}

function draw() {
  background(220);

  if (img) {
    image(img, gameX, gameY, img.width, img.height);
  }
  push();
  noFill();
  stroke(0);
  strokeWeight(r / 2);

  rect(gameX, gameY, gameWidth, gameHeight);
  pop();
  push();

  strokeWeight(r);
  for (let i = 1; i < vertices.length; i++) {
    push();
    if (vertices[i - 1].state === 1) {
      stroke(60); //grey
    } else if (vertices[i - 1].state === 2) {
      stroke(255); //white
    } else if (vertices[i - 1].state === 3) {
      stroke(0, 255, 0); //green
    } else if (vertices[i - 1].state === 4) {
      stroke(0, 0, 255); //red
    }

    line(
      vertices[i - 1].x + gameX,
      vertices[i - 1].y + gameY,
      vertices[i].x + gameX,
      vertices[i].y + gameY
    );
    pop();
  }
  pop();
  for (let v of vertices) {
    v.display();
  }
  text(`x: ${round(mouseX - gameX)}\ny: ${round(mouseY - gameY)}`, 700, 20);
}

function mouseDragged() {
  if (moving) {
    for (let i = 0; i < vertices.length; i++) {
      if (
        dist(mouseX, mouseY, vertices[i].x + gameX, vertices[i].y + gameY) <=
          r &&
        selectedPoint === null
      ) {
        vertices[i].dragging = true;
        selectedPoint = i;
      }
      if (selectedPoint !== null) {
        vertices[selectedPoint].x = round(mouseX - gameX);
        vertices[selectedPoint].y = round(mouseY - gameY);
        vertices[selectedPoint].checkBoundaries();
      }
    }
  }
}

function mouseReleased() {
  if (!moving && !deleting && !switching) {
    if (0 < mouseX && mouseX < width && 0 < mouseY && mouseY < height) {
      vertices.push(new Vertex(mouseX - gameX, mouseY - gameY, tunnelState));
    }
  } else {
    dragging = false;
    selectedPoint = null;
  }
  if (deleting) {
    for (let i = 0; i < vertices.length; i++) {
      if (vertices[i].mouseOver()) {
        vertices.splice(i, 1);
      }
    }
  } else if (switching) {
    for (let i = 0; i < vertices.length; i++) {
      if (vertices[i].mouseOver()) {
        if (previousSelectedPoint > -1) {
          vertices[previousSelectedPoint].selected = false;
        }
        vertices[i].selected = true;
        previousSelectedPoint = i;
      }
    }
  } else if (!switching){
    for (let i = 0; i < vertices.length; i++) {
      vertices[i].selected=false;
    }
  }
}

function generateCode() {
  pathLength = 0;
  if (vertices.length < 1) {
    textarea.innerHTML = "There are no points on the canvas.";
  } else {
    initHeader();
    let str = "";
    for (let i = 0; i < vertices.length - 1; i++) {
      let v = getNewCoord(vertices[i], vertices[i + 1]);
      let factor = getFactor(vertices[i], vertices[i + 1]);
      for (let j = 0; j < round(factor); j++) {
        str += `${convert(v.x)} ${convert(v.y)} `;
        str += tunnelChar[vertices[i].state];
        pathLength++;
      }
    }
    pathLength++; 
    
    let headerString=generateHeader();
    let headerLen=headerString.length+2;
    if(headerLen%4!=2){
      if(headerLen%4==0){
        remainder=2;
      } else if(headerLen%4==1){
        remainder=1;
      } else if(headerLen%4==3){
        remainder=3;
      }
    }
    headerLen+=remainder;
    headerLen=convertLength(headerLen.toString(16)).substr(6,5);
    let headerConvert=asciiToHex(headerString);
    let tempStr='';
    for(let i=0; i<headerConvert.length-1; i+=2){
      tempStr+=headerConvert[i]+headerConvert[i+1]+' ';
    }
    headerString=" 00 00 "+tempStr;
    for(let i=0; i<remainder; i++){
      headerString+="00 ";
    }
    console.log("header length",headerLen,headerString);
    header+=headerLen;
    header+=headerString;
    let pathHex = pathLength.toString(16);
    let newPathHex = convertLength(pathHex);
    console.log("length: ", newPathHex);
    header += newPathHex + " "; //LENGTH OF PATH
    header += "00 00 ";
    let startx = convertFloatToHex(vertices[0].x);
    let starty = convertFloatToHex(vertices[0].y);
    console.log("starting point: ", startx, starty);
    header += startx + " " + starty + " "; //STARTING POINT
    header += "00 00 ";
    header += str; //DELTAS
    textarea.innerHTML = header;
    const downloadButton = document.querySelector("#downloadButton");
    let hexBytes = generateCleanStrings();
    let bufferSize = hexBytes.length * 4;
    let buf = new ArrayBuffer(bufferSize);
    let dw = new DataView(buf);
    let offset = 0;
    for (let i of hexBytes) {
      let str = "0x" + i;
      console.log(parseInt(str, 16));
      dw.setUint32(offset, parseInt(str, 16), false);
      offset += 4;
    }
    console.log(dw);
    let blob = new Blob([buf], { type: "octet/stream" });
    let url = window.URL.createObjectURL(blob);
    downloadButton.href = url;
    downloadButton.download = "level.dat";
    downloadButton.click();

    window.URL.revokeObjectURL(url);
    const jsonString = JSON.stringify(Object.assign({}, vertices));

    console.log(
      asciiToHex(jsonString),
      asciiToHex(jsonString).length,
      jsonString
    );
  }
}

function convertLength(pathHex) {
  let newStr = "00 00 ";
  if (pathHex.length == 1) {
    newStr += "0" + pathHex + " 00";
  } else if (pathHex.length == 2) {
    newStr += pathHex + " 00";
  } else if (pathHex.length == 3) {
    newStr += pathHex[1];
    newStr += pathHex[2];
    newStr += " ";
    newStr += 0;
    newStr += pathHex[0];
  } else if (pathHex.length == 4) {
    newStr += pathHex[2];
    newStr += pathHex[3];
    newStr += " ";
    newStr += pathHex[0];
    newStr += pathHex[1];
  }
  return newStr;
}

function convert(x) {
  let str;
  if (x >= 0) {
    str = Math.round(x).toString(16); //convert x
  }
  if (x < 0) {
    str = Math.round(x + 256).toString(16);
  }
  if (str.length < 2) {
    str = "0" + str;
  }
  return str;
}

function textBox() {
  textarea = document.getElementById("output");
}

function renderButtons() {
  generate = document.getElementById("generate");
  generate.onclick = generateCode;
  generateJson = document.getElementById("generateJson");
  generateJson.onclick = () => {
    saveJSON(vertices, "level.json");
  };
  inputBox = document.getElementById("textBox");
  btn = document.getElementById("input");
  btn.onclick = inputVertices;
  reset = document.getElementById("reset");
  reset.onclick = () => {
    vertices = [];
    pathLength = 0;
    initHeader();
  };
  moveVertices = document.getElementById("moveVertices");
  moveVertices.onclick = () => {
    moving = !moving;
    if (moving) {
      moveVertices.innerHTML = "Add Vertices";
    } else {
      moveVertices.innerHTML = "Move Vertices";
    }
  };
  deleteVertices = document.getElementById("deleteVertices");
  deleteVertices.onclick = () => {
    deleting = !deleting;
    if (deleting) {
      deleteVertices.innerHTML = "Back";
    } else {
      deleteVertices.innerHTML = "Delete Vertices";
    }
  };
  document.getElementById("zIndex");
  zIndex.innerHTML = `Z Index is ${tunnelState}`;
}

function inputVertices() {
  str = inputBox.value;
  if (str) {

    strings = str.split("\n");
    for (let i = 0; i < strings.length; i++) {
      let a = strings[i].split(" ");
      strings[i] = a;
    }

    for (let i = 0; i < strings.length; i++) {
      let n0 = Number(strings[i][0]);
      let n1 = Number(strings[i][1]);
      let n2 = Number(strings[i][2]); //state, optional
      if (!isNaN(n0) && !isNaN(n1)) {
        if (isNaN(n2)) {
          n2 = 2;
        }
        vertices.push(new Vertex(n0, n1, n2));
      }
    }
  }
  inputBox.value = "";
}

function getFactor(v1, v2) {
  return sqrt((v1.x - v2.x) * (v1.x - v2.x) + (v1.y - v2.y) * (v1.y - v2.y));
}

function getNewCoord(v1, v2) {
  let factor = 100 / getFactor(v1, v2);
  let x = factor * (v2.x - v1.x);
  let y = factor * (v2.y - v1.y);
  let vertex = createVector(x, y);
  vertex.x=round(vertex.x);
  vertex.y=round(vertex.y);
  return vertex;
}

function convertFloatToHex(a, b) {
  const getHex = (i) => ("00" + i.toString(16)).slice(-2);

  var view = new DataView(new ArrayBuffer(4)),
    result;

  view.setFloat32(0, a);

  result = Array.apply(null, { length: 4 })
    .map((_, i) => getHex(view.getUint8(i)))
    .join("");
  let result1 = "";
  result1 =
    result1 +
    result[6] +
    result[7] +
    " " +
    result[4] +
    result[5] +
    " " +
    result[2] +
    result[3] +
    " " +
    result[0] +
    result[1];
  return result1;
}

function handleInput(file) {
  if (file.type == "image") {
    img = createImg(file.data, "");
    img.hide();
  } else {
    img = null;
  }
}

function keyPressed() {
  if (key === "s" || key === "S") {
    switching = !switching;
  }
  if (!switching) {
    if (key === "1") {
      tunnelState = 1;
    } else if (key === "2") {
      tunnelState = 2;
    } else if (key === "3") {
      tunnelState = 3;
    } else if (key === "4") {
      tunnelState = 4;
    } else if (keyCode === 46) {
      deleteLast();
    }
  } else if (switching) {
    if (key === "1") {
      vertices[previousSelectedPoint].state = 1;
    } else if (key === "2") {
      vertices[previousSelectedPoint].state = 2;
    } else if (key === "3") {
      vertices[previousSelectedPoint].state = 3;
    } else if (key === "4") {
      vertices[previousSelectedPoint].state = 4;
    }
  }
  zIndex.innerHTML = `Z Index is ${tunnelState}`;
}

function deleteLast() {
  vertices.pop();
}

function generateCleanStrings() {
  let clean = header.replace(/\s+/g, "");
  clean = clean.match(/.{1,8}/g);
  return clean;
}

function pathInput() {
  const readFile = (e) => {
    const file = e.target.files[0];
    console.log(file.name);
    let reader = new FileReader();
    if (file.name.split(".").pop() == "dat") {
      reader.readAsArrayBuffer(file);
    } else if (file.name.split(".").pop() == "json") {
      reader.readAsText(file);
    }
    reader.onload = function (e) {
      if (file.name.split(".").pop() === "dat") {
        let arrayBuffer = new Uint8Array(reader.result);
        console.log(arrayBuffer);
        doStuff(arrayBuffer);
      } else if (file.name.split(".").pop() === "json") {
        console.log(e.target.result);
        try {
          JSON.parse(e.target.result);
        } catch (err) {
          console.log("invalid json file");
          textarea.innerHTML="Invalid JSON File!\n"+err.message;
          return false;
        }
        loadedVertices = JSON.parse(e.target.result);
        generateVertices(loadedVertices);
        textarea.innerHTML='';
      }
    };
  };

  document.querySelector("#fileItem").onchange = readFile;

  function doStuff(buffer) {
    qualityArray = [];
    for (let i in buffer) {
      qualityArray.push(buffer[i].toString(16));
    }
    qualityArray = qualityArray.map((x) => (x.length < 2 ? "0" + x : x));
    console.log(buffer);
    console.log(qualityArray);
    signatureLength = parseInt(
      qualityArray[13].toString() +
        qualityArray[12].toString(),
      16
    );
    let hexString='';
    for(let i=16; i<16+signatureLength; i++){
      hexString+=qualityArray[i];
    }
    hexString=hexToAscii(hexString);
    console.log(hexString);
    let arr=hexString.split(";");
    for(let i in arr){
      arr[i]=arr[i].split(",");
      arr[i]=arr[i].map(x=>parseInt(x));
    }
    console.log(arr);
    vertices=[];
    for(let i=0; i<arr.length; i++){
      vertices.push(new Vertex());
      vertices[i].x=arr[i][0];
      vertices[i].y=arr[i][1];
      vertices[i].state=arr[i][2];
    }
  }
}

const HexToFloat32 = (str) => {
  var int = parseInt(str, 16);
  if (int > 0 || int < 0) {
    var sign = int >>> 31 ? -1 : 1;
    var exp = ((int >>> 23) & 0xff) - 127;
    var mantissa = ((int & 0x7fffff) + 0x800000).toString(2);
    var float32 = 0;
    for (i = 0; i < mantissa.length; i += 1) {
      float32 += parseInt(mantissa[i]) ? Math.pow(2, exp) : 0;
      exp--;
    }
    return float32 * sign;
  } else return 0;
};

function hexToDec(string) {
  let x = parseInt(string, 16);
  return x > 127 ? x - 256 : x;
}

function asciiToHex(str) {
  let arr = [];
  for (let i = 0; i < str.length; i++) {
    arr.push(str.charCodeAt(i).toString(16));
  }
  return arr.join("");
}

function hexToAscii(str) {
  let arr = [];
  for (let i = 0; i < str.length - 1; i += 2) {
    let crt = str[i] + str[i + 1];
    arr.push(String.fromCharCode(parseInt(crt, 16)));
  }
  return arr.join("");
}

function generateVertices(v) {
  vertices = [];

  for (let i = 0; i < v.length; i++) {
    if (
      isNaN(v[i].x) ||
      isNaN(v[i].y) ||
      isNaN(v[i].state) ||
      isNaN(v[i].dragging) ||
      isNaN(v[i].selected)
    ) {
      vertices = [];
      return false;
    }
    vertices.push(new Vertex());
    vertices[i].x = v[i].x;
    vertices[i].y = v[i].y;
    vertices[i].state = v[i].state;
    vertices[i].dragging = v[i].dragging;
    vertices[i].selected = v[i].selected;
  }
}

function generateHeader(){
  let str='';
  for (let v of vertices){
    str=str+v.x+","+v.y+","+v.state+";";
  }
  return str.substr(0, str.length-1);
}


