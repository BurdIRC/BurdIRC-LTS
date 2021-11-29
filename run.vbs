Dim objShell
Set objShell = WScript.CreateObject("WScript.Shell")
objShell.Run "cmd /K node index.js", 0
WScript.Sleep 1000
objShell.Run """C:\Program Files\Google\Chrome\Application\chrome.exe"" --app=http://localhost:1987/", 1
Set objShell = Nothing