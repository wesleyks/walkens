from flask import Flask, render_template, request
import uuid
import redis
import geohash
import json

r = redis.StrictRedis(host='ec2-54-200-77-211.us-west-2.compute.amazonaws.com', port=6379, db=1)

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
	modifiedX = float(x) / 100
	modifiedY = float(y) / 100
	ghash = geohash.encode(modifiedX, modifiedY, 3)
	key = ghash + playerId
	value = {
		'uuid': playerId,
		'x': request.form['x'],
		'y': request.form['y']
	}
	r.set(key, json.dumps(value))
	r.expire(key, 6)
	keys = r.keys(ghash + '*')
	values = [json.loads(r.get(k)) for k in keys]
	return json.dumps(values)

if __name__ == '__main__':
	app.debug = False
	app.run()