function Walken(canvas, canvasWidth, canvasHeight) {
	var context = canvas.getContext('2d'),
		width = canvasWidth,
		height = canvasHeight,
		grid = new Grid(context, width, height),
		acceleration = 1,
		maxVel = 3,
		px = 0,
		vx = 0,
		py = 0,
		vy = 0,
		uuid;
	
	function clamp(val, min, max) {
		return Math.min(Math.max(val, min), max);
	}

	function update() {
		vx *= 0.99;
		vy *= 0.99;
		px += vx;
		py += vy;
	}

	function draw() {
		context.clearRect(0, 0, width, height);
		context.beginPath();
		grid.drawBoard(px, py);
		context.arc(width / 2, height / 2, 10, 0, Math.PI * 2);
		context.stroke();
		context.closePath();
	}

	function run() {
		draw();
		update();
		requestAnimationFrame(run);
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
	this.run = run;
	this.initialize = initialize;
}