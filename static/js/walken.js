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
		bigCircles = {},
		smallCircles = {},
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
			objectList[i].x += objectList[i].vx;
			objectList[i].y += objectList[i].vy;
			if ((objectList[i].type == 'p' && objectList[i].lastUpdated + 10000 < d.getTime()) || (Math.abs(objectList[i].x - px) > width && Math.abs(objectList[i].y - py) > height)) {
				deleteList.push(i);
			}
		}
		for (var i = 0; i < deleteList.length; i++) {
			delete objectList[deleteList[i]];
		}
		document.title = neighborCount + ' nearby';
		setTimeout(update, 16.6667);
	}

	function draw() {
		context.clearRect(0, 0, width, height);
		grid.drawBoard(px, py);
		for (var i in objectList) {
			var object = objectList[i];
			if (object.uuid != uuid) {
				if (object.type == 'p') {
					if (!bigCircles[object.color]) {
						bigCircles[object.color] = new Circle(object.color, 15);
					}
					bigCircles[object.color].drawCircle(context, width / 2 + (object.x - px), height / 2 - (object.y - py));
				} else {
					if (!smallCircles[object.color]) {
						smallCircles[object.color] = new Circle(object.color, 4);
					}
					smallCircles[object.color].drawCircle(context, width / 2 + (object.x - px), height / 2 - (object.y - py));
				}
			}
		}
		context.fillStyle = color;
		context.beginPath();
		context.arc(width / 2, height / 2, 15, 0, Math.PI * 2);
		context.fill();
		context.closePath();
		requestAnimationFrame(draw);
	}

	function run() {
		update();
		draw();
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
				gHash = data;
				if (streamSource !== null) {
					updatePosition('closeStream');
					streamSource.close();
				}
				streamSource = new EventSource('/events/' + gHash + '/' + uuid);
				streamSource.onmessage = handleMessage;
				setTimeout(getMarks, 50);
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

	function getMarks() {
		if (!uuid) {
			return;
		}
		$.ajax({
			url: '/marks/' + gHash + '/' + uuid,
			type: 'GET',
			dataType: 'json',
			async: true
		}).done(function(data) {
			for (var i = 0; i < data.length; i++) {
				var object = data[i],
					d = new Date();
				object.lastUpdated = d.getTime();
				object.x = parseFloat(object.x);
				object.y = parseFloat(object.y);
				object.vx = parseFloat(object.vx);
				object.vy = parseFloat(object.vy);
				objectList[object.uuid] = object;
			}
		});
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
		continuousUpdatePosition('add');
		color = getRandomColor();
		run();
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