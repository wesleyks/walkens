from flask import Flask, render_template
import uuid

app = Flask(__name__)

@app.route('/')
def index():
	return render_template('index.html')

@app.route('/uuid')
def genUUID():
	return str(uuid.uuid4())

if __name__ == '__main__':
	app.debug = True
	app.run()