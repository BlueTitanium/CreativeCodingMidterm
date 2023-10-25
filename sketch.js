/*
Game based on: https://bluetitanium.itch.io/ball-and-blade
    - One of my previous games :)
    - this version is partially inspired by one finger death punch
Sideways version of that game. 

*/


//fonts
var fontRegular, fontBold;

//A variable to store the current game state so there can be a start, game, and end screens
var GAMESTATE = 0; // 0 -> START, 1 -> GAME, 2 -> END

//for the floor and ceiling
var floorHeight = 100;
var ceilHeight = 200;

//variables for the camera
var nextX = 0;
var nextY = 0;
var nextScale = 5;

//player object
let player = {
    //positions
    x: 0,
    nextX: 0,
    y: 0,

    //body size
    s: 50,
    
    //sword properties
    swordY: -.5,
    swordSize: 4,
    swordHeight: 40,
    //outer range to slice
    sRange: 300, // should lerp to this point
    //inner range to block
    innerRange: 150,
    isMoving: false,
    successfulBlock: false,
    hp: 3,

    display: function() {
        push();
        noStroke();

        this.x = lerp(this.x, this.nextX, 0.1);
        this.sRange = lerp(this.sRange, 300, 0.01);
        this.isMoving = abs(this.nextX - this.x) > 1;
        this.s = 50 + sin(frameCount/5);

        //range
        fill("#ff19192d");
        ellipse(this.x,this.y,this.sRange);
        fill("#ff19192d");
        ellipse(this.x,this.y,this.innerRange);
        
        //body
        fill("#ff4646");
        ellipse(this.x,this.y,this.s);
        fill("#ff8b8b");
        rectMode(CENTER);
        rect(this.x,this.y, this.s/20, this.s)
        
        //sword
        fill("#101014");
        rect(this.x+35, this.swordY-this.swordHeight+10, this.swordSize, 15);
        fill("#101014");
        rect(this.x+35, this.swordY-this.swordHeight+13, this.swordSize*3, 2);
        fill("#FFFFFF");
        rect(this.x+35, this.swordY-2, this.swordSize-1, 48);
        //sheathe
        fill("#212131");
        rect(this.x+35, this.y-2, this.swordSize, 50);
        

        if(keyIsDown(LEFT_ARROW)){
            TryBlock(true);
        } else if (keyIsDown(RIGHT_ARROW)) {
            TryBlock(false);
        } else {
            this.successfulBlock = false;
        }
        pop();
    }
};

//will hold all enemies
var enemyList = [];
//will hold all projectiles
var projectileList = [];

//list of potential enemy colors
colorList = ['#ff8bf9','#bea6ff','#6a98b6'];
//enemy class
class Enemy {
    //direction determines enemy movement. -1->left, 0->nothing, 1->right
    direction = 0;
    //speed is how fast enemy moves
    speed = 1;
    //position
    x = 0;
    y = 0;
    //size
    s = 50;
    //color
    col;
    constructor(direction, speed, x){
        this.direction = direction;
        this.speed = speed;
        this.x = x;
        this.col = color(colorList[floor(random(0, colorList.length ))]);
    }
    display(){
        push();
        noStroke();
        fill(this.col);
        rectMode(CENTER);
        rect(this.x,this.y, this.s)
        if(this.x > player.x) { //right
            this.direction = -1;
        } else {
            this.direction = 1;
        }
        this.x += this.speed * this.direction;

        //damage player if colliding
        if(abs(this.x - player.x) < this.s/2){
            player.hp -= 1;
            var ind = enemyList.indexOf(this);
            enemyList.splice(ind,1);
        }
        pop();
    }
}

class Projectile {
    //direction determines enemy movement. -1->left, 0->nothing, 1->right
    direction = 0;
    //speed is how fast projectile moves
    speed = 1;
    //position
    x = 0;
    y = 0;
    //size
    s = 20;
    t = 0;
    //color
    col;
    constructor(direction, speed, x){
        this.direction = direction;
        this.speed = speed;
        this.x = x;
        this.col = color(colorList[floor(random(0, colorList.length ))]);
        this.y = random(-20,20);
    }
    display(){
        push();
        noStroke();
        fill(this.col);
        this.t += 1;
        translate(this.x,this.y);
        rotate(this.t/10 * this.direction);
        triangle(0,-this.s/2,-this.s/2, this.s/2,this.s/2,this.s/2)
        if(this.x > player.x) { //right
            this.direction = -1;
        } else {
            this.direction = 1;
        }
        this.x += this.speed * this.direction;

        //damage player if colliding
        if(abs(this.x - player.x) < this.s/2){
            player.hp -= 1;
            var ind = projectileList.indexOf(this);
            projectileList.splice(ind,1);
        }
        pop();
    }
}

//WAVE SYSTEM
var curWave = 1;
var enemiesToSpawn = 3;
var spawnTime = 100;
var spawnTimer = 50;
var projSpawnTime = 50;
var projSpawnTimer = 50;

//SCREEN UI
var startAlpha = 0;
var gameAlpha = 0;
var endAlpha = 0;

function preload() {
    fontRegular = loadFont('assets/Raleway-Regular.ttf');
    fontBold = loadFont('assets/Raleway-SemiBold.ttf');
}

function setup() {
    createCanvas(900, 400);
    nextX = -player.x-50;
    nextY = height / 2;
    startAlpha = 255;
}
  
function draw() {
    background("#1c1425");

    //CAMERA INSPIRED FROM ANSWER IN THIS: https://stackoverflow.com/questions/64470290/how-can-i-write-a-line-of-code-for-p5-js-that-works-as-a-camera-follower-for-my
    
    //END VIEW

    switch (GAMESTATE){
        case 0:
            //START VIEW
            
            //CAMERA STUFF
            nextX = lerp(nextX, -player.x - 50, .1);
            nextY = lerp(nextY, height / 2 , .1);
            translate(width/2, nextY);
            nextScale = lerp(nextScale, 5, 0.025);
            scale(nextScale);
            translate(nextX, 0);
            //display player
            player.display();
            drawFloor();
            drawCeil();
            //display UI
            drawStringOverlayed(player.x + 130,-10, "BALL\nBLADE\nHALL", 15, startAlpha);
            drawString(player.x + 130,20, "a game by taneim miah", 5, startAlpha);
            drawString(player.x + 130,31, "press SPACE to start", 8, startAlpha);
            //UI LERPERS
            startAlpha = lerp(startAlpha, 255, .05);
            gameAlpha = lerp(gameAlpha, 0, .05);
            endAlpha = lerp(endAlpha, 0, .05);
            break;
        case 1:
            //GAME VIEW
            
            //CAMERA STUFF
            nextX = lerp(nextX, -player.x, .1);
            nextY = lerp(nextY,height - floorHeight, .1);
            translate(width/2, nextY);
            nextScale = lerp(nextScale, 1.25, 0.025);
            scale(nextScale); //scale needs to come before the player translate... this took me a long time to debug... thank this video (Coding Challenge #32.1: Agar.io - Part 1 (Basic Game Mechanics) https://www.youtube.com/watch?v=JXuxYMGe4KI for showing the camera movement
            translate(nextX,0);

            //display player
            player.display();

            //display arena
            drawFloor();
            drawCeil();

            //display enemies/projectiles
            for(i = 0; i<enemyList.length; i++){
                enemyList[i].display();
            }
            for(i = 0; i<projectileList.length; i++){
                projectileList[i].display();
            }
            //display UI
            drawStringOverlayed(130,-10, "BALL\nBLADE\nHALL", 15, startAlpha);
            drawString(130,20, "a game by taneim miah", 5, startAlpha);
            //UI LERPERS
            startAlpha = lerp(startAlpha, 0, .05);
            gameAlpha = lerp(gameAlpha, 255, .05);
            endAlpha = lerp(endAlpha, 0, .05);
            //display effects

            //WAVE SYSTEM
            if(spawnTimer > 0){
                spawnTimer-=1;
            }else{
                spawnTimer = spawnTime;
                var randDir = random(0,100);
                if(randDir <50){
                    randDir = -1;
                } else {
                    randDir = 1;
                }
                enemyList.push(new Enemy(randDir, 2, player.x+randDir*-500));
                
            }
            if(projSpawnTimer > 0){
                projSpawnTimer-=1;
            }else{
                projSpawnTimer = projSpawnTime;
                var randDir = random(0,100);
                if(randDir <50){
                    randDir = -1;
                } else {
                    randDir = 1;
                }
                projectileList.push(new Projectile(randDir,4,player.x+randDir*-500));
            }
            break;
        case 2:

            break;
        default:
            break;
    }
}

function drawStringOverlayed(x, y, str, size, a){
    push();
    textAlign(RIGHT, CENTER);
    textFont(fontBold);
    textSize(size);
    var c = color('#da5954');
    c.setAlpha(a);
    fill(c);
    text(str, x+.5, y+.5);
    c = color('#ff8181');
    c.setAlpha(a);
    fill(c);
    text(str, x, y);
    pop();
}
function drawString(x, y, str, size, a){
    push();
    textAlign(RIGHT, CENTER);
    textFont(fontBold);
    textSize(size);
    var c = color('#da5954');
    c.setAlpha(a);
    fill(c);
    text(str, x+.5, y+.5);
    pop();
}


function drawFloor(){
    push();
    noStroke();
    fill("#342d3b");
    rect(player.x-width,25,width*2,100);
    pop();
}

function drawCeil(){
    push();
    noStroke();
    fill("#342d3b");
    rect(player.x-width,25-ceilHeight,width*2,-height);
    pop();
}

function keyPressed(){
    if(keyCode == LEFT_ARROW){
        if(GAMESTATE == 0){
            GoToGame();
        }
    } else if(keyCode == RIGHT_ARROW){
        if(GAMESTATE == 0){
            GoToGame();
        }
    } else if(keyCode == 49 || keyCode == 82){
        GoToStartScreen()
    } else if(keyCode == 50 || keyCode == 32){
        GoToGame()
    } else if(keyCode == 51){
        GoToDeathScreen()
    }
}

function keyReleased(){
    if(keyCode == LEFT_ARROW){
        if(GAMESTATE == 1) {
            Slice(true);
        }
    } else if(keyCode == RIGHT_ARROW){
        if(GAMESTATE == 1) {
            Slice(false);
        }
    } 
}

function Slice(isLeft){
    //check if enemies are within range and find the closest enemy that is within the range
    //current closest is just outside of range, meaning none is in range
    var currentClosest = player.sRange/2 + 1;
    var curClosestIndex = -1;
    for(i = 0; i < enemyList.length; i++){
        
        var e = enemyList[i];
        //make sure enemy is to the left of the player
        if(isLeft && e.x < player.x){
            //player center - rightmost position of enemy
            var distance = abs(player.x - (e.x+e.s/2));
            if(distance < currentClosest){
                currentClosest = distance;
                curClosestIndex = i;
            }
        } else 
        //make sure enemy is to the right of the player
        if (!isLeft && e.x > player.x){
            //player center - leftmost position of enemy
            var distance = abs(player.x - (e.x-e.s/2));
            if(distance < currentClosest){
                currentClosest = distance;
                curClosestIndex = i;
            }
        }
    }
    if(currentClosest < player.sRange/2){
        //slice the enemy
        player.nextX = enemyList[curClosestIndex].x;
        enemyList.splice(curClosestIndex,1);
        player.sRange += 100;
    } else {
        if(!player.successfulBlock){
            player.sRange -= 30;
            if(isLeft){
                player.nextX -= 20;
            } else {
                player.nextX += 20;
            }
        }
    }
}

function TryBlock(isLeft){
    //check if projectiles are within inner range
    var index = -1;
    for(i = 0; i < projectileList.length; i++){
        var p = projectileList[i];
        //make sure enemy is to the left of the player
        //and within inner range
        if(isLeft && p.x < player.x && abs(p.x - player.x) < player.innerRange/2){
            //player center - rightmost position of enemy
            index = i;
            break;
        } else 
        //make sure enemy is to the right of the player
        //and within inner range
        if (!isLeft && p.x > player.x && abs(p.x - player.x) < player.innerRange/2){
           index = i;
           break;
        }
    }
    if(index != -1){
        projectileList.splice(index,1);
        player.successfulBlock = true;
        player.sRange += 40;
    }
}

function GoToStartScreen(){
    GAMESTATE = 0;
   
}

function GoToGame(){
    GAMESTATE = 1;
    enemyList = []; // clear array
    projectileList = [];
}

function GoToDeathScreen(){
    GAMESTATE = 2;
}