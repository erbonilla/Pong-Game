// Variable Declarations
var playerPaddle, computerPaddle, ball;
var playerScore = 0;
var computerScore = 0;
var winningScore = 5;
var gamePaused = false;
var backgroundImage, playerPaddleImage, computerPaddleImage, ballImage, bounceSound, scoreSound;
var spinAngle = 0;
var difficulty = 0.15; // Adjust this value to control AI difficulty

function preload() {
    backgroundImage = loadImage("fondo1.png");
    playerPaddleImage = loadImage("barra1.png");
    computerPaddleImage = loadImage("barra2.png");
    ballImage = loadImage("bola.png");
    bounceSound = loadSound("justinvoke__bounce.wav");
    scoreSound = loadSound("game_over_mono.wav");
}

function setup() {
    createCanvas(800, 400);
    playerPaddle = new Paddle(true);
    computerPaddle = new Paddle(false);
    ball = new Ball();
}

function draw() {
    background(backgroundImage);
    
    if (gamePaused) {
        displayWinner();
        return;
    }

    // Draw paddles, ball, center line, and frames
    drawCenterLine();
    drawFrames();
    playerPaddle.show();
    computerPaddle.show();
    ball.show();
    
    // Update paddles and ball
    playerPaddle.update();
    computerPaddle.update(ball);
    ball.update();
    
    // Display score
    displayScore();
    
    // Check for winning condition
    checkWinningCondition();
}

function drawCenterLine() {
    stroke(255);
    line(width / 2, 0, width / 2, height);
}

function drawFrames() {
    fill('#2B3FD6');
    rect(0, 0, width, 10); // Top frame
    rect(0, height - 10, width, 10); // Bottom frame
}

function displayScore() {
    textSize(32);
    fill(255);
    textAlign(CENTER, TOP);
    text(playerScore, width / 4, 20);
    text(computerScore, 3 * width / 4, 20);
}

function displayWinner() {
    textSize(48);
    fill(255);
    textAlign(CENTER, CENTER);
    var winner = playerScore >= winningScore ? "Player Wins!" : "Computer Wins!";
    text(winner, width / 2, height / 2);

    // Added prompt to restart the game
    textSize(24);
    text("Press 'R' to Restart", width / 2, height / 2 + 50);
}

function checkWinningCondition() {
    if (playerScore >= winningScore || computerScore >= winningScore) {
        gamePaused = true;
    }
}

// Added function to reset the game
function resetGame() {
    playerScore = 0;
    computerScore = 0;
    gamePaused = false;
    ball.reset();
}

// Added function to handle key presses
function keyPressed() {
    if (key === 'r' || key === 'R') {
        if (gamePaused) {
            resetGame();
        }
    }
}

// Paddle Constructor Function
function Paddle(isPlayer) {
    this.width = 10;
    this.height = 70;
    this.isPlayer = isPlayer;
    this.x = this.isPlayer ? 20 : width - 30;
    this.y = height / 2 - this.height / 2;
    this.speed = 5;
}

Paddle.prototype.show = function() {
    if (this.isPlayer) {
        image(playerPaddleImage, this.x, this.y, this.width, this.height);
    } else {
        image(computerPaddleImage, this.x, this.y, this.width, this.height);
    }
};

Paddle.prototype.update = function(ball) {
    if (this.isPlayer) {
        this.y = constrain(mouseY - this.height / 2, 10, height - 10 - this.height);
    } else {
        // Improved AI movement with adjustable difficulty
        var targetY = ball.y - this.height / 2;
        this.y += (targetY - this.y) * difficulty;
        this.y = constrain(this.y, 10, height - 10 - this.height);
    }
};

// Ball Constructor Function
function Ball() {
    this.size = 20;
    this.reset();
}

Ball.prototype.reset = function() {
    this.x = width / 2;
    this.y = height / 2;
    this.xSpeed = Math.random() > 0.5 ? 7 : -7;
    this.ySpeed = Math.random() * 8 - 4; // Random between -4 and 4
    this.resetDelay = 60; // Adding delay before ball starts moving again
    spinAngle = 0; // Reset spin angle
};

Ball.prototype.show = function() {
    push();
    translate(this.x + this.size / 2, this.y + this.size / 2);
    rotate(spinAngle);
    imageMode(CENTER);
    image(ballImage, 0, 0, this.size, this.size);
    pop();
};

Ball.prototype.update = function() {
    if (this.resetDelay > 0) {
        this.resetDelay--;
        return;
    }

    this.x += this.xSpeed;
    this.y += this.ySpeed;
    spinAngle += 0.05 * (this.xSpeed + this.ySpeed) / 2; // Update spin angle based on speed
    
    // Ball collision with top and bottom frames
    if (this.y < 10 || this.y > height - 10 - this.size) {
        this.ySpeed *= -1;
        bounceSound.play();
    }
    
    // Ball collision with paddles
    if (this.collidesWith(playerPaddle)) {
        this.adjustAngle(playerPaddle);
        this.xSpeed = Math.abs(this.xSpeed) * 1.05; // Set xSpeed to positive
        this.x = playerPaddle.x + playerPaddle.width;
        bounceSound.play();
    }
    if (this.collidesWith(computerPaddle)) {
        this.adjustAngle(computerPaddle);
        this.xSpeed = -Math.abs(this.xSpeed) * 1.05; // Set xSpeed to negative
        this.x = computerPaddle.x - this.size;
        bounceSound.play();
    }

    // Cap the speed
    var maxSpeed = 15;
    this.xSpeed = constrain(this.xSpeed, -maxSpeed, maxSpeed);
    this.ySpeed = constrain(this.ySpeed, -maxSpeed, maxSpeed);

    // Ensure ySpeed is not too low
    if (Math.abs(this.ySpeed) < 2) {
        this.ySpeed = this.ySpeed > 0 ? 2 : -2;
    }
    
    // Ball out of bounds (scoring)
    if (this.x < 0) {
        computerScore++;
        scoreSound.play();
        narrateScore();
        this.reset();
    }
    if (this.x > width) {
        playerScore++;
        scoreSound.play();
        narrateScore();
        this.reset();
    }
};

Ball.prototype.collidesWith = function(paddle) {
    return (
        this.x < paddle.x + paddle.width &&
        this.x + this.size > paddle.x &&
        this.y > paddle.y &&
        this.y < paddle.y + paddle.height
    );
};

Ball.prototype.adjustAngle = function(paddle) {
    var relativeIntersectY = (this.y + this.size / 2) - (paddle.y + paddle.height / 2);
    var normalizedRelativeIntersectionY = relativeIntersectY / (paddle.height / 2);
    var maxBounceAngle = Math.PI / 4; // Maximum bounce angle of 45 degrees
    var bounceAngle = normalizedRelativeIntersectionY * maxBounceAngle;
    this.ySpeed = 7 * Math.sin(bounceAngle);
};

// Modified 'narrateScore()' function to use the Web Speech API
function narrateScore() {
    var narration = playerScore + " to " + computerScore;
    if ('speechSynthesis' in window) {
        var utterance = new SpeechSynthesisUtterance(narration);
        utterance.lang = 'en-US'; // Set language for narration
        utterance.rate = 1; // Set speech rate for better clarity
        window.speechSynthesis.speak(utterance);
    } else {
        console.error("SpeechSynthesis API not supported in this browser.");
    }
}
r