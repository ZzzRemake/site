---
sidebar_position: 11
---

# Public Key Encryption

上章讲了公钥密码的优点，这里讲一下缺点：

1. 公钥密码不能指定发送者。公钥是公开的，那么任何人都可以发送给持有私钥的接收者信息。
2. 最主要的还是效率，公钥密码的时间复杂度比私钥密码高出2-3个数量级。

## Security distribution of public keys

到目前为止，我们对公钥密码的讨论仅限于被动（EAV）敌手。若敌手能够截获所有信息，并且通信双方没有在此之前共享密钥，则无法实现secrecy。

因此，在本章有一个很重要的假设：发送者能够直接获得接收者的公钥（安全密钥分发）。该假设的原因是因为存在有其他方式能够抵御主动攻击，因此将密钥分发和公钥加密的安全性分开讨论是合理的。

## CPA attacks

### EAV Security?

$PubK_{\mathcal{A},\prod}^{\mathbf{eav}}$ expriment

1. 敌手预言机事先给定安全参数n。
2. 预言机:$(pk,sk)\leftarrow Gen(1^n),b\leftarrow \{0,1\}$，并将公钥返回给攻击者。
3. 攻击者$\mathcal{A}$ 发送$(m_0,m_1)$,预言机返回$c'\leftarrow Enc_{pk}(m_b)$
4. 攻击者返回$b'$，若$b=b'$ 返回1，否则0.

:::warning EAV Security
    A public-key encryption scheme $\prod =(Gen, Enc, Dec)$ has indistinguishable encryption in the presence of an eavesdropper if for all probabilistic polynomial-time adversary $\mathcal{A}$ there is a negligible function $negl$ such that
    $Pr[PubK_{\mathcal{A},\prod}^{\mathbf{eav}}(n)=1]\leq 1/2+negl(n)$
:::

### Public key definition

$Gen(1^n)$生成公钥$pk$,私钥$sk$.
$Enc_{pk}( m)\rightarrow c$，其中m从消息空间$\mathcal{M}$中获取。
$Dec_{sk}( c)\rightarrow m~ or~
 \bot$

需要注意的是，公钥密码允许有可忽略的概率使得
$Dec_{sk}(Enc_{pk}(m))=m$不成立。
因此，Enc可以是确定性或概率性的，Dec允许Perfectly Correct，但也允许以可忽略概率失败。

需要注意的是，每一个公钥密码的实例中，消息空间都是隐含着与公钥$pk$有关，可能是某些代数结构中的元素。因此，消息m可能需要转换。

### Some Theorem

:::info CPA-Secure
    若公钥加密方案保证EAV安全，那么其也是IND-CPA-Secure（IND= indistinguishable）
:::

这条很好说明，公钥的公开使任何人都可以加密信息，相当于获得了$Enc$预言机。

:::info Perfect secret
    没有任何公钥加密方案能保证完美加密。
:::

不做证明（之后看看能不能补上）

:::info Deterministic encryption scheme
    没有确定性的公钥加密方案满足IND-CPA-Secure
:::

在实践中，我们想让同一条公钥pk去加密多条消息，于是有：

:::warning Multiple Encryption
    若公钥加密方案满足IND-CPA-secure，那么其也满足multiple encryption的不可区分性。
:::

## Arbitrary long messages

由上文对多消息加密的安全性，可以构造一个加密方案，其基于最初的公钥加密：每一块都来个加密然后发送。该方案是IND-CPA-secure的。

然而，这不够高效，于是有混合加密方案：

公钥加密只加密私钥加密的密钥，私钥加密整条信息连带着公钥加密的密钥一同发送。

### CCA attacks

CCA attack experiment

1. 事先给定n。
2. 预言机:$(pk,sk)\leftarrow Gen(1^n),b\leftarrow \{0,1\}$，并将公钥返回给攻击者。
3. 攻击者发送密文$c_i$,预言机返回$Dec_{sk}(c_i)$
4. 可进行多次第三步，之后敌手发送$m_0,m_1$,预言机返回$c'$
之后还可以多次进行第三步，但无法对$c'$进行Dec。
5. 敌手发送b',之后和其他定义一样。

:::warning CCA-secure
    对任意PPT敌手$\mathcal{A}$,若满足以下性质，则满足CCA-secure：
    $$Pr[PubK_{\mathcal{A},\prod}^{\mathbf{cca}}=1]\leq 1/2+negl(n)$$
:::

## Key-encapsulation machanism(KEM)

KEM定义为$Gen,Encaps,Decaps$

$Gen(1^n)\rightarrow (pk,sk)$
$Encaps(1^n,pk)\rightarrow (c,k),k\in\{0,1\}^{p(n)}$
$Decaps(sk,c)\rightarrow k$

同样也要求存在可忽略的概率不成功（公钥啊嗯）

----

KEM experiment

1. 事先给定n。
2. 预言机$Gen(1^n)\rightarrow (pk,sk),Encaps_{pk}(1^n)\rightarrow (c',k)$,随机选择$b\leftarrow\{0,1\}$，若b=0，k'=k，否则k从$\{0,1\}^n$随机获取，返回敌手$(pk,(c',k'))$
3. 敌手返回b'，剩余和其他预言机定义相同。

----

:::warning CPA-secure
    对任意PPT敌手$\mathcal{A}$,若满足以下性质则有CPA-secure：
    $$Pr[KEM_{\mathcal{A},\prod}^{\mathbf{pa}}=1]\leq 1/2+negl(n)$$
:::

用先前构造的公钥密码方案（IND-CPA/IND-CCA）可以很容易构造KEM(IND-CPA/IND-CCA)，构造方法略（懒），把加密的消息换成k就行了。

需要注意的是，由于k本身需要“随机”选择，因此消息空间需要具有合适的“min-entropy”。

当然，专门的KEM算法效率肯定比这种构造的效率要高。

### Hybrid Encryption

有了KEM，就可以构造更高效的（混合）公钥加密。

设$\prod=(Gen,Encaps,Decaps),\prod'=(Gen',Enc',Dec')$,构造$\prod^{hy}=(Gen^{hy},Enc^{hy},Dec^{hy})$

$Gen^{hy}:(pk,sk)\leftarrow Gen(1^n)$
$Enc^{hy}:c' \leftarrow Enc_k'(m)$
output:$(c,c')$
$Dec^{hy}:k=Decaps_{sk}(c),m=Dec_k'(c')$

:::info
    若$\prod$ 是CPA-secure KEM，$\prod'$私钥密码是EAV下安全，则$\prod^{hy}$是CPA-secure的。
:::

:::info
    若$\prod$ 是CCA-secure KEM，$\prod'$私钥密码是CCA-secure，则$\prod^{hy}$是CCA-secure的。
:::

## EIGamal Encryption

基本思路：
利用DH problem，接收者选择$a\leftarrow \mathbb{Z}_q$作为私钥，而把群$(G,q,g)$和$g^a$作为公钥公开，那么任何人可以指定b，传输$g^b，K\cdot M$给接收者，则接收者运行$K\leftarrow(g^b)^a$,从而解密，并共享密钥。

### scheme

$Gen(1^n):Run(G,q,g)\leftarrow\mathbb{G}(1^n)$随机选择$x\leftarrow\mathbb{Z}_q$,计算$y=g^x$

$$(sk,pk)=((G,q,g,x)(G,q,g,y))$$

$Enc(m,pk):$对于输入m，随机选择$r\leftarrow\mathbb{Z}_q,$

$$C=(g^r,m\cdot y^r)$$

$Dec(C,sk):C=(C_1,C_2),$

$$m=C_2\cdot(C_1^x)^{-1}$$

在这里可以认为$(G,q,g)$为安全参数。

### Security

:::warning lemma EIGamal
    设$G$为有限群，$m\in G$任意，随机选择的$k\in G$和设置的$k'=k\cdot m$具有相同的分布，即对任意的$g'\in G$
    $$Pr[k\cdot m=g']=1/G$$
:::

上方的lemma中，可以看到类似于私钥密码中的一次一密定义，那么由此，可以设想出另外一种"EIGamal"的加密方式：

随机选择$g^z$,让密文$C=(g^r,m\cdot g^z)$

因此， $g^z$ 对敌手是未知的，则其能够满足信息论安全（即完美加密）

EIGamal的安全性证明便基于此类的不可区分性小于$1/2+negl(n)$,而其证明又依赖于DDH assumption。

安全证明就略了😋

## RSA attacks

回顾一下“课本”上的RSA：

$Gen()$:选择两个大素数p，q，N=pq，均匀选择e，$1<e<\phi(N)$且$gcd(e,\phi(N))=1$.计算$d,ed=1~ \phi(N)$
$Enc(pk,m): c=m^e~ mod N$
$Dec(sk,c): m=c^d ~ mod N$

:::note RSA in our class
    课本上的RSA是不能够直接使用的。
:::

RSA假设中，m是随机均匀选择的，但其本质上而言，消息并不满足这一条件。同时，RSA加密过程是确定性的，因此必定不是安全的。

具体攻击方法略。反正很容易构造捏。

----

由上，RSA在实际使用过程中需要进行预处理等过程，才能够真正作为加密算法进行公钥加密。

RSA-OAEP便用了哈希函数，使得RSA-OAEP是CCA Secure的（证明过程中用到了随机函数，其用SHA-256进行实例化。）
