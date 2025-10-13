---
slug: devops-first
title: DevOps初探--一次不成功的招新经历
date: 2022-12-25 15:48:00
tags: [devops, docker]
---

“你来星辰有项目经历吗”

“没有，但我得进了星辰才能有项目经历”

<!-- truncate -->

无项目经历者不得入星辰DevOps。

半开玩笑，虽然笔试完成的自认为还行，但可能还有缺陷，这里就放下等之后有项目经历了来品鉴一下这坨答辩吧。DevOps看重项目经历当然是很正常的，但我没想到的是面试基本上只问这一点。评判标准明确了那被薄纱也是合情合理。

这就是大一摆没有搞项目的下场.jpg

过程截图就不放了，这里把部分题目放出来。

相关链接：

[docker官方文档](https://docs.docker.com/)
[gitlab官方文档](https://docs.gitlab.com)
[gitlab官网](https://gitlab.com/)
[我的gitlab主页](https://gitlab.com/ZzzRemake)

## 命令行入门

### 思考题 与图形界面相比，命令行有什么优势？

命令行相比图形界面消耗的资源更少，能够让用戶避开图形界面的杂乱（处理大量数据等场景）更专注操作命令、信息等本质需求，操作更加灵活；且在某些无法使用图形界面程序或相关设施的情况下，命令行必不可少。

顺带一提，这里可以去了解一下各大Shell。
来个知乎连接：[DavidZ的回答](https://www.zhihu.com/question/21418449/answer/2292448029)

之后搞一个专门的命令行分类学学罢。

## Linux安装软件

### docker

docker官方文档提供了Docker desktop和Docker Engine的两种下载方式，我是安装了Docker Engine，并且基本按照官方文档的步骤进行的。
所有步骤附在以下代码块中，并以注释注明过程。

```shell
# 第一步，卸载旧版本（然而我的Ubuntu根本没有）
sudo apt-get remove docker docker-engine docker.io containerd runc
# 第二部，由于是第一次装，需要建立新的Docker 仓库
# 1.依赖项
sudo apt-get update
sudo apt-get install ca-certificates curl gnupg lsb-release
# 2.curl add GPGkey
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
# 3. 建立仓库
echo \
"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
$(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > / dev/null
# 第三步，正常的用apt-get安装
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin
# 测试一下？
sudo docker run hello-world
```

### 思考题 Linux下安装软件与Windows/macOS有什么区别？

Linux可以通过包管理工具方便的获取最新的软件并更新，apt等包管理工具在安装软件的时候可以安装依赖项，大大简化了安装软件的过程。Windows则是通过下载可执行文件(exe)等方式进行安装，无法解决依赖问题，Linux当然也有类似的安装包直接安装，不解决依赖的方式，apt等包管理便改善了这一点。

**后来修订部分**
当然，这里可以扩展开讲。dpkg，deb之类的。。emmm，归linux档？和先前那个命令行一起。

## 网络相关

### 思考题 OSI七层模型的数据处理过程

应用层：将数据呈现给用戶；表示层：将接收到的数据编码解码成应用层能读取的格式，也可以对数据加密解密；会话层：再两台主机间建立会话以传输数据。
以上层的PDU都为数据（data），都是和应用本身相关的数据、消息报文等。
而传输层将PDU分段为segment（TCP）或者数据报datagram（UDP），两者大小都是有限的。分段前进行数据封装，加上TCP或UDP等有关信息。
网络层将数据头加上IP信息，包含了逻辑寻址的信息，之后将处理后的PDU：包（Packet）传输给数据链路层。
数据链路层的PDU形式为帧（frame），其中加上了LLC头（与硬件无关）和MAC头（寻址等硬件相关）；物理层则将数据处理为二进制流数据位（bit）

### 实践题 Linux配置路由访问外网

NAT模式下的linux虚拟机无法完成任务，因此将虚拟机切换成桥接模式。
然而，桥接模式下的虚拟机的默认路由是没有任何多余设置的，因此，在取消NAT的设置后，网卡的路由无法改变，在宿主机切换WIFI的时候便因为没有合法IP地址而无法联网。（大概。。符合题目要求？）
于是在`/etc/netplan`文件夹（新版的Ubuntu网络配置文件与其他系统不同）找到yaml并修改：

```yaml
network: 
    version: 2
    renderer: NetworkManager
    ethernets:
        ens33:
            dhcp4: true
            dhcp6: true
```

这里用dhcp动态配置ip，ens33表示网卡。emmm，其他的还是需要查一下的。

之后虚拟机和主机能够ping通，也能够访问外网。

### 选做题 请简述二层交换机、三层交换机、路由器之间的区别，以及它们一般被部署在网络的哪些位置上

二层交换机位于OSI第二层，可以用MAC地址转发数据（可传输到单一主机，与集线器的广播区分），可以用于VLAN等方式划分广播域；三层交换机在加上了路由模块，从而加速转发数据包的过程（一次路由，多次转发）。
然而，三层交换机只能部分实现路由器的功能。连接WAN的路由器所需维护的表项十分庞大且存在刷新的可能，这对三层交换机来说任务过于繁重，且大量的数据也对其加速转发的性能有较大影响，因而这部分由路由器承担。同时，路由器可以提供网络安全、除TCP/IP外的网络协议等功能，这些都是三层交换机所无法做到的。

**二次修订**:
实际上，这里的二层、三层交换机可以和很多概念挂钩。关于交换机的区别，可以看这个博客：
[Vlan/Trunk以及三层交换](https://blog.csdn.net/dog250/article/details/8219141)
关于vlan，可以看这个[原理详解](https://blog.csdn.net/phunxm/article/details/9498829).

!!! info 推荐书籍
    就是你电课本，大黑皮是真不错。
    **《计算机网络：自顶向下方法》**

### 附加题

实际上这个附加题不是DevOps里头的，我从网管会那里搬一个放在这，感觉是很好玩的。

**DH42网络配置**
[lantian's blog](https://lantian.pub/article/modify-website/dn42-experimental-network-2020.lantian/)
咕咕咕，等有时间搞。

## docker容器

### 实践题 在docker中运行phpmyadmin容器

!!! info 提示
    phpmyadmin是一个Web端的数据库可视化界面，它需要指定MySQL服务器的IP地址，通过设置容器的环境变量`PMA_HOST`来指定。如果你是在Linux环境，那么docker会有一个子网，一般是`172.16.0.0/16`网段，刚才运行的mariaDB容器会得到一个IP地址，你可以通过`docker ps`命令查看当前运行的容器信息，然后通过`docker inspect` 容器ID查看容器的IP地址。如果你是在macOS上运行docker，需要注意由于macOS不具备docker所需要的namespace和cgroup，所以macOS上的docker实际是运行在VirtualBox虚拟机中的，而且它的网络与宿主机网络并不直接连通，好在容器之间的网络是连通的，但是对于phpmyadmin，你可能需要将它的Web端口（80）映射到本机的其他端口上，可以用参数 `-p` 宿主机端口:容器端口 指定。

```shell
# docker 创建网络
sudo docker network create my-mariadb
# 创建mariadb，指定环境变量MYSQL_ROOT_PASSWORD、端口映射、命名卷和网络别名
sudo docker run -d \
--restart always \
--network my-mariadb --network-alias mariadb \
-e MYSQL_ROOT_PASSWORD=123456 \
-p 3306:3306 \
-v mariadb-data:/var/lib/mysql \
mariadb
# 创建phpmyadmin，指定环境变量PMA_HOST、端口映射和网络别名
sudo docker run -d \
--restart always \
--network my-mariadb --network-alias phpmyadmin \
-p 8081:80 \
-e PMA_HOST=mariadb \
phpmyadmin
```

### 思考题 docker和虚拟机有什么不同？

docker通过docker守护进程来管理docker容器，通过linux的namespace组合和cgroups来隔离docker内外和管理所用资源。docker可以将应用程序所运行存储的数据通过分层来隔离，push和pull镜像的时候不会影响，通过数据卷挂载来持久化数据。然而其隔离性无法比拟虚拟机。
而虚拟机是通过Hypervisor管理虚拟机系统，直接访问硬件资源，并较docker需要更多的存储空间等硬件资源。虚拟机在运行的时候需要运行各种依赖，相较docker可以专注单个应用而言更可能发生冲突，启动时间也比拟不了docker的快捷。

**二次修订**:
关于docker相关，除了最上方的官方文档教程（新人友好），还有相关的[介绍](https://www.lixl.cn/books/Docker/1-Overview/#docker_7)

## GitLab CI/CD

git操作这里就不放了（

### 实践题 使用GitLab CI/CD功能，实现Docker镜像自动发布

[看看项目](https://gitlab.com/ZzzRemake/hello_devops)
具体已经写readme里头了。

### 思考题 如何将Docker镜像实际在服务器上运行？

似乎是一个蛮深奥的问题，但我没有项目开发经验（这就是大一摆没有搞项目的下场.jpgx2），这里只能放网上查到的玩意儿了。

创建镜像后已经发布到了docker hub，因此可以让服务器删除原有的可能冲突的镜像，然后从docker hub拉取所需镜像运行容器。

### 实践题 搭建博客罢

[博客链接](https://zzzremake.gitlab.io/)

[仓库链接](https://gitlab.com/ZzzRemake/zzzremake.gitlab.io)

之前已经在windows环境下写过一次github page部署hexo博客（就是你现在看到的博客）了，但`node_modules/`以及相关的包由于都是js等文件，理论上是可以跨平台的，因此我直接试了下copy，还真行，乐（
于是便把相关文件copy到了虚拟机中，且在gitlab网⻚里新建了创建page的project。接下来的步骤和之前用`gitlab CI/CD` 功能部署docker镜像相似。编写`.gitlab-ci.yml`时，发现gitlab有提供hexo的模板
yml，copy后由于node版本不同修改了模板的image信息，提交后便可通过pipeline生成博客。

**problems**:
在注册gitlab-runner的时候，我原本以为需要再在本地创建一个gitlab-runner的docker来搭配博客仓库的流水线，但注册后查看配置文件，发现是在配置文件中新添加了关于博客仓库配置runner的信息.

另外，copy后发现使用的主题文件夹`theme/hexo-theme-matery`里面是有`git`子仓库的，如果不删除其中的`.git`文件夹，push到gitlab上会无法打开其中的文件（无url），流水线创建的过程也会失败。由于博客项目本身不是一个复杂项目（？，因此删去这里的子仓库，用主仓库直接管理。

**二次修订**:
没错，这就是个简单的复制粘贴，含金量其实就只有`.gitlab-ci.yml`编写，然而这个我也是抄模板的（这就是大一摆没有搞项目的下场.jpgx3）
