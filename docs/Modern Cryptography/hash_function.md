---
sidebar_position: 7
---

# Cryptographic Hash Functions

计算机科学上到处都是哈希函数，得益于哈希函数可以作为一种“压缩”的方式，进行诸如哈希表的构建。密码学上的哈希函数则要满足更多的性质。

## Collision resistance

形式化：

对于$H:\{0,1\}^m\rightarrow \{0,1\}^n,m\geq n$对任何的PPT算法，无法找到一个碰撞，或者说对多项式的寻找方式，$x\neq x',H(x)\neq H(x')$,那么该函数抗碰撞。

$m>n$，则哈希函数必定会产生碰撞。只是对PPT敌手而言，只有极小概率能够找到碰撞。

可以看到，这里定义的哈希函数是**unkeyed**的，也因此是确定性的。然而，实际运用中，若要攻破这一哈希函数，便需要去找到一对碰撞，而碰撞的寻找是十分困难的。实际上，这里的unkeyed只是指$H(k,x)$中的k为公开常量，而非随机选定的意思。

在密码学中的证明里，若结果依赖抗碰撞性，形式上我们考虑使用keyed哈希函数，实际上通常使用unkeyed哈希函数，并且同样能够满足抗碰撞。

### Definition

:::warning Definition: Hash Functions
    A hash Function with output length $l$ is a pair of PPT algorithm (Gen,H) satisfying
    1. $s\leftarrow Gen(1^n),|s|\geq n$,作为k,并为所有人可知。
    2. For a key s and $x\in\{0,1\}^*,H(s,x)$output a string in $\{0,1\}^{l(n)}$
    if the input x  is restricted to $|x|= l'(n),l'(n)\geq l(n)$，Gen，H)is a fixed-length hash Function.
:::

----

collision-finding experiment

1. 生成密钥s。
2. 敌手被给定密钥$s$，输出信息$x$，$x’$保证两者长度相同并符合上述定义。
3. 若$H(x)=H(x')$，则返回1，否则返回0.

:::warning collision resistant in orcacle
    $(Gen,H)$ is a collision resistant if for every PPT $\mathcal{A}$
    $$Pr_{s\leftarrow Gen(1^n)}[\mathcal{A}(s)\rightarrow(x\neq x')\land H(s,x)=H(s,x')]\leq negl(n)$$
:::

----

### weaker notions of security

1. 第二原象性(Second-preimage or target-collision resistance)：对于给定的s和随机的x，找到$x'\neq x,H(s,x)=H(s,x')$是极其困难的，
2. 单向性(Preimage resistance or one-wayness)：给定s和y，y是$H(s,x)$的结果，找到$x'$（不一定非要$x\neq x'$），$H(s,x')=y$

这是在更弱意义上的安全性。有了collision-resistance，这两个性质便都有了。若满足这两个小性质，便可以构造出单向函数。

## Domain extension for CRHFs

如同先前一般，这里介绍通过操作模式进行扩展。

:::warning The Merkle Damgard transform
    Chop input x with length $L=|x|$ into $B=\lceil \frac{L}{n}\rceil$,并在最后一块添加0以填充。$x_{B+1}=L$
    有以下形式化：
    $z_0=IV,z_i=h(z_{i-1},x_i)$
    $h_{B+1}=H(x)$
:::

在这里，由于原消息填充后有被碰撞的可能，例如111||000和1110||00填充后相同，因此最后一块设为L用于防碰撞。
这种构造方式是十分普遍的。在实际的哈希构造方案中基本都用到了该构造方式：MD5，SHA-1，SHA-2。

:::info MD transform collision resistant
    if $h$ is collision resistant, so is $H$.
:::

对上述性质的证明过程，可以通过反证法，若H不满足该性质，则h也不满足抗碰撞。

顺带一提，我国密码学的王小云院士的一大工作便是找到杂凑(hash)函数的碰撞，也因她的工作，采用MD transform的MD5，SHA-1被证明是不安全的。实际运用中，最好采用SHA-2，或者不是MD transform形式的SHA-3算法。

## Hash-and-MAC

有了hash函数后，对**任意长度**的明文m进行认证，可以采用“先对m进行hash，再对hash值进行mac计算”。MAC保证了攻击者无法对任何新的哈希值进行认证，而抗碰撞使攻击者无法找到对应的明文。

----

构造认证方案：
$\prod'=(Gen',Mac',Vrfy')$

$Gen'(1^n)\rightarrow <s(Gen_H(1^n)),k(Gen)>$

$Mac_{<s,k>}'(m)=Mac_k(H^s(m))$

$Vrfy$满足canonical条件。

----

:::info New Construct
    若原$\prod$是安全的MAC，且$H$是抗碰撞的，则$\prod'$对任意长度的明文都是安全的MAC方案。
:::

证明过程需要用到归约性证明，证明若敌手要攻破构造的方案，要么攻破MAC要么找到碰撞。

### using Hash functions as MACs

在许多场合中，人们会错误的直接把密码学意义上的hash函数用于认证~~没有基本的密码学常识~~,这实际上是十分危险的。

$Naive$~~y**ng~~ MAC：$Mac_k(m)=H(k||m)$

但用hash函数构造MAC是可行的：

Nested MAC（两密钥），若采用的哈希函数是PRF，则NMAC也是PRF，从而就是MAC。

顺带一提，NMAC原论文的h哈希函数默认直接带有PRF属性，所以直接使用了；但一般而言，h只是具有抗碰撞性质的哈希函数。
然而，现代的哈希函数基本都明确要求具有PRF属性，所以歪打正着，NMAC也能够保证安全性。

HMAC则是较为著名的一个方案了。它可以用于任意长度的消息，并用任意的哈希函数构造，较NMAC更加实用。

在HMAC之前，许多人不喜欢用CBC-MAC（太慢）而自己构造MAC，不能不说是一种安全性缺失。HMAC填补了这一漏洞。

## Generic attacks on hash Functions

### Birthday bound

看上去，对于哈希函数的攻击是十分困难的,最坏情况下要对所有的可能进行蛮力遍历才能得到一对碰撞。然而，**生日悖论**使攻击可能大大增强：

:::info Birthday bound
    若有q个独立均匀随机选取的元素从集合S中选取，$|S|=N$，则有：
    $$\frac{q(q-1)}{4N}\leq Pr[\exists i\neq j,y_i=y_j]\leq\frac{q^2}{2N}$$
    对于不均匀的选取，第一个不等式成立。
:::

因此，要保证对于q(n)问询的敌手，$q(n)^2/2^\ell<<1$，即$\ell>2log(q(n))$

### meaningful collisions

由于有意义的句子里有许多固定格式，理论上而言，可以通过调整较少数量的词来达到缩小搜索空间，从而使攻击更加容易成立。

### Small space birthday attacks

相比普通生日攻击，该方法通过两倍的查询来换取存储空间的$O(1)$复杂度。

## Applications

### random oracle model(随机预言机)

有几种基于密码学上的哈希函数的构造方案，单凭哈希函数的抗碰撞、单向性是无法完成安全的。
对此，如果想要重新寻找基于底层哈希函数的可证明安全方案，那么找到这类方案前便无法使用；而如果使用现有的密码系统，除了设计者试图攻击未果这一事实外没有任何理由证明其安全性，这是不可接受的。

于是，便有一种看起来“取巧”的方案，在严格的可证明安全和没有任何证明中的一种方法：引入一个理想化的模型来证明密码的安全性，而这就是**随机预言机**。

~~有证明总比没有好对吧~~

随机预言机的定义：假设一个随机函数$H:\{0,1\}^*\rightarrow\{0,1\}^n$，其只能够被任何人**查询**计算，即输入$x$返回$H(x)$。

用另一种更加玄乎的话来说，在你给定输入前，随机预言机看起来像是完全均匀随机的函数(黑盒啊嗯)，原文甚至将随机预言机比作“in the sky”,但你朝天空喊一句$x$，它就会给你确定的回应$H(x)$,并且$H(x)$确定下来，无论你后面怎么输入给定的$x$，$H(x)$都是唯一的回应。

~~什么b比喻~~

在构造方案时，证明使用**RO**(随机预言机),而实际构建方案时，RO用密码学意义上的哈希函数实例化。

显而易见，这是一种启发式的证明，但在实际出乎意料的好用。

另外，随机预言机满足“可编程性”，在归约性证明中可以选定均匀的输出值。

#### pseudorandom generator

设随机预言机$H=\{0,1\}^{n/2}\rightarrow \{0,1\}^n$
则有$Pr_{y\leftarrow \{0,1\}^n}[\mathcal{A}^{H(\cdot)}(y)=1]-Pr_{x\leftarrow \{0,1\}^{n/2} }[\mathcal{A}^{H(\cdot) }(H(x))=1]=negl(n)$

则H便是PRG。

#### pseudorandom Function

$H=\{0,1\}^{2n}\rightarrow\{0,1\}^n$
$F_k(x)=H(k||x)$

则$F$便是PRF。

#### Collision resistant Hash Function

$H=\{0,1\}^*\rightarrow\{0,1\}^n$

其本身便可作为抗碰撞的哈希函数实例化。

以上所有的构造都用到了H(x)是uniform的性质，但没有可编程性。

:::missing RO
    需要注意的是，RO的使用直至现在都存在着争议，有人认为它并不能代表完全的安全，也有人认为我们并没有完全了解RO的性质，可能会有隐藏的问题。
:::

### Fingerprinting and deduplication

哈希函数可用于病毒检测，另外，也可以用于云存储等。

#### Merkle tree

上文提到哈希可以用于云存储。用户只要保存了哈希值，便可以通过哈希值来查询得到对应的云文件，从而对文件进行下载验证等操作。若要高效进行，可以采用Merkle tree这种数据结构。

其构造方法通俗而言，Merkle tree除了叶子节点的tag是对文件的哈希值，其余节点的tag都是对子节点的哈希值。

:::info Merkle tree
    若其底层的哈希函数是抗碰撞的，那么具有固定文件数量的Merkle Tree也是抗碰撞的。
:::

客户端存储根节点的哈希值，而服务器维护Merkle Tree以及文件。若客户端需要对应的文件，服务器可以将文件和其Merkle Tree路径外的其他子节点上的所有哈希值(空间复杂度$O(log(n))$)发向客户端，以让客户端验证文件完整性。

### MAC and Hash for message authentication

MAC和Hash都可以用于认证，区别为：

MAC要求通信双方在通信前共享密钥，而哈希函数虽然不用密钥的存储，但要求能够安全存储哈希值。

### basic password protocol

~~谁的密码明文存储啊？~~

~~原来是CSDN啊~~

现实中对密码进行哈希操作已经是稀松平常了。具有抗碰撞性的哈希才是好的加密存储。

然而，由于许多人采用弱密码，可以用在线字典攻击(攻击者对用户清单统一尝试较少密码)，也可以离线字典攻击(暴力查找H(w)=storaged password).
而batch离线字典攻击则假设敌手获取一整个存储密码的文件$F$，用事先准备的字典集合$Dict$对其进行离线字典攻击，这种方式更容易攻破其密码,时间复杂度为$|Dict|+|F|$

于是就有了public salt，也就是我们常说的**加盐**，即使在密码文件中公开存储盐值，也可以保证其时间复杂度大幅上升，攻击者必须遍历密码文件才能完成一次攻击尝试，于是时间复杂度为$O(|Dict|\times|F|)$

----

回到对于密码的哈希：如果哈希函数，例如SHA1执行过快，也就是单步执行过快，计算机也能在可接受的时间内完成计算。

于是就有“慢”哈希函数，或者多次应用哈希函数来减慢速度；或者如之前已经叙述过的“加盐”，抑或是服务器辅助的方法（密码学老师似乎就是搞这方向的，还搞了两篇自己的论文放在PPT）。
