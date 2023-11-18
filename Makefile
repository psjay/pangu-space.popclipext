.PHONY: build

build:
	pyinstaller --distpath=./pangu-space.popclipext src/pangu-space.py 
	find src -type f ! -name 'pangu-space.py' -exec cp {} pangu-space.popclipext/ \;