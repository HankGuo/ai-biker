@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion
cd /d "%~dp0"

node scripts/stop.mjs
