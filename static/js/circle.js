function Circle(color, radius) {
	var _color = color,
		_radius = radius,
		_canvas = $('<canvas></canvas>')[0],
		_context;

	function _construct() {
		_canvas.width = _radius * 2 + 3;
		_canvas.height = _radius * 2 + 3;
		_context = _canvas.getContext('2d');
		_context.beginPath();
		_context.fillStyle = _color;
		_context.arc(_radius + 2, _radius + 2, _radius, 0, Math.PI * 2);
		_context.fill();
		_context.closePath();
	}

	this.drawCircle = function(context, x, y) {
		context.drawImage(_canvas, x - _radius, y - _radius);
	};
	_construct();
}