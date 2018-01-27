"use strict"
//DOM stuff
const canvas = document.querySelector(".gameCanvas")
const ctx = canvas.getContext('2d')
ctx.webkitImageSmoothingEnabled = false
ctx.mozImageSmoothingEnabled = false
ctx.imageSmoothingEnabled = false
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

const pos = {x: 16, y: 1, dir: dir.right}
const depth = 0
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
  draw3D()
  drawMap()
  ctx.font="12px Verdana"
  ctx.fillStyle="black"
  ctx.fillText("position: " + pos.x + ":" + pos.y + ":" + pos.dir.name, 12, 748)
  
}

function draw3D() {
  const viewX = 700
  const viewY = 0
  const viewSize = 1024-700
  const viewXCentre = viewX + viewSize / 2
  const viewYCentre = viewY + viewSize / 2
  const depthFactor = 3
  ctx.fillStyle = "darkgrey"
  ctx.fillRect(viewX, viewY, viewSize, viewSize/2)
  ctx.fillStyle = "darkblue"
  ctx.fillRect(viewX, viewY+viewSize/2, viewSize, viewSize/2)
  const across = [-8,-7,-6,-5,-4,-3,-2,-1,7,6,5,4,3,2,1,0]
  for (let i = 15; i > 0; i--) { //depth
    const size = viewSize/(Math.pow(depthFactor,i-1))
    //draw edges
    for (let j of across) {
      const cellPos = viewCellPos(pos, i, j)
      const cell = cellAt(cellPos)
      if (cell == 0) {
        const left = viewXCentre - size/2 + j*size
        const top = viewYCentre - size/2
        const behindSize = size / depthFactor
        if (j > 0) {
          ctx.fillStyle = "darkgreen"
          ctx.beginPath()
          ctx.moveTo(left, top)
          ctx.lineTo(left, top+size)
          ctx.lineTo(viewXCentre - behindSize/2 + j*behindSize, viewYCentre + behindSize/2) //back top
          ctx.lineTo(viewXCentre - behindSize/2 + j*behindSize, viewYCentre - behindSize/2) //back bottom
          ctx.closePath()
          ctx.fill()
          ctx.strokeStyle = "green"
          ctx.stroke()
        } else if (j < 0) {
          ctx.fillStyle = "darkgreen"
          ctx.beginPath()
          ctx.moveTo(left+size, top)
          ctx.lineTo(left+size, top+size)
          ctx.lineTo(viewXCentre - behindSize/2 + (j+1)*behindSize, viewYCentre + behindSize/2) //back top
          ctx.lineTo(viewXCentre - behindSize/2 + (j+1)*behindSize, viewYCentre - behindSize/2) //back bottom
          ctx.closePath()
          ctx.fill()
          ctx.strokeStyle = "green"
          ctx.stroke()
        }
      }
    }
    //draw fronts and enemies
    for (let j of across) {
      const cellPos = viewCellPos(pos, i, j)
      const cell = cellAt(cellPos)
      if (cell == 0) {
        const left = viewXCentre - size/2 + j*size
        const top = viewYCentre - size/2
        ctx.fillStyle = "lightblue" //"darkgreen"
        ctx.fillRect(left, top, size, size)
        ctx.strokeStyle = "green"
        ctx.strokeRect(left, top, size, size)
      } else {
        const e = enemies.find(e => e.x == cellPos.x && e.y == cellPos.y)
        if (e != undefined) {
          ctx.fillStyle = "red"
          const eSize = viewSize/(Math.pow(depthFactor,i-0.5))
          const left = viewXCentre - size/2 + j*size
          const top = viewYCentre - size/2
          ctx.drawImage(spriteImage, 0, 0, 256, 256, left+(size-eSize)/2, top+(size-eSize)/2, eSize, eSize)
        }
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
  if (enemies.some(e => e.x == x && e.y == y)) {
    ctx.fillStyle = "red"
    ctx.fillRect(x*cellSize+2, y*cellSize+2, cellSize - 4, cellSize - 4)
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

