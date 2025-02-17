class PongWindow {
	constructor(type, roomNumber = 0) {
		this.commandBuffer = {};
		this.gameOver = false;
		this.type = type;
		this.roomName = '';
		this.socket = null;

		this.canvas = document.getElementById('gameCanvas');
		this.ctx = this.canvas.getContext('2d');
		this.winWidth = 800;
		this.winHeight = 600;
		this.paddleWidth = 20;
		this.paddleHeight = 100;
		this.ballRadius = 10;
		this.previousBallPositions = [];

		if (!roomNumber)
			this.roomNumber = Math.floor(Math.random() * 10000);
		else
			this.roomNumber = roomNumber;

		if (type === 'ai') {
			this.roomName = 'room_ai_' + this.roomNumber;
			this.socket = new WebSocket('wss://' + window.location.host + '/ai_game/rooms/' + this.roomName + '/');
		}
		else if (type === 'local') {
			this.roomName = 'room_local_' + this.roomNumber;
			this.socket = new WebSocket('wss://' + window.location.host + '/game/rooms/' + this.roomName + '/');
		}
		else {
			this.roomName = 'room_' + this.roomNumber;
			this.socket = new WebSocket('wss://' + window.location.host + '/game/rooms/' + this.roomName + '/');
		}

		this.handleKeyDown = this.handleKeyDown.bind(this);
		this.handleKeyUp = this.handleKeyUp.bind(this);
		this.resizeCanvas = this.resizeCanvas.bind(this);
		this.run = this.run.bind(this);
		this.close = this.close.bind(this);
		this.drawGame = this.drawGame.bind(this);
		this.drawBackground = this.drawBackground.bind(this);
		this.drawPaddles = this.drawPaddles.bind(this);
		this.drawBall = this.drawBall.bind(this);
		this.drawScore = this.drawScore.bind(this);
	}

	open() {
		const pongWindow = document.getElementById('PongGame');
		const gameOver = document.querySelector('.all-game-over');
		const gameOverButton = document.querySelector('.game-over-button');

		gameOver.style.display = 'none';

		if (pongWindow.style.display === 'none') {
			pongWindow.style.display = 'flex';
			history.pushState({ page: "pong" }, "", "#pong");
		}

		pongWindow.querySelector('.close-button').addEventListener('click', () => {
			pongWindow.style.display = 'none';
			window.createRoom = false;
			this.close();
		});

		gameOverButton.addEventListener('click', () => {
			document.querySelector('.all-game-over').style.display = 'none';
			pongWindow.style.display = 'none';
			window.createRoom = false;
			this.close();
		});
	}

	close() {
		if (this.socket.readyState === WebSocket.OPEN) {
			this.socket.close();
		}
		document.removeEventListener('keydown', this.handleKeyDown);
		document.removeEventListener('keyup', this.handleKeyUp);
		window.removeEventListener('resize', this.resizeCanvas);
		this.commandBuffer = {};
	}

	run() {
		this.open();

		window.addEventListener('popstate', (event) => {
			const pongWindow = document.getElementById('PongGame');

			pongWindow.style.display = 'none';
			window.createRoom = false;
			this.close();
		});

		document.addEventListener('keydown', this.handleKeyDown);
		document.addEventListener('keyup', this.handleKeyUp);

		setInterval(() => {
			if (Object.keys(this.commandBuffer).length > 0) {
				if (this.socket.readyState === WebSocket.OPEN) {
					this.socket.send(JSON.stringify(this.commandBuffer));
					this.commandBuffer = {};
				}
			}
		}, 16); // Send commands every 16ms (60fps)

		window.addEventListener('resize', this.resizeCanvas);
		this.resizeCanvas();

		this.socket.onopen = () => {
			console.log('WebSocket connection established');
			};

		this.socket.onclose = async (event) => {
			console.log('WebSocket connection closed, code:', event.code);
			if (event.code === 3000) {
				console.log('WebSocket connection closed, code:', event.code);
				try {
					const isRefreshed = await getRefreshToken();
					if (isRefreshed) {
						this.socket = new WebSocket('wss://' + window.location.host + '/game/rooms/' + this.roomName);
						this.run();
					}
					else {
						this.close();
						quitDesk();
						let expired_session = null;
						if (window.dataMap && window.dataMap.has('expired-session'))
							expired_session = window.dataMap.get('expired-session');
						else
							expired_session = 'Session expired';
						raiseAlert(expired_session);
					}
				}
				catch (error) {
					console.error('Failed during token refresh or reconnection:', error);
					this.close();
				}
			}
			else if (event.code === 3005) {
				let room_full = null;
				if (window.dataMap && window.dataMap.has('room-full'))
					room_full = window.dataMap.get('room-full');
				else
					room_full = 'Room is full';
				if (window.dataMap && window.dataMap.get('room-full'))
					raiseAlert(room_full);
				const pongWindow = document.getElementById('PongGame');
				pongWindow.querySelector('.close-button').click();
			}
		};

		this.socket.onerror = (error) => {
			console.error('WebSocket error:', error);
		};

		this.socket.onmessage = (event) => {
			if (this.gameOver) return;

			const gameState = JSON.parse(event.data);
			if (gameState.type === 'handler') {
				return;
			}
			this.drawGame(gameState);
			if (gameState.type === 'game_over') {
				this.gameOver = true;
				let gameOverPlayer = null;
				if (window.dataMap && window.dataMap.has('game-over-player'))
					gameOverPlayer = window.dataMap.get('game-over-player');
				else
					gameOverPlayer = 'Game Over! Player ';
				let gameOverWin = null;
				if (window.dataMap && window.dataMap.has('game-over-win'))
					gameOverWin = window.dataMap.get('game-over-win');
				else
					gameOverWin = ' wins!';
				triggerGameOverWindows(gameOverPlayer + gameState.winner + gameOverWin);
				this.socket.close();
				this.close();
				return;
			}
		};
	}

	handleKeyDown(event) {
		this.commandBuffer.type = 'handler';
		if (event.key === 'w') this.commandBuffer.move_left_up = true;
		if (event.key === 's') this.commandBuffer.move_left_down = true;
		if (event.key === 'ArrowUp') this.commandBuffer.move_right_up = true;
		if (event.key === 'ArrowDown') this.commandBuffer.move_right_down = true;
	}

	handleKeyUp(event) {
		this.commandBuffer.type = 'handler';
		if (event.key === 'w') this.commandBuffer.move_left_up = false;
		if (event.key === 's') this.commandBuffer.move_left_down = false;
		if (event.key === 'ArrowUp') this.commandBuffer.move_right_up = false;
		if (event.key === 'ArrowDown') this.commandBuffer.move_right_down = false;
	}

	resizeCanvas() {
        const width = window.innerWidth * 0.8;
        const height = window.innerHeight * 0.8;
        this.canvas.width = width;
        this.canvas.height = height;

        this.paddleWidth = width * 0.025;
        this.paddleHeight = height * 0.15;
        this.ballRadius = width * 0.0125;
    }

	drawBackground() {
		this.ctx.fillStyle = '#008080';
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
	}

	drawPaddles(state) {
		this.ctx.fillStyle = 'white';
		this.ctx.fillRect(state.paddle_left.x / this.winWidth * this.canvas.width,
						state.paddle_left.y / this.winHeight * this.canvas.height,
						this.paddleWidth, this.paddleHeight);
		this.ctx.fillRect(state.paddle_right.x / this.winWidth * this.canvas.width,
						state.paddle_right.y / this.winHeight * this.canvas.height,
						this.paddleWidth, this.paddleHeight);

		this.ctx.strokeStyle = '#000000';
		this.ctx.lineWidth = 2;
		this.ctx.strokeRect(state.paddle_left.x / this.winWidth * this.canvas.width,
							state.paddle_left.y / this.winHeight * this.canvas.height,
							this.paddleWidth, this.paddleHeight);
		this.ctx.strokeRect(state.paddle_right.x / this.winWidth * this.canvas.width,
							state.paddle_right.y / this.winHeight * this.canvas.height,
							this.paddleWidth, this.paddleHeight);
	}

	drawBall(state) {
        this.previousBallPositions.push({x: state.ball.x, y: state.ball.y});
        if (this.previousBallPositions.length > 10) {
            this.previousBallPositions.shift();
        }

        this.ctx.globalAlpha = 0.3;
        this.previousBallPositions.forEach((pos) => {
            this.ctx.beginPath();
            this.ctx.arc(pos.x / this.winWidth * this.canvas.width,
						pos.y / this.winHeight * this.canvas.height,
						this.ballRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = "white";
            this.ctx.fill();
            this.ctx.closePath();
        });

        this.ctx.globalAlpha = 1.0;
        this.ctx.beginPath();
        this.ctx.arc(state.ball.x / this.winWidth * this.canvas.width,
					state.ball.y / this.winHeight * this.canvas.height,
					this.ballRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = "white";
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.closePath();
    }

	drawScore(state) {
        this.ctx.font = `${this.canvas.width * 0.04}px Arial`;
        this.ctx.fillStyle = "white";
        this.ctx.fillText(state.score[0], this.canvas.width / 4, this.canvas.height * 0.13);
        this.ctx.fillText(state.score[1], this.canvas.width * 3 / 4, this.canvas.height * 0.13);
        this.ctx.strokeText(state.score[0], this.canvas.width / 4, this.canvas.height * 0.13);
        this.ctx.strokeText(state.score[1], this.canvas.width * 3 / 4, this.canvas.height * 0.13);
    }

	drawPlayerNames(state) {
		this.ctx.font = `${this.canvas.width * 0.025}px Arial`;
		this.ctx.fillStyle = "white";
		this.ctx.textAlign = 'center';
		this.ctx.fillText(state.players[0], this.canvas.width / 4, this.canvas.height * 0.055);
		this.ctx.fillText(state.players[1], this.canvas.width * 3 / 4, this.canvas.height * 0.055);
		this.ctx.strokeText(state.players[0], this.canvas.width / 4, this.canvas.height * 0.055);
		this.ctx.strokeText(state.players[1], this.canvas.width * 3 / 4, this.canvas.height * 0.055);
	}

	drawGame(state) {
		this.ctx.fillStyle = 'blue';
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		this.drawBackground();
		this.drawPaddles(state);
		this.drawBall(state);
		this.drawScore(state);
		this.drawPlayerNames(state);
	}
}
