.PHONY: build package test clean

EXTENSION := pangu-space.popclipext
DIST_DIR := dist
EXTENSION_PATH := $(DIST_DIR)/$(EXTENSION)
VERSION ?= dev
ZIP := pangu-space.popclipext-$(VERSION).zip

build:
	rm -rf $(EXTENSION_PATH)
	mkdir -p $(EXTENSION_PATH)
	cp src/Config.plist src/pangu-space.pl src/space.png $(EXTENSION_PATH)/
	chmod +x $(EXTENSION_PATH)/pangu-space.pl
	xattr -cr $(EXTENSION_PATH) || true

test:
	/usr/bin/perl -c src/pangu-space.pl
	/usr/bin/perl -c $(EXTENSION)/pangu-space.pl
	plutil -lint src/Config.plist $(EXTENSION)/Config.plist
	cmp src/pangu-space.pl $(EXTENSION)/pangu-space.pl
	cmp src/Config.plist $(EXTENSION)/Config.plist
	test ! -e src/pangu-space.py
	test ! -e $(EXTENSION)/pangu-space.py
	test ! -e src/vendor
	test ! -e $(EXTENSION)/vendor
	/usr/bin/perl t/pangu-space.t
	PANGU_SPACE_SCRIPT="$(EXTENSION)/pangu-space.pl" /usr/bin/perl t/pangu-space.t

package: build
	cd $(DIST_DIR) && zip -X -r ../$(ZIP) $(EXTENSION)
	xattr -c $(ZIP) || true

clean:
	rm -rf build dist *.zip pangu-space.spec
