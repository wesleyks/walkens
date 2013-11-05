#!/bin/bash
_now=`date +"%Y-%m-%d_%H-%M-%S"`
_file="log/$_now.log"
cp log/actions.log "$_file"
echo "" > log/actions.log