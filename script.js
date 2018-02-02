"use strict"
//DOM stuff
const canvas = document.querySelector(".gameCanvas")
const mouseBox = document.querySelector(".mouseBox")

let debug = false

const ctx = canvas.getContext('2d')
ctx.webkitImageSmoothingEnabled = false
ctx.mozImageSmoothingEnabled = false
ctx.imageSmoothingEnabled = false

let smallFont = "24px \"dysin4mation\", monospace"
let mediumFont = "36px \"dysin4mation\", monospace"
let largeFont = "48px \"dysin4mation\", monospace"
let headingFont = "96px \"Wizard's Manse\", monospace"
let specialFont = "64px \"Wizard's Manse\", monospace"
let fontLineHeightScale = 0.6

const audios = []
let currentAudio = undefined
const audioCount = 4 //repeat after this many tracks

const tempCanvas = document.createElement("canvas")
const tCtx = tempCanvas.getContext("2d")
tempCanvas.width = 1024
tempCanvas.height = 1024
tCtx.webkitImageSmoothingEnabled = false
tCtx.mozImageSmoothingEnabled = false
tCtx.imageSmoothingEnabled = false

const width = canvas.width
const height = canvas.height

let loaded = false
let justRestarted = false

const spellNames = []
// see enemies on map | no fog of war
spellNames.push({name:"Out of Problems", fullName:"As long as we have each other, we will never run out of problems", desc:"Kill target creature. This spell consumes half of your remaining health points."})
spellNames.push({name:"Deception", desc:"Pass through a wall to the other side"}) // enemies stop hunting you
spellNames.push({name:"Extinction", desc:"Target creature becomes the last of its kind. This spell is permanent. Spell points used will not regenerate!"})
spellNames.push({name:"Ouroboros", desc:"Summon the World Eater Sword, the most powerful sword in the world!"})
spellNames.push({name:"Heartbeat", desc:"Heal 1 health point each turn, for 3 turns per intelligence point"})
spellNames.push({name:"We See Things", fullName: "We don't see things as they are, we see them as we are.", desc:"Let monsters think you are one of them. Enemies will ignore you unless provoked."})
spellNames.push({name:"What do we do now?", desc:"Teleport target creature to a random location on this level. If there is no target, teleport yourself."})
spellNames.push({name:"Ritual", desc:"Heal up to 3 health points per intelligence point"})
spellNames.push({name:"Waves", desc:"Deal 30 health points of damage"})
spellNames.push({name:"Transmission", desc:"Detect the mind waves of a Shadow Guardian, so you can hunt it for its treasure"})
spellNames.reverse()

const effectNames = []
effectNames.push("Heartbeat", "Disguised", "Ouroboros")

const spriteImage = new Image()
spriteImage.addEventListener('load', function() {
  loaded = true
  console.log("sprites loaded")
  if (menuState === menuStates.colorPicker) {
    if (!tryLoad()) {
      console.log("no save file")
      restart()
    }
    menuState = menuStates.start
  }
  draw()
}, false)


//start preloading
loadAudio(0)
var font = new FontFaceObserver('dysin4mation', {});
font.load().then(function () {
  console.log('Font is available');
  showColorPicker()
}, function () {
  console.log('Font is not available');
  showColorPicker()
});
var font2 = new FontFaceObserver('Wizard\'s Manse', {});
font2.load()

let fixedRandom  = new Random(1);

function rnd(n) {
  return Math.floor(fixedRandom.nextFloat() * n)
}

function trueRnd(n) {
  return Math.floor(Math.random() * n)
}

const states = { main:"main", dead:"dead",  
  university:"university", healer:"healer", foundSomething:"foundSomething", 
  spellNotes:"spellNotes",
  newLevel:"newLevel", falling:"falling", endChoice:"endChoice", retireScreen:"retireScreen"}

const menuStates = { ok:"ok", start:"start", colorPicker:"colorPicker"}

//start state
const pressAnyKeyStates = [states.foundSomething, states.spellNotes, states.newLevel, states.falling]

const mapSize = 100
const cellSize = 10
const levelsPerTileset = 3
const dirs = {up:{name:"up", y:-1,i:0}, right:{name:"right",x:1,i:1}, down:{name:"down",y:1,i:2}, left:{name:"left",x:-1,i:3}}
const dirsList = [dirs.up, dirs.right, dirs.down, dirs.left]
setupDirs(dirsList)
function setupDirs(dirs) {
  for(let i = 0; i < dirs.length; i++) {
    dirs[i].cw = dirs[(i+1)%dirs.length]
    dirs[i].ccw = dirs[(i+3)%dirs.length]
    dirs[i].reverse = dirs[(i+2)%dirs.length]
    if (dirs[i].x==undefined) dirs[i].x = 0
    if (dirs[i].y==undefined) dirs[i].y = 0
  }
}

const tileSetCount = 4
const normalEnemyCount = tileSetCount * 4
const potionEnemyCount = 10
const bossEnemyStartCount = normalEnemyCount + potionEnemyCount
const enemyType = []

enemyType.push({tileSet:0, sprite:1, end:1, speed:7, defence: 3, power:4, name: "Broken One", desc:"It looks fragile"})
enemyType.push({tileSet:0, sprite:2, end:3, speed:5, defence: 3, power:5, name: "Smoke Elemental", desc:"It seems to be slowly burning away"})
enemyType.push({tileSet:0, sprite:3, end:4, speed:3, defence: 2, power:4, name: "Sewer Wyrm", desc:"It thrashes around to no avail"})
enemyType.push({tileSet:0, sprite:4, end:5, speed:2, defence: 3, power:4, name: "Canbion", desc:"It shuffles back and forth"})

enemyType.push({tileSet:1, sprite:1, end:3, speed:10, defence: 3, power:4, name: "Killer Prawn", desc:"It snarls at your presence"})
enemyType.push({tileSet:1, sprite:2, end:2, speed:2, defence: 1, power:5, name: "Island Mimic", desc:"Its sandy shore has claimed many victims"})
enemyType.push({tileSet:1, sprite:3, end:4, speed:7, defence: 6, power:6, name: "Purple Tentacle", desc:"Does it belong to something bigger?"})
enemyType.push({tileSet:1, sprite:4, end:12, speed:1, defence: 1, power:8, name: "Iron Giant", desc:"You hear grinding gears from the depths"})

//all slow
enemyType.push({tileSet:2, sprite:1, end:3, speed:5, defence: 5, power:3, name: "Sporangium Warrior", desc:"A cloud of toxic spores surrounds it"})
enemyType.push({tileSet:2, sprite:2, end:3, speed:6, defence: 2, power:4, name: "Aspergillus Philosopher", desc:"It quivers threateningly"})
enemyType.push({tileSet:2, sprite:3, end:2, speed:2, defence: 2, power:7, name: "Elder Shroom", desc:"It doesn't want you here"})
enemyType.push({tileSet:2, sprite:4, end:6, speed:2, defence: 5, power:6, name: "Earthstar", desc:"It stares expectantly"})

enemyType.push({tileSet:3, sprite:1, end:5, speed:8, defence: 3, power:8, name: "Triffid", desc:"It smells angry"})
enemyType.push({tileSet:3, sprite:2, end:4, speed:6, defence: 8, power:5, name: "Dumble-Dor", desc:"It clutches a crude spear"})
enemyType.push({tileSet:3, sprite:3, end:10, speed:2, defence: 2, power:7, name: "Honey Golem", desc:"It looks delicious"})
enemyType.push({tileSet:3, sprite:4, end:2, speed:2, defence: 3, power:4, name: "Larva", desc:"It writhes with ecstasy"})

//potions
{
  const potionNames = 
  ["Turquoise", "Pink", "Aqua", "Red", "Dark Blue", "Orange", "Violet", "Lemon", "Lavender", "Green"]
  let n = 0
  for (var i = 0; i < potionEnemyCount/2; i++) {
    enemyType.push({tileSet:5, sprite:1+i, end:1, speed:4, defence: 1, power:5, special: i, name: potionNames[n++] + " Potion Bearer", desc:"This one will change you…"})
    enemyType.push({tileSet:6, sprite:1+i, end:1, speed:4, defence: 1, power:5, special: i+5, name: potionNames[n++]+ " Potion Bearer", desc:"This one will change you…"})
  }
}

//bosses
enemyType.push({tileSet:0, sprite:4, end:6, speed:2, defence: 3, power:8, boss:0, name: "Alumincubus", desc:"It hurts to look at"})
enemyType.push({tileSet:1, sprite:1, end:7, speed:6, defence: 3, power:9, boss:1, name: "Shadow Prawn", desc:"It demands blood for its barbequed brethren"})
enemyType.push({tileSet:2, sprite:4, end:8, speed:2, defence: 3, power:10, boss:2, name: "Moonstar", desc:"Its gaze crosses dimensions"})
enemyType.push({tileSet:3, sprite:1, end:9, speed:5, defence: 4, power:12, boss:3, name: "Audrey IV", desc:"It fights as if protecting its kin"})
enemyType.push({tileSet:3, sprite:5, end:0, speed:0, defence: 0, power:0, isItem:true, name: "Oxygen Generator", desc:"This is it!!!"})

//information you would save
let state = states.main
let playerStats = {}
let playerCombatMessage = []
let enemyCombatMessage = []
let townMessage = []
let endState = "" //hack for spawning final treasure
let endRuns = 0
let playerPos = {}
let depth = -1
let newLevelMsg = -1
let enemies = []
let storedEnemies = [] //saved on level change only

//not saved
let menuState = menuStates.colorPicker
console.log(menuState)
const map = []
const pits = []
const laddersUp = []
const laddersDown = []
let flipped = false
let buttons = []
let tileSet = 0
let frozen = false

function tryLoad() {
  try {
    const save = getSave()
    if (!save || !save.state) return false
    console.log("loading save file")
    state = save.state
    playerStats = save.playerStats
    playerCombatMessage = save.playerCombatMessage
    enemyCombatMessage = save.enemyCombatMessage
    townMessage = save.townMessage
    endState = save.endState
    endRuns = save.endRuns
    playerPos = save.playerPos
    depth = save.depth
    enemies = save.enemies
    storedEnemies = save.storedEnemies
    newLevelMsg = save.newLevelMsg

    //upgrade old saves here
    if (playerStats.effects === undefined) playerStats.effects = []
    if (playerStats.extinctions === undefined) playerStats.extinctions = []
    if (playerStats.burnedSp === undefined) playerStats.burnedSp = 0
    if (playerStats.seed === undefined) playerStats.seed = 0
    if (playerStats.knownPits === undefined) playerStats.knownPits = []

    //fixing up
    playerPos.dir = dirsList[playerPos.dir] //fix up serializable
    changeLevelTo(depth) //draws
    return true
    } catch (e) {
      console.log("Loading failed somehow")
      console.log(e)
      return false
    }
}

//does not update enemies on other levels!
function saveMain() {
  var t0 = performance.now();
  const save = {}
  save.state = state
  save.playerStats = playerStats
  save.playerCombatMessage = playerCombatMessage
  save.enemyCombatMessage = enemyCombatMessage
  save.townMessage = townMessage
  save.endState = endState
  save.endRuns = endRuns
  save.playerPos = playerPos
  playerPos.dir = dirsList.indexOf(playerPos.dir) //make serializable
  save.depth = depth
  save.enemies = enemies
  save.newLevelMsg = newLevelMsg
  localStorage.setItem('saveMain', JSON.stringify(save))
  playerPos.dir = dirsList[playerPos.dir] //fix it up after
  var t1 = performance.now();
  if ((t1 - t0) > 5) console.log("slow save took " + (t1 - t0) + " milliseconds.")
}

function saveWorld() {
  localStorage.setItem('saveWorld', JSON.stringify(storedEnemies))
}

function restart() {
  justRestarted = true
  state = states.main
  playerStats = {speed:10, strength: 10, luck: 10, int:10, end:10, 
                  level:1, sp:0, maxSp:0, hp:0, maxHp:0, exp:0, gold: 50, age:startAge(),
                  surprise:[], kills:0, burnedSp:0}
  deriveMaxHpAndSp()
  playerStats.hp = playerStats.maxHp
  playerStats.sp = playerStats.maxSp

  playerPos = {x: -1, y: -1, dir: dirs.right}
  playerStats.spellKnown = [true,false,false,false,false,false,false,false,false,false]
  playerStats.bossesKilled = [false, false, false, false]
  playerStats.levelsVisited = []
  playerStats.lootTimer = makeLootArray()
  playerStats.effects = []
  playerStats.extinctions = []
  playerStats.seed = trueRnd(1000)
  playerStats.knownPits = []
  clearMessages()
  endState = ""
  endRuns = 0
  depth=-1
  enemies = []
  storedEnemies.length = 0
  newLevelMsg = -1
  changeLevelTo(0)
}

function deriveMaxHpAndSp() {
  const startHp = Math.floor(playerStats.end*1.5+playerStats.luck/2+3+25)
  playerStats.maxHp = startHp + Math.floor((8+playerStats.end/2)*playerStats.level)
  playerStats.maxSp = Math.floor(3+playerStats.int*playerStats.level*0.8) - playerStats.burnedSp
  if (playerStats.hp > playerStats.maxHp) playerStats.hp = playerStats.maxHp
  if (playerStats.sp > playerStats.maxSp) playerStats.sp = playerStats.maxSp
}

function isLastLevel() {
  return depth >= tileSetCount*levelsPerTileset-1
}

function makeMap() {
  pits.length = 0
  if (isLastLevel()) {
    makeFinalMap()
    return
  }
  for(let x = 0; x < mapSize; x++) {
    map[x] = [];
    for (let y = 0; y < mapSize; y++) {
      map[x][y] = 0
    }
  }
  //rooms
  let rooms = []
  fixedRandom  = new Random(playerStats.seed+depth);
  times(140, () => addRoom(rooms))
  for(let r of rooms) {
    addCorridors(r)
  }
  makeLadders(depth)
  removeOrphanRooms()
  makePits()
  makeEnemies()
}

function makePits() {
  if (depth===0) return
  times(40, () => makePit())
}

function makePit() {
  let x = -1
  let y = -1
  while(cellAt({x:x,y:y})==0 || anyAtPos(laddersUp, {x:x, y:y}) || anyAtPos(laddersDown, {x:x, y:y})) {
    x = rnd(mapSize)
    y = rnd(mapSize)
  }
  pits[x+y*mapSize]=true
}

function makeFinalMap() {
  for(let x = 0; x < mapSize; x++) {
    map[x] = [];
    for (let y = 0; y < mapSize; y++) {
      map[x][y] = 1
    }
  }
  makeLadders(depth)
  laddersDown.length = 0 //hack out the down ladders
  makeEnemies()
}

function makeLadders(n) {
  laddersUp.length = 0
  fixedRandom  = new Random(playerStats.seed+n-1);
  times(100, () => addLadderUp())
  if (depth==0) {
    times(150, () => addLadderUp())
  }
  laddersDown.length = 0
  fixedRandom  = new Random(playerStats.seed+n);
  times(100, () => addLadderDown())
}

function removeOrphanRooms()
{
  fixedRandom  = new Random(playerStats.seed+depth);
  const roomStates = []
  for(let x = 0; x < mapSize; x++) {
    roomStates[x] = [];
    for (let y = 0; y < mapSize; y++) {
      roomStates[x][y] = false
    }
  }
  //flood fill from up ladders with OKness
  laddersUp.forEach(function (ladder) {
    floodFillState(map, roomStates, "ok", ladder)
  })
  //for each non-OK downladder:
  laddersDown.forEach(function (ladder) {
    if (roomStates[ladder.x][ladder.y]===false) {
      makePathToLadder(map, roomStates, ladder)
    }
  })

  //remove non-ok cells
  for(let x = 0; x < mapSize; x++) {
    for (let y = 0; y < mapSize; y++) {
      if (roomStates[x][y]===false) map[x][y] = 0
    }
  }
}

function makePathToLadder(map, roomStates, ladder) {
  console.log('found orphaned down ladder at ' + ladder.x + "," + ladder.y)
  //- find a close ok cell
  let pos = {x:ladder.x, y:ladder.y}
  while (roomStates[pos.x][pos.y]!=="ok") {
    let nextPos = {x:-1,y:-1}
    while (!isValidPos(nextPos)) {
      nextPos = move(pos, pickRandom(dirsList))
    }
    pos = nextPos
  }
  console.log("carving path to " + pos.x + "," + pos.y)
  //- carve a path there
  let carve = {x:ladder.x, y:ladder.y}
  while (carve.x != pos.x) {
    carve.x += (pos.x > carve.x) ? 1 : -1
    map[carve.x][carve.y]=1
  }
  while (carve.y != pos.y) {
    carve.y += (pos.y > carve.y) ? 1 : -1
    map[carve.x][carve.y]=1
  }
  //- flood fill okness 
  floodFillState(map, roomStates, "ok", ladder) 
}

function floodFillState(map, states, state, pos)
{
  const open = [pos]
  const closed = []
  while (open.length > 0) {
    let o = open.pop()
    if (canFloodFillCell(map, states, state, o, closed)) {
      states[o.x][o.y] = state
      closed[o.x+o.y*mapSize]=true
      open.push({x:o.x+1,y:o.y})
      open.push({x:o.x-1,y:o.y})
      open.push({x:o.x,y:o.y+1})
      open.push({x:o.x,y:o.y-1})
    }
  }
}

function canFloodFillCell(map, states, state, c, closed) {
  return (isValidPos(c) && map[c.x][c.y]===1&&states[c.x][c.y]!==state&&!closed[c.x+c.y*mapSize])
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
  let x = makeOdd(rnd(mapSize-1))
  let y = makeOdd(rnd(mapSize-1))
  let rand = rnd(4) //we have to ask for it whether we use it or not
  if (anyAtPos(list, {x:x, y:y})) {
    return //don't add duplicates
  }
  var ladder = {x:x, y:y, type: isUp ? "up" : "down"}
  list.push(ladder)

  map[x][y] = 1 //clear the space

  let pos = {x:x, y:y}
  
  if (cellAt(move(pos, dirs.up)) === 0
    && cellAt(move(pos, dirs.down)) === 0
    && cellAt(move(pos, dirs.left)) === 0
    && cellAt(move(pos, dirs.right)) === 0) {
    //ladder needs more room

    //careful not to call rnd, unless you _always_ call it
    //because ladders appear on two different levels
    let dir = dirsList[rand]
    if (x < 10) dir = dirs.right
    if (x > mapSize - 10) dir = dirs.left
    if (y < 10) dir = dirs.down
    if (y > mapSize - 10) dir = dirs.up

    pos = move(pos, dir)
    while(isValidPos(pos)&&map[pos.x][pos.y]==0) {
      map[pos.x][pos.y]=1
      pos = move(pos, dir)
    }
  }
}

function makeEnemies() {  
  if (storedEnemies[depth] != undefined) {
    enemies = storedEnemies[depth]
    storedEnemies[depth] = undefined
    //spawn more if there aren't many left
    times(180-enemies.length, makeEnemy)
  } else {
    enemies = []
    times(280+depth*30, makeEnemy)
    maybeGenerateBoss()
  }
  
}

function maybeGenerateBoss() {
  if (isBossLevel(depth)) {
    const bossN = (Math.floor(depth/levelsPerTileset))%tileSetCount
    if (!playerStats.bossesKilled[bossN]) {
      makeEnemy(bossEnemyStartCount+bossN)
    }
  }
}

function randomEmptyCell() {
  const pos = {x:-1, y:-1}
  while (!cellIsEmpty(pos||anyAtPos(laddersUp, pos)||anyAtPos(laddersDown,pos))) {
    pos.x = trueRnd(mapSize)
    pos.y = trueRnd(mapSize)
  }
  return pos
}

function makeEnemy(fixedType) {
  const enemy = randomEmptyCell()

  if (fixedType != undefined) {
    enemy.type = fixedType;
  } else if (trueRnd(100)<20) {
    //potion!
    enemy.type = normalEnemyCount+trueRnd(10)
  } else {
    enemy.type = trueRnd(4)+tileSet*4
  }

  const et = getType(enemy)
  if (playerStats.extinctions.indexOf(enemy.type) >= 0) {
    console.log("tried to generate extinct creature! lol no")
    return
  }
  enemy.level = depth + 1 + trueRnd(2)
  if (et.boss != undefined) enemy.level += 5
  enemy.maxHp = 5 + Math.floor(et.end/2*enemy.level)
  enemy.hp = enemy.maxHp
  enemy.timer = 0
  enemy.defence = et.defence + Math.floor(enemy.level * et.defence / 4)
  enemy.speed = et.speed + Math.floor(enemy.level * et.speed / 4)
  enemy.power = et.power + Math.floor(enemy.level * et.power / 4)
  const baseExp = (et.end + et.power + et.speed + et.defence)
  enemy.exp = Math.floor(baseExp * (1+enemy.level/2))
  enemy.gold = trueRnd(enemy.exp) + 5 //note: this only occasionally drops, based on lootTimer

  enemies.push(enemy)
  return enemy
}

function addRoom(rooms) {
  let attempt = 0
  let room = {x:-1,y:-1,w:0,h:0}
  const maxSize = (rnd(100)<30) ? 13 : 8
  while (!isRoomValid(room)) {
    attempt++
    if (attempt > 100) return //abort!
    room.x = makeOdd(rnd(mapSize))
    room.y = makeOdd(rnd(mapSize))
    room.w = makeOdd(rnd(maxSize-3) + 3)
    room.h = makeOdd(rnd(maxSize-3) + 3)
  }
  rooms.push(room)
  for(let x = room.x; x < room.x+room.w; x++) {
    for (let y = room.y; y < room.y+room.h; y++) {
      map[x][y] = 1
    }
  }
}

function addCorridors(room) {
  const n = 1 + rnd((room.w+ room.h)/9+1)
  for (let i = 0; i < n; i++) {
    let pos = randomRoomEdge(room)
    let attempt = 0
    while (map[pos.x][pos.y]!=0&&attempt<5) {
      attempt++
      pos = randomRoomEdge(room)
    }
    carveCorridor(pos)
  }
}

function carveCorridor(pos) {
  map[pos.x][pos.y]=0//hack because corridor wants a solid start, but is usually started on space
  let step = false //can only twist every 2nd step
  while (isValidPos(pos) && map[pos.x][pos.y]==0) {
    map[pos.x][pos.y]=1 //clear start pos
    const dir = pos.dir
    pos = move(pos, dir)
    pos.dir = dir
    step = !step
    if (step && rnd(10)<4) {
      pos.dir = (rnd(10)<5) ? pos.dir.cw : pos.dir.ccw
    }
  }
}

function isValidPos(pos) {
  return !(pos.x < 0 || pos.y < 0 || pos.x >= mapSize || pos.y >= mapSize)
}

function randomRoomEdge(room) {
  const n = makeEven(rnd(room.w+room.h+1))
  const pos = {x:0,y:0}
  if (n < room.w) {
    //top or bottom
    pos.dir = (rnd(2)==0) ? dirs.up : dirs.down
    pos.x = room.x + n
    pos.y = (pos.dir==dirs.up) ? room.y - 1 : room.y + room.h

  } else {
    //side
    pos.dir = (rnd(2)==0) ? dirs.left : dirs.right
    pos.x = (pos.dir==dirs.left) ? room.x - 1 : room.x + room.w
    pos.y = room.y + (n - room.w - 1)
  }
  return pos
}

//room must not be touching any space
function isRoomValid(room) {
  for(let x = room.x-1; x <= room.x + room.w; x++) {
    for (let y = room.y-1; y <= room.y+room.h; y++) {
      if (x < 0 || y < 0 || x >= mapSize || y >= mapSize) return false
      if (map[x][y] != 0) return false
    }
  }
  return true
}

function makeOdd(n) {
  if (n%2==0) return n + 1
  return n
}

function makeEven(n) {
  if (n%2==1) return n - 1
  return n
}

const smallColWidth = 186
const viewSize = canvas.width - smallColWidth*2
const viewSizeY = Math.floor(viewSize/1.5)
const smallViewSizeY = Math.floor(smallColWidth/1.5)
const smallViewY = viewSizeY-smallViewSizeY
const col1X = 0
const col2X = smallColWidth
const col3X = smallColWidth + viewSize
const lowerHudY = viewSizeY + 30
const centerX = Math.floor(canvas.width/2)
const rearViewX = Math.floor(centerX-smallColWidth/2)
function draw() {
  buttons.length=0
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (state===states.newLevel || state===states.endChoice || state===states.retireScreen) {
    const t = getMainWindowTextTool()
    t.setFont(specialFont)
    t.y += 20
    t.lineHeight += 12
    for (let i = 0; i < floorMsg[newLevelMsg].length; i++) {
      t.print(floorMsg[newLevelMsg][i])
    }

    t.setFont(smallFont)
    t.print()
    if (state===states.endChoice) {
      button(col2X, t.y-t.lineHeight+2, viewSize, t.lineHeight, endRetire)
      t.print("Press [R] to retire in peace")
      button(col2X, t.y-t.lineHeight+2, viewSize, t.lineHeight, endContinue)
      t.print("Press [D] to stay in the dungeon")
    } else if (state===states.retireScreen) {
      button(col2X, t.y-t.lineHeight+2, viewSize, t.lineHeight, endRestart)
      t.print("Press [R] to restart")
    } else {
      t.print("Press any key to close")
    }
    drawBorder(col2X, 0, viewSize, viewSizeY)
    finishDraw()
    return //draw nothing else
  }
  
  if (menuState !== menuStates.start) {
    draw3D(col1X, smallViewY, smallColWidth, playerPos.dir.ccw)
    draw3D(col3X, smallViewY, smallColWidth, playerPos.dir.cw)
    
    draw3D(rearViewX, viewSizeY, smallColWidth, playerPos.dir.reverse)
    drawMap(col3X, 0, canvas.width - col3X, smallViewY)

    button(col1X, viewSizeY-smallViewSizeY, smallColWidth, smallViewSizeY, turnLeft)
    button(col2X, 0, viewSize, viewSizeY, forward)
    button(col3X, viewSizeY-smallViewSizeY, smallColWidth, smallViewSizeY, turnRight)
    button(rearViewX, viewSizeY, smallColWidth, smallViewSizeY, turnBack)
    button(col1X, viewSizeY, canvas.width, canvas.height-viewSizeY, wait)
  }
  draw3D(col2X, 0, viewSize, playerPos.dir)

  if (menuState !== menuStates.start) {
    drawLadderPopups()
  }

  const ahead = move(playerPos, playerPos.dir)
  const target = enemyAt(ahead)

  if (menuState !== menuStates.start && state != states.spellNotes) {
    drawSpellUi(0, 0, smallColWidth, smallViewY)
  }

  //lower left HUD
  if (menuState !== menuStates.start) {
    ctx.fillStyle=getColors().textColor
    ctx.font=mediumFont
    let lineHeight = 24
    const x = col1X + 20
    const rightX = x + 290
    let y = lowerHudY
    ctx.fillText(`Health points: ${playerStats.hp} of ${playerStats.maxHp}`, x, y)
    ctx.fillText(`Gold: ${playerStats.gold}`, rightX, y);  y+=lineHeight
    ctx.fillText(`Spell points: ${playerStats.sp} of ${playerStats.maxSp}`, x, y);
    ctx.fillText(`Level: ${playerStats.level}`, rightX, y);  y+=lineHeight
    ctx.fillText(`Exp: ${playerStats.exp} of ${expNeeded()}`, x, y);  y+=lineHeight
    
    
    y+=lineHeight
    y+=lineHeight
    ctx.fillText(`Str: ${playerStats.strength}   Spd: ${playerStats.speed}   Int: ${playerStats.int}`, x, y);  y+=lineHeight
    ctx.fillText(`End: ${playerStats.end}   Luc: ${playerStats.luck}`, x, y);  y+=lineHeight

    ctx.font=smallFont
    lineHeight = 16    
    y+=lineHeight
    ctx.fillText(`Arrow keys move and attack. Spacebar to wait.`, x, y);  y+=lineHeight
    if (anyAtPos(laddersUp, playerPos) || anyAtPos(laddersDown, playerPos)) {
      ctx.fillText(`[d] or [u] to go down or up a ladder.`, x, y);  y+=lineHeight
    }
    ctx.font=mediumFont
    lineHeight = 24
    y+=lineHeight
    if (playerStats.effects.some(x => x > 0)) {
      ctx.fillText(`Status effects:`, x, y);  y+=lineHeight  
      for(let i = 0; i < playerStats.effects.length; i++) {
        if (playerStats.effects[i]>0) {
          ctx.fillText(effectNames[i] + ` (${playerStats.effects[i]})`, x, y);  y+=lineHeight
        }
      }
    }
  }

  //lower rightHUD
  if (state == states.falling) {
    const x = rearViewX + smallColWidth + 20
    let y = lowerHudY
    ctx.font=mediumFont
    let lineHeight = 24
    ctx.fillText("Uh Oh...", x, y); y+=lineHeight
    ctx.fillText("A sinking feeling!", x, y); y+=lineHeight
    freeze(function () {
      ctx.fillText("(press any key)", x, y); y+=lineHeight  
    })
  } else if (menuState !== menuStates.start) {
    const x = rearViewX + smallColWidth + 20
    let y = lowerHudY
    ctx.font=mediumFont
    let lineHeight = 24
    for (let i = 0; i < enemyCombatMessage.length; i++) {
      ctx.fillText(enemyCombatMessage[i], x, y); y+=lineHeight
    }
    if (enemyCombatMessage.length==0) y+=lineHeight
    if (target != null)
    {
      const et = enemyType[target.type]

      y+=lineHeight
      ctx.fillText("A level " + target.level + " " + et.name, x, y);  y+=lineHeight
      ctx.fillText("It has " + target.hp + " health points left", x, y);  y+=lineHeight
      y+=lineHeight
      for (let i = 0; i < playerCombatMessage.length; i++) {
        ctx.fillText(playerCombatMessage[i], x, y); y+=lineHeight
      }
      if (playerCombatMessage.length < 2) times(2-playerCombatMessage.length, () => {y+=lineHeight})
      y+=lineHeight
      y+=lineHeight
      ctx.fillText("Experience value: " + target.exp, x, y);  y+=lineHeight
      ctx.fillText(et.desc, x, y);  y+=lineHeight
    } else {
      if (playerCombatMessage.length>0) {
        //treasure reveal. Move text to same position as before
        y+=lineHeight*4
        for (let i = 0; i < playerCombatMessage.length; i++) {
          ctx.fillText(playerCombatMessage[i], x, y); y+=lineHeight
        }
      } else {
        //misc notices
        if (playerStats.exp >= expNeeded()) {
          y+=lineHeight
          ctx.fillStyle = getColors().textColor
          ctx.fillText(`You have enough experience to go`, x, y);  y+=lineHeight
          const amount = howManyLevelsCanIGet()
          const msg = (amount == 1) ? "a level" : amount + " levels"
          ctx.fillText(`up ${msg}! Return to the top of`, x, y);  y+=lineHeight
          ctx.fillText(`the dungeon. But it will cost you!`, x, y);  y+=lineHeight
        }
        if (isLastLevel() && endState === "flowerHunt") {
          const flower = enemies.find(x=>getType(x).isItem === true)
          if (flower != undefined) {
            const txt = bossPointText(flower.x - playerPos.x, flower.y - playerPos.y)
            y+=lineHeight
            ctx.fillText(`The Oxygen Generator is ${txt}!`, x, y);  y+=lineHeight
          }
        }
        if (endState === "hasFlower") {
            y+=lineHeight
            ctx.fillText(`You have the Oxygen Generator!`, x, y);  y+=lineHeight
            ctx.fillText(`Return to the surface!`, x, y);  y+=lineHeight
        }
        if (endState === "shouldSpawn") {
            y+=lineHeight
            ctx.fillText(`You sense an Oxygen Generator`, x, y);  y+=lineHeight
            ctx.fillText(`on the lowest dungeon level!`, x, y);  y+=lineHeight
        }
        if (endRuns > 0) {
            y+=lineHeight
            ctx.fillText(`You helped the citadel ${endRuns} time${plural(endRuns)}.`, x, y);  y+=lineHeight 
        }
      }
   
    }
    if (endState === "hasFlower") {
      ctx.drawImage(spriteImage, 256*5, 3*256, 255, 256, rearViewX, viewSizeY+smallViewSizeY+20, smallColWidth, smallColWidth)
    }
  }

  if (state===states.dead) {
    drawTitle("You have died", centerX, 100)
    drawMedium("Press R to restart", centerX, viewSizeY - 20)
    ctx.textAlign="left"
  }

  if (menuState === menuStates.start) {
    button(0, 0, canvas.width, canvas.height, pressAnyKey)
    drawTitle("Matthew's", centerX, 80)
    drawTitle("Dungeons of", centerX, 80+90)
    drawTitle("the Unforgiven", centerX, 80+90+70)
    let y = viewSizeY + 50
    const lineHeight = 30
    if (justRestarted) {
      drawMedium("Press [spacebar] to start", centerX, viewSizeY - 20)
      drawMedium("Life in the citadel is hard but fair.", centerX, y); y += lineHeight
      //works up to 1099
      drawMedium(`There is only enough air for one thousand and ${numberToWords.toWords(12+getPeopleSaved())} people.`, centerX, y); y += lineHeight
      drawMedium("When a baby is born, the oldest citizen is sent into the Depths.", centerX, y); y += lineHeight
      y += lineHeight
      drawMedium("Today is your turn to be exiled.", centerX, y); y += lineHeight
      y += lineHeight
      drawMedium("You have 50 coins and know 1 spell.", centerX, y); y += lineHeight
      drawMedium(`You are ${startAge()} years old.`, centerX, y); y += lineHeight
      drawMedium(" Good luck!", centerX, y); y += lineHeight
    } else {
      button(0, y-lineHeight+5, canvas.width, lineHeight, pressAnyKey, null, true)
      drawMedium("Press [spacebar] to continue this game.", centerX, y); y += lineHeight
      button(0, y-lineHeight+5, canvas.width, lineHeight, doKey, 82, true) //r for restart
      drawMedium("Press [R] to abandon this character and start again.", centerX, y); y += lineHeight
      y+=lineHeight*2
      const kills = playerStats.bossesKilled.filter(x=>x===true).length
      drawMedium(`You are level ${playerStats.level} and have killed ${kills} shadow guardian${plural(kills)}`, centerX, y); y += lineHeight
    }
    ctx.textAlign="left"
  } else if (state===states.spellNotes) {
    const t = getSpellNotesTextTool()
    t.print("Spell Notes")
    t.setFont(smallFont)
    //t.print()
    for (let i = 0; i < spellNames.length; i++) {
      if (playerStats.spellKnown[i]) {
        t.print((i+1) + " " + (spellNames[i].fullName != undefined ? spellNames[i].fullName : spellNames[i].name))
        t.print("    " + spellNames[i].desc)
        if (spellNames[i].desc2 != null) t.print("    " +spellNames[i].desc2)
      } else {
        t.print((i+1) + " " + "???")
        t.print()
      }
    }
    t.print()
    t.print("Each spell costs as many spell points as its number")
    t.print("Press any key to close")
  } else if (state===states.healer) {
    const t = getMainWindowTextTool()
    t.print("The Therapist")
    t.setFont(mediumFont)
    t.print()
    if (townMessage.length > 0) {
      for (let i = 0; i < townMessage.length; i++) {
        t.print(townMessage[i])
      }
    } else {
      t.print("Dungeoneering can be stressful!")
      t.print("I can heal you with my words.")
    }
    t.print()
    button(col2X, t.y-t.lineHeight,viewSize,t.lineHeight,buyHealing,10,true)
    t.print("Press [1] to heal 10 hp for " + healCost(10))
    button(col2X, t.y-t.lineHeight,viewSize,t.lineHeight,buyHealing,50,true)
    t.print(`Press [2] to heal 50 for ${healCost(50)}`)
    drawPopup(false,"HIT D TO","GO BACK", backToMain)
  } else if (state===states.university) {
    const t = getMainWindowTextTool()
    t.print("Survivor's Technical College")
    t.setFont(mediumFont)
    t.print()
    if (townMessage.length > 0) {
      for (let i = 0; i < townMessage.length; i++) {
        t.print(townMessage[i])
      }
    } else {
      if (canLevelUp()) {
        if (playerStats.gold >= goldNeededToLevel()) {
          t.print("You're ready to study here!")
          button(col2X, t.y-t.lineHeight,viewSize,t.lineHeight,buyLevelUp,null,true)
          t.print(`Press [S] to study, paying ${goldNeededToLevel()}`)
        } else {
          t.print("You're ready to study here!")
          t.print(`But you need ${goldNeededToLevel()}! Come back when you've earned more.`)
        }
      } else {
        t.print("You don't have enough life experience to study here.")
        t.print("Come back when you've done more murder!")
      }
      t.print()
    }
    drawPopup(false,"HIT D TO","GO BACK", backToMain)
  }

  finishDraw()
}

function finishDraw() {
  //mouse Ui hacks
  if (isPressAnyKeyState()) {
    buttons.length = 0
    button(0,0,canvas.width,canvas.height,pressAnyKey)
  }
  saveMain() ///eek, calling save from draw()?! but it's ok.
}

function drawMedium(text, x, y) {
  ctx.font=largeFont
  ctx.textAlign="center"
  ctx.fillStyle="black"
  for (let xi = -1; xi <=1; xi++)
  {
    for (let yi = -1; yi <=1; yi++) 
    {
      ctx.fillText(text, x+xi*2, y+yi*2)
    }
  }
  ctx.fillStyle=getColors().textColor
  ctx.fillText(text, x, y)
}

function drawTitle(text, x, y) {
  ctx.font=headingFont
  ctx.textAlign="center"
  ctx.fillStyle="black"
  for (let xi = -1; xi <=1; xi++)
  {
    for (let yi = -1; yi <=1; yi++) 
    {
      ctx.fillText(text, x+xi*4, y+yi*4)
    }
  }
  ctx.fillStyle=getColors().textColor
  ctx.fillText(text, x, y)
}

function drawLadderPopups() {

  if (!state === states.main) return


  let already = false
  if (anyAtPos(laddersDown, playerPos)) {
    drawPopup(false,"HIT D TO","GO DOWN", down)
    already = true
  }
  if (anyAtPos(laddersUp, playerPos)) {
    drawPopup(already," HIT 'U'","TO GO UP",up)
    already = true
  }
}

function drawPopup(isTop,text1,text2, clickFunction)
{
  const popupWidth = 120
  const popupHeight = Math.floor(popupWidth*0.7)
  const x = col2X + 40
  const topPos = 20
  const bottomPos = viewSizeY - popupHeight - 20
  const y = isTop ? topPos : bottomPos

  const width = viewSize
  const height = viewSizeY

  ctx.fillStyle="black"
  ctx.fillRect(x,y,popupWidth, popupHeight)
  ctx.fillStyle = getColors().textColor
  ctx.font=mediumFont
  ctx.fillText(text1, x+20, y+35)
  ctx.fillText(text2, x+20, y+65)
  drawBorder(x, y, popupWidth, popupHeight)
  button(x,y,popupWidth,popupHeight,clickFunction,null,true)
}

function getSpellNotesTextTool() {
  const out = getMainWindowTextTool()
  //this is a bit hacky, it's already been drawn
  ctx.fillStyle = "black"
  ctx.fillRect(col1X, 0, viewSize+smallColWidth, viewSizeY)
  drawBorder(col1X, 0, viewSize+smallColWidth, viewSizeY)
  ctx.fillStyle=getColors().textColor
  out.x -= smallColWidth
  console.log('hi')
  return out
}

function getMainWindowTextTool() {
    ctx.fillStyle = "black"
    ctx.fillRect(col2X, 0, viewSize, viewSizeY)
    ctx.fillStyle=getColors().textColor
    let me = {}
    me.x = col2X + 20
    me.y = 40
    me.setFont = function(font) {
      ctx.font= font
      const fontSize = parseInt(font.substring(0, font.indexOf("px")))
      me.lineHeight = Math.floor(fontSize*fontLineHeightScale)
    }
    me.print = function (text) {
      if (text) {
        ctx.fillText(text, me.x, me.y)  
      }
      me.y += me.lineHeight
    }
    me.setFont(largeFont)
    return me
}

function drawSpellUi(x, y, width, height) {
  ctx.fillStyle = "black"
  ctx.fillRect(x,y,width,height)
  ctx.font=smallFont
  ctx.fillStyle=getColors().textColor
  let tX = x + 7
  let tY = y + 20
  const lineHeight = 16
  const costX = x + 164
  ctx.fillText("Spells", tX, tY); tY += lineHeight
  tY += lineHeight
  for (var i = 0; i < 10; i++) {
    if (playerStats.spellKnown[i]) {
      button(col1X, tY-lineHeight+4, smallColWidth, lineHeight, castSpell, i)
      ctx.fillText((i+1) + " " + spellNames[i].name, tX, tY);
      tY += lineHeight
    } else {
      ctx.fillText("  -------------", tX, tY); tY += lineHeight
    }
  }
  tY += lineHeight
  ctx.fillText("[1-9] Cast Spell", tX, tY); tY += lineHeight
  button(col1X, tY-lineHeight+4, smallColWidth, lineHeight, showSpellNotes)
  ctx.fillText("[S] Show spell notes", tX, tY); tY += lineHeight
}

const ladderIslandTop = -0.85
const ladderIslandLeft = -0.44
const ladderIslandScale = 2.3
const extraScale = 0.8
const ladderIslandLadderLeft = 0.07

const potIslandLeft = 0.03
const potIslandTop = 0
const potIslandScale = 0.8

function draw3D(viewX, viewY, viewSize, dir) {
  const viewSizeX = viewSize
  const viewSizeY = Math.floor(viewSize / 1.5)
  const viewXCentre = viewSizeX / 2
  const viewYCentre = viewSizeY / 2
  const depthFactor = 2

  //floor and ceiling

  const flipX = flipped ? -1 : 1
  if (flipped) {
    tCtx.scale(-1,1) 
  }
  tCtx.drawImage(spriteImage, 256*6, 512*tileSet, 512, 512, 0, 0, viewSizeX*flipX, viewSizeY)
  if (tileSet===0&&depth>0) {
    //hack to draw the floor on the ceiling in trash land
    tCtx.scale(1,-1)
    tCtx.drawImage(spriteImage, 256*6, 512*tileSet+256, 512, 256, 0, -0, viewSizeX*flipX, -viewSizeY/2) 
    tCtx.scale(1,-1)
  }
  if (flipped) {
    tCtx.scale(-1,1)
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
        //front
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
            let top = viewYCentre - eSize/2+eSize*(isHomeRow ? 0.4:0.2) + eSize*tileSetHeightAdjust()
            if (tileSet==1) {
              //island,ladder
              tCtx.drawImage(spriteImage, 256*2, 1*256, 255, 256, left+ladderIslandLeft*eSize, top+ladderIslandTop*eSize, eSize*ladderIslandScale*extraScale, eSize*ladderIslandScale*extraScale)
              tCtx.drawImage(spriteImage, 0, 6*256, 256, 256, left+ladderIslandLadderLeft*eSize, top, eSize*extraScale, eSize*extraScale)  
            } else {
              tCtx.drawImage(spriteImage, 0, 6*256, 256, 256, left, top, eSize, eSize)  
            }
            
          }
        }
        const e = enemies.find(e => e.x == cellPos.x && e.y == cellPos.y)
        if (e != undefined) {
          const et = enemyType[e.type]
          const eSize = viewSizeY/(Math.pow(depthFactor,i-0.4))
          const left = viewXCentre - eSize/2 + j*eSize
          const top = viewYCentre - eSize/2+eSize*0.2 + eSize*tileSetHeightAdjust()
          //draw island under some enemies
          if (tileSet==1 && et.special != undefined) {
            //island
            tCtx.drawImage(spriteImage, 256*2, 1*256, 255, 256, left, top, eSize, eSize) 
            tCtx.drawImage(spriteImage, 256*et.sprite+1, et.tileSet*256, 255, 256, left+potIslandLeft*eSize, top+potIslandTop*eSize, eSize*potIslandScale, eSize*potIslandScale)
          } else if (et.boss != undefined) {
            drawBoss(et.sprite, et.tileSet, left, top, eSize)
          } else {
            tCtx.drawImage(spriteImage, 256*et.sprite+1, et.tileSet*256, 255, 256, left, top, eSize, eSize)
          }
          if (e.hp <= 0) {
            tCtx.drawImage(spriteImage, 256*5, 1*256, 255, 256, left, top, eSize, eSize)
          }
        }
      } 
    }
  }
  ctx.drawImage(tempCanvas, 0, 0, viewSizeX, viewSizeY, viewX, viewY, viewSizeX, viewSizeY)
  drawBorder(viewX, viewY, viewSizeX, viewSizeY)
}

const waterHeightAdjust = -0.07
function tileSetHeightAdjust() {
  if (tileSet===1) return waterHeightAdjust
    return 0
}

function drawBorder(viewX, viewY, viewSizeX, viewSizeY) {
  ctx.strokeStyle = getColors().border
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
  tCtx.fillStyle = getColors().mapBack
  tCtx.fillRect(0, 0, mapSize*cellSize+viewSizeX, mapSize*cellSize+viewSizeY)
  for (let x = 0; x < mapSize; x++) {
    for (let y = 0; y < mapSize; y++) {
      const cell = cellAt(x, y)
      if (cell == 1) {
        drawCell(x, y)
      }
    }
  }
  const dir = playerPos.dir
  tCtx.drawImage(spriteImage, 10*dir.i, 2038, 10, 10, playerPos.x*cellSize, playerPos.y*cellSize, 10, 10)

  //centre map on player
  var cropX = playerPos.x * cellSize - viewSizeX / 2
  var cropY = playerPos.y * cellSize - viewSizeY / 2

  ctx.fillStyle = getColors().mapBack
  ctx.fillRect(viewX, viewY, viewSizeX, viewSizeY)
  ctx.drawImage(tempCanvas, cropX, cropY, viewSizeX, viewSizeY, viewX, viewY, viewSizeX, viewSizeY)

  ctx.strokeStyle = getColors().border
  ctx.lineWidth = 4
  ctx.strokeRect(viewX, viewY, viewSizeX, viewSizeY)
}


function drawCell(x, y) {
  const edgeLength = cellSize - 1
  tCtx.fillStyle = "black"
  tCtx.fillRect(x*cellSize+1,y*cellSize+1,cellSize-1,cellSize-1)
  tCtx.fillStyle = getColors().textColor
  if (cellAt(x-1, y) == 0) {
    tCtx.fillRect(x*cellSize,y*cellSize+1,1,edgeLength)
  }
  if (cellAt(x+1, y) == 0) {
    tCtx.fillRect((x+1)*cellSize,y*cellSize+1,1,edgeLength)
  }
  if (cellAt(x, y-1) == 0) {
    tCtx.fillRect(x*cellSize+1,y*cellSize,edgeLength,1)
  }
  if (cellAt(x, y+1) == 0) {
    tCtx.fillRect(x*cellSize+1,(y+1)*cellSize,edgeLength,1)
  }
  if (debug && anyAtPos(enemies, {x:x, y:y})) {
    tCtx.fillStyle = "red"
    tCtx.fillRect(x*cellSize+3, y*cellSize+3, cellSize - 4, cellSize - 4)
  }
  const posKey = x+y*mapSize
  if ((playerStats.knownPits[depth]&&playerStats.knownPits[depth][posKey]===1)
    || (debug && pits[posKey])) {
    drawCross(x,y)
  }
  if (anyAtPos(laddersUp, {x:x, y:y})) {
    if (depth == 0) {
      const ladderType = townLadderType({x:x, y:y})
      if (ladderType==0) tCtx.fillStyle = getColors().uniColor
      else tCtx.fillStyle = getColors().healer
    } else {
      tCtx.fillStyle = getColors().upLadder
    }
    tCtx.fillRect(x*cellSize+2, y*cellSize+2, cellSize - 3, cellSize - 3)    
  }
  if (anyAtPos(laddersDown, {x:x, y:y})) {
    tCtx.fillStyle = getColors().downLadder
    tCtx.fillRect(x*cellSize+2, y*cellSize+2, cellSize - 3, cellSize - 3)    
  }
}

function drawCross(x, y) {
  tCtx.fillStyle = "white"
  for (let i = 0; i < cellSize-3; i++) {
    tCtx.fillRect(x*cellSize+2+i, y*cellSize+1+i, 1, 1)  
    tCtx.fillRect(x*cellSize+2+i, y*cellSize+cellSize-i-2, 1, 1)  
  }
}

function cellAt(x, y) { //or {x,y} object
  //unpack object
  if (x.x != undefined) {
    y = x.y
    x = x.x
  }
  if (x >= 0 && x < mapSize && y >= 0 && y < mapSize) {
    return map[x][y]
  }
  return 0
}

function cellIsEmpty(pos) {
  return (cellAt(pos) != 0) 
    && (playerPos.x != pos.x || playerPos.y != pos.y) 
    && !anyAtPos(enemies, pos)
}

document.addEventListener("mousemove", mouseMove)

let soreWristMode=false
function s() {soreWristMode = true; console.log("clickless mode enabled")}
let swmSet = false
let oldMouseE = {}
let smeTimer = null

function mouseMove(e) {
  let [x,y] = getMousePos(e)

  if (soreWristMode && e.screenX != oldMouseE.screenX) {
    if (swmSet) {
      clearTimeout(smeTimer)
    }
    swmSet = true
    smeTimer = setTimeout(function () {
      console.log("click")
      const event = new MouseEvent("click", {screenX:oldMouseE.screenX, screenY:oldMouseE.screenY, clientX:oldMouseE.clientX, clientY:oldMouseE.clientY})
      canvas.dispatchEvent(event)
      swmSet=false
    }, 100)
    oldMouseE = e
  }

  let clickConsumed = false
  buttons.forEach(b => {
    if (!clickConsumed 
      && x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
      clickConsumed = true
      const ratio = canvas.clientWidth/canvas.width
      mouseBox.style.left = Math.floor(b.x*ratio+canvas.offsetLeft)+"px"
      mouseBox.style.top = Math.floor(b.y*ratio+canvas.offsetTop)+"px"
      mouseBox.style.width = Math.floor(b.width*ratio-2)+"px"
      mouseBox.style.height = Math.floor(b.height*ratio-2)+"px"
      mouseBox.classList.remove("hidden")
    }
  })
  if (!clickConsumed) {
    mouseBox.classList.add("hidden")
  }
}

function getMousePos(e) {
  const ratio = canvas.clientWidth/canvas.width
  //UI help: show people where to click to wait?
  var x = (e.pageX - canvas.offsetLeft) / ratio
  var y = (e.pageY - canvas.offsetTop)  / ratio 
  return [x, y]
}

function isPressAnyKeyState() {
  return pressAnyKeyStates.indexOf(state)>=0;
}

function pressAnyKey() {
  doKey(32) //enter
}

canvas.addEventListener("click", function (e) {
  if (frozen) return
  let [x,y] = getMousePos(e)
  //full screen press any key
  if (isPressAnyKeyState()) {
    doKey(32)//enter
    return
  }
  if (state===states.dead) {
    restartIfDead()
    return
  }
  let clickConsumed = false
  buttons.forEach(b => {
    if (debug) {
      ctx.strokeStyle = ["white","red","blue","green","orange","magenta","cyan","yellow"][trueRnd(8)]
      ctx.lineWidth=1
      ctx.strokeRect(b.x,b.y,b.width,b.height)
    }
    if (!clickConsumed 
      && x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
      b.callback(b.arg1)
      clickConsumed = true
    }
  })
  if (clickConsumed) {
    //update mouse hover with new button positions
    mouseMove(e)
  }
})

window.addEventListener("keyup", function (e) {
  if (frozen) return
  doKey(e.keyCode)
  mouseBox.classList.add("hidden")
})

function doKey(keyCode) {

  if (keyCode==67) {
    nextColorMode()
    return
  }

  if (menuState === menuStates.colorPicker) {
    doKeyColorPicker(keyCode)
    return
  }
  if (!loaded) return

  if (menuState === menuStates.start) {
    if (keyCode===32) {
      menuState = menuState.ok
      draw()
    }
    if (keyCode===82) {
      restart()
    }
    return
  }
  if (state === states.endChoice) {
    if (keyCode===82) {//r
      endRetire()
    }
    if (keyCode===68) { //d
      endContinue()
    }
    return
  }
  if (state === states.retireScreen) {
    if (keyCode===82) {//r
      endRestart()
    }
    return
  }
  if (state === states.spellNotes || state === states.newLevel) {
    state = states.main
    draw()
    return
  }
  if (state === states.falling) {
    changeLevelTo(depth + 1, true)
    while (cellAt(playerPos)===0) {
      changeLevelTo(depth + 1, true)
    }
    //we loaded those in quick loading mode (no sprites or audio), so reload the level for real
    state = states.main
    changeLevelTo(depth)
  }
  if (state === states.healer) {
    switch (keyCode) {
      case 68: //down
        backToMain()
        break
      case 49: //1 -> buy 10
        buyHealing(10)
        break
      case 50: //2 -> buy 50
        buyHealing(50)
        break
    }
    return
  }
  if (state === states.university) {
    switch (keyCode) {
      case 68: //down
        backToMain()
        break
      case 83: //s
        buyLevelUp()
        break
    }
    return
  }
  if (state === states.foundSomething) {
    state = states.main
    cleanDeadEnemies()
    if (playerStats.surprise.length ==0) {
      playerCombatMessage.push("nothing!")
    }
    for(let i = 0; i < playerCombatMessage.length; i++) {
      playerCombatMessage[i] = playerCombatMessage[i].replace("(PRESS ANY KEY)", "")
    }
    for(let thing of playerStats.surprise) {
      if (thing.type==="boss") {
        switch (thing.bossId) {
          case 0: playerCombatMessage.push("A Fountain Pen of Luck! +10 Luc")
          playerStats.luck += 10
          break
          case 1: playerCombatMessage.push("A Mobile Phone of Speed! +12 Spd")
          playerStats.speed += 12
          break
          case 2: playerCombatMessage.push("A Poison of Intelligence! +15 Int")
          playerStats.int += 15
          deriveMaxHpAndSp()
          break
          case 3: playerCombatMessage.push("Boots of Endurance! +20 End")
          playerStats.end += 20
          deriveMaxHpAndSp()
          break
        }
        //killed final boss, change state but AFTER screen redraw
        if (!playerStats.bossesKilled.some(x=>x===false)) {
          endState="showMessage"
        }
      }
      if (thing.type==="spell") {
        var spellToGet = playerStats.spellKnown.indexOf(false)
        console.log(spellToGet)
        if (spellToGet >= 0) {
          playerCombatMessage.push("A spell: " + spellNames[spellToGet].name + "!")
          playerStats.spellKnown[spellToGet] = true
        } else {
          playerCombatMessage.push("A spell, but you already knew it.")  
        }
      }
      if (thing.type==="sp") {
        playerCombatMessage.push("A shimmering ball of thought...")
        playerCombatMessage.push("You touch it, and gain 1 spell point!")
        playerStats.sp++
        deriveMaxHpAndSp()
      }
      if (thing.type==="hp") {
        const amount = trueRnd(9)+1
        playerCombatMessage.push("A wedge of muscle cheese...")
        playerCombatMessage.push(`You chew it, gaining ${amount} health points.`)
        playerStats.hp += amount
        deriveMaxHpAndSp()
      }
      if (thing.type==="gold") {
        playerCombatMessage.push(thing.amount + " gold coins!")
        playerStats.gold += thing.amount
      }
    }
    playerStats.surprise.length=0
    draw()
    return
  }
  switch (keyCode) {
    case 37: //left
    //case 65: //a
      turnLeft()
      break
    case 38: //up
    case 88: //x
     forward()
      break
    case 39: //right
    //case 68: //d
      turnRight()
      break
    case 40: turnBack()
      break
    case 32: wait()
      break
    case 68: down()
      break
    case 85: up()
      break
    case 82: //r
      restartIfDead()
      break
    case 83: //s
        showSpellNotes()
        break
    case 77: showMap()
      break
    case 49: castTransmission(); break //1
    case 50: castWaves(); break //2
    case 51: castRitual(); break //3
    case 52: castWhatDo(); break //4
    case 53: castSeeThings(); break //5
    case 54: castHeartbeat(); break //6
    case 55: castOuroboros(); break //6
    case 56: castExtinction(); break //8
    case 57: castDeception(); break //9
    case 48: castProblems(); break//0

  }
}

function backToMain() {
  //if we are in a state that can return to main
  if (state===states.healer||state===states.university) {
    state = states.main
    draw()
  }
}

const spellFunctionsAsList = [castTransmission, castWaves, castRitual, castWhatDo, castSeeThings, 
  castHeartbeat, castOuroboros, castExtinction, castDeception, castProblems]

function castSpell(i) {
  spellFunctionsAsList[i]()
}

function showSpellNotes() {
  if (!inGame()) return
  state = states.spellNotes
  draw()  
}

function cheatToBoss() {
  let nextBossLevel = 2+playerStats.bossesKilled.indexOf(false)*3
  changeLevelTo(nextBossLevel)
  const boss = enemies.find(x=>getType(x).boss != undefined)
  playerPos.x = boss.x + 1
  playerPos.y = boss.y
  cheat()
}

function cheatLastBoss() {
  playerStats.bossesKilled[1]=true
  playerStats.bossesKilled[2]=true
  playerStats.bossesKilled[3]=true
  cheatToBoss()
}

function cheat() {
  playerStats.end = 99999
  playerStats.hp = 99999999
  playerStats.strength = 9999
  playerStats.mp = 9999
  draw()
}

function cheat2() {
  tileSet=1
  changeLevelTo(4)
  playerPos.y -= 3
  laddersDown[0].x = playerPos.x - 2
  laddersDown[0].y = playerPos.y
  playerPos.dir = dirs.left
  map[playerPos.x-1][playerPos.y-1]=0
  cheat()
}

function cheatSpells() {
  playerStats.int=50
  playerStats.sp = 50
  playerStats.maxSp = 50
  playerStats.spellKnown=[true,true,true,true,true,true,true,true,true,true]
  draw()
}

function getPlayerTarget() {
  return findAtPos(enemies, move(playerPos, playerPos.dir))
}

function castProblems() {
  if (!inGame()) return
  clearMessages()
  const e = getPlayerTarget()
  if (e == undefined) {
    playerCombatMessage.push("That spell requires a target")
  } else if (trySpendSp(10)) {
    hitMonster(1000, e, "You command it to die")
    playerStats.hp = Math.ceil(playerStats.hp/2)
    monsterCombatTurn()
    draw()
  }
  draw()
}

function castDeception() {
  if (!inGame()) return
  clearMessages()
  let wall = move(playerPos, playerPos.dir)
  if (cellAt(wall)!=0) {
    playerCombatMessage.push("That spell must be cast on a wall")
  } else {
    let dist = 0
    while (dist < 15 && isValidPos(wall) && cellAt(wall)==0) {
      console.log(wall.x+":"+wall.y)
      wall = move(wall, playerPos.dir)
      dist++
    }
    if (!isValidPos(wall) || cellAt(wall)==0) {
      playerCombatMessage.push("The wall is too thick.")
    } else if (trySpendSp(9)) {
      playerCombatMessage.push("Wall? What wall?")
      playerCombatMessage.push("You step through.")
      playerPos.x = wall.x
      playerPos.y = wall.y
    }
  }
  draw()
}

function castExtinction() {
  if (!inGame()) return
  clearMessages()
  const e = getPlayerTarget()
  if (e == undefined) {
    playerCombatMessage.push("That spell requires a target")
  } else if (getType(e).boss != undefined || playerStats.extinctions.indexOf(e.type)>=0) {
    showSpecialMessage(2000)
  } else if (trySpendSp(8)) {
    playerStats.burnedSp += 8
    deriveMaxHpAndSp()
    playerStats.extinctions.push(e.type)
    enemies.forEach(m => {if (m.type===e.type&&m!=e) {m.hp=0}})
    playerCombatMessage.push("You say the forbidden words")
    playerCombatMessage.push("And this " + getType(e).name)
    playerCombatMessage.push("becomes the last of its kind")
    monsterCombatTurn()
  }
  draw()
}

function castOuroboros() {
  if (!inGame()) return
  clearMessages()
  if (trySpendSp(7)) {
    addEffect(2, 20)
    playerCombatMessage.push(`You call forth Ouroboros, World`)
    playerCombatMessage.push(`Ender. It is a lovely sword, sharp`)
    playerCombatMessage.push(`and pretty.`)
    monsterCombatTurn()
    draw()
  }
}

function castHeartbeat() {
  if (!inGame()) return
  clearMessages()
  if (trySpendSp(6)) {
    addEffect(0, 3*playerStats.int)
    playerCombatMessage.push(`You feel your heart pumping`)
    playerCombatMessage.push(`with healing power`)
    monsterCombatTurn()
    draw()
  }
}

function addEffect(n, amount) {
  if (playerStats.effects[n]===undefined) playerStats.effects[n] = 0
  playerStats.effects[n] += amount
}

function castSeeThings() {
  if (!inGame()) return
  clearMessages()
  if (trySpendSp(5)) {
    playerCombatMessage.push(`What if we are all monsters?`)
    playerCombatMessage.push(`You pretend to fit in.`)
    addEffect(1, 15)
    monsterCombatTurn()
    draw()
  }
}

function castWhatDo() {
  if (!inGame()) return
  clearMessages()
  if (trySpendSp(4)) {
    const pos = {x:-1,y:-1}
    const e = getPlayerTarget()
    const boss = enemies.find(x=>getType(x).boss != undefined)
    const startDist = boss != undefined ? distanceFromTo(playerPos, boss) : undefined
    let dist = 0
    while (!cellIsEmpty(pos) || (boss != undefined && dist > 4 + startDist/2)) {
      pos.x = trueRnd(mapSize)
      pos.y = trueRnd(mapSize)
      dist = boss != undefined ? distanceFromTo(pos, boss) : undefined
    }
    if (e) {
      e.x = pos.x
      e.y = pos.y
      playerCombatMessage.push(`Your enemy forgets where it was.`)
    } else {
      playerPos.x = pos.x
      playerPos.y = pos.y
      if (boss != undefined) {
        playerCombatMessage.push(`You forget where you are, and feel`)
        playerCombatMessage.push(`a cold voice pulling you closer.`)
        console.log(`old dist ${startDist}, new dist ${dist}`)
      } else {
        playerCombatMessage.push(`You forget where you are,`)
        playerCombatMessage.push(`and you are somewhere else.`)
      }
    }

    monsterCombatTurn()
    draw()
  }
}

function castRitual() {
  if (!inGame()) return
  clearMessages()
  if (trySpendSp(3)) {
    const amount = trueRnd(playerStats.int*3) + 1
    playerStats.hp = Math.min(playerStats.hp + amount, playerStats.maxHp)
    playerCombatMessage.push(`The ritual heals ${amount} health points.`)
    monsterCombatTurn()
    draw()
  }
}

function castWaves() {
  if (!inGame()) return
  clearMessages()
  const e = getPlayerTarget()
  if (e == undefined) {
    playerCombatMessage.push("That spell requires a target")
    draw()
  } else if (trySpendSp(2)) {
    hitMonster(30, e, "You emit waves of energy!")
    monsterCombatTurn()
    draw()
  }
}

function castTransmission() {
  if (!inGame()) return
  clearMessages()
  if (trySpendSp(1)) {
    const areAllDead = !playerStats.bossesKilled.some(x => x === false)
    if (areAllDead) {
      playerCombatMessage.push("No signal. You killed them all!")
    } else {
      const bossN = playerStats.bossesKilled.indexOf(false)
      const dist = (bossN+1)*levelsPerTileset - 1 - depth
      if (dist==0) {
        playerCombatMessage.push("You hear the Shadow Guardian's mind!")
        const boss = enemies.find(x=>getType(x).boss != undefined)
        const txt = bossPointText(boss.x - playerPos.x, boss.y - playerPos.y)
        playerCombatMessage.push(`It is on this level! ${txt}!`)
      } else {
        playerCombatMessage.push("You hear the Shadow Guardian's mind!")
        playerCombatMessage.push(`It is ${bossDistText(dist)}!`)
      }
    }
    monsterCombatTurn()
    draw()
  }
}

function bossPointText(xD, yD) {
  const compass = ["West", "North West", "North", "North East", "East", "East", "South East", "South", "South West"]
  const rad = Math.atan2(yD, xD);
  const deg = rad * (180 / Math.PI) + 180 //left is zero, goes clockwise
  return compass[Math.floor((deg+22.5)/45)]
}

function isBossLevel(n) {
  return (n%3==2)
}

function bossDistText(n) {
  const s = plural(n)
  const amount = Math.abs(n)
  const dir = (n > 0) ? "below" : "above"
  return amount + " level" + s + " " + dir 
}

function plural(n) {
  return (n == 1 || n == -1) ? "" : "s"
}

function trySpendSp(n) {
  if (!playerStats.spellKnown[n-1]) {
    playerCombatMessage.push("You don't know that spell yet!")
    draw()
    return false
  }
  if (playerStats.sp < n) {
    playerCombatMessage.push("You need more Spell Points for that")
    draw()
    return false
  }
  playerStats.sp -= n
  return true
}

function restartIfDead() {
  if (state !== states.dead) return
  menuState = menuStates.start
  restart()
}

function endRestart() {
  menuState = menuStates.start
  restart()
}

function townLadderType(pos) {
  if ((pos.x/2 + pos.y/2) % 2 == 0) {
    return 0
  }
  return 1
}

function up() {
  if (!inGame()) return
  clearMessages()

  const ladder = findAtPos(laddersUp, playerPos)
  if (ladder == undefined) return
  if (depth == 0) {
    const ladderType = townLadderType(playerPos)
    state = ladderType == 0 ? states.university : states.healer
    townMessage.length = 0
    draw()
  } else {
    changeLevelTo(depth-1)
  }
}

function down() {
  if (!inGame()) return
  clearMessages()

  const ladder = findAtPos(laddersDown, playerPos)
  if (ladder == undefined) return
  changeLevelTo(depth+1)
}

function changeLevelTo(newLevel, isFalling)
{
  if (depth != -1) {
    storedEnemies[depth] = enemies
    enemies = []
  }
  saveWorld()
  depth = newLevel
  console.log("now on level " + depth)
  tileSet = Math.floor(depth / levelsPerTileset) % tileSetCount
  makeMap()

  if (!isFalling) {
    playAudio()
    //sneaky: preload the audio for the level below!
    const preLoadTileSet = Math.floor((depth+1) / levelsPerTileset) % tileSetCount
    loadAudio(preLoadTileSet)
    if (playerStats.levelsVisited.indexOf(newLevel)==-1) {
      playerStats.levelsVisited.push(newLevel)
      firstTimeOnLevel(newLevel)
    }
    if(depth==0 && endState === "hasFlower") {
      endState = "shouldSpawn"
      saveSomeone()
      showEndChoice()
      endRuns++
    }
  }
  //hack to move player before first draw on new game
  if (playerPos.x === -1) {
    let pos = {x:Math.floor(mapSize/2),y:Math.floor(mapSize/2)}
    while (!cellIsEmpty(pos)) {
      pos = move(pos, pickRandom(dirsList))
    }
    playerPos.x = pos.x
    playerPos.y = pos.y
    //face away from walls
    while (cellAt(move(playerPos, playerPos.dir))===0) playerPos.dir = playerPos.dir.cw
  }
  if (!isFalling) draw()
}

function showSpecialMessage(n) {
  if (state !== states.main) {
    console.log("Warning: showing a message from weird state " + state + ", message is " + floorMsg[n][0] + "...")
  }  
  state = states.newLevel
  newLevelMsg = n
}

function showEndChoice() {
  state = states.endChoice
  newLevelMsg = 1002
  stopAudio()
}

function firstTimeOnLevel() {
  if (floorMsg[depth] != undefined) {
    showSpecialMessage(depth)
  }
}

function loadAudio(tileSet) {
  if (audios[tileSet]===undefined) {
    audios[tileSet] = new Audio((tileSet % audioCount) + '.ogg');
    audios[tileSet].loop = true
    audios[tileSet].volume = 0.2;
  }  
}

function stopAudio() {
  console.log("stop")
  if (currentAudio != undefined) {
    audios[currentAudio].pause()
    audios[currentAudio].currentTime = 0;
  }
  currentAudio = undefined  
}

function playAudio() {
  console.log("play")
  if (currentAudio==tileSet) return
  if (currentAudio != undefined) {
    audios[currentAudio].pause()
    audios[currentAudio].currentTime = 0;
  }
  loadAudio(tileSet)
  audios[tileSet].play()
  currentAudio = tileSet
}

const waitMessages=["You wait.","You pause.", "You hesitate.", "You think.", "You stand there.", "You sit tight.", "You stand ready."]
function wait() {
  if (!inGame()) return
  clearMessages()
  playerCombatMessage.push(pickRandom(waitMessages))
  timePasses()
}

function pickRandom(list) {
  return list[rnd(list.length)]
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
    const posKey = playerPos.x+playerPos.y*mapSize
    if (pits[posKey]) {
      if (playerStats.knownPits[depth]===undefined) playerStats.knownPits[depth]={}
      playerStats.knownPits[depth][posKey]=1
      state = states.falling
      draw()
    } else {
      timePasses()  
    }
  }
}

function clearMessages() {
  enemyCombatMessage.length = 0
  playerCombatMessage.length = 0
  townMessage.length = 0 //for completeness, not actually needed except maybe on save\load
  cleanDeadEnemies()
}

function fight(e) {
  if (!inGame()) return
  clearMessages()
  playerAttack(e)
  monsterCombatTurn()
  draw()
}

function playerMoveTime() {
  return 100/playerStats.speed
}

function monsterCombatTurn() {
  const time = playerMoveTime()
  for(let dir of dirsList) {
    const newPos = move(playerPos, dir)
    const e = findAtPos(enemies, newPos)
    if (e) passTimeForEnemy(time, e)
  }
}

function playerAttack(e) {
  const attackRoll = rnd(80) + playerStats.level * 2 
  + playerStats.strength * 2 + playerStats.luck //+ weapon hit bonus + prep and permanent weapon enchants
  const defenceRoll = 40 + e.level * 2 + e.defence + e.speed
  const result = attackRoll - defenceRoll
  let damage = 0
  if (result > 0) {
    times(Math.floor(result/40)+1, () => damage += playerDamageRoll())
    //bonus damage
    damage += rnd(Math.floor(playerStats.strength / 3)) + rnd(playerStats.level)
  }

  if (damage > 0) {
    hitMonster(damage, e)
  } else {
    playerCombatMessage.push("You missed!")
  }
}

function monsterAttack(e) {
  console.log(maxEnemyDamage(e))
  if (e.hp <= 0) return
  const et = getType(e)
  const attackRoll = trueRnd(80) + 20 + e.level * 2 
  //protection spells, body armour, armour enchantment
  const result = attackRoll - playerDefenceRoll()
  let damage = 0
  if (result > 0) {
    damage++ //at least 1 damage!
    times(Math.floor(result/40)+1, () => damage += trueRnd(e.power))
    //add bonus damage
    //no, it's already super hard - if (depth > playerStats.level) damage += trueRnd(depth-playerStats.level)
  }
  //auto hit for 1 point, sometimes (no idea why, it's from moraffs...)
  if (trueRnd(500)<depth*2) { //in moraff's, it's just depth
    damage++
  }
  //25% chance of replacing all calculations with a standard hit (moraff's, IDK why)
  //means monsters hit at least 25% of the time?
  if (trueRnd(100)<25) {
    console.log("(standardized hit)")
    damage = standardHitDamage()
  } else {
    console.log("(normal hit)")
  }

  if (damage > 0) {
    if (et.special != undefined) {
      specialHitEffect(et.special)
      e.hp = 0
      //FIXME: this should go to a 'press any key' state that makes the enemy disappear
    } else {
      damage = applyPlayerDamageReduction(damage)
      hitPlayer(damage)
      enemyCombatMessage.push("The " + getType(e).name + " deals " + damage + " damage")
    }
  } else {
    enemyCombatMessage.push("The " + getType(e).name + " missed!")
  }
}

function playerDefenceRoll() {
  return 32 + playerStats.level * 2 + playerStats.speed * 3/2 + playerStats.luck
}

function standardHitDamage() {
  return Math.floor(3+(depth/2)) //same as moraff's
}

function applyPlayerDamageReduction(damage) {
  let result = Math.floor(Math.max(1, (damage*(50+Math.max(1, 100-playerStats.end)))/150))
  if (playerStats.level <= 2 && result > 10) {
    result = Math.floor(result/2)
  }
  return result
}

//must be kept in sync with code above... need a better way to do this
function maxEnemyDamage(e) {
  if (getType(e).special) return 0
  const attackRoll = 80 + 20 + e.level * 2
  const result = attackRoll - playerDefenceRoll()
  let damage = 2
  times(Math.floor(result/40)+1, () => damage += e.power-1)
  //no it was too hard - if (depth > playerStats.level) damage += (depth-playerStats.level)
  return Math.max(damage, standardHitDamage())
}

function hitMonster(damage, e, text)
{
  if (getType(e).isItem) {
    hitItem(e)
    return
  }
  e.hp -= damage
  if (e.hp > 0) {
    playerCombatMessage.push(text == undefined ? "You hit the monster!" : text)
    playerCombatMessage.push("It takes " + damage + " points of damage!")
  } else {
    playerStats.exp += e.exp
    playerStats.kills++
    state = states.foundSomething
    const bossId = getType(e).boss
    if (bossId != undefined) {
      playerStats.bossesKilled[bossId] = true
      playerStats.surprise.push({type:"boss", bossId:bossId})
      playerStats.surprise.push({type:"gold", amount:e.gold}) //bosses always give gold
      playerCombatMessage.push("The mighty Shadow Guardian is dead!")
      playerCombatMessage.push("You take its treasure... (PRESS ANY KEY)")
    } else {
      playerCombatMessage.push("You killed it!")
      playerCombatMessage.push("You found... (PRESS ANY KEY)")
      if (playerStats.kills / 10 > playerStats.spellKnown.filter(i => i === true).length && rnd(100) < 15) {
        playerStats.surprise.push({type:"spell"})
      } else if (e.gold > 0 && playerStats.lootTimer.pop()===1) {
        playerStats.surprise.push({type:"gold", amount:e.gold})
      } else if (rnd(100) < 7) {
        playerStats.surprise.push({type:"sp"})
      } else if (rnd(100) < 7) {
        playerStats.surprise.push({type:"hp"})
      }
      if (playerStats.lootTimer.length===0) playerStats.lootTimer = makeLootArray();
    }
  }
}

//hack for final flower
function hitItem(e) {
  e.hp=0
  //teleport away so you can' see its dead body
  e.x = -1
  endState = "hasFlower"
  showSpecialMessage(1001)
}

function cleanDeadEnemies() {
  for (let i = 0; i < enemies.length; i++) {
    if (enemies[i].hp <= 0) {
      enemies.splice(i, 1)
      i--
    }
  }
}

function playerDamageRoll() {
  let amount = trueRnd(6)
  if (playerStats.effects[2] > 0) {
    amount += 5
  }
  return amount
}

function effectExpired(i) {
  playerCombatMessage.push(effectNames[i] + " expired")
}

function effectTicked(i) {
  if (i===0) {
    playerStats.hp++
    deriveMaxHpAndSp()
  }
}

function timePasses()
{
  for(let i = 0; i < playerStats.effects.length; i++) {
    if (playerStats.effects[i]>0) {
      playerStats.effects[i]--
      if (playerStats.effects[i]==0) {
        effectExpired(i)
      } else {
        effectTicked(i)
      }
    }
  }
  let amount = playerMoveTime()
  if (playerStats.effects[1] > 0) {
    amount = 0 //we are disguised, which actually freezes enemies
  }
  for (let e of enemies) {
    passTimeForEnemy(amount, e)
  }
  checkEndState()
  draw()
}

function checkEndState() {
  if (endState == "shouldSpawn" && isLastLevel()) {
    endState = "flowerHunt"
    makeEnemy(bossEnemyStartCount+tileSetCount)
  }
  if (endState === "showMessage") {
    showSpecialMessage(1000)
    endState = "shouldSpawn"
    return
  }
}

function passTimeForEnemy(amount, e)
{
  if (getType(e).isItem) return
  if (e.timer == undefined) e.timer = 0
    e.timer += amount
    const et = getType(e)
    while (e.timer > 100/et.speed) {
      e.timer -= 100/et.speed
      moveEnemy(e)
  }
}

function getType(e) {
  return enemyType[e.type]
}


function moveEnemy(e) {
  const moves = []
  
  const dist = distanceFromTo(e, playerPos)

  if (dist > 10) return //distant enemies just stand there

  if (dist == 1) {
    //enemy attack
    monsterAttack(e)
    return
  }

  for(let dir of dirsList) {
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
  if (width < 1) return
  const img = spriteImage
  const h = 255
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
    try {
      ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
    } catch (e) {
      console.log("bad: " + sWidth+":"+ sHeight+":"+ dx+":"+ dy+":"+ dWidth+":"+ dHeight)
    }
    
  }
}

function expNeeded(levelOrBlank)
{
  const level = levelOrBlank == undefined ? playerStats.level : levelOrBlank
  return 125*(Math.pow(2, level - 1))
}

function canLevelUp() {
  return playerStats.exp >= expNeeded()
}

function howManyLevelsCanIGet() {
  let temp = playerStats.exp
  let n = 0
  let level = playerStats.level
  while (expNeeded(level) <= temp) {
    temp -= expNeeded(level)
    level++
    n++
  }
  return n
}

function buyLevelUp() {
  if (!canLevelUp()) return
  if (playerStats.gold < goldNeededToLevel()) return
  playerStats.gold -= goldNeededToLevel()
  while (playerStats.exp >= expNeeded()) {
    playerStats.exp -= expNeeded()
    playerStats.level++
  }
  deriveMaxHpAndSp()
  playerStats.hp = playerStats.maxHp
  playerStats.sp = playerStats.maxSp
  playerStats.age += 3
  townMessage.length = 0
  townMessage.push("You study for three years.")
  townMessage.push(`You are now level ${playerStats.level}. You are ${playerStats.age} years old.`)
  //enemies moved around while you were away
  enemies.forEach(function(e) {
    const newPos = randomEmptyCell()
    e.x = newPos.x
    e.y = newPos.y
  })
  draw()
}

function buyHealing(n) {
  townMessage.length = 0
  const cost = healCost(n)
  if (playerStats.gold < cost) {
    townMessage.push("You can't afford that!")
    townMessage.push("I don't work for free! (You shouldn't either.)")
  } else {
    playerStats.gold -= cost
    playerStats.hp += n
    if (playerStats.hp > playerStats.maxHp) playerStats.hp = playerStats.maxHp
    townMessage.push("> You feel better after your session.")
    townMessage.push("") //to align the text the same amount
  }
  draw()
}

function goldNeededToLevel() {
  return Math.floor(expNeeded() / 5)
}

function hitPlayer(amount)
{
  playerStats.hp -= amount
  if (playerStats.hp <= 0) {
    state = states.dead
  }
}

function healCost(amount) {
  if (amount > 40) amount *= 0.8 //20% bulk discount
  return Math.floor(playerStats.level*2 + amount * 2)
}

function specialHitEffect(effect) {
  switch (effect) {
    case 1: playerStats.speed++
    enemyCombatMessage.push("Speed raised by potion!")
    break
    case 2: playerStats.strength++
    enemyCombatMessage.push("Strength raised by potion!")
    break
    case 3: playerStats.Luck++
    enemyCombatMessage.push("Luck raised by potion!")
    break
    case 4: playerStats.int++
    deriveMaxHpAndSp()
    enemyCombatMessage.push("Intelligence raised by potion!")
    break
    case 5: playerStats.end++
    deriveMaxHpAndSp()
    enemyCombatMessage.push("Endurance raised by potion!")
    break
    case 0: playerStats.speed--
    enemyCombatMessage.push("Speed lowered by potion!")
    break
    case 6: playerStats.strength--
    enemyCombatMessage.push("Strength lowered by potion!")
    break
    case 7: playerStats.Luck--
    enemyCombatMessage.push("Luck lowered by potion!")
    break
    case 8: playerStats.int--
    deriveMaxHpAndSp()
    enemyCombatMessage.push("Intelligence lowered by potion!")
    break
    case 9: playerStats.end--
    deriveMaxHpAndSp()
    enemyCombatMessage.push("Endurance lowered by potion!")
    break
  } 
}

function drawBoss(sX, sY, left, top, size) {
  const img = spriteImage
  const h = 256
  const w = 255
  const numSlices = size
  const widthScale = size / w

  // The width of each source slice.
  const sliceWidth = w / numSlices

  for(var n = 0; n < numSlices; n++) {
    var sx = sX*256 + sliceWidth * n,
        sy = sY*256,
        sWidth = sliceWidth,
        sHeight = h;

    const progress = n / numSlices
    var dx = left + (sliceWidth * n * widthScale)
    var dWidth = sliceWidth * widthScale
    var dHeight = size + ((n % 2 == 0) ? 5 : -5)
    var dy = top
    tCtx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
  }
}

const cga1 = "#FF6666"
const cga2 = "#6666FF"

const colorModes = []
let colorMode = 0

//healer is green, uni is blue
//mapback is reused for dull text
//                                             text,   map back, borders,   upLadder, downLadder, healer,   uniColor
addColorMode("CGA", "-cga", "    4",             "white", cga2,    cga1,      cga2,     cga1,       cga2,     cga2)
addColorMode("High-Res EGA", "-ega", "   16",    "white","#666666", "#000099","#999999","#666666",  "#009900", "#66FFFF")
addColorMode("High-Res EGA with Classic Moraff Palette", "-moraff", "   16")
addColorMode("High-Res VGA, requires 512k RAM", "", "  256")
addColorMode("Super High Quality, requires 2 meg RAM", "-svga", "65,536")


function addColorMode(name, fileName, colors, textColor, mapBack, border, upLadder, downLadder, healer, uniColor) {
  var colorMode = {name:name, fileName:fileName, colors:colors, res:"1024 x 768",
  textColor:textColor, mapBack:mapBack, border:border, 
  upLadder:upLadder, downLadder:downLadder, healer:healer, uniColor:uniColor}
  if (textColor==undefined) colorMode.textColor="white"
  if (mapBack==undefined) colorMode.mapBack="grey"
  if (border==undefined) colorMode.border="darkblue"
  if (upLadder==undefined) colorMode.upLadder="#E0E0E0"
  if (downLadder==undefined) colorMode.downLadder="grey"
  if (healer==undefined) colorMode.healer="lightgreen"
  if (uniColor==undefined) colorMode.uniColor="lightblue" 
  colorModes.push(colorMode)
}

function getColors() {
  return colorModes[colorMode]
}

const mfYellow = "#FFAA01"
const mfOrange = "#FF5500"
const mBlue = "#00AAFF"
function showColorPicker() {
  menuState = menuStates.colorPicker
  ctx.fillStyle = "black"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle=mfYellow
  ctx.font
  const me = {}
  ctx.font=mediumFont
  me.lineHeight = 21
  me.x = 8
  me.y = me.lineHeight + 4
  function print(text, lineBreak, xOff) {
    if (text) {
      ctx.fillText(text, me.x + (xOff ? xOff : 0), me.y)
    }
    if (lineBreak !== false) me.y += me.lineHeight
  }

  const pipeLineHeight = me.lineHeight*2 //firefox: subtract 1
  const pipeWidth = 19.5
  function drawPipes(text) {
    let n = 0
    for (let i of text) {
      ctx.fillText(i, me.x+pipeWidth*n,pipeY)
      n++
    }
    pipeY+= pipeLineHeight
  }

  print("This Mattheware Game Can Be Played In " + colorModes.length + " Different Video Modes:")
  print()
  let pipeY = me.y
  drawPipes("  ╔═══════╦════╦════════════════════════╗")
  drawPipes("╔═╬═══════╬════╬════════════════════════╣")
  for(let i = 0; i < Math.floor(colorModes.length/2); i++) {
    drawPipes("║ ║       ║    ║                        ║")
  }
  drawPipes("╚═╩═══════╩════╩════════════════════════╝")
  print()
  print("      RESOLUTION    COLORS   DESCRIPTION, REQUIREMENTS")
  print()
  for(var i = 0; i < colorModes.length; i++) {
    button(0, me.y-me.lineHeight, canvas.width, me.lineHeight, setColorMode, i)
    print("  "+(i+1) + ") ", false)
    ctx.fillStyle=mfOrange
    print(colorModes[i].res, false, 70)
    ctx.textAlign = "right"
    print(colorModes[i].colors, false, 290)
    ctx.textAlign = "left"
    print(colorModes[i].name, false, 330)
    ctx.fillStyle=mfYellow
    print()
  }
  print()
  ctx.fillStyle = mBlue
  print("Select Video Mode You Want by Entering One of the Above Values:")
  print()
  print("(Press C At Any Time To Change Video Mode In-Game. This Requires A Good Graphics Adapter!)")
  times(16, print)
  ctx.fillStyle=mfOrange
  print("Credits:")
  print("Art - Sergio Cornaga")
  print("Code - Matthew Gatland")  
  print("Music - Chimeratio")
  print()
  print("Fonts: Dysin4mation and Wizard's Manse by Anna Anthropy")
}

function doKeyColorPicker(keyCode) {
 const mode = keyCode - 49
 if (mode >= 0 && mode < colorModes.length) {
  setColorMode(mode)
 }
}

function setColorMode(mode) {
  loaded = false
  spriteImage.src =  'sprites' + colorModes[mode].fileName + '.png'
  colorMode = mode
  if (menuState === menuStates.colorPicker) {
    buttons.length=0 //hack to disable mouse buttons because, unlike all other buttons,
    //the color picker screen doesn't immediately update - 
    //nothing changes until the file downloads
  }

}

function nextColorMode() {
  setColorMode((colorMode+1)%colorModes.length)
}

//https://gist.github.com/blixt/f17b47c62508be59987b
function Random(seed) {
  this._seed = seed % 2147483647;
  if (this._seed <= 0) this._seed += 2147483646;
}
Random.prototype.next = function () {
  return this._seed = this._seed * 16807 % 2147483647;
};
Random.prototype.nextFloat = function (opt_minOrMax, opt_max) {
  // We know that result of next() will be 1 to 2147483646 (inclusive).
  return (this.next() - 1) / 2147483646;
};

const floorMsg = []
function addFloorMsg(n, list) {
    floorMsg[n]=list.replace(/\^/g, '    ').split("|")
}
//test with: showSpecialMessage(n); draw()
addFloorMsg(1, `A Little Snake Says:|^"Such a Shame You|Had to Leave Home! |There might be a way|to Get Back... But You|Don't Look Tough|Enough!"`)
addFloorMsg(2, `A Note:|^"Find Me On This|Level! I Have a Crush|on You! Or, Will I|Crush You? Puns Aside,|You Are Doomed."|- The Shadow Guardian`)

addFloorMsg(3, `A Little Snake Says:|^"If You Had Your|Own Oxygen Generator,|You Would Be Allowed|Back Into The Citidel!|I Know Where One Is."`)
addFloorMsg(4, `A Little Snake Says:|^"The Four Shadow|Guardians Protect An|Oxygen Generator! If|You Kill Them All, You|Can Claim It!"`)
addFloorMsg(5, `A Little Snake Says:|^"A Shadow Guardian|Dwells On This Level!|Hunting Them Is Your|Ticket Out Of Here!|But Be Careful!"`)

addFloorMsg(8, `A Little Snake Says:|^"A Shadow Guardian|Dwells On This Level!|Hunting Them Is Your|Ticket Out Of Here!|But Be Careful!"`)//repeats

addFloorMsg(11, `A Little Snake Says:|^"A Shadow Guardian|Dwells On This Level!|Hunting Them Is Your|Ticket Out Of Here!|But Be Careful!"`)//repeats
//special
addFloorMsg(1000, `"You killed us all...|Now our shadow magic|is gone. Anyone can find|and steal our Oxygen|Generator from the|lowest level of the|dungeon.\"`)
addFloorMsg(1001, `The Oxygen Generator|Is Yours! Now Your|People Will Let You|Return Home And Live|Out Your Years.`)
addFloorMsg(1002, `"You have your own|Oxygen supply! We Will|Let You Live In The|Citadel, If You Promise|To Donate It To Our|People When You Die."`)
addFloorMsg(1003, `|   Congratulations!|||||         The End`)
addFloorMsg(1004, `"No," you say, "Give|this Oxygen To Someone|In Need. My Place Is|Here, In The:|| |   `)
addFloorMsg(1005, `"No," you say, "Give|this Oxygen To Someone|In Need. My Place Is|Here, In The:||     Dungeons Of|   The Unforgiven!"`)
//

//
addFloorMsg(2000, `That spell won't work|on me! I'm already the|last of my kind :(`)



function getPeopleSaved() {
  var out = parseInt(localStorage.getItem("peopleSaved"))
  if (isNaN(out)) return 0;
  return out
}

function saveSomeone() {
  localStorage.setItem('peopleSaved', getPeopleSaved()+1)
}

function getSave() {
  try {
    const save = JSON.parse(localStorage.getItem("saveMain"))
    const storedEnemies = JSON.parse(localStorage.getItem("saveWorld"))
    save.storedEnemies = storedEnemies
    return save
  }
  catch (e) {
    console.log('bad save')
    return null
  }
}

function startAge() {
  return 22 + getPeopleSaved()
}

function makeLootArray() {
  const lootArray = [0,0,0,1]
  shuffleArray(lootArray)
  return lootArray
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]
    }
}

function button(x,y,width,height,callback, arg1, priority) {
  buttons.push({x:x,y:y,width:width,height:height,callback:callback, arg1:arg1})
  if (priority) {
    //move to front
    buttons.unshift(buttons.pop())
  }
}

function freeze(callback,n) {
  frozen = true
  setTimeout(function () {
    frozen = false
    if (callback != undefined) callback()
  }, n||1000)
}

function endRetire() {
  showRetireMessage()
  draw()
}

function showRetireMessage() {
  state = states.retireScreen
  newLevelMsg = 1003  
}

function endContinue() {
  showSpecialMessage(1004)
  freeze(function () {
    showSpecialMessage(1005)
    draw()
    playAudio()
  })
  draw()
}
