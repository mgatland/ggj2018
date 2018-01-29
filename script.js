"use strict"
//DOM stuff
const canvas = document.querySelector(".gameCanvas")

//credit font dysin4mation by Auntie Pixelante

const ctx = canvas.getContext('2d')
ctx.webkitImageSmoothingEnabled = false
ctx.mozImageSmoothingEnabled = false
ctx.imageSmoothingEnabled = false

let smallFont = "24px \"dysin4mation\", monospace"
let mediumFont = "36px \"dysin4mation\", monospace"
let largeFont = "48px \"dysin4mation\", monospace"
let headingFont = "96px \"dysin4mation\", monospace"
let fontLineHeightScale = 0.6

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
let playerCombatMessage = []
let enemyCombatMessage = []
let townMessage = []
let flipped = false

const spellNames = []
// see enemies on map | no fog of war
spellNames.push({name:"We are together", fullName:"As long as we have each other, we will never run out of problems", desc:"Does nothing"}) //instakill
spellNames.push({name:"Deception", desc:"Does nothing"}) // enemies stop hunting you
spellNames.push({name:"Extinction", desc:"Does nothing"}) //destroy all enemies of this type (op?)
spellNames.push({name:"Ouroboros", desc:"Does nothing"}) //enemy attacks itself
spellNames.push({name:"Heartbeat", desc:"Heals exactly 10 health points per level"}) //(todo: heal over time for a time)
spellNames.push({name:"See things as we are", fullName: "We don't see things as they are, we see them as we are.", desc:"Disguise yourself as a monster for a short time. Monsters will ignore you, unless you provoke them."})
spellNames.push({name:"What do we do now?", desc:"Teleport to a random position on this level.", desc2:"If a Shadow Guardian is present, it will draw you closer!"}) //teleport
spellNames.push({name:"Ritual", desc:"Heals up to 10 health points per level"}) //heal (small)
spellNames.push({name:"Waves", desc:"Deals 15-30 health points of damage"}) //damage
spellNames.push({name:"Transmission", desc:"Detect the mind waves of a Shadow Guardian, so you can hunt it for its treasure"}) //detect boss
spellNames.reverse()

const spriteImage = new Image()
spriteImage.src = 'sprites.png'
spriteImage.addEventListener('load', function() {
  loaded = true

  var font = new FontFaceObserver('dysin4mation', {});

  font.load().then(function () {
    console.log('Font is available');
    restart()
  }, function () {
    console.log('Font is not available');
    restart()
  });
}, false)

let rngSeed = 1;
function random() {
    var x = Math.sin(rngSeed++) * 10000;
    return x - Math.floor(x);
}

function rnd(n) {
  return Math.floor(random() * n)
}

function trueRnd(n) {
  return Math.floor(Math.random() * n)
}

const states = { main:"main", dead:"dead", start:"start", town:"town", healer:"healer", foundSomething:"foundSomething", spellNotes:"spellNotes" }
let state = states.start

let playerStats = {}
const mapSize = 100
const cellSize = 10
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

enemyType.push({tileSet:0, sprite:1, maxHp:20, speed:7, defence: 3, power:5, name: "Broken One", desc:"It looks fragile"})
enemyType.push({tileSet:0, sprite:2, maxHp:15, speed:5, defence: 3, power:6, name: "Smoke Elemental", desc:"It seems to be slowly burning away"})
enemyType.push({tileSet:0, sprite:3, maxHp:30, speed:3, defence: 3, power:7, name: "Sewer Wyrm", desc:"It thrashes around to no avail"})
enemyType.push({tileSet:0, sprite:4, maxHp:40, speed:2, defence: 3, power:8, name: "Canbion", desc:"It shuffles back and forth"})

enemyType.push({tileSet:1, sprite:1, maxHp:20, speed:7, defence: 3, power:5, name: "Killer Prawn", desc:"It sees you and snarls"})
enemyType.push({tileSet:1, sprite:2, maxHp:15, speed:5, defence: 3, power:6, name: "Island Mimic", desc:"Its sandy shore has claimed many victims"})
enemyType.push({tileSet:1, sprite:3, maxHp:30, speed:3, defence: 3, power:7, name: "Purple Tentacle", desc:"Does it belong to something bigger?"})
enemyType.push({tileSet:1, sprite:4, maxHp:40, speed:2, defence: 3, power:8, name: "Iron Giant", desc:"You hear grinding gears from the depths"})

enemyType.push({tileSet:2, sprite:1, maxHp:5, speed:7, defence: 3, power:3, name: "Sporangium Warrior", desc:"A cloud of intoxicating spores surrounds it"})
enemyType.push({tileSet:2, sprite:2, maxHp:10, speed:5, defence: 3, power:4, name: "Aspergillus Philosopher", desc:"It quivers threateningly"})
enemyType.push({tileSet:2, sprite:3, maxHp:12, speed:3, defence: 3, power:5, name: "Elder Shroom", desc:"It doesn't want you here"})
enemyType.push({tileSet:2, sprite:4, maxHp:30, speed:2, defence: 3, power:6, name: "Earthstar", desc:"It stares expectantly"})

enemyType.push({tileSet:3, sprite:1, maxHp:5, speed:7, defence: 3, power:3, name: "Triffid", desc:"It smells angry"})
enemyType.push({tileSet:3, sprite:2, maxHp:10, speed:5, defence: 3, power:4, name: "Dumble-Dor", desc:"It clutches a crude spear"})
enemyType.push({tileSet:3, sprite:3, maxHp:12, speed:3, defence: 3, power:5, name: "Honey Golem", desc:"It looks delicious"})
enemyType.push({tileSet:3, sprite:4, maxHp:30, speed:2, defence: 3, power:6, name: "Larva", desc:"It writhes with ecstasy"})

//potions
for (var i = 0; i < potionEnemyCount/2; i++) {
  enemyType.push({tileSet:5, sprite:1+i, maxHp:5, speed:4, defence: 1, power:5, special: i, name: "Potion Bearer", desc:"This one will change you…"})
  enemyType.push({tileSet:6, sprite:1+i, maxHp:5, speed:4, defence: 1, power:5, special: i+5, name: "Potion Bearer", desc:"This one will change you…"})
}

//bosses
enemyType.push({tileSet:0, sprite:4, maxHp:40, speed:2, defence: 3, power:8, boss:0, name: "Super Canbion", desc:"It shuffles back and forth"})
enemyType.push({tileSet:0, sprite:1, maxHp:20, speed:7, defence: 3, power:5, boss:1, name: "Super Killer Prawn", desc:"It sees you and snarls"})
enemyType.push({tileSet:2, sprite:4, maxHp:30, speed:2, defence: 3, power:6, boss:2, name: "Super Earthstar", desc:"It stares expectantly"})
enemyType.push({tileSet:3, sprite:1, maxHp:5, speed:7, defence: 3, power:3, boss:3, name: "Super Triffid", desc:"It smells angry"})

//information you would save
let playerPos = {}
let depth = -1
let tileSet = 0
let enemies = []
let storedEnemies = []

const map = []
const laddersUp = []
const laddersDown = []

function restart() {
  state = states.start
  playerStats = {speed:10, strength: 10, luck: 10, int:10, end:10, 
                  level:1, sp:0, maxSp:0, hp:0, maxHp:0, exp:0, gold: 50, age:22}
  deriveMaxHpAndSp()
  playerStats.hp = playerStats.maxHp
  playerStats.sp = playerStats.maxSp
  playerPos = {x: 27, y: 11, dir: dirs.down}
  playerStats.spellKnown = [true,false,false,false,false,false,false,false,false,false]
  playerStats.bossesKilled = [false, false, false, false]

  clearMessages()
  storedEnemies.length = 0
  depth=-1
  changeLevelTo(0)
}

function deriveMaxHpAndSp() {
  playerStats.maxHp = 15 + Math.floor(playerStats.end/2)*playerStats.level
  playerStats.maxSp = Math.floor((playerStats.int*3)/5)*playerStats.level
  if (playerStats.hp > playerStats.maxHp) playerStats.hp = playerStats.maxHp
  if (playerStats.sp > playerStats.maxSp) playerStats.sp = playerStats.mapSp
}

function makeMap() {
  for(let x = 0; x < mapSize; x++) {
    map[x] = [];
    for (let y = 0; y < mapSize; y++) {
      map[x][y] = 0
    }
  }
  //rooms
  rngSeed = depth
  times(100, () => addRoom(2, 12))
  times(160, () => addRoom(1, 20, true))

  makeEnemies()
  makeLadders(depth)
}

function makeLadders(n) {
  laddersUp.length = 0
  rngSeed = n - 1
  times(100, () => addLadderUp())
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
  list.push(ladder)

  map[x][y] = 1 //clear the space

  const pos = {x:x, y:y}
  
  if (cellAt(move(pos, dirs.up)) === 0
    && cellAt(move(pos, dirs.down)) === 0
    && cellAt(move(pos, dirs.left)) === 0
    && cellAt(move(pos, dirs.right)) === 0) {
    //ladder needs more room
    //careful not to call rnd in here
    let width = 1
    let height = 1
    if ((x+y) % 2 == 0) width++
    if (y % 2 == 0) height++

    for(let x = pos.x-width; x <= pos.x + width; x++) {
      for (let y = pos.y - height; y <= pos.y + height; y++) {
        if (x >= 0 && y >= 0 && x< mapSize && y < mapSize) {
          map[x][y] = 1
        }
      }
    }
  }
}

function makeEnemies() {  
  if (storedEnemies[depth] != undefined) {
    enemies = storedEnemies[depth]
    storedEnemies[depth] = undefined
    //spawn more if there aren't many left
    times(30-enemies.length, makeEnemy)
  } else {
    enemies.length = 0
    times(100, makeEnemy)
    maybeGenerateBoss()
  }
  
}

function maybeGenerateBoss() {
  if (isBossLevel(depth)) {
    const bossN = Math.floor(depth/3)
    if (!playerStats.bossesKilled[bossN]) {
      makeEnemy(bossEnemyStartCount+bossN)
    }
  }
}

function makeEnemy(fixedType) {
  let x = -1
  let y = -1
  while (!cellIsEmpty({x:x, y:y})) {
    x = trueRnd(mapSize)
    y = trueRnd(mapSize)
  }
  var enemy = {x:x, y:y}

  if (fixedType != undefined) {
    enemy.type = fixedType;
  } else if (trueRnd(100)<10) {
    //potion!
    enemy.type = normalEnemyCount+trueRnd(10)
  } else {
    enemy.type = trueRnd(4)+tileSet*4
  }

  const et = getType(enemy)
  enemy.level = depth + trueRnd(2)
  if (et.boss != undefined) enemy.level += 5
  enemy.maxHp = et.maxHp + Math.floor(enemy.level * et.maxHp / 2)
  enemy.hp = enemy.maxHp
  enemy.timer = 0
  enemy.defence = et.defence + Math.floor(enemy.level * et.defence / 4)
  enemy.speed = et.speed + Math.floor(enemy.level * et.speed / 4)
  enemy.power = et.power + Math.floor(enemy.level * et.power / 4)
  enemy.exp = enemy.level + et.maxHp + enemy.power + enemy.defence
  enemy.gold = Math.floor(enemy.exp / 4)
  enemies.push(enemy)
  return enemy
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


const smallColWidth = 186
const viewSize = canvas.width - smallColWidth*2
const viewSizeY = Math.floor(viewSize/1.5)
const smallViewY = viewSizeY-Math.floor(smallColWidth/1.5)
const col1X = 0
const col2X = smallColWidth
const col3X = smallColWidth + viewSize
const lowerHudY = viewSizeY + 30
const centerX = Math.floor(canvas.width/2)
const rearViewX = Math.floor(centerX-smallColWidth/2)
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  if (state !== states.start) {
    draw3D(col1X, smallViewY, smallColWidth, playerPos.dir.ccw)
    draw3D(col3X, smallViewY, smallColWidth, playerPos.dir.cw)
    
    draw3D(rearViewX, viewSizeY, smallColWidth, playerPos.dir.reverse)
    drawMap(col3X, 0, canvas.width - col3X, smallViewY)
  }
  draw3D(col2X, 0, viewSize, playerPos.dir)

  const ahead = move(playerPos, playerPos.dir)
  const target = enemyAt(ahead)

  if (state !== states.start) {
    drawSpellUi(0, 0, smallColWidth, smallViewY)
  }

  //lower left HUD
  if (state !== states.start) {
    ctx.fillStyle="white"
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
    
    y+=lineHeight

    ctx.font=smallFont
    lineHeight = 16
    ctx.fillText(`Arrow keys move and attack. Spacebar to wait.`, x, y);  y+=lineHeight
    if (anyAtPos(laddersUp, playerPos) || anyAtPos(laddersDown, playerPos)) {
      ctx.fillText(`[d] or [u] to go down or up a ladder.`, x, y);  y+=lineHeight
    }
    y+=lineHeight
    if (playerStats.seeThingsSpellTimer > 0) {
      ctx.fillText(`Spell effect: disguised (${playerStats.seeThingsSpellTimer})`, x, y);  y+=lineHeight
    }
  }

  //lower rightHUD
  if (state !== states.start) {
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
          ctx.fillStyle = "grey"
          ctx.fillText(`You have enough experience to go`, x, y);  y+=lineHeight
          const amount = howManyLevelsCanIGet()
          const msg = (amount == 1) ? "a level" : amount + " levels"
          ctx.fillText(`up ${msg}! Return to the top of`, x, y);  y+=lineHeight
          ctx.fillText(`the dungeon. But it will cost you!`, x, y);  y+=lineHeight
          ctx.fillStyle = "white"
        }         
      }
   
    }
  }

  if (state===states.dead) {
    drawTitle("YOU HAVE DIED", centerX, 100)
    drawMedium("Press R to restart", centerX, viewSizeY - 20)
    ctx.textAlign="left"
  }

  if (state===states.start) {
    drawTitle("MATTHEW'S", centerX, 80)
    drawTitle("DUNGEONS OF", centerX, 80+70)
    drawTitle("THE UNFORGIVEN", centerX, 80+70+70)
    drawMedium("Press [spacebar] to start", centerX, viewSizeY - 20)
    let y = viewSizeY + 50
    const lineHeight = 30
    drawMedium("Life in the citadel is hard but fair.", centerX, y); y += lineHeight
    drawMedium("There is only enough air for one thousand and twenty-two people.", centerX, y); y += lineHeight
    drawMedium("When a baby is born, the oldest citizen is sent into the Depths.", centerX, y); y += lineHeight
    y += lineHeight
    drawMedium("Today is your turn to be exiled.", centerX, y); y += lineHeight
    y += lineHeight
    drawMedium("You have 50 coins and know 1 spell.", centerX, y); y += lineHeight
    drawMedium("You are 22 years old.", centerX, y); y += lineHeight
    drawMedium(" Good luck!", centerX, y); y += lineHeight
    drawMedium("", centerX, y); y += lineHeight
    drawMedium("", centerX, y); y += lineHeight
    drawMedium("", centerX, y); y += lineHeight

    ctx.textAlign="left"
  }

  if (state===states.spellNotes) {
    const t = getMainWindowTextTool()
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
  }

  if (state===states.healer) {
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
    t.print("Press [1] to heal 10 hp for " + healCost(10))
    t.print(`Press [2] to heal 100 for ${healCost(100)}`)
    t.print()
    t.print("Press [D] to go back to the dungeon")
  }

  if (state===states.town) {
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
    t.print("Press [D] to go back to the dungeon")
  }
  
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
  ctx.fillStyle="white"
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
  ctx.fillStyle="white"
  ctx.fillText(text, x, y)
}

function getMainWindowTextTool() {
    ctx.fillStyle = "black"
    ctx.fillRect(col2X, 0, viewSize, viewSizeY)
    ctx.fillStyle="white"
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
  ctx.fillStyle="white"
  let tX = x + 7
  let tY = y + 20
  const lineHeight = 16
  const costX = x + 164
  ctx.fillText("Spells", tX, tY); tY += lineHeight
  tY += lineHeight
  for (var i = 0; i < 10; i++) {
    if (playerStats.spellKnown[i]) {
      ctx.fillText((i+1) + " " + spellNames[i].name, tX, tY);
      tY += lineHeight
    } else {
      ctx.fillText("  -------------", tX, tY); tY += lineHeight
    }
  }
  tY += lineHeight
  ctx.fillText("[1-9] Cast Spell", tX, tY); tY += lineHeight
  ctx.fillText("[S] Show spell notes", tX, tY); tY += lineHeight
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
    tCtx.drawImage(spriteImage, 256*6, 512*tileSet, 512, 512, 0, 0, viewSizeX*-1, viewSizeY)
    tCtx.scale(-1,1)    
  } else {
    tCtx.drawImage(spriteImage, 256*6, 512*tileSet, 512, 512, 0, 0, viewSizeX, viewSizeY)
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
          if (et.boss != undefined) {
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

  ctx.fillStyle = "grey"
  ctx.fillRect(viewX, viewY, viewSizeX, viewSizeY)
  ctx.drawImage(tempCanvas, cropX, cropY, viewSizeX, viewSizeY, viewX, viewY, viewSizeX, viewSizeY)

  ctx.strokeStyle = "darkblue"
  ctx.lineWidth = 4
  ctx.strokeRect(viewX, viewY, viewSizeX, viewSizeY)
}


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
  if (state === states.spellNotes) {
    state = states.main
    draw()
    return
  }
  if (state === states.healer) {
    switch (keyCode) {
      case 68: //down
        state = states.main
        draw()
        break
      case 49: //1 -> buy 10
        buyHealing(10)
        draw()
        break
      case 50: //2 -> buy 100
        buyHealing(100)
        draw()
        break
    }
    return
  }
  if (state === states.town) {
    switch (keyCode) {
      case 68: //down
        state = states.main
        draw()
        break
      case 83: //s
        levelUp()
        draw()
        break
    }
    return
  }
  if (state === states.foundSomething) {
    state = states.main
    cleanDeadEnemies()
    if (playerStats.surprise != undefined) {
      switch (playerStats.surprise) {
        case 0: playerCombatMessage.push("A Fountain Pen of Luck! +10 Luc")
        playerStats.luck += 10
        break
        case 1: playerCombatMessage.push("A Mobile Phone of Speed! +12 Spd")
        playerStats.speed += 12
        break
        case 2: playerCombatMessage.push("A Poison of Intelligence! +15 Int")
        playerStats.int += 15
        break
        case 3: playerCombatMessage.push("Boots of Endurance! +20 End")
        playerStats.end += 20
        break
      }
    } else if (rnd(100) < 10) {
      var spellToGet = playerStats.spellKnown.indexOf(false)
      console.log(spellToGet)
      if (spellToGet >= 0) {
        playerCombatMessage.push("A spell: " + spellNames[spellToGet].name + "!")
        playerStats.spellKnown[spellToGet] = true
      } else {
        playerCombatMessage.push("A spell, but you already knew it.")  
      }
    } else {
      playerCombatMessage.push("nothing!")
    }
    draw()
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
    case 83: //s
        state = states.spellNotes
        draw()
        break
    case 77: showMap()
      break
    case 49: castTransmission(); break //1
    case 50: castWaves(); break //2
    case 51: castRitual(); break //3
    case 52: castWhatDo(); break //4
    case 53: castSeeThings(); break //5
    case 54: castHeartbeat(); break //6
    case 48: //0

  }
}

function getPlayerTarget() {
  return findAtPos(enemies, move(playerPos, playerPos.dir))
}

function castHeartbeat() {
  if (!inGame()) return
  clearMessages()
  if (trySpendSp(6)) {
    const amount = playerStats.level*10
    playerStats.hp = Math.min(playerStats.hp + amount, playerStats.maxHp)
    playerCombatMessage.push(`You focus on your heart,`)
    playerCombatMessage.push(`healing ${amount} health points.`)
    monsterCombatTurn()
    draw()
  }
}

function castSeeThings() {
  if (!inGame()) return
  clearMessages()
  if (trySpendSp(5)) {
    playerCombatMessage.push(`What if we are all monsters?`)
    playerCombatMessage.push(`You pretend to fit in.`)
    playerStats.seeThingsSpellTimer = 15
    monsterCombatTurn()
    draw()
  }
}

function castWhatDo() {
  if (!inGame()) return
  clearMessages()
  if (trySpendSp(4)) {
    const amount = playerStats.level*10
    const pos = {x:-1,y:-1}
    const boss = enemies.find(x=>getType(x).boss != undefined)
    const startDist = boss != undefined ? distanceFromTo(playerPos, boss) : undefined
    let dist = 0
    while (!cellIsEmpty(pos) || (boss != undefined && dist > 4 + startDist/2)) {
      pos.x = trueRnd(mapSize)
      pos.y = trueRnd(mapSize)
      dist = boss != undefined ? distanceFromTo(pos, boss) : undefined
    }
    playerPos.x = pos.x
    playerPos.y = pos.y
    if (boss != undefined) {
      playerCombatMessage.push(`You forget where you are,`)
      playerCombatMessage.push(`and feel a cold presence calling you.`)
      console.log(`old dist ${startDist}, new dist ${dist}`)
    } else {
      playerCombatMessage.push(`You forget where you are,`)
      playerCombatMessage.push(`and you are somewhere else.`)
    }
    monsterCombatTurn()
    draw()
  }
}

function castRitual() {
  if (!inGame()) return
  clearMessages()
  if (trySpendSp(3)) {
    const amount = trueRnd(playerStats.level*10) + 1
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
    hitMonster(trueRnd(15)+15, e, "You emit waves of energy!")
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
      const dist = (bossN+1)*3 - 1 - depth
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
  const s = (n == 1 || n == -1) ? "" : "s"
  const amount = Math.abs(n)
  const dir = (n > 0) ? "below" : "above"
  return amount + " level" + s + " " + dir 
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
  restart()
}

function townLadderType(pos) {
  if ((pos.x + pos.y) % 2 == 0) {
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
    state = ladderType == 0 ? states.town : states.healer
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

function changeLevelTo(newLevel)
{
  if (depth != -1) {
    storedEnemies[depth] = enemies
    enemies = []
  }
  depth = newLevel
  tileSet = Math.floor(depth / 3) % tileSetCount
  makeMap()
  draw()
}

function wait() {
  if (!inGame()) return
  clearMessages()
  
  timePasses()
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
    timePasses()
  }
}

function clearMessages() {
  enemyCombatMessage.length = 0
  playerCombatMessage.length = 0
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
    if (getType(e).special != undefined) {
      specialHitEffect(getType(e).special)
      e.hp = 0
      //FIXME: this should go to a 'press any key' state that makes the enemy disappear
    } else {
      hitPlayer(damage)
      enemyCombatMessage.push("The " + getType(e).name + " deals " + damage + " damage")
    }
  } else {
    enemyCombatMessage.push("The " + getType(e).name + " missed!")
  }
}

function hitMonster(damage, e, text)
{
  e.hp -= damage
  if (e.hp > 0) {
    playerCombatMessage.push(text == undefined ? "You hit the monster!" : text)
    playerCombatMessage.push("It takes " + damage + " points of damage!")
  } else {
    playerStats.exp += e.exp
    playerStats.gold += e.gold
    state = states.foundSomething
    const boss = getType(e).boss
    playerStats.surprise = boss
    if (boss != undefined) {
      playerStats.bossesKilled[boss] = true
      playerCombatMessage.push("The mighty Shadow Guardian is dead!")
      playerCombatMessage.push("You take its treasure... (PRESS A KEY)")
    } else {
      playerCombatMessage.push("You killed it!")
      playerCombatMessage.push("You found... (PRESS ANY KEY)")
    }
  }
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
  return rnd(10) //should be weapon power
}

function timePasses()
{
  if (playerStats.seeThingsSpellTimer > 0) {
    playerStats.seeThingsSpellTimer--
    draw()
    return
  }
  const amount = playerMoveTime()
  for (let e of enemies) {
    passTimeForEnemy(amount, e)
  }
  draw()
}

function passTimeForEnemy(amount, e)
{
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

function levelUp() {
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
  }
}

function goldNeededToLevel() {
  return Math.floor(expNeeded() / 6)
}

function hitPlayer(amount)
{
  playerStats.hp -= amount
  if (playerStats.hp <= 0) {
    state = states.dead
  }
}

function healCost(amount) {
  return playerStats.level * 15 + amount * 4 * Math.floor(1 + playerStats.level/2)
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
    enemyCombatMessage.push("Intelligence raised by potion!")
    break
    case 5: playerStats.end++
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
    enemyCombatMessage.push("Intelligence lowered by potion!")
    break
    case 9: playerStats.end--
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