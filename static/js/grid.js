function Grid(canvasContext, canvasWidth, canvasHeight) {
	var xSpacing = 40,
		ySpacing = 40,
		gridCanvas = $('<canvas></canvas>')[0];
	gridCanvas.width = xSpacing;
	gridCanvas.height = ySpacing;
	var gridContext = gridCanvas.getContext('2d'),
		context = canvasContext,
		width = canvasWidth,
		height = canvasHeight;

	function drawBoard(px, py) {
		for (var x = -px % xSpacing - xSpacing; x <= width; x += xSpacing) {
			for (var y = -py % ySpacing - ySpacing; y <= height; y += ySpacing) {
				context.drawImage(gridCanvas, x, y);
			}
		}
	}

	function setupBoard() {
		gridContext.beginPath();
		for (var x = 0; x <= xSpacing; x += xSpacing) {
			gridContext.moveTo(x, 0);
			gridContext.lineTo(x, ySpacing);
		}
		for (var y = 0; y <= ySpacing; y += ySpacing) {
			gridContext.moveTo(0, y);
			gridContext.lineTo(xSpacing, y);
		}
		gridContext.strokeStyle = '#bbb';
		gridContext.stroke();
		gridContext.closePath();
	}
	setupBoard();
	this.drawBoard = drawBoard;
}