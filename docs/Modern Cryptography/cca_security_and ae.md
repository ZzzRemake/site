---
sidebar_position: 6
---

# CCA-Security ＆ AE

## Chosen ciphertext attacks(CCA)

本章之前所讨论的都是CPA安全性，以及$EAV$等敌手。而CCA相比CPA而言，不仅能够访问$Enc_korcale$,也可以访问$Dec_korcale$.

### Padding-orcale attacks

这里介绍的attack方式是CPA无法防御的。

CBC模式下，明文长度必为分组长度的倍数。因此，便需要扩充。假设分组长度16bytes。
$b=16-(|m|mod 16)$
则在明文后填充b个值：b。比如HelloWorld666666.若b=0，填充16个0.

$Dec_k(\cdot)$的访问导致了可以通过对CBC模式的密文替换学习到b的值是什么，从而得出更多的信息。

### CCA Definition

还是采取预言机定义。事前敌手和预言机给定安全参数$n\in N$

1. 预言机生成密钥$k\leftarrow Gen(1^n)$和随机选取的$b\leftarrow\{0,1\}$
2. 敌手既可以发送明文$m\in\{0,1\}’$，预言机返回$Enc_k( m)$；也可以发送密文$c\in\{0,1\}’$,预言机返回$Dec_k( c)$.可不断进行。
3. 最后，发送明文$m_0,m_1\in \{0,1\}’,|m_0|=|m_1|$，预言机返回$c'=Enc_k(m_b)$，其不可以被解密预言机解密。

其具体的CCA下不可区分性，或者说CCA-Secure的概率性定义和之前一样。

:::info Is CCA-secure unnecessarily strong?
    Since we don’t know what information an attacker might be able to learn when a ciphertext it sends is decrypted by a receiver, in reality we make the worst-case assumption that the attacker learns everything, where the adversary is stronger than whom in padding-oracle attack.
:::

## CCA schemes

**到如今，我们没有构造出任何一个CCA secure的加密方案。**

举个例子。最简单的一个scheme：$Enc_k(m)=<r,F_k( r)\oplus m>$
那么，在上面的CCA定义中最后一条中，敌手会收到预言机的回应：$<r,s=F_k( r)\oplus m_b>$，则他可以随机选取一个$x$，访问Dec预言机：$s\oplus x\oplus F_k( r)=Dec_k(<r,s\oplus x>)$
从而学习到$m_b\oplus x$.

CCA Security 需要不可延展性: $non-malleability$.这种性质导致，若敌手对给定的密文进行任何修饰。它解密出来的明文不应该和原明文有任何联系。

### unforgeable encryption

首先先试图把Secrecy和authenticated合起来。

----
预言机定义unforgeable：
（简略写了）

事先给定安全参数$n$。

1. 预言机生成$k$。
2. 敌手发送$m\in\{0,1\}^*$,预言机维护$G\cup=m$,返回$Enc_k(m)$
3. 不断进行第二步，最后敌手发送$c\in \{0,1\}^*$,预言机解密$m'=Dec_k( c)$，若$(m'\neq \bot)\land(m'\notin G)$返回1，否则返回0.

其中的垂直符号表示invalid。

----

需要注意的是，关于unforgeability for encryption，从弱到强共三阶：

1. Random Plaintext Unforgeability
2. Chosen Plaintext Unforgeability.
3. Existential Unforgeability.

这里采用最强的第三种。

:::warning Definition
    该方案若满足以下性质，对任何的PPT敌手$\mathcal{A}$，都是unforgeable的：
    $$Pr[Enc-Forge_{\mathcal{A},\prod}(n)=1]\leq negl(n)$$
:::

:::warning AE(1)
    A private-key encryption schemes is an Authenticated Encryption scheme if it is CCA-secure and unforgeable.
:::

## Authenticated Encryption(AE) Definition

预言机定义AE：

事先给定$n$。

1. 预言机生成$k$，$b$。
2. 敌手可访问两种预言机：
(1) 如果$b=0$，访问$Enc_k(m),Dec_k(m)$.
(2) 如果$b=1$,访问$Enc_k^0(m)=Enc_k(0^{|m|})$和$Dec_\bot( c)$,$Dec$永远返回error标志。
3. 敌手猜测$b'$，若$b=b'$，返回1，否则返回0.

:::warning AE(2)
    A private-key encryption scheme is an authenticated encryption (AE) scheme if for all PPT adversaries $\mathcal{A}$ there is a negligible function negl such that:
    $$Pr[Priv_{\mathcal{A},\prod}^{ae}=1]\leq \frac{1}{2}+negl(n)$$
:::

以上两个AE定义等价。

另外，若AE schemes能够接受额外的数据，被称为authenticated encryption with associated data (AEAD).

### CCA and AE

需要注意的是，**任何AE scheme都满足CCA-secure，反过来则不满足。**

密钥交换协议就无需AE但需要CCA。

AE需要满足Secrecy和integrity，但CCA-security只需要满足在CCA敌手下的安全性。

## AE schemes

由上讨论，我们想要构建一个兼具secrecy和integrity的方案。但两者的结合方式会造成不一样的结果。即使每个原语都是安全的，结合起来也可以是不安全的。

另外，安全性依靠其底部构建的细节是危险的。我们一般而言讨论安全性的时候，都是着重于通常的安全性。

### Generic Constructions

#### Encrypt-and-authenticate

选定两个独立的密钥，分别生成$Enc_{k_E}(m)$和$Mac_{k_M}(m)$
这种方式不能保证任何的secrecy，因为tag便可以暴露$m$。无法保证CPA security，若MAC是确定性的，比如CBC-MAC，则相同的m便会生成相同的tag。

#### Authenticate-then-Encrypt

选定两个独立的密钥，序列生成：
$t\leftarrow Mac_{k_M}(m),c'=Enc_{k_E}(m,t)$

回想一下先前的padding attack，假设Enc是CBC-mode，则先验证再加密存在着两个错误来源：填充不正确，或tag无法Vrfy。

因此构造出$Dec'_{k_E,k_M}( c)$：

1. 计算$m'=Dec_{k_E}$,若padding error发生，则返回“bad padding”。
2. 将m'解析为$m||t$，若$Vrfy_{k_M}(m,t)=1$，返回m，否则返回“authentication failure”

若敌手可以区分两种错误信息返回，则便可以通过Padding attack中的方式获取整个明文。

实际运用中，SSL试图修复这一点，它只返回一种错误消息，但要保证无法区分不同的错误还是十分困难的。因此，微小的时间差别使该版本的SSL被成功攻破。

#### Encrypt-then-Authenticate

选定两个独立的密钥，序列生成：

$c\leftarrow Enc_{k_E}(m),t\leftarrow Mac_{k_M}( c)$

若MAC是strong MAC，那么该AE满足strongly unforgeable。

若采用的模块分别能满足strong MAC和CPA-secure，那么该加密方案满足AE。
（证明思路，大约是证明Dec是无用的。）

### Independent keys

:::warning 密钥的独立性
    所有的密码学原语都应该采用独立的密钥！
:::

为什么？现假设：$Enc_k(m)=F_k(m||r)$，$F$是strong PRP，则该加密方案满足CPA-secure。

$Mac_k( c)=F_k^{-1}( c)$这也能满足strong secure。

但，若用Enc-then-Authen，则有：

$Enc_k(m),Mac_k(Enc_k(m))=F_k(m||r),F_k^{-1}(F_k(m||r))=F_k(m||r),m||r$
这不就暴露力？

### standard schemes

1. GCM
the encrypt-then-authenticate paradigm with CTR mode and GMAC
2. CCM
the authenticate-then-encrypt approach with CTR mode and CBC-MAC
3. ChaCha20-Poly1305
the encrypt-then-authenticate approach with ChaCha20 and Poly1305

实际上现在用的AES加密方案，大多都是在说GCM。
