#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

if command -v python3 >/dev/null 2>&1; then
	exec python3 "$SCRIPT_DIR/pangu-space.py"
fi

if [ -x /usr/bin/python3 ]; then
	exec /usr/bin/python3 "$SCRIPT_DIR/pangu-space.py"
fi

echo "pangu-space requires Python 3." >&2
exit 127
