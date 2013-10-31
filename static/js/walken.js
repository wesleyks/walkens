function Walken(canvas, canvasWidth, canvasHeight, beacon, bg) {
	var context = canvas.getContext('2d'),
		width = canvasWidth,
		height = canvasHeight,
		grid = new Grid(context, width, height),
		acceleration = 1.0,
		maxVel = 3.0,
		maxBounds = 100000.0,
		px = 1000 * Math.random() * (Math.random > 0 ? -1 : 1),
		vx = 0.0,
		py = 1000 * Math.random() * (Math.random > 0 ? -1 : 1),
		vy = 0.0,
		objectList = {},
		gHash = null,
		streamSource = null,
		uuid = null,
		color = null;

	function getRandomColor() {
		var letters = '0123456789ABCDEF'.split('');
		var color = '#';
		for (var i = 0; i < 6; i++ ) {
			color += letters[Math.round(Math.random() * 15)];
		}
		return color;
	}
	
	function clamp(val, min, max) {
		return Math.min(Math.max(val, min), max);
	}
	function update() {
		var neighborCount = 0;
		//vx *= 0.99;
		//vy *= 0.99;
		px += vx;
		py += vy;
		if (Math.abs(px) > maxBounds || Math.abs(py) > maxBounds) {
			px -= vx;
			py -= vy;
		}
		var deleteList = [],
			d = new Date();
		for (var i in objectList) {
			if (objectList[i].type == 'p' && objectList[i].uuid != uuid) {
				neighborCount++;
			}
			//objectList[i].vx *= 0.99;
			//objectList[i].vy *= 0.99;
			objectList[i].x += objectList[i].vx;
			objectList[i].y += objectList[i].vy;
			if (objectList[i].lastUpdated + 10000 < d.getTime()) {
				deleteList.push(i);
			}
		}
		for (var i = 0; i < deleteList.length; i++) {
			delete objectList[deleteList[i]];
		}
		document.title = neighborCount + ' nearby';
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
					context.fillStyle = player.color;
					context.arc(width / 2 + (parseFloat(player.x) - px), height / 2 - (parseFloat(player.y) - py), 15, 0, Math.PI * 2);
				} else {
					context.fillStyle = player.color;
					context.arc(width / 2 + (parseFloat(player.x) - px), height / 2 - (parseFloat(player.y) - py), 4, 0, Math.PI * 2);
				}
				context.fill();
			}
		}
		context.closePath();
		context.fillStyle = color;
		context.beginPath();
		context.arc(width / 2, height / 2, 15, 0, Math.PI * 2);
		context.fill();
		context.closePath();
	}

	function run() {
		update();
		draw();
		requestAnimationFrame(run);
	}

	function updatePosition(action) {
		if (!uuid || !color) {
			return;
		}
		$.ajax({
			url: '/position',
			type: 'POST',
			data: {
				action: action,
				uuid: uuid,
				color: color,
				x: px,
				y: py,
				vx: vx,
				vy: vy
			},
			async: (action == 'add' ? true : false)
		}).done(function(data) {
			if (data != gHash) {
				console.log('redo');
				gHash = data;
				if (streamSource != null) {
					streamSource.close();
				} else {
					updatePosition('closeStream');
				}
				streamSource = new EventSource('/events/' + gHash + '/' + uuid);
				streamSource.onmessage = handleMessage;
			}
		});
	}

	function continuousUpdatePosition() {
		updatePosition('add');
		setTimeout(continuousUpdatePosition, 3000);
	}

	function handleMessage(e) {
		var parsedData = $.parseJSON(e.data);
		if (typeof parsedData == 'object') {
			if (parsedData.action == 'add') {
				var d = new Date();
				parsedData.lastUpdated = d.getTime();
				parsedData.x = parseFloat(parsedData.x);
				parsedData.y = parseFloat(parsedData.y);
				parsedData.vx = parseFloat(parsedData.vx);
				parsedData.vy = parseFloat(parsedData.vy);
				objectList[parsedData.uuid] = parsedData;
			} else if (parsedData.action == 'remove'){
				delete objectList[parsedData.uuid];
			}
		}
	}

	function leaveMark() {
		if (!color || !uuid) {
			return;
		}
		$.ajax({
			url: '/mark',
			type: 'POST',
			data: {
				x: px,
				y: py,
				color: color
			}
		});
	}

	function start() {
		run();
		continuousUpdatePosition('add');
		color = getRandomColor();
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
			if (magnitude > 15) {
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