"use strict"
//DOM stuff
const canvas = document.querySelector(".gameCanvas")

const ctx = canvas.getContext('2d')
ctx.webkitImageSmoothingEnabled = false
ctx.mozImageSmoothingEnabled = false
ctx.imageSmoothingEnabled = false

const tempCanvas = document.createElement("canvas")
const tCtx = tempCanvas.getContext("2d")
tempCanvas.width = 1024
tempCanvas.height = 768
tCtx.webkitImageSmoothingEnabled = false
tCtx.mozImageSmoothingEnabled = false
tCtx.imageSmoothingEnabled = false

const width = canvas.width
const height = canvas.height
let loaded = false

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

const pos = {x: 28, y: 4, dir: dir.down}
let depth = 0
let tileSet = 0
const map = []
const enemies = []
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

  makeEnemies()
}

function makeEnemies() {
  times(300, makeEnemy)
}

function makeEnemy() {
  let x = -1
  let y = -1
  while (cellAt(x, y) == 0) {
    x = rnd(mapSize)
    y = rnd(mapSize)
  }
  enemies.push({x:x, y:y})
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
  const smallColWidth = 186
  const viewSize = canvas.width - smallColWidth*2
  const smallViewY = Math.floor(viewSize/1.5)-Math.floor(smallColWidth/1.5)
  const col1X = 0
  const col2X = smallColWidth
  const col3X = smallColWidth + viewSize
  draw3D(col1X, smallViewY, smallColWidth, pos.dir.ccw)
  draw3D(col2X, 0, viewSize, pos.dir)
  draw3D(col3X, smallViewY, smallColWidth, pos.dir.cw)
  draw3D(smallColWidth + viewSize/2-smallColWidth/2, Math.floor(viewSize/1.5), smallColWidth, pos.dir.reverse)
  
  drawMap(col3X, 0, canvas.width - col3X, smallViewY)
  ctx.font="12px Verdana"
  ctx.fillStyle="white"
  ctx.fillText("position: " + pos.x + ":" + pos.y + ":" + pos.dir.name, 12, 748)
}

function draw3D(viewX, viewY, viewSize, dir) {
  const viewSizeX = viewSize
  const viewSizeY = Math.floor(viewSize / 1.5)
  const viewXCentre = viewSizeX / 2
  const viewYCentre = viewSizeY / 2
  const depthFactor = 2
  tCtx.fillStyle = "darkgrey"
  tCtx.fillRect(0, 0, viewSizeX, viewSizeY/2)
  tCtx.fillStyle = "brown"
  tCtx.fillRect(0, 0+viewSizeY/2, viewSizeX, viewSizeY/2)
  const across = [-8,-7,-6,-5,-4,-3,-2,-1,7,6,5,4,3,2,1,0]
  for (let i = 15; i > 0; i--) { //depth
    const size = viewSizeX/(Math.pow(depthFactor,i-1))
    //draw edges
    for (let j of across) {
      const cellPos = viewCellPos(pos, dir, i, j)
      const cell = cellAt(cellPos)
      if (cell == 0) {
        const left = viewXCentre - size/2 + j*size
        const top = viewYCentre - size/2
        const behindSize = size / depthFactor
        if (j > 0) {
          const backLeft = viewXCentre - behindSize/2 + j*behindSize
          const backTop = viewYCentre - behindSize/2
          const pixelWidth = (left) - (viewXCentre - behindSize/2 + j*behindSize)
          drawWall(tCtx, tileSet, backLeft, backTop, pixelWidth, behindSize, size)          
        } else if (j < 0) {
          const pixelWidth = (viewXCentre - behindSize/2 + (j+1)*behindSize) - (left+size)
          drawWall(tCtx, tileSet, left+size, top, pixelWidth, size, behindSize)
        }
      }
    }
    //draw fronts and enemies
    for (let j of across) {
      const cellPos = viewCellPos(pos, dir, i, j)
      const cell = cellAt(cellPos)
      if (cell == 0) {
        const left = viewXCentre - size/2 + j*size
        const top = viewYCentre - size/2
        tCtx.drawImage(spriteImage, 0, 256*tileSet, 256, 256, left, top, size, size)
      } else {
        const e = enemies.find(e => e.x == cellPos.x && e.y == cellPos.y)
        if (e != undefined) {
          tCtx.fillStyle = "red"
          const eSize = viewSizeX/(Math.pow(depthFactor,i-0.5))
          const left = viewXCentre - size/2 + j*size
          const top = viewYCentre - size/2
          tCtx.drawImage(spriteImage, 256, 0, 256, 256, left+(size-eSize)/2, top+(size-eSize)/2, eSize, eSize)
        }
      } 
    }
  }
  ctx.drawImage(tempCanvas, 0, 0, viewSizeX, viewSizeY, viewX, viewY, viewSizeX, viewSizeY)
  ctx.strokeStyle = "darkblue"
  ctx.lineWidth = 4
  ctx.strokeRect(viewX, viewY, viewSizeX, viewSizeY)
}

function viewCellPos(pos, viewDir, i, j)
{
  if (viewDir == dir.down) {
    return {x:pos.x-j, y:pos.y + i}
  }
  if (viewDir == dir.up) {
    return {x:pos.x+j, y:pos.y - i}
  }
  if (viewDir == dir.right) {
    return {x:pos.x+i, y:pos.y + j}
  }
  if (viewDir == dir.left) {
    return {x:pos.x-i, y:pos.y - j}
  }
}

function drawMap(viewX, viewY, viewSizeX, viewSizeY) {
  tCtx.fillStyle = "grey"
  tCtx.fillRect(0, 0, mapSize*cellSize, mapSize*cellSize)
  for (let x = 0; x < mapSize; x++) {
    for (let y = 0; y < mapSize; y++) {
      const cell = cellAt(x, y)
      if (cell == 1) {
        drawCell(x, y)
      }
    }
  }
  tCtx.fillStyle = "white"
  tCtx.fillRect(pos.x * cellSize, pos.y*cellSize, cellSize-1, cellSize-1)

  //centre map on player
  var cropX = pos.x * cellSize - viewSizeX / 2
  var cropY = pos.y * cellSize - viewSizeY / 2

  ctx.fillStyle = "grey"
  ctx.fillRect(viewX, viewY, viewSizeX, viewSizeY)
  ctx.drawImage(tempCanvas, cropX, cropY, viewSizeX, viewSizeY, viewX, viewY, viewSizeX, viewSizeY)

  ctx.strokeStyle = "darkblue"
  ctx.lineWidth = 4
  ctx.strokeRect(viewX, viewY, viewSizeX, viewSizeY)
}

draw()

function drawCell(x, y) {
  const edgeLength = cellSize - 1
  tCtx.fillStyle = "black"
  tCtx.fillRect(x*cellSize,y*cellSize,cellSize-1,cellSize-1)
  tCtx.fillStyle = "white"
  if (cellAt(x-1, y) == 0) {
    tCtx.fillRect(x*cellSize-1,y*cellSize,1,edgeLength)
  }
  if (cellAt(x+1, y) == 0) {
    tCtx.fillRect((x+1)*cellSize-1,y*cellSize,1,edgeLength)
  }
  if (cellAt(x, y-1) == 0) {
    tCtx.fillRect(x*cellSize,y*cellSize-1,edgeLength,1)
  }
  if (cellAt(x, y+1) == 0) {
    tCtx.fillRect(x*cellSize,(y+1)*cellSize-1,edgeLength,1)
  }
  if (enemies.some(e => e.x == x && e.y == y)) {
    tCtx.fillStyle = "red"
    tCtx.fillRect(x*cellSize+2, y*cellSize+2, cellSize - 4, cellSize - 4)
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
    case 77: showMap()
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

const states = { main:{}, map:{}}

let state = states.main

function drawWall(ctx, tileSet, left, top, width, leftSize, rightSize)
{
  const img = spriteImage
  const h = 256
  const w = 256
  const numSlices = width
  const widthScale = width / w

  // The width of each source slice.
  const sliceWidth = w / numSlices

  for(var n = 0; n < numSlices; n++) {
    var sx = sliceWidth * n,
        sy = tileSet * 256,
        sWidth = sliceWidth,
        sHeight = h;

    const progress = n / numSlices
    var dx = left + (sliceWidth * n * widthScale)
    var dWidth = sliceWidth * widthScale
    var dHeight = leftSize * (1 - progress) + rightSize * progress;
    var dy = top + (leftSize - dHeight) / 2
    ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
  }

}
