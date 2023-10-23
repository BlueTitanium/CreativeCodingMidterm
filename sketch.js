/*
Game based on: https://bluetitanium.itch.io/ball-and-blade
    - One of my previous games :)
    - this version is partially inspired by one finger death punch
Sideways version of that game. 

*/


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
    sRange: 300,

    isMoving: false,

    display: function() {
        push();
        noStroke();

        this.x = lerp(this.x, this.nextX, 0.1);
        this.isMoving = this.x != this.nextX;
        this.s = 50 + sin(frameCount/5);

        //range
        fill("#ff19192d");
        ellipse(this.x,this.y,this.sRange);

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
        
        pop();
    }
};


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

        this.x += this.speed * this.direction;

        pop();
    }
}

class Projectile {
    //direction determines projectile movement. -1->left, 0->nothing, 1->right
    direction = 0;
    //speed is how fast projectile moves
    speed = 1;
    constructor(direction, speed){
        this.direction = direction;
        this.speed = speed;
    }
    display(){

    }
}

//will hold all enemies and projectiles
var enemyList = [];

//WAVE SYSTEM
var curWave = 1;
var enemiesToSpawn = 3;
var spawnTime = 100;
var spawnTimer = 50;


function setup() {
    createCanvas(900, 400);
    nextX = -player.x-50;
    nextY = height / 2;
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

            //display UI

            //display effects

            //WAVE SYSTEM
            if(spawnTimer > 0){
                spawnTimer-=1;
            }else{
                spawnTimer = spawnTime;
                var randDir = random(0,1);
                if(randDir <.5){
                    randDir = -1;
                } else {
                    randDir = 1;
                }
                enemyList.push(new Enemy(randDir,1,player.x+randDir*-500));
            }
            break;
        case 2:

            break;
        default:
            break;
    }
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
        } else if(GAMESTATE == 1) {
            LeftSlice();
        }
    } else if(keyCode == RIGHT_ARROW){
        if(GAMESTATE == 0){
            GoToGame();
        } else if(GAMESTATE == 1) {
            RightSlice();
        }
    } else if(keyCode == 49 || keyCode == 82){
        GoToStartScreen()
    } else if(keyCode == 50 || keyCode == 32){
        GoToGame()
    } else if(keyCode == 51){
        GoToDeathScreen()
    }
}

function LeftSlice(){
    
}

function RightSlice(){

}

function GoToStartScreen(){
    GAMESTATE = 0;
    enemyList = []; // clear array
    
}

function GoToGame(){
    GAMESTATE = 1;
}

function GoToDeathScreen(){
    GAMESTATE = 2;
}