@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo SecurePath CLI - Demonstracao com dados sinteticos
where py >nul 2>&1
if %errorlevel%==0 (
  py -3 artefatos.py teste.txt
) else (
  where python >nul 2>&1
  if errorlevel 1 (
    echo Python nao encontrado. Instale Python 3.9+ e habilite-o no PATH.
    pause
    exit /b 2
  )
  python artefatos.py teste.txt
)
echo.
echo Para executar os testes: py -3 -m unittest discover -s tests -v
pause
