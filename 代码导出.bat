@echo off

rem 创建一个文件来存储所有文件内容
set "output=all_files.txt"
echo. > "%output%"

rem 递归查找所有 .js、.json、.wxml 和 .wxss 文件
for /r %%f in (*.js *.json *.wxml *.wxss) do (
    echo %%f >> "%output%"
    type "%%f" >> "%output%"
    echo. >> "%output%"
)

echo 操作完成! 所有内容已导出到 %output%
pause