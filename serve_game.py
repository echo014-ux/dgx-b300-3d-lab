"""Loopback-only offline launcher; no cloud upload or external dependencies."""
import http.server, socketserver, webbrowser, sys, urllib.request, re, os
from pathlib import Path
ROOT=Path(__file__).resolve().parent/'game'
class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT),**kwargs)
    def send_head(self):
        # Media seeking needs byte ranges, including on loopback/offline deployments.
        self._range_remaining=None
        path=Path(self.translate_path(self.path))
        if path.suffix.lower() not in {'.mp4','.mp3'} or not path.is_file():return super().send_head()
        f=path.open('rb');stat=os.fstat(f.fileno());size=stat.st_size
        requested=self.headers.get('Range');start,end=0,size-1
        if requested:
            match=re.fullmatch(r'bytes=(\d*)-(\d*)',requested.strip())
            try:
                if not match or not any(match.groups()):raise ValueError()
                if match[1]:
                    start=int(match[1]);end=min(int(match[2]),size-1) if match[2] else size-1
                else:
                    suffix=int(match[2]);start=max(0,size-suffix)
                    if suffix<=0:raise ValueError()
                if start>=size or end<start:raise ValueError()
            except ValueError:
                f.close();self.send_response(416);self.send_header('Content-Range',f'bytes */{size}');self.send_header('Content-Length','0');self.end_headers();return None
        self.send_response(206 if requested else 200)
        self.send_header('Content-Type',self.guess_type(str(path)));self.send_header('Accept-Ranges','bytes')
        self.send_header('Content-Length',str(end-start+1));self.send_header('Last-Modified',self.date_time_string(stat.st_mtime))
        if requested:self.send_header('Content-Range',f'bytes {start}-{end}/{size}')
        self.end_headers();f.seek(start);self._range_remaining=end-start+1;return f
    def copyfile(self,source,outputfile):
        if self._range_remaining is None:return super().copyfile(source,outputfile)
        remaining=self._range_remaining
        while remaining:
            data=source.read(min(65536,remaining))
            if not data:break
            outputfile.write(data);remaining-=len(data)
    def end_headers(self):
        self.send_header('Cache-Control','no-cache')
        super().end_headers()
class Server(socketserver.ThreadingMixIn,http.server.HTTPServer):
    daemon_threads=True
    allow_reuse_address=False
port=int(sys.argv[1]) if len(sys.argv)>1 else 27730
try:server=Server(('127.0.0.1',port),Handler)
except OSError:
    # Reuse this game's existing service; an unrelated port owner gets a fresh port.
    try:
        opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
        with opener.open(f'http://127.0.0.1:{port}/',timeout=2) as r:existing=r.read(4096).decode('utf8',errors='replace')
        if 'DGX B300 · 拆解实验室' in existing:
            if '--no-browser' not in sys.argv:webbrowser.open(f'http://127.0.0.1:{port}/')
            sys.exit(0)
    except Exception:pass
    server=Server(('127.0.0.1',0),Handler);port=server.server_address[1]
print(f'DGX B300 Lab: http://127.0.0.1:{port}/',flush=True)
if '--no-browser' not in sys.argv:webbrowser.open(f'http://127.0.0.1:{port}/')
server.serve_forever()
