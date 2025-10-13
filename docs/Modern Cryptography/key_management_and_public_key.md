---
sidebar_position: 10
---

# Key Management and Public Key

在此之前，我们讨论了私钥密码学的安全性，但一直没有讨论：如何分发密钥？

在Perfect Secret节中讲过，OTP可以采用线下的交换密钥，但如今的网络无法这样做；同时，私钥密码还需要保证密钥管理的安全性，并且也不适用于开放的系统中安全通信的需求。

## Partial Solution：Key-Distribution Centers(KDC)

在封闭系统中，能够构造出这样一种密钥管理方案，系统中KDC服务器来分配密钥，每一个用户都保存和KDC安全通信的长期密钥，而KDC按需返回用户短期密钥。

:::info 符号说明
    $S$：KDC Server

    $A,B$：用户。
    
    $K_{AS},K_{BS}$：$A,B$保存的长期密钥。
    
    $\{M\}_K$：被K加密且认证的消息M，这里可以采用任何的AE scheme，$K=(K_0,K_1)$，并同时采用Encrypt-then-MAC。

    ----

    P.S. 用户A，B在密码学论文中又可以叫做Alice，Bob，没有特殊的含义，只是约定俗称的叫法:-)，本文在之后也会出现$A$,Alice等混用的情况。
:::

### toy protocol(First)

很容易的，我们可以构造出这样一个方案：

1. $A$试图与B建立联系，向$S$发送$(A,B)$
2. $S$随机选择密钥$K$,并发送$\{K\}\_{K_{ AS} }\{K\}\_{ K_{ BS} }$
$\{K\}\_{K_{ BS} }$可以认为是S发送的ticket。
3. $A$向$B$发送$\{K\}\_{K_{BS} },A$，建立联系。

可以看到，其满足CPA-Secure。然而，其无法抵御中间人攻击：进行第三步时，中间人敌手截获A发送的信息，并向B发送$\{K\}\_{K_{BS} },Eve$。

### Second：suffer from replay attack

很容易想到，若中间人可以截获身份并顶替，那么将身份信息也随之加密发送即可。于是将上述方案中$\{K\}\_{K_{?S} }$转为$\{K,?\}\_{K_{otherS} }$

然而，该方法同样也可以遭受重放攻击。敌手可以存储KDC发送的值并重放，这样便可以使其复用密钥，导致不安全性。

### Third: Needham Schreoder 1972

因此，便有了$Nonce$概念。$Nonce$的字面意义是“number used once”,一次性有效。一般而言，$Nonce$是随机选择的数，其在通信中用于证明该信息是全新生成而不是重放的。

于是，在上述过程的第一步中A将发送$N_A$,第二步中$\{K,B\}\_{K_{AS} }$改为$\{K,B,N_A\}\_{K_{AS} }$

----

然而，该协议仍然存在缺陷。倘若敌手发送$\{K_{old},A\}\_{K_{BS} }$ ,B无法判断该密钥是否重放。

### Kerboros

（真实的Kerboros是很复杂的，这里随便写点了）

1. $A$ 向$S$发送$(A,B,N_A,N_B)$
2. $S$选择随机密钥$K$，发送$\{K,B,N_A\}_{K_{AS} },\{K,A,N_B\}_{K_{BS} }$
3. $A$发送$\{K,A,N_B\}_{K_{BS} }$，$B$发送$(B,N_B)$。

同时，Kerboros通过timestamps来保证key的freshness。

### conclusion

KDC能够保证封闭系统内的可扩展性，能够接纳更多的成员，用户只需要存储KDC keys，在通信的时候只需要KDC生成session keys 即可。

然而，其无法在开放系统如Internet中具有扩展性，并且其依赖于KDC的honesty、available。没有其他措施保证KDC的可信，KDC一旦故障也可能导致事故。

## Public-Key Cryptography

现构造一个实验：

Alice、Bob想要构建EAV下安全的通信。（现在先讨论没有篡改下的纯EAV攻击）

选定一个素数q，生成q阶群，生成元为$g$。

有以下密钥生成：

1. Alice生成$g^a$,$a\leftarrow \mathbb{Z}_q$，同理Boc生成$g^b$
2. 两者直接互相发送$g^?$，并根据各自的生成数，生成密钥$(g^b)^a\quad (g^a)^b$

----

定义$\mathbf{KE}_{\mathcal{A},\prod}^{\mathbf{eav}}$实验：

在这里，安全参数为$\mathcal{G}$生成的$(G,q,g)$

1. 预言机生成(k,trans)，随机选择$b\leftarrow\{0,1\}$，若$b=0$，$k'=k$，否则$k'$从$G$中均匀选择,返回敌手$(k',trans)$
2. 敌手返回$b'$.

----

:::warning key-exchange protocal $\prod$
    it's secure in the EAV if for every PPT $\mathcal{A}$
    $$Pr[b=b']\leq 1/2+negl(n)$$
:::

其安全性基于DDH问题。

:::info DDH and Diffie-Hellman key-exchange protocol
    若DDH是困难的，那么DH 密钥交换协议在EAV下是安全的。
:::

需要注意的是，这里选取得是有限群里的元素，因此可以用键控函数转化为nbits string以保证安全性。具体转换略。

----

DH密钥交换协议保证了EAV下的密钥交换是安全的，但其无法抵御中间人攻击。然而，其第一次证明了非对称技术，以及数论相关知识可以用于密码学的密钥分发问题。其仍然为标准密钥交换协议的核心。

## Public-Key revolution

PPT无，不作为考纲，但觉得有趣就搬来了。

在Diffie-Hellman发布他们的密钥交换协议时，他们也提出了非对称的密码学。

在此基础上，出现了RSA等公钥加密方案，也出现了数字签名这一公钥密码学下的认证手段。

公钥加密有以下特征：

1. 公钥密码学允许通过公开(但经过身份验证)的通道进行密钥分发，其可以简化共享密钥的分发与更新。
2. 公钥密码能够减少用户存储密钥的数量，例如在公司情境下，每个员工只需要存储自己的私钥和相对于其他所有员工公钥即可，公钥甚至不需要保密，可以存储在中央存储库中。
3. 公钥密码更适用于开放环境，通信双方即使没有通信过也能够建立安全通信信道。

可以说，公钥加密是对密码学的一次革命。在公钥密码学出现前，密码学一般属于情报等领域，而公钥技术出现后，便有了TLS、SSL这些使用。

----

严格说来，公钥密码比私钥密码要更强，每个公钥密码方案都可以用作私钥密码加密方案（既然EAV无法在公钥公开的情况下破解，公钥若保密更无法破解），但私钥密码学的效率更高，可以和公钥密码学进行适当组合使用。
