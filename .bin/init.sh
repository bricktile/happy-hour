set -xue
USERNAME=$1
SCRIPT_DIR=./.bin
mkdir -p $USERNAME
ln -s ../.bin/newdaily $USERNAME/newdaily 
ln -s ../.bin/push $USERNAME/push 
