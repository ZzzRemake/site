# MIT 6.S081

很遗憾大三才开始做这个课的Lab。
不过幸运的是在拖延症buff的加持下我还是完成了。

----

## 配环境

第一次配环境的时候wsl崩了，猜测原因是Ubuntu版本不同，导致用的源和官方文档不太一样。反正没什么重要东西，卸载重装 \_(:з)∠)\_

具体方法详见[官方文档](https://pdos.csail.mit.edu/6.828/2021/tools.html)，我自己的环境配置为
wsl2+Ubuntu20.04，具体环境及配置命令同官方文档。

## 一些命令

1. `make qemu` 启动qemu以及xv6。
2. `echo "add-auto-load-safe-path ~/xv6-labs-2021/.gdbinit" >> ~/.gdbinit` 让`gdb-multiarch`可以调试xv6程序。调试时需要注意`make qemu`的flag添加。

----

虽然mmap lab完成了，但当时没写博客，等以后有时间再写吧。
