.PHONY: build build-binary package clean

EXTENSION := pangu-space.popclipext
DIST_DIR := dist
EXTENSION_PATH := $(DIST_DIR)/$(EXTENSION)
VERSION ?= dev
ZIP := pangu-space.popclipext-$(VERSION).zip
PYINSTALLER ?= pyinstaller
SIGN_IDENTITY ?= -

build:
	rm -rf $(EXTENSION_PATH)
	mkdir -p $(EXTENSION_PATH)
	cp src/Config.plist src/init.sh src/pangu-space.py src/space.png src/requirements.txt $(EXTENSION_PATH)/
	cp -R src/vendor $(EXTENSION_PATH)/
	chmod +x $(EXTENSION_PATH)/init.sh $(EXTENSION_PATH)/pangu-space.py
	find $(EXTENSION_PATH) -name __pycache__ -type d -prune -exec rm -rf {} +
	xattr -cr $(EXTENSION_PATH) || true

package: build
	cd $(DIST_DIR) && zip -X -r ../$(ZIP) $(EXTENSION)
	xattr -c $(ZIP) || true

build-binary: clean
	$(PYINSTALLER) --distpath=./$(EXTENSION_PATH) src/pangu-space.py
	codesign --force --sign "$(SIGN_IDENTITY)" $(EXTENSION_PATH)/pangu-space/pangu-space
	cp src/Config.plist src/init.sh src/space.png src/requirements.txt $(EXTENSION_PATH)/
	cp -R src/vendor $(EXTENSION_PATH)/
	find $(EXTENSION_PATH) -name __pycache__ -type d -prune -exec rm -rf {} +
	xattr -cr $(EXTENSION_PATH) || true

clean:
	rm -rf build dist *.zip pangu-space.spec
