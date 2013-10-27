function Walken(canvas, canvasWidth, canvasHeight, beacon, bg) {
	var context = canvas.getContext('2d'),
		width = canvasWidth,
		height = canvasHeight,
		grid = new Grid(context, width, height),
		acceleration = 1.0,
		maxVel = 3.0,
		maxBounds = 100000.0,
		px = 100 * Math.random() * (Math.random > 0 ? -1 : 1),
		vx = 0.0,
		py = 100 * Math.random() * (Math.random > 0 ? -1 : 1),
		vy = 0.0,
		playerList = [],
		previousPlayerCount = 2,
		uuid;
	
	function clamp(val, min, max) {
		return Math.min(Math.max(val, min), max);
	}
	function update() {
		//vx *= 0.99;
		//vy *= 0.99;
		px += vx;
		py += vy;
		if (Math.abs(px) > maxBounds || Math.abs(py) > maxBounds) {
			px -= vx;
			py -= vy;
		}
		for (var i = 0; i < playerList.length; i++) {
			//playerList[i].vx *= 0.99;
			//playerList[i].vy *= 0.99;
			playerList[i].x += playerList[i].vx;
			playerList[i].y += playerList[i].vy;
		}
		if (playerList.length > previousPlayerCount) {
			//beacon.play();
		}
		previousPlayerCount = playerList.length;
	}

	function draw() {
		context.clearRect(0, 0, width, height);
		grid.drawBoard(px, py);
		context.beginPath();
		for (var i = 0; i < playerList.length; i++) {
			var player = playerList[i];
			if (player.uuid != uuid) {
				context.beginPath();
				if (player.type == 'p') {
					context.fillStyle = '#5f5';
					context.arc(width / 2 + (parseFloat(player.x) - px), height / 2 - (parseFloat(player.y) - py), 10, 0, Math.PI * 2);
				} else {
					context.fillStyle = '#666';
					context.arc(width / 2 + (parseFloat(player.x) - px), height / 2 - (parseFloat(player.y) - py), 5, 0, Math.PI * 2);
				}
				context.fill();
			}
		}
		context.closePath();
		context.fillStyle = '#55f';
		context.beginPath();
		context.arc(width / 2, height / 2, 10, 0, Math.PI * 2);
		context.fill();
		context.closePath();
	}

	function run() {
		update();
		draw();
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
			for (var i = 0; i < playerList.length; i++) {
				playerList[i].vx = parseFloat(playerList[i].vx);
				playerList[i].vy = parseFloat(playerList[i].vy);
				playerList[i].x = parseFloat(playerList[i].x);
				playerList[i].y = parseFloat(playerList[i].y);
			}
		});
		setTimeout(updateAndGetNearby, 200);
	}

	function leaveMark() {
		$.ajax({
			url: '/mark',
			type: 'POST',
			data: {
				x: px,
				y: py
			}
		});
	}

	function start() {
		run();
		updateAndGetNearby();
		
		bg.addEventListener('ended', function() {
			bg.play();
		});
		//bg.play();
	}

	function initialize(clientuuid) {
		uuid = clientuuid;
		$(document).keydown(function(e) {
			switch (e.which) {
				case 37: // left
					vx += -acceleration;
					break;
				case 38: // up
					vy += acceleration;
					break;
				case 39: // right
					vx += acceleration;
					break;
				case 40: // down
					vy += -acceleration;
					break;
			}
			vy = clamp(vy, -maxVel, maxVel);
			vx = clamp(vx, -maxVel, maxVel);
		});
		$('#mark-button').click(function() {
			leaveMark();
		});
		$(canvas).click(function(e) {
			var clickX = e.offsetX - width / 2,
				clickY = height / 2 - e.offsetY,
				magnitude = Math.sqrt(clickY * clickY + clickX * clickX);
			if (magnitude > 10) {
				vx = 2 * maxVel * (clickX / magnitude) * (magnitude / width);
				vy = 2 * maxVel * (clickY / magnitude) * (magnitude / height);
			} else {
				vx = 0;
				vy = 0;
			}
		});
	}
	this.start = start;
	this.initialize = initialize;
}