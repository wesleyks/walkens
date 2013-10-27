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
		objectList = {},
		gHash = null,
		gHashChanged = false,
		streamSource = null,
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
		for (var i in objectList) {
			//objectList[i].vx *= 0.99;
			//objectList[i].vy *= 0.99;
			objectList[i].x += objectList[i].vx;
			objectList[i].y += objectList[i].vy;
		}
	}

	function draw() {
		context.clearRect(0, 0, width, height);
		grid.drawBoard(px, py);
		context.beginPath();
		for (var i in objectList) {
			var player = objectList[i];
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

	function updatePosition(action) {
		$.ajax({
			url: '/position',
			type: 'POST',
			data: {
				action: action,
				uuid: uuid,
				x: px,
				y: py,
				vx: vx,
				vy: vy
			},
			async: (action == 'add' ? true : false)
		}).done(function(data) {
			if (data != gHash) {
				gHashChanged = true;
				gHash = data;
			}
		});
	}

	function continuousUpdatePosition() {
		updatePosition('add');
		setTimeout(continuousUpdatePosition, 2000);
	}

	function streamObjects() {
		if (gHash) {
			if (!streamSource) {
				streamSource = new EventSource('/events/' + gHash);
			} else {
				streamSource.close();
				streamSource = new EventSource('/events/' + gHash);
			}
			streamSource.onmessage = function(e) {
				var parsedData = $.parseJSON(e.data);
				if (typeof parsedData == 'object') {
					if (parsedData.action == 'add') {
						parsedData.x = parseFloat(parsedData.x);
						parsedData.y = parseFloat(parsedData.y);
						parsedData.vx = parseFloat(parsedData.vx);
						parsedData.vy = parseFloat(parsedData.vy);
						objectList[parsedData.uuid] = parsedData;
					} else {
						delete objectList[parsedData.uuid];
					}
				}
			}
		}
		setTimeout(streamObjects, 3000);
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
		continuousUpdatePosition('add');
		streamObjects();
		//bg.play();
		window.onbeforeunload = function() {
			updatePosition('remove');
		};
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
			updatePosition('add');
		});
	}
	this.start = start;
	this.initialize = initialize;
}