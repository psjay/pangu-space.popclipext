# coding: utf-8
import os
import re
import sys
import urllib.parse


SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
VENDOR_DIR = os.path.join(SCRIPT_DIR, "vendor")
if os.path.isdir(VENDOR_DIR):
    sys.path.insert(0, VENDOR_DIR)

try:
    import pangu
except ImportError:
    pangu = None


CJK = (
    r"\u2e80-\u2eff"
    r"\u2f00-\u2fdf"
    r"\u3040-\u30ff"
    r"\u3100-\u312f"
    r"\u31a0-\u31bf"
    r"\u3400-\u4dbf"
    r"\u4e00-\u9fff"
    r"\uf900-\ufaff"
)
HALFWIDTH = r"A-Za-z0-9`~!@#$%^&*()\-_+=\[\]{}\\|;:'\",<.>/?"
CJK_RE = f"[{CJK}]"
HALFWIDTH_RE = f"[{HALFWIDTH}]"


def spacing_text(text):
    if pangu is not None:
        return pangu.spacing_text(text)

    text = re.sub(f"({CJK_RE})({HALFWIDTH_RE})", r"\1 \2", text)
    text = re.sub(f"({HALFWIDTH_RE})({CJK_RE})", r"\1 \2", text)
    text = re.sub(r" {2,}", " ", text)
    return text


# By mousepotato @https://anotherbug.com
if __name__ == '__main__':
    query = os.environ['POPCLIP_URLENCODED_TEXT']
    # 增加 盘古之白
    res = spacing_text(urllib.parse.unquote(query))
    # 修改双引号为直角
    res = res.replace("“", "「").replace("”", "」")
    print(res, end="")
