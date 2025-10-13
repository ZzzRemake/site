---
sidebar_position: 9
---

# Public key and Pre knowledge

信安数学爷们可以跳过这章.

## Math

### Integers mod N

gcd，以及$\xi(N)$(欧拉函数)。

关于欧拉函数，可以看 [OI-WIKI](https://oi-wiki.org/math/number-theory/euler/)

需要了解其积性函数的性质。

### Division Remainder Module

数论基础的mod表示：$a \equiv b~ mod~ N$
其性质较为简单。

### Groups

近世代数研究的是抽象意义上的代数运算，因此其运算规则需要重新定义。群这种代数结构满足以下性质：

1. 闭包：$\forall g,h\in G,g\cdot h\in G$.
2. 单位元：$\exists e\in G~ s.t. \forall g\in G,e\cdot g=g=g\cdot e$.
3. 逆元：$\forall g\in G,\exists h\in G,g\cdot h=e=h\cdot g$
4. 结合律：$\forall g,h,f\in G,(g\cdot h)\cdot f=g\cdot (h\cdot f)$

群满足以下性质被称为交换群：

$\forall g,h\in G,g\cdot h=h\cdot g$
在密码学中，我们基本上只讨论交换群。

Example:

若N>0，那么$G=\{a\cdot b mod N\}$是一个群。

### 幂

简写$g^m=g\cdot g\cdot g...g$,加法群也是类似定义，于是有：

1. $g^{i+j}=g^i\cdot g^j$
2. $g^{ij}=(g^i)^j=(g^j)^i$
3. $g^{-i}=(g^i)^{-1}=(g^{-1})^i$

### order of a Group

若$G$是有限群，那么$m=|G|$为其阶。
则满足以下性质：$\forall g\in G,g^m=1$（单位元）
推论：$G$为有限群，那么$g^x=g^{x~ mod~ m}$

### 求幂方式

对于求$a^n$中n十分庞大的情况，可以通过快速幂的思想快速求解。关于快速幂，同样可以查询OIWIKI。

### Cyclic Groups

现定义$G=\{g_0,g_1,...\}$为有限群，其阶为m。

设$i\leq m$是能够满足以下性质的最小正整数：$g^i=1$,其可以构建这样一个群：$g^i=g^0,g^{i+1}=g^i,< g >=\{g^0,g^1,...g^{i-1}\}$

那么，我们叫$i$为元素$g$的阶，而$< g >$是$G$的子群，由$g$生成。

若由一个元素$g\in G$,其阶为$m=|G|$，那么G被称为循环群。

:::info
    若$G$为$m$阶群，$g\in G$有阶$i$ ，则$i|m$
:::

若$p$是素数，则$Z^*_{p}=\{1,2,3,4,...p-1\}$是阶为$p-1$的循环群。

### Generating random primes

:::info Bertrand’s postulate
    $\forall n>1$,the fraction of n-bit integers that are prime is at least $1/3n$.
:::

有算法能够生成随机的素数，但实现其算法的要点在于如何判断一个数为素数。于是有素性测试。

### Probabilistic primality test（素性测试）

确定性的测试一个素数思路很简单，但用概率测试能够更有效率的解决。其对于所有的素数，都会输出正确的结果，但可能会误判合数为素数。

素性测试采用 [费马小定理](https://oi-wiki.org/math/number-theory/fermat/)，而素性测试可以见 [这里](https://oi-wiki.org/math/number-theory/prime/#%E7%B4%A0%E6%80%A7%E6%B5%8B%E8%AF%95)

### 因数

对于一个数而言，若其只有大的质因数，那么分解它是很难的；但找到任意给定的N的较小因数是较为简单的：$Pollard~rho$算法。关于Pollard rho算法，可以在OI WIKI中找到。

定义GenModule实验：

----

事先给定安全参数n

1. 预言机生成（$N,p,q$），返回敌手$N$，其中$N=pq$，$pq$为nbits 素数.
2. 敌手发送$p',q'$，若$N=p'q'$，返回1，否则返回0.

----

:::warning Factoring hard
    Factoring is hard 这一结论基于以下性质：对任意PPT 敌手
    $Pr[Factoring_{\mathcal{A,\mathbf{GenModulus}}}=1]\leq negl(n)$
:::

## RSA assumption

定义GenRSA实验：

----

事先给定安全参数n。

1. 预言机生成（$N,e,d$）返回敌手$N,e,y$，其中$N=pq,gcd(e,\phi(N))=1,ed=1~ mod \phi(N)$,y为均匀选择。
2. 敌手返回x，若$x^e=y~ mod N$ 返回1，否则返回0.

----

定义RSA是困难的，类似上方Factoring 定义方式。

RSA的经典构造方式，就不用细讲了罢）网上一搜都有的。

需要说明的是，RSA算法基于的假设并不是“大整数因式分解是困难的”，其基于的是上方的RSA问题。即使现基于RSA的攻击基本上都是基于大整数因式分解。

实际上，RSA的难度不可能比Factoring更难，但RSA问题的难易程度是否由Factoring所决定，也是一个悬而未决的问题。一般而言，RSA问题可能可以在PPT内完成，但Factoring则不能。

----

同时，普通教材上的RSA实际上不太可能在实际方案中出现，实际方案的RSA已经经过修改，但仍基于最基本的RSA算法。

## Generators

:::info
    若G为q阶循环群，q>1,其生成元为g，那么G一共有$\phi(q)$个生成元。
:::

推论：若G为q阶群，q为素数，那么G为循环群；同时，除了单位元，任何G的元素都是生成元。

----

若G为q阶群，q可以表示为 $\prod p_i^{e_i}$，则选择$q_i=q/p_i$，当且仅当$h\in G,h^{q_i}\neq 1$时h为G的生成元。

## Discrete logarithms

现选择q阶循环群，那么可以定义DL problem：

----

DL problem：给定$h=g^x$去寻找x。

让$\mathcal{G}$为群生成器，其输入为$1^n$,输出一个循环群 $(G,q,g)$,其中$|q|=n$。

则有：$DLOG_{\mathcal{A},\mathcal{G}}$:

1. 运行 $\mathcal{G}(1^n)$.
2. 均匀选择元素$h\in G$
3. 敌手被给定：$G,q,g,h$并返回预言机$x\in \mathbb{Z}_q$
4. 若$g^x=h$输出1，否则返回0。

----

warning Discrete-logarithm
    定义离散对数问题是难的，其依赖于上述实验对任意PPT敌手：
    $$Pr[DLOG_{\mathcal{A},\mathcal{G}}=1]\leq negl(n)$$
:::

基于DL problem，现讨论以下较弱的问题

### computational Diffie-Hellman(CDH)

让$DH_g(h_1,h_2)=g^{log_g(h_1)\cdot log_g(h_2)}$
若$h_1=g^{x_1},h_2=g^{x_2}$,那么$DH_g(h_1,h_2)=g^{x_1x_2}=h_1^{x_2}=h_2^{x_1}$

CDH problem: Given $G,q,g,h_1,h_2$，计算  $DH_g(h_1,h_2)$

其概率定义类似上节。

### Decision Diffie-Hellman(DDH)

给定$(G,q,g)$并均匀随机选择$h_1,h_2\in G$区分$DH_g(h_1,h_2)$的结果和随机选择的元素$h'\in G$、

其类似的定义也是上方的概率定义。

----

### conclusion

若能解决DH问题，自然也能解决DDH和CDH问题，DDH是比CDH更强的假设；但也有groups满足CDH更难，DDH是简单的性质。

在实际问题中，由于素数阶的群生成元更容易找到，且DL Problem的强度是最高的，同时还有其他的性质（这里不讨论），一般而言选择素数阶的群。

## Elliptic curves(椭圆曲线)

这里要引入域的概念。关于域，一般而言是满足两类运算的代数结构，具体可见OI WIKI。

在密码学中，为了让DLP更难，需要选择大素数阶的群（子群）。而对于椭圆曲线群的阶，则有以下讨论：

定义二次剩余(quadratic residue,QR),选择$y\in \mathbb{Z}_p$，其为模p的二次剩余时，满足：$\exists x\in \mathbb{Z}_p,x^2=y~ mod p$.

对于大于2的素数p。有一半的$\mathbb{Z}_p$,且每个QR都有两个square roots。

剩下的真看不懂了，似乎是构造了一个素数等式，若满足有该素数表达式的点，则有p+1个 point of infinite？而这个等式似乎和构造二次剩余的交点个数有关？

直接上结论了。

:::info Hasse bound
    p为素数，E为$\mathbb{Z}_p$的椭圆曲线，则有：
    $$p+1-2\sqrt{p}\leq |E(\mathbb{Z}_p)|\leq p+1+2\sqrt{p}$$
:::

选择椭圆曲线是，一般而言是随机选择，其便可以极其接近“均匀”分布在Hasse bound所确定的区间。需要注意的是要排除弱椭圆曲线。

通过椭圆曲线，还可以定义椭圆曲线上的DLP(ECDLP)，相对应的也可以定义CDH,DDH。

### Application

觉得很重要，说明了一些有关椭圆曲线的攻击、后门，以及新型应用，但不想翻译，直接贴原文了。

Although curves standardized decades ago are still widely used, there happened a lot in the last decades.
Starting with Kocher’99, side-channel attacks and their couter-measures have become extremely sophisticated.
Decades of new research yielding faster, simpler and safer ways to do ECC.
Suspicion surrounding previous standards: snowden leaks, dual EC-DRBG backdoor, etc., lead to conjectured.weaknesses in the NIST curves.
Other specific classes of curves enable secure cryptographic pairings.
  And thus interesting applications such as practical identity-and attribute-based cryptography.

----

基于椭圆曲线的双线性映射，这里略。

## 碎碎念

笑死，原PPT这里是极短的，老师似乎两节课就结束了，但要理解这些概念对于初学者而言还是不太够。只能看之后自己能不能补上了。
