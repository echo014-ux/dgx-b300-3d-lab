"""Quiet desktop entry: start the local game if needed, then open the browser."""
from pathlib import Path
import os,sys,time,re,subprocess,urllib.request,webbrowser,ctypes,json
from datetime import datetime

ROOT=Path(__file__).resolve().parent
STATE=ROOT/'desktop_runtime';STATE.mkdir(exist_ok=True)
OPENER=urllib.request.build_opener(urllib.request.ProxyHandler({}))
DEFAULT_URL='http://127.0.0.1:27730/'

def is_game(url):
    try:
        with OPENER.open(url,timeout=1) as response:
            return response.status==200 and 'DGX B300 · 拆解实验室' in response.read(4096).decode('utf8',errors='replace')
    except Exception:return False

def launch():
    url=DEFAULT_URL
    reused=is_game(url)
    if not reused:
        runtime=Path(sys.executable).with_name('python.exe')
        if not runtime.is_file():raise RuntimeError('找不到本机 Python 运行环境。')
        stamp=datetime.now().strftime('%Y%m%d_%H%M%S_%f')
        log=STATE/f'server_{stamp}.log'
        with log.open('wb') as stream:
            server=subprocess.Popen([str(runtime),str(ROOT/'serve_game.py'),'27730','--no-browser'],cwd=ROOT,stdin=subprocess.DEVNULL,stdout=stream,stderr=stream,creationflags=subprocess.CREATE_NO_WINDOW)
        deadline=time.monotonic()+15
        while time.monotonic()<deadline:
            match=re.search(r'DGX B300 Lab: (http://127\.0\.0\.1:\d+/)',log.read_text(encoding='utf8',errors='replace'))
            if match:url=match[1]
            if is_game(url):break
            if server.poll() is not None:raise RuntimeError('游戏服务未能启动。请查看 '+str(log))
            time.sleep(.15)
        else:raise RuntimeError('游戏启动超时。请查看 '+str(log))
    opened=webbrowser.open(url,new=2)
    (STATE/'last_launch.json').write_text(json.dumps({'launched_at':datetime.now().isoformat(timespec='seconds'),'url':url,'existing_service_reused':reused,'browser_open_requested':opened},ensure_ascii=False,indent=2),encoding='utf8')
    if not opened:raise RuntimeError('游戏服务已启动，请用浏览器打开 '+url)

if __name__=='__main__':
    try:launch()
    except Exception as error:
        (STATE/'launcher_error.txt').write_text(str(error),encoding='utf8')
        ctypes.windll.user32.MessageBoxW(None,str(error),'DGX B300 游戏启动提示',0x10)
