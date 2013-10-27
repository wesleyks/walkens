function Walken(canvas, canvasWidth, canvasHeight) {
	var context = canvas.getContext('2d'),
		width = canvasWidth,
		height = canvasHeight,
		grid = new Grid(context, width, height),
		acceleration = 1.0,
		maxVel = 3.0,
		px = 0.0,
		vx = 0.0,
		py = 0.0,
		vy = 0.0,
		playerList = [],
		uuid;
	
	function clamp(val, min, max) {
		return Math.min(Math.max(val, min), max);
	}

	function update() {
		vx *= 0.99;
		vy *= 0.99;
		px += vx;
		py += vy;
		for (var i = 0; i < playerList.length; i++) {
			playerList[i].x += playerList[i].vx;
			playerList[i].y += playerList[i].vy;
		}
	}

	function draw() {
		context.clearRect(0, 0, width, height);
		grid.drawBoard(px, py);
		context.beginPath();
		context.arc(width / 2, height / 2, 10, 0, Math.PI * 2);
		context.stroke();
		context.closePath();
		for (var i = 0; i < playerList.length; i++) {
			var player = playerList[i];
			if (player.uuid != uuid) {
				context.beginPath();
				context.arc(width / 2 + (parseFloat(player.x) - px), height / 2 + (parseFloat(player.y) - py), 10, 0, Math.PI * 2);
				context.stroke();
				context.closePath();
			}
		}
		
	}

	function run() {
		draw();
		update();
		requestAnimationFrame(run);
	}

	function updateAndGetNearby() {
		$.ajax({
			url: '/position',
			type: 'POST',
			data: {
				uuid: uuid,
				x: px,
				y: py,
				vx: vx,
				vy: vy
			},
			dataType: 'json'
		}).done(function(data) {
			playerList = data;
		});
		setTimeout(updateAndGetNearby, 100);
	}

	function start() {
		run();
		updateAndGetNearby();
	}

	function initialize(clientuuid) {
		uuid = clientuuid;
		$(document).keydown(function(e) {
			switch (e.which) {
				case 37: // left
					vx += -acceleration;
					break;
				case 38: // up
					vy += -acceleration;
					break;
				case 39: // right
					vx += acceleration;
					break;
				case 40: // down
					vy += acceleration;
					break;
			}
			vy = clamp(vy, -maxVel, maxVel);
			vx = clamp(vx, -maxVel, maxVel);
		});
	}
	this.start = start;
	this.initialize = initialize;
}