@echo off
setlocal

cd /d "%~dp0"

set "PORT=5188"
set "URL=http://localhost:%PORT%"
set "NODE=C:\Users\EricodosReisFrizzera\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
set "SERVER=%~dp0server.mjs"

if not exist "%NODE%" (
  echo Nao encontrei o Node usado pelo projeto:
  echo %NODE%
  echo.
  pause
  exit /b 1
)

if not exist "%SERVER%" (
  echo Nao encontrei o servidor do Auto Compras:
  echo %SERVER%
  echo.
  pause
  exit /b 1
)

echo Iniciando Auto Compras...

"%SystemRoot%\System32\netstat.exe" -ano | "%SystemRoot%\System32\findstr.exe" /R /C:":%PORT% .*LISTENING" >nul
if errorlevel 1 (
  start "Auto Compras - servidor" /min "%ComSpec%" /k call "%NODE%" "%SERVER%"
) else (
  echo Servidor ja estava rodando na porta %PORT%.
)

echo Aguardando o servidor responder...

for /l %%i in (1,1,20) do (
  "%SystemRoot%\System32\netstat.exe" -ano | "%SystemRoot%\System32\findstr.exe" /R /C:":%PORT% .*LISTENING" >nul
  if not errorlevel 1 goto open_browser
  "%SystemRoot%\System32\timeout.exe" /t 1 /nobreak >nul
)

echo.
echo Nao consegui confirmar o servidor em %URL%.
echo Veja se a janela "Auto Compras - servidor" mostrou algum erro.
echo.
pause
exit /b 1

:open_browser
echo Abrindo %URL% ...
start "" "%URL%"
exit /b 0
