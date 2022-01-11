Dim objShell
Set objShell = WScript.CreateObject("WScript.Shell")
objShell.Run "cmd /K node index.js --appwindow=true --autoclose=true", 0