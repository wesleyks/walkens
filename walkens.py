from flask import Flask, render_template, request, Response
from flask.ext.assets import Environment, Bundle
from pymongo import MongoClient
from datetime import datetime, timedelta
import uuid
import redis
import geohash
import json
import ConfigParser
import logging

cfg = ConfigParser.ConfigParser()
cfg.read('site.cfg')
redisHost = cfg.get('redis', 'host')
redisPort = cfg.get('redis', 'port')
redisDb = cfg.get('redis', 'db')

mongoHost = cfg.get('mongo', 'host')
mongoPort = cfg.get('mongo', 'port')
mongoDb = cfg.get('mongo', 'db')

production = cfg.get('server', 'production') == 'True'
logfile = cfg.get('server', 'logfile')

if production:
	LOGFORMAT = '%(asctime)s %(message)s'
	logging.basicConfig(filename=logfile,level=logging.INFO, format=LOGFORMAT)

redisClient = redis.StrictRedis(host=redisHost, port=int(redisPort), db=int(redisDb))

mongoClient = MongoClient(mongoHost, int(mongoPort))[mongoDb]
mongoMarks = mongoClient.marks

app = Flask(__name__)
assets = Environment(app)

js = Bundle('js/walken.js', 'js/grid.js', 'js/circle.js', 'js/main.js', filters='jsmin', output='js/packed.js')
assets.register('js_all', js)

canvasWidth = 400
offsetX = float(canvasWidth) / 8.0
canvasHeight = 400
offsetY = float(canvasHeight) / 8.0

def hashesToSearch(x, y):
	gHashes = set()
	for i in [-7.0, -4.0, -1.0, 0.0, 1.0, 4.0, 7.0]:
		for j in [-6.0, -2.0, 0.0, 2.0, 6.0]:
			subHash = geohash.encode((x + i * offsetX) / 1112.0, (y + j * offsetY) / 1112.0, 4)
			gHashes.add(subHash)
	return gHashes

def eventStream(channels, userUuid):
	pubsub = redisClient.pubsub()
	pubsub.subscribe(channels)

	dtThreshold = datetime.utcnow() - timedelta(hours=6)
	for mark in mongoMarks.find({'geoHash': {'$in': list(channels)}, 'utcDate': {'$gt': dtThreshold}}):
		yield 'data:%s\n\n' % json.dumps(mark['value'])
	
	for message in pubsub.listen():
		if type(message['data']) != long:
			messageData = json.loads(message['data'])
			if (messageData[u'action'] == u'closeStream' or messageData[u'action'] == u'remove') and messageData[u'uuid'] == userUuid:
				break
		yield 'data: %s\n\n' % message['data']
	yield 'data: 0\n\n'

@app.route('/')
def index():
	return render_template('index.html', width=canvasWidth, height=canvasHeight, production=production)

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
	valueJson = json.dumps(value)
	redisClient.publish(gHash, valueJson)
	mark = {
		'_id': markId,
		'geoHash': gHash,
		'utcDate': datetime.utcnow(),
		'value': value
	}
	mongoMarks.insert(mark)
	if production:
		logging.info('data: ' + valueJson)
	return '0'

@app.route('/position', methods=['POST'])
def storePosition():
	playerId = request.form['uuid']
	color = request.form['color']
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
		'color': color,
		'x': x,
		'vx': vx,
		'y': y,
		'vy': vy
	}
	valueJson = json.dumps(value)
	redisClient.publish(gHash, valueJson)
	if production:
		logging.info('data: ' + valueJson)
	return gHash

@app.route('/events/<gHash>/<userUuid>')
def streamEvents(gHash, userUuid):
	coords = geohash.decode(gHash)
	x = coords[0] * 1112.0
	y = coords[1] * 1112.0
	gHashes = hashesToSearch(x, y)
	return Response(eventStream(gHashes, userUuid), mimetype='text/event-stream')

@app.route('/marks/<gHash>/<userUuid>')
def getMarks(gHash, userUuid):
	coords = geohash.decode(gHash)
	x = coords[0] * 1112.0
	y = coords[1] * 1112.0
	gHashes = hashesToSearch(x, y)
	dtThreshold = datetime.utcnow() - timedelta(hours=6)
	data = [mark['value'] for mark in mongoMarks.find({'geoHash': {'$in': list(gHashes)}, 'utcDate': {'$gt': dtThreshold}})]
	return '[]'#return json.dumps(data)

if __name__ == '__main__':
	app.debug = False
	app.run(host='0.0.0.0')