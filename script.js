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
let enemyCombatMessage = []
let flipped = false

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

const states = { main:{}, dead:{}, start:{}}
let state = states.start


let playerStats = {}
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
enemyType.push({tileSet:0, sprite:1, maxHp:20, speed:7, power:5, name: "Sporangium Warrior", desc:"It smells angry"})
enemyType.push({tileSet:0, sprite:2, maxHp:15, speed:5, power:6, name: "Aspergillus Philosopher", desc:"It quivers threateningly"})
enemyType.push({tileSet:0, sprite:3, maxHp:30, speed:3, power:7, name: "Elder Shroom", desc:"It doesn't want you here"})
enemyType.push({tileSet:0, sprite:4, maxHp:40, speed:2, power:8, name: "Earthstar", desc:"It stares expectantly"})
enemyType.push({tileSet:1, sprite:1, maxHp:20, speed:7, power:5, name: "Broken One", desc:"It looks fragile"})
enemyType.push({tileSet:1, sprite:2, maxHp:15, speed:5, power:6, name: "Smoke Elemental", desc:"It seems to be slowly burning away"})
enemyType.push({tileSet:1, sprite:3, maxHp:30, speed:3, power:7, name: "Sewer Wyrm", desc:"It thrashes around to no avail"})
enemyType.push({tileSet:1, sprite:4, maxHp:40, speed:2, power:8, name: "Canbion", desc:"It shuffles back and forth"})


let playerPos = {}
let depth = 0
let tileSet = 0
const map = []
const enemies = []
const laddersUp = []
const laddersDown = []


restart()

function restart() {
  state = states.start
  playerStats = {speed:10, strength: 10, luck: 10, level:0, exp:0, sp:5, maxSp:5, hp:10, maxHp:10}
  depth = 0
  playerPos = {x: 27, y: 11, dir: dirs.down}
  clearMessages()
  makeMap()
  draw()
}



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
  makeLadders(depth)
}

function makeLadders(n) {
  laddersUp.length = 0
  if (n > 0) {
    rngSeed = n - 1
    times(100, () => addLadderUp())
  }
  laddersDown.length = 0
  rngSeed = n
  times(100, () => addLadderDown())
}

function addLadderDown() {
  addLadder(false)
}

function addLadderUp() {
  addLadder(true)
}

function addLadder(isUp) {
  let type = isUp ? "up" : "down"
  let list = isUp ? laddersUp : laddersDown
  let x = rnd(mapSize)
  let y = rnd(mapSize)
  if (anyAtPos(list, {x:x, y:y})) {
    return //don't add duplicates
  }
  var ladder = {x:x, y:y, type: isUp ? "up" : "down"}
  map[x][y] = 1 //clear the space
  list.push(ladder)
}

function makeEnemies() {
  enemies.length = 0
  times(100, makeEnemy)
}

function makeEnemy() {
  let x = -1
  let y = -1
  while (!cellIsEmpty({x:x, y:y})) {
    x = rnd(mapSize)
    y = rnd(mapSize)
  }
  var enemy = {x:x, y:y, type:rnd(4)+tileSet*4}
  const et = getType(enemy)
  enemy.hp = et.maxHp
  enemy.timer = 0
  enemy.level = 1
  enemy.defence = 10
  enemy.speed = 10
  enemy.power = et.power
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
  const viewSizeY = Math.floor(viewSize/1.5)
  const smallViewY = viewSizeY-Math.floor(smallColWidth/1.5)
  const col1X = 0
  const col2X = smallColWidth
  const col3X = smallColWidth + viewSize
  draw3D(col1X, smallViewY, smallColWidth, playerPos.dir.ccw)
  draw3D(col2X, 0, viewSize, playerPos.dir)
  draw3D(col3X, smallViewY, smallColWidth, playerPos.dir.cw)
  const rearViewX = smallColWidth + viewSize/2-smallColWidth/2
  draw3D(rearViewX, viewSizeY, smallColWidth, playerPos.dir.reverse)
  
  drawMap(col3X, 0, canvas.width - col3X, smallViewY)
  ctx.font="16px Verdana"
  ctx.fillStyle="white"
  ctx.fillText("position: " + playerPos.x + ":" + playerPos.y + ":" + playerPos.dir.name, 12, 748)

  const ahead = move(playerPos, playerPos.dir)
  const target = enemyAt(ahead)

  {
    const x = col1X + 20
    let y = viewSize/1.5+20
    const lineHeight = 20
    ctx.fillText("Armour: clothes    weapon: fist ", x, y);  y+=lineHeight
    ctx.fillText(`Level: ${playerStats.level}     Exp: ${playerStats.exp}`, x, y);  y+=lineHeight
    ctx.fillText(`Spell points: ${playerStats.sp} of ${playerStats.maxSp}`, x, y);  y+=lineHeight
    ctx.fillText(`Health points: ${playerStats.hp} of ${playerStats.maxHp}`, x, y);  y+=lineHeight
    y+=lineHeight
    ctx.fillText(`Arrow keys move and attack. Spacebar to wait.`, x, y);  y+=lineHeight
    if (anyAtPos(laddersUp, playerPos) || anyAtPos(laddersDown, playerPos)) {
      ctx.fillText(`[d] or [u] to go down or up a ladder.`, x, y);  y+=lineHeight
    }
  }

  const x = rearViewX + smallColWidth + 20
  let y = viewSize/1.5+20
  const lineHeight = 20
  for (let i = 0; i < enemyCombatMessage.length; i++) {
    ctx.fillText(enemyCombatMessage[i], x, y); y+=lineHeight
  }
  if (target != null)
  {
    const et = enemyType[target.type]

    y+=lineHeight
    ctx.fillText("You are fighting a level 1 " + et.name, x, y);  y+=lineHeight
    ctx.fillText("It has " + target.hp + " health points left", x, y);  y+=lineHeight
    y+=lineHeight
    ctx.fillText(playerCombatMessage1, x, y); y+=lineHeight
    ctx.fillText(playerCombatMessage2, x, y); y+=lineHeight
    y+=lineHeight
    ctx.fillText("Experience value: " + et.maxHp*5, x, y);  y+=lineHeight
    ctx.fillText(et.desc, x, y);  y+=lineHeight
  }

  if (state===states.dead) {
    ctx.font="64px Verdana"
    ctx.fillStyle="white"
    ctx.textAlign="center"
    ctx.fillText("YOU HAVE DIED", (col2X + col3X)/2, 100)

    ctx.font="32px Verdana"
    ctx.fillText("Press R to restart", (col2X + col3X)/2, viewSizeY - 20)
    ctx.textAlign="left"
  }

  if (state===states.start) {
    ctx.font="64px Verdana"
    ctx.fillStyle="white"
    ctx.textAlign="center"
    ctx.fillText("DUNGEON OF DEEP", (col2X + col3X)/2, 100)

    ctx.font="32px Verdana"
    ctx.fillText("Press [spacebar] to start", (col2X + col3X)/2, viewSizeY - 20)
    ctx.textAlign="left"
  }
  
}

function draw3D(viewX, viewY, viewSize, dir) {
  const viewSizeX = viewSize
  const viewSizeY = Math.floor(viewSize / 1.5)
  const viewXCentre = viewSizeX / 2
  const viewYCentre = viewSizeY / 2
  const depthFactor = 2

  //floor and ceiling

  if (flipped) {
    tCtx.scale(-1,1)
    tCtx.drawImage(spriteImage, 256*6, 512*tileSet*0, 512, 512, 0, 0, viewSizeX*-1, viewSizeY)
    tCtx.scale(-1,1)    
  } else {
    tCtx.drawImage(spriteImage, 256*6, 512*tileSet*0, 512, 512, 0, 0, viewSizeX, viewSizeY)
  }

  const across = [-8,-7,-6,-5,-4,-3,-2,-1,7,6,5,4,3,2,1,0]
  for (let i = 15; i >= 0; i--) { //depth
    const isHomeRow = (i == 0)
    const size = viewSizeY/(Math.pow(depthFactor,i-1))
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
        {
          const l = findAtPos(laddersUp, cellPos)
          if (l != undefined)
          {
            const eSize = viewSizeY/(Math.pow(depthFactor,i-0.4))
            const left = viewXCentre - eSize/2 + j*eSize
            const top = viewYCentre - eSize/2-eSize*(isHomeRow ? 0.4:0.2)
            tCtx.drawImage(spriteImage, 0, 5*256, 256, 256, left, top, eSize, eSize)
          }
        }
        {
          const l = findAtPos(laddersDown, cellPos)
          if (l != undefined)
          {
            const eSize = viewSizeY/(Math.pow(depthFactor,i-0.4))
            const left = viewXCentre - eSize/2 + j*eSize
            const top = viewYCentre - eSize/2+eSize*(isHomeRow ? 0.4:0.2)
            tCtx.drawImage(spriteImage, 0, 6*256, 256, 256, left, top, eSize, eSize)
          }
        }
        const e = enemies.find(e => e.x == cellPos.x && e.y == cellPos.y)
        if (e != undefined) {
          const et = enemyType[e.type]
          const eSize = viewSizeY/(Math.pow(depthFactor,i-0.4))
          const left = viewXCentre - eSize/2 + j*eSize
          const top = viewYCentre - eSize/2+eSize*0.2
          tCtx.drawImage(spriteImage, 256*et.sprite+1, et.tileSet*256, 255, 256, left, top, eSize, eSize)
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
  if (anyAtPos(enemies, {x:x, y:y})) {
    tCtx.fillStyle = "red"
    tCtx.fillRect(x*cellSize+2, y*cellSize+2, cellSize - 4, cellSize - 4)
  }
  if (anyAtPos(laddersUp, {x:x, y:y})) {
    tCtx.fillStyle = "yellow"
    tCtx.fillRect(x*cellSize+2, y*cellSize+2, cellSize - 4, cellSize - 4)
  }
  if (anyAtPos(laddersDown, {x:x, y:y})) {
    tCtx.fillStyle = "gold"
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
    && !anyAtPos(enemies, pos)
}

window.addEventListener("keyup", function (e) {
  doKey(e.keyCode)
})

function doKey(keyCode) {
  if (!loaded) return
  if (state === states.start) {
    if (keyCode===32) {
      state = states.main
      draw()
    }
    return
  }
  switch (keyCode) {
    case 37: turnLeft()
      break
    case 38: forward()
      break
    case 39: turnRight()
      break
    case 40: turnBack()
      break
    case 32: wait()
      break
    case 68: down()
      break
    case 85: up()
      break
    case 82: restartIfDead()
      break
    case 77: showMap()
      break
  }
}

function restartIfDead() {
  if (state !== states.dead) return
  restart()
}

function up() {
  if (!inGame()) return
  clearMessages()

  const ladder = findAtPos(laddersUp, playerPos)
  if (ladder == undefined) return
  changeLevelTo(depth-1)
}

function down() {
  if (!inGame()) return
  clearMessages()

  const ladder = findAtPos(laddersDown, playerPos)
  if (ladder == undefined) return
  changeLevelTo(depth+1)
}

function changeLevelTo(newLevel)
{
  depth = newLevel
  tileSet = depth % 2
  makeMap()
  draw()
}

function wait() {
  if (!inGame()) return
  clearMessages()
  
  timePasses(100/playerStats.speed)
}

function turnBack() {
  if (!inGame()) return
  clearMessages()

  flipped = !flipped
  playerPos.dir = playerPos.dir.reverse
  draw()
}
function turnLeft() {
  if (!inGame()) return
  clearMessages()

  flipped = !flipped
  playerPos.dir = playerPos.dir.ccw
  draw()
}
function turnRight() {
  if (!inGame()) return
  clearMessages()

  flipped = !flipped
  playerPos.dir = playerPos.dir.cw
  draw()
}
function forward() {
  if (!inGame()) return
  clearMessages()

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
}

function clearMessages() {
  enemyCombatMessage.length = 0
  playerCombatMessage1 = ""
  playerCombatMessage2 = ""
}

function fight(e) {
  if (!inGame()) return
  clearMessages()

  playerAttack(e)
  monsterAttack(e) //FIXME: all adjacent monsters get initiative
  draw()
}

function playerAttack(e) {
  const attackRoll = rnd(80) + playerStats.level * 2 
  + playerStats.strength * 2 + playerStats.luck //+ weapon hit bonus + prep and permanent weapon enchants
  const defenceRoll = 40 + e.level * 2 + e.defence + e.speed
  const result = attackRoll - defenceRoll
  let damage = 0
  if (result > 0) {
    times(Math.floor(result/40)+1, () => damage += playerDamageRoll())
    hitMonster(damage, e)
    //bonus damage
    damage += rnd(Math.floor(playerStats.strength / 3)) + rnd(playerStats.level)
  }

  if (damage > 0) {
    hitMonster(damage, e)
    playerCombatMessage1 = "You hit the monster!"
    playerCombatMessage2 = "It takes " + damage + " points of damage!"
  } else {
    playerCombatMessage1 = "You missed!"
    playerCombatMessage2 = ""    
  }
}

function monsterAttack(e) {
  if (e.hp <= 0) return
  const et = getType(e)
  const attackRoll = rnd(80) + 20 + e.level * 2 
  const defenceRoll = 32 + playerStats.level * 2 
  + playerStats.speed * 3/2 + playerStats.luck
  //protection spells, body armour, armour enchantment
  const result = attackRoll - defenceRoll
  let damage = 0
  if (result > 0) {
    times(Math.floor(result/40)+1, () => damage += rnd(e.power))
    //add bonus damage
  }

  if (damage > 0) {
    hitPlayer(damage)
    enemyCombatMessage.push("The " + getType(e).name + " does " + damage + " points of damage")
  } else {
    enemyCombatMessage.push("The " + getType(e).name + " missed!")
  }
}

function hitMonster(damage, e)
{
  e.hp -= damage
  if (e.hp <= 0) enemies.splice(enemies.indexOf(e), 1)
}

function playerDamageRoll() {
  return rnd(10) //should be weapon power
}

function timePasses(amount)
{
  clearMessages()
  for (let e of enemies) {
    if (e.timer == undefined) e.timer = 0
    e.timer += amount
    const et = getType(e)
    if (e.timer > 100/et.speed) {
      e.timer -= 100/et.speed
      moveEnemy(e)
    }
  }
  draw()
}

function getType(e) {
  return enemyType[e.type]
}

function moveEnemy(e) {
  const moves = []
  const options = [dirs.up, dirs.down, dirs.left, dirs.right]

  if (distanceFromTo(e, playerPos) == 1) {
    //enemy attack
    monsterAttack(e)
    return
  }

  for(let dir of options) {
    const newPos = move(e, dir)
    const score = distanceFromTo(newPos, playerPos)
    if (cellIsEmpty(newPos)) {
      moves.push({pos:newPos, score:score})
    }
  }
  moves.sort((a,b) => a.score > b.score)
  if (moves.length > 0) {
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

function anyAtPos(list, pos)
{
  return list.some(el => el.x == pos.x && el.y == pos.y)
}

function findAtPos(list, pos)
{
  return list.find(el => el.x == pos.x && el.y == pos.y)
}

function inGame() {
  return state === states.main
}

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

function hitPlayer(amount)
{
  playerStats.hp -= amount
  if (playerStats.hp <= 0) {
    state = states.dead
  }
}