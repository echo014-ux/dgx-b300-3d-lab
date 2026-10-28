@echo off
chcp 65001 >nul
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (py -3 serve_game.py 27730) else (python serve_game.py 27730)
pause
