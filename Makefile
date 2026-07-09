.PHONY: build package test clean

EXTENSION := pangu-space.popclipext
DIST_DIR := dist
EXTENSION_PATH := $(DIST_DIR)/$(EXTENSION)
VERSION ?= dev
ZIP := pangu-space.popclipext-$(VERSION).zip

build:
	rm -rf $(EXTENSION_PATH)
	mkdir -p $(EXTENSION_PATH)
	cp src/Config.plist src/pangu-space.js src/space.png $(EXTENSION_PATH)/
	xattr -cr $(EXTENSION_PATH) || true

test: build
	node --check src/pangu-space.js
	node --check $(EXTENSION_PATH)/pangu-space.js
	plutil -lint src/Config.plist $(EXTENSION_PATH)/Config.plist
	cmp src/pangu-space.js $(EXTENSION_PATH)/pangu-space.js
	cmp src/Config.plist $(EXTENSION_PATH)/Config.plist
	node --test t/pangu-space.test.js
	PANGU_SPACE_SCRIPT="$(abspath $(EXTENSION_PATH)/pangu-space.js)" PANGU_SPACE_CONFIG="$(abspath $(EXTENSION_PATH)/Config.plist)" node --test t/pangu-space.test.js

package: build
	cd $(DIST_DIR) && zip -X -r ../$(ZIP) $(EXTENSION)
	xattr -c $(ZIP) || true

clean:
	rm -rf build dist *.zip pangu-space.spec
