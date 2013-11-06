from pymongo import MongoClient, ASCENDING
import ConfigParser

cfg = ConfigParser.ConfigParser()
cfg.read('site.cfg')

mongoHost = cfg.get('mongo', 'host')
mongoPort = cfg.get('mongo', 'port')
mongoDb = cfg.get('mongo', 'db')

mongoClient = MongoClient(mongoHost, int(mongoPort))[mongoDb]
mongoMarks = mongoClient.marks

mongoMarks.ensure_index([('geoHash', ASCENDING), ('utcDate', ASCENDING)])