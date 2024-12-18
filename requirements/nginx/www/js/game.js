function runGame() {
    let gameOver = false;

    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    let paddleWidth = 20;
    let paddleHeight = 100;
    let ballRadius = 10;
    let previousBallPositions = [];
    const winWidth = 800;
    const winHeight = 600;

    const roomName = "room1"; // Replace with dynamic room name if needed
    const socket = new WebSocket('wss://' + window.location.host + '/game/rooms/' + roomName + '/');

    socket.onopen = function() {
        console.log('WebSocket connection established');
        console.log('socket', socket);
    };

    socket.onerror = function(error) {
        console.error('WebSocket error:', error);
        console.error('window.location.host:', window.location.host);
    };

    socket.onmessage = function(event) {
        if (gameOver) return;

        // console.log('Received message:', event.data);
        const gameState = JSON.parse(event.data);
        if (gameState.type === 'handler') {
            return;
        }
        if (gameState.score[0] >= 10 || gameState.score[1] >= 10) {
            gameOver = true;
            alert('Game Over! Player ' + gameState.winner + ' wins!');
            stopGameInstance();
            return;
        }
        drawGame(gameState);
    };

    let commandBuffer = {};

    function handleKeyDown(event) {
        commandBuffer.type = 'handler';
        if (event.key === 'w') commandBuffer.move_left_up = true;
        if (event.key === 's') commandBuffer.move_left_down = true;
        if (event.key === 'ArrowUp') commandBuffer.move_right_up = true;
        if (event.key === 'ArrowDown') commandBuffer.move_right_down = true;
    }

    function handleKeyUp(event) {
        commandBuffer.type = 'handler';
        if (event.key === 'w') commandBuffer.move_left_up = false;
        if (event.key === 's') commandBuffer.move_left_down = false;
        if (event.key === 'ArrowUp') commandBuffer.move_right_up = false;
        if (event.key === 'ArrowDown') commandBuffer.move_right_down = false;
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    setInterval(() => {
        if (Object.keys(commandBuffer).length > 0) {
            socket.send(JSON.stringify(commandBuffer));
            commandBuffer = {};
        }
    }, 16); // Send commands every 16ms (60fps)

    function resizeCanvas() {
        const width = window.innerWidth * 0.8;
        const height = window.innerHeight * 0.8;
        canvas.width = width;
        canvas.height = height;

        paddleWidth = width * 0.025;
        paddleHeight = height * 0.15;
        ballRadius = width * 0.0125;
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function drawBackground() {
        const background = new Image();
        background.src = '../img/windows98bureau_plain_hill.png';
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

        //ctx.fillStyle = "#008080";
        //ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawPaddles(state) {
        ctx.fillStyle = "white";
        ctx.fillRect(state.paddle_left.x / winWidth * canvas.width, state.paddle_left.y / winHeight * canvas.height, paddleWidth, paddleHeight);
        ctx.fillRect(state.paddle_right.x / winWidth * canvas.width, state.paddle_right.y / winHeight * canvas.height, paddleWidth, paddleHeight);

       
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        ctx.strokeRect(state.paddle_left.x / winWidth * canvas.width, 
                       state.paddle_left.y / winHeight * canvas.height, 
                       paddleWidth, paddleHeight);
        ctx.strokeRect(state.paddle_right.x / winWidth * canvas.width, 
                       state.paddle_right.y / winHeight * canvas.height, 
                       paddleWidth, paddleHeight);
    }

    function drawBall(state) {
        previousBallPositions.push({x: state.ball.x, y: state.ball.y});
        if (previousBallPositions.length > 10) {
            previousBallPositions.shift();
        }

        ctx.globalAlpha = 0.3;
        previousBallPositions.forEach((pos) => {
            ctx.beginPath();
            ctx.arc(pos.x / winWidth * canvas.width, pos.y / winHeight * canvas.height, ballRadius, 0, Math.PI * 2);
            ctx.fillStyle = "white";
            ctx.fill();
            ctx.closePath();
        });

        ctx.globalAlpha = 1.0;
        ctx.beginPath();
        ctx.arc(state.ball.x / winWidth * canvas.width, state.ball.y / winHeight * canvas.height, ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
    }

    function drawScore(state) {
        ctx.font = `${canvas.width * 0.05}px Arial`;
        ctx.fillStyle = "white";
        ctx.fillText(state.score[0], canvas.width / 4, canvas.height * 0.1);
        ctx.fillText(state.score[1], canvas.width * 3 / 4, canvas.height * 0.1);
        ctx.strokeText(state.score[0], canvas.width / 4, canvas.height * 0.1);
        ctx.strokeText(state.score[1], canvas.width * 3 / 4, canvas.height * 0.1);
    }
    
    function drawGame(state) {
        if (!state || !state.paddle_left || !state.paddle_right || !state.ball || !state.score) {
            console.error('Invalid game state:', state);
            return;
        }

        ctx.fillStyle = "blue";
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawBackground();

        drawPaddles(state);

        drawBall(state);

        drawScore(state);

        requestAnimationFrame(drawGame);
    }

}
