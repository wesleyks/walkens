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

@app.route('/')
def index():
	return render_template('index.html')

@app.route('/uuid')
def genUUID():
	return str(uuid.uuid4())

@app.route('/position', methods=['POST'])
def storePosition():
	playerId = request.form['uuid']
	x = request.form['x']
	y = request.form['y']
	modifiedX = float(x) / 150
	modifiedY = float(y) / 150
	ghash = geohash.encode(modifiedX, modifiedY, 3)
	key = ghash + playerId
	value = {
		'uuid': playerId,
		'x': request.form['x'],
		'y': request.form['y']
	}
	r.set(key, json.dumps(value))
	r.expire(key, 1)
	keys = r.keys(ghash[:-1] + '*')
	values = [json.loads(r.get(k)) for k in keys]
	return json.dumps(values)

if __name__ == '__main__':
	app.debug = True
	app.run(host='0.0.0.0')