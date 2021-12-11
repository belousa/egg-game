
Array.prototype.remove = function (elem) {
    const indexInArray = this.findIndex(e => e === elem)
    if (indexInArray >= 0) this.splice(indexInArray, 1)
}

const zip = (...rows) => rows[0].map((_,c) => rows.map(row => row[c]))

let score = 0

class Vec {
    constructor(x,y) {
        if (Array.isArray(x) && y === undefined)
            [this.x, this.y] = x
        else {
            this.x = x
            this.y = y
        }
        this[Symbol.iterator] = function*() {
            yield x;
            yield y;
        }
    }
}

const V = (...args) => new Vec(...args)

function rampBelow(ramp) {
    if (ramp === ramps.leftTop) return ramps.leftBottom
    if (ramp === ramps.rightTop) return ramps.rightBottom
}

class Basket {
    constructor(ramp) {
        this.ramp = ramp || ramps.leftBottom
    }

    left = () => {
        if (this.ramp === ramps.rightTop) this.ramp = ramps.leftTop
        if (this.ramp === ramps.rightBottom) this.ramp = ramps.leftBottom
    }
    right = () => {
        if (this.ramp === ramps.leftTop) this.ramp = ramps.rightTop
        if (this.ramp === ramps.leftBottom) this.ramp = ramps.rightBottom
    }
    up = () => {
        if (this.ramp === ramps.leftBottom) this.ramp = ramps.leftTop
        if (this.ramp === ramps.rightBottom) this.ramp = ramps.rightTop
    }
    down = () => {
        this.ramp = rampBelow(this.ramp) ?? this.ramp
    }
}

const ramps = {
    leftTop: {
        from: V(100, 100),
        to: V(400, 200)
    },
    rightTop: {
        from: V(900, 100),
        to: V(600, 200)
    },
    leftBottom: {
        from: V(100, 400),
        to: V(400, 500)
    },
    rightBottom: {
        from: V(900, 400),
        to: V(600, 500)
    },
}

function isRightRamp(ramp) {
    return ramp === ramps.rightBottom || ramp == ramps.rightTop
}


const basket = new Basket()
const basketImage = new Image(2, 2)
const basketSize = 50
basketImage.src = './basket.svg'
basket.width = basketSize;
basket.height = basketSize;

const groundLevel = 600

const rampsTable =  [
    [ramps.leftTop, ramps.rightTop],
    [ramps.leftBottom, ramps.rightBottom]
]

const rampLength = 100

const distanceTopToBottomRamp = 30
const distanceBottomRampToGround = 30

const fallVelocity = 0.2

const flightTimeTopToBottomRamp =  distanceTopToBottomRamp / fallVelocity
const flightTimeBottomRampToGround = distanceBottomRampToGround / fallVelocity


let time = 0

let eggsCaught = 0
let eggsSplat = 0

let isGameOver = false;

class EggDefinition {
    constructor(ramp, speed, spawnDelay) {
        this.ramp = ramp || ramps.leftTop
        this.speed = speed || 1.0
        this.spawnTime = time + spawnDelay
        this.events = [
            setTimeout(() => this.spawn(), spawnDelay),
            setTimeout(() => this.splat(), this.deathTime() - time),
            setTimeout(() => this.firstChanceCatch(), this.firstChanceCatchTime() - time),
        ];
        if (this.doesSpawnTop()) {
            this.events.push(setTimeout(() => this.secondChanceCatch(), this.secondChanceCatchTime() - time))
        }
        console.log('construct', {
            spawn: this.spawnTime,
            firstChance: this.firstChanceCatchTime(),
            secondChance: this.secondChanceCatchTime(),
            splatTime: this.deathTime(),
        })
    }

    doesSpawnTop() {
        return rampsTable[0].includes(this.ramp)
    }

    firstChanceCatchTime() {
        return this.spawnTime + rampLength / this.speed
    }

    secondChanceCatchTime() {
        return this.firstChanceCatchTime() + flightTimeTopToBottomRamp
    }

    // egg lands/breaks
    deathTime() {
        const flightTime = this.doesSpawnTop()
            ? flightTimeTopToBottomRamp + flightTimeBottomRampToGround 
            : flightTimeBottomRampToGround
        return this.firstChanceCatchTime() + flightTime
    }

    spawn() {
        eggSpawnQueue.remove(this)
        liveEggs.push(this)
        if (!isGameOver) enqueueEggSpawn()
    }

    despawn() {
        liveEggs.remove(this)
        eggSpawnQueue.remove(this)
        this.events.forEach(e => clearTimeout(e))
    }

    caught() {
        eggsCaught += 1
        this.despawn();
    }

    splat() {
        console.log('splat', { spawnTime: this.spawnTime, current: time })
        eggsSplat += 1
        this.despawn();
    }

    firstChanceCatch() {
        console.log('first', { spawnTime: this.spawnTime, current: time })
        if (this.ramp === basket.ramp) {
            this.caught();
        }
    }

    secondChanceCatch() {
        console.log('second', { spawnTime: this.spawnTime, current: time })
        const secondChanceRamp = rampBelow(this.ramp)
        if (basket.ramp === secondChanceRamp) {
            this.caught();
        }
    }
}


const eggSpawnQueue = [
    new EggDefinition(ramps.leftTop, 0.1, 0),
    new EggDefinition(ramps.rightTop, 0.2, 2000),
    new EggDefinition(ramps.leftBottom, 0.05, 3000),
    new EggDefinition(ramps.rightBottom, 0.13, 3700),
]

const liveEggs = []

const canvasElem = document.getElementById('canvas')
const ctx = canvasElem.getContext('2d')


const eggRadius = 20

function drawEgg(egg) {
    const [x, y] = position(egg)
    ctx.beginPath()
    ctx.arc(x, y - eggRadius, eggRadius, 0, 2*Math.PI, false)
    ctx.strokeStyle = '#f00'
    ctx.stroke()
    ctx.fillStyle = '#0f0'
    ctx.fill()
}

function drawRamp (ramp) {
    ctx.beginPath()
    ctx.moveTo(...ramp.from)
    ctx.lineTo(...ramp.to)
    ctx.strokeStyle = "#000"
    ctx.stroke()
}

function drawUi() {
    document.getElementById('caught').innerText = `${eggsCaught}`
    document.getElementById('splatted').innerText = `${eggsSplat}`
}

function draw() {
    ctx.clearRect(0,0, canvasElem.width, canvasElem.height)

    liveEggs.forEach(drawEgg)
    rampsTable.forEach(row => row.forEach(drawRamp))
    drawBasket()
    drawUi()
}

function position(egg) {
    return (
        time <= egg.firstChanceCatchTime()
        ? rampPosition(egg)
        : fallPosition(egg)
    )
}

function rampPosition(egg) {
    const timeOnRamp = time - egg.spawnTime 
    const distance = timeOnRamp * egg.speed
    const rampPercentage = distance / rampLength
    const { to, from }  = egg.ramp
    const x = from.x + rampPercentage * (to.x - from.x)
    const y = from.y + rampPercentage * (to.y - from.y)
    return [x, y]
}

function fallPosition(egg) {
    const timeInFall = time - egg.firstChanceCatchTime() 
    const distanceFell = timeInFall * fallVelocity
    const height = egg.doesSpawnTop() 
        ? distanceTopToBottomRamp + distanceBottomRampToGround
        : distanceBottomRampToGround
    const fallPercentage = distanceFell / height
    const { to } = egg.ramp
    const x = to.x
    const y = to.y + fallPercentage * (groundLevel - egg.ramp.to.y)
    return [x,y]
}

function drawBasket() {
    let {x,y} = basket.ramp.to;
    if (isRightRamp(basket.ramp)) x -= basketSize
    ctx.drawImage(basketImage, x, y, basketSize, basketSize)
}

let lastCallTime = 0;
function advanceTime(callTime) {
    if (lastCallTime) {
        const delta = callTime - lastCallTime
        time += delta;
    }
    lastCallTime = callTime;
}

const intendedDifficulty = 1;
function computeLevelSpawnQueue() {
    const 
}

function computeQueueDifficulty(queue) {
    let cumulativeDifficulty = 1
    const queue = [...queue];
    queue.sort((prev, next) => prev.firstChanceCatchTime() - next.firstChanceCatchTime())
    for (const [egg, nextEgg] of zip(eggSpawnQueue.slice(0, -1), eggSpawnQueue.slice(1))) {
        if (egg.doesSpawnTop()) {
            const deathTimes = [egg.firstChanceCatchTime(), egg.secondChanceCatchTime()]
        }
    }
    return 1;
}

const randInt = () => Math.round(Number.MAX_SAFE_INTEGER * Math.random())

const minEggSpeed = 0.02
const maxEggSpeed = 0.2

const minEggSpawnDelay = 0
const maxEggSpawnDelay = 3000

const clamp = (val, min, max) => Math.min(max, Math.max(val, min))

const randomFloatInRange = (min, max) => {
    const range = max - min;
    return min + Math.random() * range;
}

function enqueueEggSpawn() {
    const newEgg = new EggDefinition(
        //ramp
        rampsTable[randInt() % 2][randInt() % 2],
        //speed
        randomFloatInRange(minEggSpeed, maxEggSpeed),
        //spawnDelay
        randomFloatInRange(minEggSpawnDelay, maxEggSpawnDelay)
    )
    const queueDifficulty = computeQueueDifficulty([...queue.slice(1), newEgg])
    eggSpawnQueue.push(newEgg)
}


function gameOver() {
    ctx.font = "48px serif"
    ctx.fillText("GAME OVER", 300, 300)
    isGameOver = true;
}

function tick(callTime) {
    advanceTime(callTime)    
    draw()
    if (eggsSplat >= 10) {
        gameOver()
    } else {
        requestAnimationFrame(tick);
    }
}

function start() {
    requestAnimationFrame(tick);
}

document.addEventListener('keydown', evt => {
    // HACK?
    const keyMap = {
        ArrowLeft: basket.left,
        ArrowRight: basket.right,
        ArrowUp: basket.up,
        ArrowDown: basket.down
    }
    if (evt.key in keyMap) keyMap[evt.key]()
})

//start()
