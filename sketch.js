/*
Game based on: https://bluetitanium.itch.io/ball-and-blade
    - One of my previous games :)
    - this version is partially inspired by one finger death punch
Sideways version of that game. 

*/


//fonts
var fontBold; // from Google Fonts
//SFX 
//https://p5js.org/examples/sound-playback-rate.html says that you can change pitch using playback rate so I'll use that to gain variety
var SFXSwordSlice, SFXSwordDeflect, SFXSwordMiss; //https://pixabay.com/sound-effects/search/slash/   samurai slash, Sword Hit, Slash
var SFXDamaged //https://pixabay.com/sound-effects/search/damage/ Punch 2
//MUSIC
var menuMusic; //PERITUNE https://peritune.com/blog/2023/01/07/awayuki/ 
var gameMusic; //PERITUNE https://peritune.itch.io/battle-tracks-jrpg-battle-music-collection PRAIRIE5


//A variable to store the current game state so there can be a start, game, and end screens
var GAMESTATE = 0; // 0 -> START, 1 -> GAME, 2 -> END

//for the floor and ceiling
var floorHeight = 100;
var ceilHeight = 200;

//variables for the camera
var nextX = 0;
var nextY = 0;
var nextScale = 5;
var nextRot = 0;
var randRot = 0;
//will hold all enemies
var enemyList = [];
//will hold all projectiles
var projectileList = [];
//will hold all effects
var effectList = [];

//list of potential enemy colors
colorList = ['#ff8bf9','#bea6ff','#6a98b6'];

//WAVE SYSTEM
var curWave = 1;
var enemiesToSpawn = 0;
var projectilesToSpawn = 6;
var spawnTime = 100;
var spawnTimer = 50;
var projSpawnTime = 50;
var projSpawnTimer = 50;

//SCREEN UI alpha values to smoothly fade between scenes
var startAlpha = 0;
var gameAlpha = 0;
var endAlpha = 0;
//SCORE
var totalPoints = 0;
var highScore = 0;
//health ui
var hpUI = 1;
//screenshake timer
var screenShakeTimer = 0;
//damage timer for an orange screen flash
var damageTimer = 0;
var damageDuration = 20;

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
    //if blocked once already, don't punish a "whiff"
    successfulBlock: false,
    //health variables
    hp: 10,
    maxhp: 10,

    //particle trail
    trail: [],
    trailCount: 40,

    //function to set the correct variable states for the game
    reset: function(){
        //positions
        this.x= 0;
        this.nextX= 0;
        this.y= 0;

        //body size
        this.s= 50;
        
        //sword properties
        this.swordY= -.5;
        this.swordSize= 4;
        this.swordHeight= 40;
        //outer range to slice
        this.sRange= 300; // should lerp to this point
        //inner range to block
        this.innerRange= 150;
        this.successfulBlock= false;
        this.hp= 6;
        this.maxhp= 6;
        this.trail = [];
        //set up the trail particles
        for(i = 1; i <= this.trailCount; i++){
            this.trail.push(new ParticleTrail(15,.5,i*15/this.trailCount));
        }
    },
    //display function
    display: function() {
        push();
        noStroke();
        //display the particle trail behind everything
        for(i = 0; i < this.trail.length; i++){
            this.trail[i].display();
        }
        //smoothly move the player
        this.x = lerp(this.x, this.nextX, 0.1);
        //shrink/expand the range to its normal amount gradually over time
        this.sRange = lerp(this.sRange, 300, 0.0025);
        //make the player "breath"
        this.s = 50 + sin(frameCount*10);

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
            //sword is raised to block left
            TryBlock(true);
            this.swordY = lerp(this.swordY, -3.5, .5);
        } else if (keyIsDown(RIGHT_ARROW)) {
            //sword is raised to block right
            TryBlock(false);
            this.swordY = lerp(this.swordY, -3.5, .5);
        } else {
            //sword released or not held
            this.successfulBlock = false;
            this.swordY = lerp(this.swordY, -.5, .3);
        }

        if(GAMESTATE == 1 && this.hp <= 0){
            //lose game when hp <= 0
            GoToDeathScreen();
            var sfx = SFXDamaged;
            sfx.rate(.7);
            sfx.play();
        }
        pop();
    }
};

class ParticleTrail{
    //position
    x = 0;
    y = 0;
    //original size
    originalS = 20;
    //decay over time
    decayRate = 0.5;
    constructor(s, decayRate = 0.5, startingPoint){
        this.x = player.x;
        this.y = player.y + random(-1,1)*3;
        this.originalS = s;
        this.s = s - startingPoint;
        this.decayRate = decayRate;
    }
    display(){
        push();
        //color 
        var c =lerpColor(color('#ffffff'),color('#ff9a9a'), this.s/this.originalS);
        fill(c);
        rectMode(CENTER);
        rect(this.x,this.y,this.s);
        //size should decay to 0
        this.s = constrain(this.s - this.decayRate, 0, this.originalS);
        if(this.s<=0){
            //when 0, reset to starting position with some random variance
            this.x = player.x;
            this.y = player.y + random(-1,1)*3; 
            this.s = this.originalS;
        }
        pop();
    }
}

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
    //score to give when defeated
    scoreValue = 100;
    constructor(direction, speed, x){
        this.direction = direction;
        this.speed = speed;
        this.x = x;
        //random color
        this.col = color(colorList[floor(random(0, colorList.length ))]);
    }
    display(){
        push();
        noStroke();
        //should fade out when game ends
        this.col.setAlpha(gameAlpha);
        fill(this.col);
        rectMode(CENTER);
        rect(this.x,this.y, this.s)
        //movement brain
        if(this.x > player.x) { //right
            this.direction = -1;
        } else {
            this.direction = 1;
        }

        //during gameplay
        if(GAMESTATE==1){
            //move towards direction
            this.x += this.speed * this.direction;

            //damage player if colliding
            if(abs(this.x - player.x) < this.s/2){
                //try attacking the player
                if(screenShakeTimer <= 0){
                    player.hp = constrain(player.hp-1, 0, player.maxhp);
                    screenShakeTimer=20;
                    damageTimer = damageDuration;
                    var sfx = SFXDamaged;
                    sfx.rate(random(.8,1.5));
                    sfx.play();
                } else { //block because of invincibility period after damaged or attack
                    effectList.push(new FadingText(random(-20,20), random(250,280), "CLUTCH!",20,40));
                    var sfx = SFXSwordDeflect;
                    sfx.rate(random(.8,1.5));
                    sfx.play();
                }
                //remove this enemy from the list
                var ind = enemyList.indexOf(this);
                enemyList.splice(ind,1);
            }
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
    //score to give when defeated
    scoreValue = 50;
    constructor(direction, speed, x){
        this.direction = direction;
        this.speed = speed;
        this.x = x;
        //random color
        this.col = color(colorList[floor(random(0, colorList.length ))]);
        this.y = random(-20,20);
    }
    display(){
        push();
        noStroke();
        //fade out when game over
        this.col.setAlpha(gameAlpha);
        fill(this.col);
        this.t += 1;
        translate(this.x,this.y);
        //spinning
        rotate(this.t*10 * this.direction);
        triangle(0,-this.s/2,-this.s/2, this.s/2,this.s/2,this.s/2)
        //movement brain
        if(this.x > player.x) { //right
            this.direction = -1;
        } else {
            this.direction = 1;
        }
        //during gameplay
        if(GAMESTATE==1){
            //move towards direction
            this.x += this.speed * this.direction;

            //damage player if colliding
            if(abs(this.x - player.x) < this.s/2){
                //try attacking player
                if(screenShakeTimer <= 0){
                    player.hp = constrain(player.hp-1, 0, player.maxhp);
                    screenShakeTimer=20;
                    damageTimer = damageDuration;
                    var sfx = SFXDamaged;
                    sfx.rate(random(.8,1.5));
                    sfx.play();
                } else { //block because of invincibility period after damaged or attack
                    effectList.push(new FadingText(random(-20,20), random(250,280), "CLUTCH!",20,40));
                    var sfx = SFXSwordDeflect;
                    sfx.rate(random(.8,1.5));
                    sfx.play();
                }
                //remove this projectile from list
                var ind = projectileList.indexOf(this);
                projectileList.splice(ind,1);
            }
        }
        pop();
    }
}

class FadingText {
    //position
    x = 0;
    y = 0;
    //size
    s = 10;
    //speed
    spd = 0.5;
    //text
    text = "";
    //timer counter
    timer = 1;
    //overall duration
    dur = 1;
    constructor(x, y, str, s, dur){
        this.x = x;
        this.y = y;
        this.text = str;
        this.s = s;
        this.dur = dur;
        this.timer = dur;
    }
    display(){
        //fade out over time
        var a = this.timer/this.dur * 255;
        //move up over time
        this.y-=this.spd;
        //draw the stylized string
        drawStringOverlayed(-nextX+this.x,-nextY+this.y,this.text,this.s,a,color('#87114e'),color('#d0299b'),CENTER,CENTER);
        //decrement timer
        this.timer-=1;
        //if timer reaches 0, remove it
        if(this.timer <= 0){
            var ind = effectList.indexOf(this);
            effectList.splice(ind,1);
        }
    }
}

class SlashingEffect {
    //position
    x = 0;
    y = 0;
    //length
    s = 1000;
    //color
    col;
    //angle
    angle = 0;
    //timer and duration for growing the slice effect
    growingTime = 30;
    maxGrowingTime = 5;
    //timer and duration for decaying the slice effect
    decayTime = 30;
    maxDecayTime = 5;
    constructor(x, y, col){
        this.x = x;
        this.y = y;
        this.col = col;
        if(this.x > player.x){ //right
            //angle that indicates rightwards slash
            this.angle = random(-90,90);
        } else {
            //angle that indicates leftwards slash
            this.angle = random(90,270);
        }
        this.growingTime = this.maxGrowingTime;
        this.decayTime = this.maxDecayTime;
        //when slice appears, juice
        screenShakeTimer = 10;
    }
    display(){
        push();
        //display settings
        translate(this.x,this.y);
        rotate(this.angle);
        strokeCap(SQUARE);
        stroke(this.col);
        strokeWeight(5);
        if(this.growingTime > 0){
            //make slice grow
            this.growingTime--;
            line(0-this.s/2,0, 0-this.s/2+(1-(this.growingTime/this.maxGrowingTime))*this.s, 0);
        } else if(this.decayTime > 0){
            //make slice decay
            this.decayTime--;
            line(0+this.s/2-(this.decayTime/this.maxDecayTime)*this.s, 0, 0+this.s/2, 0);
        } else {
            //remove from effect list
            var ind = effectList.indexOf(this);
            effectList.splice(ind,1);
        }
        pop();
    }
}


function preload() {
    //load all assets
    fontBold = loadFont('assets/Raleway-SemiBold.ttf');
    SFXSwordSlice = loadSound('assets/samurai-slash.mp3');
    SFXSwordDeflect = loadSound('assets/sword-hit.mp3');
    SFXSwordMiss = loadSound('assets/slash.mp3');
    SFXDamaged = loadSound('assets/damaged.mp3');
    menuMusic = loadSound('assets/menu_music.mp3');
    gameMusic = loadSound('assets/game_loop.mp3');

}

function setup() {
    //start settings
    createCanvas(900, 400);
    angleMode(DEGREES);
    nextX = -player.x-50;
    nextY = height / 2;
    startAlpha = 255;
    //https://p5js.org/examples/sound-play-mode.html
    SFXSwordDeflect.playMode('sustain'); //so that the sfx can overlay
    SFXSwordMiss.playMode('sustain');
    SFXSwordSlice.playMode('sustain');
    menuMusic.setVolume(0.1);
    gameMusic.setVolume(0.1);
    GoToStartScreen();
}
  
function draw() {
    background("#1c1425");
    //shake whole screen while timer is above 0
    if(screenShakeTimer > 0){
        screenShakeTimer--;
        var magnitude = screenShakeTimer;
        translate(random(-1,1)*magnitude,random(-1,1)*magnitude);
    }
    //for damage flash
    if(damageTimer>0){
        damageTimer--;
    }
    //set a high score whenever total points is higher than it
    if(totalPoints > highScore){
        highScore = totalPoints;
    }
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
            nextRot = lerp(nextRot, 0, 0.1);
            rotate(nextRot);
            scale(nextScale);
            translate(nextX, 0);
            //display player
            player.display();
            //display arena
            drawFloor();
            drawCeil();
            //display UI
            drawStringOverlayed(player.x + 130,-10, "BALL\nBLADE\nHALL", 15, startAlpha);
            drawString(player.x + 130,20, "a game by taneim miah", 5, startAlpha);
            drawString(player.x + 130,31, "press SPACE to start", 8, startAlpha);
            rotate(0);
            drawStringOverlayed(player.x,player.y-40,"GAME OVER",50,endAlpha,color('#1d1187'),color('#c48e2b'),CENTER,CENTER);
            drawStringOverlayed(player.x+145,player.y-10,"POINTS: "+totalPoints,15,endAlpha,color('#1d1187'),color('#c48e2b'),RIGHT,TOP);
            drawStringOverlayed(player.x+145,player.y+10,"HIGH SCORE: "+highScore,15,endAlpha,color('#1d1187'),color('#c48e2b'),RIGHT,TOP);
            drawStringOverlayed(player.x,player.y+50,"PRESS SPACE TO RESTART",20,endAlpha,color('#871134'),color('#e46931'),CENTER,CENTER);
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
            nextRot = lerp(nextRot, 0, 0.1);
            rotate(nextRot);
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
            drawStringOverlayed(player.x + 130,-10, "BALL\nBLADE\nHALL", 15, startAlpha);
            drawString(player.x + 130,20, "a game by taneim miah", 5, startAlpha);
            drawString(player.x + 130,31, "press SPACE to start", 8, startAlpha);
            drawScoreGame(-nextX-365,nextY-545, gameAlpha);
            drawHP(-nextX+365,nextY-545,gameAlpha);
            for(i = 0; i<effectList.length; i++){
                //display all effects
                effectList[i].display();
            }
            push();
                 //damage flash
            var col = color("#ff0000");
            col.setAlpha(damageTimer*60/(damageDuration));
            fill(col);
            noStroke();
            rect(-nextX-width,-nextY-height,2*width,2*height);
            pop();
            if(curWave == 1){ //tutorial wave 1: projectiles
                drawStringOverlayed(-nextX,-nextY+340,"HOLD ARROW KEY IN DIRECTION OF INCOMING PROJECTILE",20,gameAlpha,color('#87114e'),color('#d0299b'),CENTER,CENTER);
                drawStringOverlayed(-nextX,-nextY+360,"to block when it reaches your inner zone",15,gameAlpha,color('#87114e'),color('#d0299b'),CENTER,CENTER);
            } else if(curWave == 2){ //tutorial wave 2: enemy
                drawStringOverlayed(-nextX,-nextY+340,"RELEASE ARROW KEY IN DIRECTION OF INCOMING ENEMY",20,gameAlpha,color('#87114e'),color('#d0299b'),CENTER,CENTER);
                drawStringOverlayed(-nextX,-nextY+360,"to slice when it reaches your outer zone",15,gameAlpha,color('#87114e'),color('#d0299b'),CENTER,CENTER);
            }
            //UI LERPERS
            startAlpha = lerp(startAlpha, 0, .05);
            gameAlpha = lerp(gameAlpha, 255, .05);
            endAlpha = lerp(endAlpha, 0, .05);
            //display effects

            //WAVE SYSTEM
            var speedMult = 1; // make speed increase as waves increase
            if(curWave > 2){ 
                speedMult = (4.7*curWave)/(4.7+curWave) - .7; 
                //approaches 4 multiplied speed after a long time
                //4 is a REALLY hard speed, but definitely doable :^) (cause i tested it myself )
            }
            //go to next wave
            if(enemiesToSpawn == 0 && enemyList.length == 0 && projectilesToSpawn == 0 && projectileList.length == 0){
                curWave+=1;
                effectList.push(new FadingText(0, 200, "WAVE "+curWave,65,100));
                spawnTimer = 200; // generous gap for spawn timer
                projSpawnTimer = 200; // generous gap for spawn timer
                if(curWave==2){ //tutorial for enemies
                    enemiesToSpawn = 6;
                    projectilesToSpawn = 0;
                } else { //regular spawn pattern
                    enemiesToSpawn = 5*(curWave-1) + 3;
                    projectilesToSpawn = 10*(curWave-1)+3;
                }
                if(player.hp > 0){ //heal player by 1
                    player.hp = constrain(player.hp+1, 0, player.maxhp);
                }
            }
            //enemy spawn handler during wave
            if(spawnTimer > 0){
                spawnTimer-=1;
            }else{
                if(enemiesToSpawn > 0){
                    spawnTimer = spawnTime/speedMult; //spawnTimer based on speed multiplier
                    //random direction
                    var randDir = random(0,100);
                    if(randDir <50){
                        randDir = -1;
                    } else {
                        randDir = 1;
                    }
                    //spawn enemy
                    enemyList.push(new Enemy(randDir, 2*speedMult, player.x+randDir*-500));
                    enemiesToSpawn-=1;
                }   
            }
            if(projSpawnTimer > 0){
                projSpawnTimer-=1;
            }else{
                if(projectilesToSpawn > 0){
                    projSpawnTimer = projSpawnTime/speedMult; //spawnTimer based on speed multiplier
                    //random direction
                    var randDir = random(0,100);
                    if(randDir <50){
                        randDir = -1;
                    } else {
                        randDir = 1;
                    }
                    //spawn projectile
                    projectileList.push(new Projectile(randDir,4*speedMult,player.x+randDir*-500));
                    projectilesToSpawn-=1;
                }
            }
            break;
        case 2:
            //END SCREEN
            //CAMERA STUFF
            nextX = lerp(nextX, -player.x, .1);
            nextY = lerp(nextY, height / 2 , .1);
            translate(width/2, nextY);
            nextScale = lerp(nextScale, 3, 0.05);
            //angled rotation for end screen for style
            nextRot = lerp(nextRot, randRot, 0.1);
            rotate(nextRot);
            scale(nextScale);
            translate(nextX, 0);
            
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
            
            drawStringOverlayed(player.x + 130,-10, "BALL\nBLADE\nHALL", 15, startAlpha);
            drawString(player.x + 130,20, "a game by taneim miah", 5, startAlpha);
            drawString(player.x + 130,31, "press SPACE to start", 8, startAlpha);

            rotate(-nextRot);
            drawScoreGame(-nextX-365,nextY-545, gameAlpha);
            drawHP(-nextX+365,nextY-545,gameAlpha);

            push();
            rotate(nextRot);
            var col = color("#ff0000");
            col.setAlpha(60);
            fill(col);
            noStroke();
            rect(-nextX-width,-nextY-height,2*width,2*height);
            pop();
            rotate(nextRot);
            //display end screen stuff
            drawStringOverlayed(player.x,player.y-40,"GAME OVER",50,endAlpha,color('#1d1187'),color('#c48e2b'),CENTER,CENTER);
            drawStringOverlayed(player.x+145,player.y-10,"POINTS: "+totalPoints,15,endAlpha,color('#1d1187'),color('#c48e2b'),RIGHT,TOP);
            drawStringOverlayed(player.x+145,player.y+5,"HIGH SCORE: "+highScore,15,endAlpha,color('#1d1187'),color('#c48e2b'),RIGHT,TOP);
            drawStringOverlayed(player.x,player.y+40,"PRESS SPACE TO RESTART",20,endAlpha,color('#871134'),color('#e46931'),CENTER,CENTER);
            
            //UI LERPERS
            startAlpha = lerp(startAlpha, 0, .05);
            gameAlpha = lerp(gameAlpha, 0, .05);
            endAlpha = lerp(endAlpha, 255, .05);
            break;
        default:
            break;
    }
}

//function to draw hp bar
function drawHP(x,y,a){
    push();
    noStroke();
    translate(x,y);
    
    scale(-1,1);
    rotate(7);
    var c = color("#282130");
    c.setAlpha(a);
    fill(c);
    rect(2,2,200,50);
    c = color("#282130");
    c.setAlpha(a);
    fill(c);
    rect(2+80,2,200-80,75);
    c = color("#49374a")
    c.setAlpha(a);
    fill(c);
    rect(0,0,200,50);
    c = color("#ff4040")
    c.setAlpha(a);
    fill(c);
    //make it so bar fill corresponds to hp%
    hpUI = lerp(hpUI, player.hp/player.maxhp, .2);
    rect(0,0,200 * hpUI,50);
    scale(-1,1);
    drawStringOverlayed(-86,2+50,"HEALTH",20,a,color('#87114e'),color('#d0299b'), RIGHT, TOP, 1)
    drawStringOverlayed(-200+2,50-2,player.hp,25,a,color('#7b080c'),color('#f9391c'), LEFT, TOP, 1.5);
    pop();
}

//function to draw score ui
function drawScoreGame(x, y, a){
    push();
    noStroke();
    translate(x, y);
    
    rotate(7);
    var c = color("#282130");
    c.setAlpha(a);
    fill(c);
    rect(2,2,200,50);
    c = color("#282130");
    c.setAlpha(a);
    fill(c);
    rect(2+80,2,200-80,75);
    c = color("#49374a")
    c.setAlpha(a);
    fill(c);
    rect(0,0,200,50);
    //points and wave
    drawStringOverlayed(12,2,"SCORE",25,a,color('#c41871'),color('#ff32be'), LEFT, TOP, 1)
    drawStringOverlayed(200-4,50,totalPoints,40,a,color('#7b080c'),color('#f9391c'), RIGHT, BOTTOM, 1.5);
    drawStringOverlayed(4+80,2+50,"WAVE",20,a,color('#87114e'),color('#d0299b'), LEFT, TOP, 1)
    drawStringOverlayed(200-4,50-2,curWave,25,a,color('#7b080c'),color('#f9391c'), RIGHT, TOP, 1.5);
    pop();
} 
//function to draw stylized string thats overlayed on eachother to get a sort of 3d effect
function drawStringOverlayed(x, y, str, size, a, c1 = color('#da5954'), c2= color('#ff8181'), halign = RIGHT, valign = CENTER, diff = .5){
    push();
    textAlign(halign, valign);
    textFont(fontBold);
    textSize(size);
    var c = c1;
    c.setAlpha(a);
    fill(c);
    text(str, x+diff, y+diff);
    c = c2
    c.setAlpha(a);
    fill(c);
    text(str, x, y);
    pop();
}
//function to draw a singular string
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

//draw floor of arena
function drawFloor(){
    push();
    noStroke();
    fill("#342d3b");
    rect(player.x-width,25,width*2,100);
    pop();
}
//draw ceiling of arena
function drawCeil(){
    push();
    noStroke();
    fill("#342d3b");
    rect(player.x-width,25-ceilHeight,width*2,-height);
    pop();
}

//key press handler
function keyPressed(){
    if(keyCode == 49 || keyCode == 82){ //1 or R
        if(GAMESTATE==0){
            menuMusic.stop();//restart music
        }
        GoToStartScreen()
    } else if(keyCode == 32){ //SPACE
        if(GAMESTATE == 0){
            GoToGame();
        }
        if(GAMESTATE == 2){
            GoToStartScreen();
        }
    } else if (keyCode == 50) { //2
        GoToGame();
    }
    else if(keyCode == 51){ //3
        GoToDeathScreen()
    }
    
}

//key release handler
function keyReleased(){
    if(keyCode == LEFT_ARROW){
        if(GAMESTATE == 1) {
            //slice in the left direction
            Slice(true);
        }
    } else if(keyCode == RIGHT_ARROW){
        if(GAMESTATE == 1) {
            //slice in the right direction
            Slice(false);
        }
    } 
}

function Slice(isLeft){ //bool to determine direction
    //check if enemies are within range and find the closest enemy that is within the range
    //current closest is just outside of range, meaning none is in range
    var currentClosest = player.sRange/2 + 1;
    var curClosestIndex = -1;
    //iterate through enemies
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
        //slice the enemy if within range
        UpdatePoints(enemyList[curClosestIndex].scoreValue);
        player.nextX = enemyList[curClosestIndex].x; //move to enemy position
        effectList.push(new SlashingEffect(enemyList[curClosestIndex].x,enemyList[curClosestIndex].y,color("#ffffff")));
        enemyList.splice(curClosestIndex,1); // remove enemy from array
        player.sRange = constrain(player.sRange+100, 20, 900); //increase range
        effectList.push(new FadingText(random(-20,20), random(250,280), "SLICE!",20,40));
        var sfx = SFXSwordSlice;
        sfx.rate(random(.8,1.5));
        sfx.play();
    } else {
        if(!player.successfulBlock){
            //if not in range and did not block, that means you missed
            //punish player for missing
            player.sRange = constrain(player.sRange-30, player.innerRange, 900);
            UpdatePoints(-10);
            effectList.push(new FadingText(random(-20,20), random(250,280), "MISS",20,40));
            var sfx = SFXSwordMiss;
            sfx.rate(random(.8,1.5));
            sfx.play();
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
    player.sRange = constrain(player.sRange-1, player.innerRange, 10000);
    if(index != -1){
        //if there is a projectile to deflect, deflect it
        UpdatePoints(projectileList[index].scoreValue);
        effectList.push(new SlashingEffect(projectileList[index].x,projectileList[index].y,color("#000000")));
        projectileList.splice(index,1); //remove the projectile
        player.successfulBlock = true; // reward the player
        player.sRange = constrain(player.sRange+40, player.innerRange, 900);
        effectList.push(new FadingText(random(-20,20), random(250,280), "DEFLECT!",20,40));
        var sfx = SFXSwordDeflect;
        sfx.rate(random(1,1.5));
        sfx.play();
    }
}
//function to update the points and give a visual for it
function UpdatePoints(value){
    var str = "" + value;
    if(value > 0){
        str = "+" + str;
    }
    //vfx
    effectList.push(new FadingText(-150,100,str,30,40));
    totalPoints += value;
}
//function to go to the start
function GoToStartScreen(){
    //play correct music
    gameMusic.stop();
    if(!menuMusic.isPlaying()){
        menuMusic.loop();
    }
    //set the state and the values it needs to be
    player.nextX = 0;
    player.x = 0;
    player.y = 0;
    if(GAMESTATE == 0){
        nextX = -player.x - 50;
    } else {
        nextX = -player.x;
    }
    GAMESTATE = 0;
    player.reset();
}

//function to go to the game state
function GoToGame(){
    //play correct music
    gameMusic.stop();
    menuMusic.stop();
    gameMusic.loop();
    //set the state and the values it needs to be
    GAMESTATE = 1;
    totalPoints = 0;
    curWave = 1; 
    enemiesToSpawn = 0;
    projectilesToSpawn = 6;
    spawnTimer = 200;
    projSpawnTimer = 200;
    effectList = [];
    effectList.push(new FadingText(0, 300, "WAVE 1",65,200));
    enemyList = []; // clear array
    projectileList = [];
    
    hpUI = 1;
    
}

function GoToDeathScreen(){
    //play correct music
    gameMusic.stop();
    if(!menuMusic.isPlaying()){
        menuMusic.loop();
    }
    //set the state and the values it needs to be
    GAMESTATE = 2;
    
    randRot = random(-7,7); //angled rotation for style
}