from flask import Flask, render_template, request
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

canvasWidth = 800
offsetX = float(canvasWidth) / 8.0
canvasHeight = 400
offsetY = float(canvasHeight) / 8.0

@app.route('/')
def index():
	return render_template('index.html', width=canvasWidth, height=canvasHeight)

@app.route('/uuid')
def genUUID():
	return str(uuid.uuid4())

@app.route('/position', methods=['POST'])
def storePosition():
	playerId = request.form['uuid']
	x = request.form['x']
	vx = request.form['vx']
	y = request.form['y']
	vy = request.form['vy']
	modifiedX = float(x) / 200.0
	modifiedY = float(y) / 200.0
	gHash = geohash.encode(modifiedX, modifiedY, 3)
	key = gHash + playerId
	value = {
		'uuid': playerId,
		'x': x,
		'vx': vx,
		'y': y,
		'vy': vy
	}
	r.set(key, playerId)
	r.expire(key, 5)
	r.set(playerId, json.dumps(value))
	r.expire(playerId, 5)
	gHashes = set()
	for i in [-3, -2, -1, 0, 1, 2, 3]:
		for j in [-3, -2, -1, 0, 1, 2, 3]:
			subHash = geohash.encode((float(x) + i * offsetX) / 200.0, (float(y) + j * offsetY) / 200.0, 3)
			gHashes.add(subHash)
	keys = set()
	for subHash in gHashes:
		subKeys = r.keys(subHash + '*')
		for k in subKeys:
			keys.add(k)
	values = [json.loads(r.get(r.get(k))) for k in keys]
	return json.dumps(values)

if __name__ == '__main__':
	app.debug = True
	app.run(host='0.0.0.0')