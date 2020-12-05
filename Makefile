init:
	NODE_ENV=production npm i 
	./setupConfig.sh

init-dev:
	NODE_ENV=production npm i 
	./setupConfig.sh dev