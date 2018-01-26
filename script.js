"use strict"
//DOM stuff
var canvas = document.querySelector(".gameCanvas")
var ctx = canvas.getContext('2d')
ctx.webkitImageSmoothingEnabled = false
ctx.mozImageSmoothingEnabled = false
ctx.imageSmoothingEnabled = false
var width = canvas.width
var height = canvas.height
var loaded = false

var spriteImage = new Image()
spriteImage.src = 'sprites.png'
spriteImage.addEventListener('load', function() {
  loaded = true
}, false)

const mapSize = 100
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
for(let x = 0; x < mapSize; x++) {
	map[x] = [];
	for (let y = 0; y < mapSize; y++) {
		map[x][y] = rnd(2) == 0 ? 1 : 0
	}
}

function rnd(n) {
	return Math.floor(Math.random * n)
}

function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height)
	ctx.font="30px Verdana"
	ctx.fillStyle="black"
	ctx.fillText("position: " + pos.x + ":" + pos.y + ":" + pos.dir.name, 50, 50)
}

draw()

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
	pos.x += pos.dir.x
	pos.y += pos.dir.y
	draw()
}