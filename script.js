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
const dir = {up:{name:"up", y:-1}, right:{name:"right",x:1}, down:{name:"down",y:1}, left:{name:"left",x:-1}}
setDirs([dir.up, dir.right, dir.down, dir.left])
function setDirs(dirs) {
  for(let i = 0; i < dirs.length; i++) {
    dirs[i].cw = dirs[(i+1)%dirs.length]
    dirs[i].ccw = dirs[(i+3)%dirs.length]
    dirs[i].reverse = dirs[(i+2)%dirs.length]
    if (dirs[i].x==undefined) dirs[i].x = 0
    if (dirs[i].y==undefined) dirs[i].y = 0
  }
}

const pos = {x: 13, y: 1, dir: dir.left}
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
  draw3D()
  drawMap()
  ctx.font="12px Verdana"
  ctx.fillStyle="black"
  ctx.fillText("position: " + pos.x + ":" + pos.y + ":" + pos.dir.name, 12, 748)
  
}

function draw3D() {
  const viewX = 700
  const viewY = 0
  const viewSize = 300
  ctx.fillStyle = "darkgrey"
  ctx.fillRect(viewX, viewY, viewSize, viewSize/2)
  ctx.fillStyle = "darkblue"
  ctx.fillRect(viewX, viewY+viewSize/2, viewSize, viewSize/2)
  ctx.fillStyle = "darkgreen"
  for (let i = 15; i > 0; i--) { //depth
    const size = viewSize/(Math.pow(3,i-1))
    for (let j = -5; j < 5; j++) { //across
      const cell = cellAt(viewCellPos(pos, i, j))
      if (cell == 0) {
        ctx.fillRect(viewX+viewSize/2-size/2+j*size, viewY+viewSize/2-size/2, size-1, size-1)
      }
    }
  }
}

function viewCellPos(pos, i, j)
{
  if (pos.dir == dir.down) {
    return {x:pos.x-j, y:pos.y + i}
  }
  if (pos.dir == dir.up) {
    return {x:pos.x+j, y:pos.y - i}
  }
  if (pos.dir == dir.right) {
    return {x:pos.x+i, y:pos.y + j}
  }
  if (pos.dir == dir.left) {
    return {x:pos.x-i, y:pos.y - j}
  }
}

function drawMap() {
  ctx.fillStyle = "grey"
  ctx.fillRect(0, 0, mapSize*cellSize, mapSize*cellSize)
  for (let x = 0; x < mapSize; x++) {
    for (let y = 0; y < mapSize; y++) {
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
  const dest = move(pos, pos.dir)
  if (cellAt(dest.x, dest.y) == 1) {
    pos.x += pos.dir.x
    pos.y += pos.dir.y
  }
  draw()
}
function move(pos, move) {
  return {x: pos.x + move.x, y: pos.y + move.y}
}
function times(n,f) {while(n-->0)f()}

const states = { main:{}}

let state = states.main

