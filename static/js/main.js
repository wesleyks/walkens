$(document).ready(function() {
	var canvas = $('#game-canvas'),
		canvasWidth = canvas.attr('width'),
		canvasHeight = canvas.attr('height'),
		uuid = ''
		w = new Walken(canvas[0], canvasWidth, canvasHeight);
	$.ajax({
		url: 'uuid',
		async: false
	}).done(function(data) {
		uuid = data;
	});
	w.initialize(uuid);
	w.run();
});