from flask import Flask, render_template, request, Response
import uuid
import redis
import geohash
import json
import ConfigParser

cfg = ConfigParser.ConfigParser()
cfg.read('site.cfg')
redisHost = cfg.get('redis', 'host')
redisPort = cfg.get('redis', 'port')
redisDb = cfg.get('redis', 'db')

r = redis.StrictRedis(host=redisHost, port=int(redisPort), db=int(redisDb))

app = Flask(__name__)

canvasWidth = 400
offsetX = float(canvasWidth) / 8.0
canvasHeight = 400
offsetY = float(canvasHeight) / 8.0

def hashesToSearch(x, y):
	gHashes = set()
	for i in [-4.0, -3.0, -2.0, -1.0, 0.0, 1.0, 2.0, 3.0, 4.0]:
		for j in [-4.0, -3.0, -2.0, -1.0, 0.0, 1.0, 2.0, 3.0, 4.0]:
			subHash = geohash.encode((x + i * offsetX) / 1112.0, (y + j * offsetY) / 1112.0, 4)
			gHashes.add(subHash)
	return gHashes

def event_stream(channels):
	pubsub = r.pubsub()
	pubsub.subscribe(channels)
	keys = set()
	for c in channels:
		for k in r.keys(c + '*'):
			keys.add(k)
	data = [r.get(k) for k in keys]
	for d in data:
		yield 'data: %s\n\n' % d
	for message in pubsub.listen():
		yield 'data: %s\n\n' % message['data']

@app.route('/')
def index():
	return render_template('index.html', width=canvasWidth, height=canvasHeight)

@app.route('/uuid')
def genUUID():
	return str(uuid.uuid4())

@app.route('/mark', methods=['POST'])
def storeMark():
	markId = str(uuid.uuid4())
	color = request.form['color']
	x = request.form['x']
	y = request.form['y']
	modifiedX = float(x) / 1112.0
	modifiedY = float(y) / 1112.0
	gHash = geohash.encode(modifiedX, modifiedY, 4)
	key = gHash + markId
	value = {
		'action': 'add',
		'type': 'm',
		'uuid': markId,
		'color': color,
		'x': x,
		'y': y,
		'vx': 0.0,
		'vy': 0.0
	}
	r.publish(gHash, json.dumps(value))
	r.set(key, json.dumps(value))
	r.expires(key, 1000)
	print value
	return '0'

@app.route('/position', methods=['POST'])
def storePosition():
	playerId = request.form['uuid']
	x = request.form['x']
	vx = request.form['vx']
	y = request.form['y']
	vy = request.form['vy']
	action = request.form['action']
	modifiedX = float(x) / 1112.0
	modifiedY = float(y) / 1112.0
	gHash = geohash.encode(modifiedX, modifiedY, 4)
	value = {
		'action': action,
		'type': 'p',
		'uuid': playerId,
		'x': x,
		'vx': vx,
		'y': y,
		'vy': vy
	}
	r.publish(gHash, json.dumps(value))
	return gHash

@app.route('/events/<gHash>')
def streamEvents(gHash):
	coords = geohash.decode(gHash)
	x = coords[0] * 1112.0
	y = coords[1] * 1112.0
	gHashes = hashesToSearch(x, y)
	return Response(event_stream(gHashes), mimetype='text/event-stream')

if __name__ == '__main__':
	app.debug = False
	app.run(host='0.0.0.0')