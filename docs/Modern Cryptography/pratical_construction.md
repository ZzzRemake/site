---
sidebar_position: 8
---

# Practical Construction

本节为私钥密码学的最后一部分：用现有的密码学原语（均为对称密码学）构造实用的加密方案。

另外，本节所探讨的一系列问题许多都是基于启发式的，也就是无法基于任何较弱的假设证明安全性。但若假设成立，例如大整数因式分解、AES是伪随机排列等，可以通过理论证明和实践证明来表明其安全性。

最后，本节不进行过多的对加密方案细节的描述。

## Stream cipher

### RC4

虽然在普通的密码学教材中，流密码一般具有代码短、速度快的特点，看上去应该广泛应用；实际上RC4也有这些优点，教科书里也以RC4作为流密码的案例；但近年来已经证明RC4有着密码学意义上的缺陷，实际中不应该继续使用。

### Trivium

（略）

### ChaCha20

ChaCha20作为流密码，可以和Poly1305这种消息认证组合成 AE scheme，并被广泛用于TLS。

## Block ciphers

在之前的章节中已有部分介绍。这里放一些相关数据罢。

n(分组长度)，k(密钥长度)
$DES:n=64\quad bits,k=56\quad bits$
$AES:n=128\quad bits,k=128,192,256\quad bits$

### Iteration

轮函数在DES中用于迭代生成密文。

|分组密码|轮函数迭代次数|
| --- | --- |
| DES | 16  |
| AES-128| 10  |
| AES-192| 12  |
| AES-256| 14  |

### Designed goals

分组密码应该表现为伪随机排列，因此有以下性质：

1. The number of permutation for n bits is $(2^n)!\approx n2^n$
2. Construct set of permutations with concise description(short key)
3. Similar to security property of PRP.

分组密码的安全性是最重要的，而判断其的依据是：其输出无法和随机排列输出区分开。

另外，分组密码还有一个重要性质：**改变输入的1bit 也能影响所有输出位**。确切而言，1bit的影响不是改变所有位，而是大致上让每一位有一般的概率被改变。

香农提出了混淆扩散范式（confusion-diffusion paradigm），通过密钥构建排列，再通过轮函数来构建简洁、伪随机的排列。

于是，有两种手段去构造分组密码：Substitution Permutation Network 和Feistel Network

## Substitution Permutation Network

为了阐明具体细节，现假设block length=n，代换块长度为L，于是便有个n/L代换块。具体如何操作见下：

1. key mixing：输入$x=x\oplus k$，其中k是该轮次的子密钥。
2. Substitution： $x=S_1(x_1)||...||S_8(x_{n/L})$，使用S-box这种排列置换方式。
3. Permutation 排列x的位来获得轮函数的输出。

每一轮的输出都作为下一轮的输入，最后通过密钥混合来得到最后的输出。S-box和mixing permutation是公开的,因此，若没有key mixing，剩余步骤都是确定性的，无密钥参与，也因此不提供额外的安全性。

每一轮的子密钥都是通过实际密钥(master key)key schedule来派生的。因此，一个r轮SPN有 r轮key mixing等步骤，但最后的密钥混合导致需要(r+1)个子密钥。

### avalanche effect

改变输入的一位会导致S box中至少两位输出的改变。mixing permutation也保证任何一个S box的输出都会作为下一轮多个S box的输入，由此的影响被称为“雪崩效应”。

## Feistel Network

具体细节的就不讲了，网上一搜一大堆。讲点别的。

但还是要有基本形式不是？

分组block分为左右两块：L,R。

$$L_i=R_{i-1}$$

$$R_i=L_{i-1}\oplus f_i(R_{i-1})$$

在该类构造方式中，处理的子函数$f_i$是公开的，且每一轮的子密钥也是从主密钥中派生而来，且是秘密的。因此，不像Feistel Network的结果是可逆的，$f_i$是不可逆的。

:::info Luby-Rackoff'85
    若$f$（输入密钥的函数）是安全的PRF，那么3轮的Feistel F便可为一个安全的PRP。
:::

## DES

DES采用16轮的Feistel Network构造，但其子函数$f_i(x)=F(k_i,x)$，构造方式是类似 Substitution permutation Network的.

### S-boxes and P-boxes

DES的构造方式具有S-boxes和P-boxes，S-boxes的输出是“P-box替换”的输入。P-boxes将每一输入位都映射到一个输出位。

若随机选取S/P-box，会导致分组密码不安全。其应该具有以下性质：

1. 任何输出位输出分布都不应该接近输入位的线性组合（函数）
2. S boxes的每4位输入都应该映射为1位输出位。
3. 若你查过S-boxes的表格，可以看到其输出是按照2-4位的表格来映射到4位输出的。DES的S-box要求表格中每一行（2位对应的一行或一列）的4 bits output string都应该只出现一次。
4. 改变S box输入的一位都会改变输出的2位。

### double DES

DES的56位密钥过短，从而导致可以通过暴力搜索来破解，人们试图通过加长密钥长度、重复使用DES来修复，于是就有了熟知的3 DES。

double DES:$2E(k_1,E(k_2,m))$采用112 位密钥，看起来应该安全性翻倍。但实际上，其并没有加强多少安全性。

#### meet in the middle attack

1. 建表，对第一层的加密可能结果$E(k_i,M)$进行穷举，并通过密钥来排序，时间复杂度$O(2^{56}log(2^{56}))$
2. 穷举搜索密钥空间$k\in \\{0,1\\}^{56}$，检索$D(k,C)$是否在表中，检索可用二分。若找到，有：$D(k_i,M)=D(k,C)->(k_i,k)=(k_2,k_1)$

总时间复杂度为$O(2^{56}log^{56})+O(2^{56}log^{56})=O(2^{63})<<2^{112}$，远远达不到预期安全性。

### Triple DES(3 DES)

构造方式类似 double DES，其也可以通过以上类似方法来攻破，虽然也达不到预期的安全性，但大致需要$O(2^{118})$才能攻破，因此仍然可以使用。

然而，其3倍于普通DES的时间，以及被日后的机器攻破的可能性，促使AES的诞生。
