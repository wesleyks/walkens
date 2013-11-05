#!/bin/bash
gunicorn -w 16 -b localhost:5000 -k gevent --max-requests 32 walkens:app