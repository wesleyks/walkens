#!/bin/bash
_folderRoot="FILL THIS IN"
_now=`date +"%Y-%m-%d_%H-%M-%S"`
_file="log/$_now.log"
cp log/actions.log "$_file"
echo "" > log/actions.log