$(document).ready(function() {
	var canvas = $('#game-canvas'),
		canvasWidth = canvas.attr('width'),
		canvasHeight = canvas.attr('height'),
		uuid = '',
		beacon = $('#beacon'),
		bg = $('#bg'),
		w = new Walken(canvas[0], canvasWidth, canvasHeight, beacon[0], bg[0]);
	$.ajax({
		url: 'uuid',
		async: false
	}).done(function(data) {
		uuid = data;
	});
	w.initialize(uuid);
	w.start();
});