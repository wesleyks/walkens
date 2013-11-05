#!/bin/bash
_now=`date +"%Y_%d_%m"`
_file="log/$_now.log"
cp log/actions.log "$_file"
echo "" > log/actions.log