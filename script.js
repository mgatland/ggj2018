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
let playerCombatMessage1 = ""
let playerCombatMessage2 = ""

const spriteImage = new Image()
spriteImage.src = 'sprites.png'
spriteImage.addEventListener('load', function() {
  loaded = true
  draw()
}, false)

let rngSeed = 1;
function random() {
    var x = Math.sin(rngSeed++) * 10000;
    return x - Math.floor(x);
}

function rnd(n) {
  return Math.floor(random() * n)
}

const playerStats = {speed:10, attack:10}
const mapSize = 100
const cellSize = 7
const dirs = {up:{name:"up", y:-1}, right:{name:"right",x:1}, down:{name:"down",y:1}, left:{name:"left",x:-1}}
setDirs([dirs.up, dirs.right, dirs.down, dirs.left])
function setDirs(dirs) {
  for(let i = 0; i < dirs.length; i++) {
    dirs[i].cw = dirs[(i+1)%dirs.length]
    dirs[i].ccw = dirs[(i+3)%dirs.length]
    dirs[i].reverse = dirs[(i+2)%dirs.length]
    if (dirs[i].x==undefined) dirs[i].x = 0
    if (dirs[i].y==undefined) dirs[i].y = 0
  }
}

const enemyType = []
enemyType.push({tileSet:0, sprite:1, maxHp:20, speed:7, name: "Sporangium Warrior", desc:"It smells angry"})
enemyType.push({tileSet:0, sprite:2, maxHp:15, speed:5, name: "Aspergillus Philosopher", desc:"It quivers threateningly"})
enemyType.push({tileSet:0, sprite:3, maxHp:30, speed:3, name: "Elder Shroom", desc:"It doesn't want you here"})
enemyType.push({tileSet:0, sprite:4, maxHp:40, speed:2, name: "Earthstar", desc:"It seems to be waiting for something"})

const playerPos = {x: 27, y: 11, dir: dirs.down}
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
  times(100, makeEnemy)
}

function makeEnemy() {
  let x = -1
  let y = -1
  while (!cellIsEmpty({x:x, y:y})) {
    x = rnd(mapSize)
    y = rnd(mapSize)
  }
  var enemy = {x:x, y:y, type:rnd(4)}
  enemy.hp = enemyType[enemy.type].maxHp
  enemy.timer = 0
  enemies.push(enemy)
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
  draw3D(col1X, smallViewY, smallColWidth, playerPos.dir.ccw)
  draw3D(col2X, 0, viewSize, playerPos.dir)
  draw3D(col3X, smallViewY, smallColWidth, playerPos.dir.cw)
  const rearViewX = smallColWidth + viewSize/2-smallColWidth/2
  draw3D(rearViewX, Math.floor(viewSize/1.5), smallColWidth, playerPos.dir.reverse)
  
  drawMap(col3X, 0, canvas.width - col3X, smallViewY)
  ctx.font="16px Verdana"
  ctx.fillStyle="white"
  ctx.fillText("position: " + playerPos.x + ":" + playerPos.y + ":" + playerPos.dir.name, 12, 748)

  const ahead = move(playerPos, playerPos.dir)
  const target = enemyAt(ahead)
  if (target != null)
  {
    const et = enemyType[target.type]
    const x = rearViewX + smallColWidth + 20
    let y = viewSize/1.5+20
    const lineHeight = 20
    ctx.fillText("You are fighting a level 1 " + et.name, x, y);  y+=lineHeight
    ctx.fillText("It has " + target.hp + " health points left", x, y);  y+=lineHeight
    y+=lineHeight
    ctx.fillText(playerCombatMessage1, x, y); y+=lineHeight
    ctx.fillText(playerCombatMessage2, x, y); y+=lineHeight
    y+=lineHeight
    ctx.fillText("Experience value: " + et.maxHp*5, x, y);  y+=lineHeight
    ctx.fillText(et.desc, x, y);  y+=lineHeight
  }
}

let flipped = false
function draw3D(viewX, viewY, viewSize, dir) {
  const viewSizeX = viewSize
  const viewSizeY = Math.floor(viewSize / 1.5)
  const viewXCentre = viewSizeX / 2
  const viewYCentre = viewSizeY / 2
  const depthFactor = 2

  //floor and ceiling

  if (flipped) {
    console.log("a")
    tCtx.scale(-1,1)
    tCtx.drawImage(spriteImage, 256*6, 512*tileSet, 512, 512, 0, 0, viewSizeX*-1, viewSizeY)
    tCtx.scale(-1,1)    
  } else {
    console.log("b")
    tCtx.drawImage(spriteImage, 256*6, 512*tileSet, 512, 512, 0, 0, viewSizeX, viewSizeY)
  }

  const across = [-8,-7,-6,-5,-4,-3,-2,-1,7,6,5,4,3,2,1,0]
  for (let i = 15; i > 0; i--) { //depth
    const size = viewSizeX/(Math.pow(depthFactor,i-1))
    //draw edges
    for (let j of across) {
      const cellPos = viewCellPos(playerPos, dir, i, j)
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
      const cellPos = viewCellPos(playerPos, dir, i, j)
      const cell = cellAt(cellPos)
      if (cell == 0) {
        const left = viewXCentre - size/2 + j*size
        const top = viewYCentre - size/2
        tCtx.drawImage(spriteImage, 0, 256*tileSet, 256, 256, left, top, size, size)
      } else {
        const e = enemies.find(e => e.x == cellPos.x && e.y == cellPos.y)
        if (e != undefined) {
          const et = enemyType[e.type]
          tCtx.fillStyle = "red"
          const eSize = viewSizeX/(Math.pow(depthFactor,i-0.4))
          const left = viewXCentre - eSize/2 + j*eSize
          const top = viewYCentre - eSize/2
          tCtx.drawImage(spriteImage, 256*et.sprite, et.tileSet*256, 256, 256, left, top, eSize, eSize)
        }
      } 
    }
  }
  ctx.drawImage(tempCanvas, 0, 0, viewSizeX, viewSizeY, viewX, viewY, viewSizeX, viewSizeY)
  ctx.strokeStyle = "darkblue"
  ctx.lineWidth = 4
  ctx.strokeRect(viewX, viewY, viewSizeX, viewSizeY)
}

function enemyAt(cellPos)
{
  return enemies.find(e => e.x == cellPos.x && e.y == cellPos.y)
}

function viewCellPos(pos, viewDir, i, j)
{
  if (viewDir == dirs.down) {
    return {x:pos.x-j, y:pos.y + i}
  }
  if (viewDir == dirs.up) {
    return {x:pos.x+j, y:pos.y - i}
  }
  if (viewDir == dirs.right) {
    return {x:pos.x+i, y:pos.y + j}
  }
  if (viewDir == dirs.left) {
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
  tCtx.fillRect(playerPos.x * cellSize, playerPos.y*cellSize, cellSize-1, cellSize-1)

  //centre map on player
  var cropX = playerPos.x * cellSize - viewSizeX / 2
  var cropY = playerPos.y * cellSize - viewSizeY / 2

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

function cellIsEmpty(pos) {
  return (cellAt(pos) != 0) 
    && (playerPos.x != pos.x || playerPos.y != pos.y) 
    && !enemies.some(e => e.x == pos.x && e.y == pos.y)
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
  flipped = !flipped
  playerPos.dir = playerPos.dir.reverse
  draw()
}
function turnLeft() {
  flipped = !flipped
  playerPos.dir = playerPos.dir.ccw
  draw()
}
function turnRight() {
  flipped = !flipped
  playerPos.dir = playerPos.dir.cw
  draw()
}
function forward() {
  const dest = move(playerPos, playerPos.dir)
  if (enemies.some(e => e.x == dest.x && e.y == dest.y)) {
    fight(enemies.find(e => e.x == dest.x && e.y == dest.y))
    return
  }
  if (cellAt(dest.x, dest.y) == 1) {
    flipped = !flipped
    playerPos.x += playerPos.dir.x
    playerPos.y += playerPos.dir.y
    timePasses(100/playerStats.speed)
  }
  draw()
}

function fight(e) {
  const damage = playerStats.attack
  e.hp -= damage
  playerCombatMessage1 = "You hit the monster!"
  playerCombatMessage2 = "It takes " + damage + " points of damage!"
  if (e.hp <= 0) enemies.splice(enemies.indexOf(e))
  draw()
}

function timePasses(amount)
{
  console.log("time passes: " + amount)
  for (let e of enemies) {
    if (e.timer == undefined) e.timer = 0
    e.timer += amount
    const et = getType(e)
    if (e.timer > 100/et.speed) {
      e.timer -= 100/et.speed
      moveEnemy(e)
    }
  }
}

function getType(e) {
  return enemyType[e.type]
}

function moveEnemy(e) {
  const moves = []
  const options = [dirs.up, dirs.down, dirs.left, dirs.right]
  for(let dir of options) {
    const newPos = move(e, dir)
    const score = distanceFromTo(newPos, playerPos)
    if (cellIsEmpty(newPos)) {
      moves.push({pos:newPos, score:score})
    }
  }
  moves.sort((a,b) => a.score > b.score)
  if (moves.length > 0) {
    console.log("moved")
    e.x = moves[0].pos.x
    e.y = moves[0].pos.y
  }
}

function distanceFromTo(start, end) {
  return Math.abs(start.x - end.x) + Math.abs(start.y - end.y)
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
