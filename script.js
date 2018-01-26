"use strict"
//DOM stuff
const canvas = document.querySelector(".gameCanvas")
const ctx = canvas.getContext('2d')
ctx.webkitImageSmoothingEnabled = false
ctx.mozImageSmoothingEnabled = false
ctx.imageSmoothingEnabled = false
const width = canvas.width
const height = canvas.height
const loaded = false

const spriteImage = new Image()
spriteImage.src = 'sprites.png'
spriteImage.addEventListener('load', function() {
  loaded = true
}, false)

let rngSeed = 1;
function random() {
    var x = Math.sin(rngSeed++) * 10000;
    return x - Math.floor(x);
}

function rnd(n) {
  return Math.floor(random() * n)
}

const mapSize = 100
const cellSize = 7
const dir = {up:{name:"up", y:-1}, left:{name:"left",x:1}, down:{name:"down",y:1}, right:{name:"right",x:-1}}
setDirs([dir.up, dir.left, dir.down, dir.right])
function setDirs(dirs) {
  for(let i = 0; i < dirs.length; i++) {
    dirs[i].cw = dirs[(i+1)%dirs.length]
    dirs[i].ccw = dirs[(i+3)%dirs.length]
    dirs[i].reverse = dirs[(i+2)%dirs.length]
    if (dirs[i].x==undefined) dirs[i].x = 0
    if (dirs[i].y==undefined) dirs[i].y = 0
  }
}

const pos = {x: 5, y: 5, dir: dir.up}
const depth = 0
const map = []
makeMap()
function makeMap() {
  rngSeed = depth
  for(let x = 0; x < mapSize; x++) {
    map[x] = [];
    for (let y = 0; y < mapSize; y++) {
      map[x][y] = 0
    }
  }
  //rooms
  times(100, () => addRoom(2, 12))
  times(160, () => addRoom(1, 20, true))
}

function addRoom(minSize, maxSize, hallway) {
  let xPos = rnd(mapSize)
  let yPos = rnd(mapSize)
  let xSize = rnd(maxSize - minSize) + minSize
  let ySize = rnd(maxSize - minSize) + minSize
  if (hallway) {
    if (xSize > ySize) {
      xSize = 1
    } else {
      ySize = 1
    }
  }
  while (xSize + xPos >= mapSize) xPos--
  while (ySize + yPos >= mapSize) yPos--
  for(let x = xPos; x < xPos + xSize; x++) {
    for (let y = yPos; y < yPos + ySize; y++) {
      map[x][y] = 1
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  drawMap()
  ctx.font="12px Verdana"
  ctx.fillStyle="white"
  ctx.fillText("position: " + pos.x + ":" + pos.y + ":" + pos.dir.name, 12, 12)
  
}

function drawMap() {
  const width = 100
  const height = 100
  ctx.fillStyle = "grey"
  ctx.fillRect(0, 0, width*cellSize, height*cellSize)
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const cell = cellAt(x, y)
      if (cell == 1) {
        drawCell(x, y)
      }
    }
  }
  ctx.fillStyle = "white"
  ctx.fillRect(pos.x * cellSize, pos.y*cellSize, cellSize-1, cellSize-1)
}

draw()

function drawCell(x, y) {
  const edgeLength = cellSize - 1
  ctx.fillStyle = "black"
  ctx.fillRect(x*cellSize,y*cellSize,cellSize-1,cellSize-1)
  ctx.fillStyle = "white"
  if (cellAt(x-1, y) == 0) {
    ctx.fillRect(x*cellSize-1,y*cellSize,1,edgeLength)
  }
  if (cellAt(x+1, y) == 0) {
    ctx.fillRect((x+1)*cellSize-1,y*cellSize,1,edgeLength)
  }
  if (cellAt(x, y-1) == 0) {
    ctx.fillRect(x*cellSize,y*cellSize-1,edgeLength,1)
  }
  if (cellAt(x, y+1) == 0) {
    ctx.fillRect(x*cellSize,(y+1)*cellSize-1,edgeLength,1)
  }
}

function cellAt(x, y) { //or {x,y} object
  //unpack object
  if (x.x != undefined) {
    y = x.y
    x = x.x
  }
  if (x > 0 && x < mapSize && y > 0 && y < mapSize) {
    return map[x][y]
  }
  return 0
}

window.addEventListener("keyup", function (e) {
  doKey(e.keyCode)
})

function doKey(keyCode, state) {
  switch (keyCode) {
    case 37: turnLeft()
      break
    case 38: forward()
      break
    case 39: turnRight()
      break
    case 40: turnBack()
      break
     case 32: /*space */p0.shoot = state
      break
      break
  }
}

function turnBack() {
  pos.dir = pos.dir.reverse
  draw()
}
function turnLeft() {
  pos.dir = pos.dir.ccw
  draw()
}
function turnRight() {
  pos.dir = pos.dir.cw
  draw()
}
function forward() {
  const dest = {x:pos.x + pos.dir.x, y:pos.y + pos.dir.y}
  if (cellAt(dest.x, dest.y) == 1) {
    pos.x += pos.dir.x
    pos.y += pos.dir.y
  }
  draw()
}
function times(n,f) {while(n-->0)f()}