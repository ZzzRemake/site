---
sidebar_position: 12
---

# Digital Signature

公钥语境下的认证可以认为是加密方案的“逆操作”。在公钥加密方案中，发送者可以对消息用公钥加密，接收者用唯一一把私钥进行解密，从而保证消息的Secrecy。而认证方案，也就是接下来要介绍的数字签名中，发送者用私钥进行加密，接收者用公钥解密，这样便可以验证发送者的身份。

实际上，数字签名（公钥语境下的MAC）需要保证以下性质：

1. Integrity protection：任何对一个被签名的消息的修改都会被发现。
2. Source authenticity 发送该消息的人身份得以验证。
3. Non-repudiation 发送者无法抵赖他发送了这条信息。

## Definition

一个数字签名方案可看作PPT 三元组$(Gen,Sig,Vrfy)$

$Gen(1^n)\rightarrow (pk,sk)$

$Sig_{sk}(m)\rightarrow$ 签名 $\sigma$。需要注意的是这里的m也和公钥加密方案一样被密钥制定消息空间。

$Vrfy_{pk}(m,\sigma)\rightarrow b$

特别的，数字签名允许以下Vrfy过程的可忽略概率的失败：

$Vrfy_{pk}(m,Sig_{sk}(m))=1$

$Vrfy$是确定性的，其可以具有“可忽略概率的失败”性质，也可以解密完全成功。而$Sig$可确定可概率性，也可以无状态或者有状态，在实际过程中，无状态为实践做法。

上述过程中，我们构造了一个有限长度的数字签名方案，后续会介绍任意长度的方案。

## Formal security notions

数字签名需要新的威胁模型和安全目标。

### Attack model

1. **No-message attack (NMA)**: 攻击者只能获取密钥信息。
2. **Random message attack (RMA)**: 攻击者只能看到随机的信息流，其中包含数字签名。即类似于EAV的被动攻击。
3. **Non-adaptive chosen message attack (naCMA)**: 攻击者可以主动构造一系列信息，并获得签名（构造的过程需在获得密钥之前）。
4. 攻击者可以任意选择信息，并获得签名（无需考虑顺序）

### Goal of an adversary

攻击者的目标反过来就是安全目标（

1. **Universal forgery(UF)**: 攻击者需要对任意消息输出一个合法的signature。
2. **Existential forgery (EF)**: 攻击者可对自己选定的消息输出合法signature。

因此，我们尽量选择最强的敌手能力，在此之下来保证其不能满足最弱的目标，作为我们的安全目标。

于是有EUF-CMA： existential unforgeability under chosen message attacks.

### EUF-CMA Security

略。定义方式和MAC的存在不可为造性极其相似，不想写了属于是。

需要注意的是，signature分为one-time（一次性）和many-time signatures，并且还有weak signature和strong（对于查询过的$m$，生成不一样但有效的$\sigma$）signature的区别。

## RSA signatures

### “Textbook” RSA

这里的方案和课本上的RSA加密过程极其相似，不过是公钥和私钥作用的位置互换。

然而，RSA只能保证一次性的安全性，于是有一下攻击：

**NMA**: $(m',\sigma')=(1,1)$，则必有$1^d=1\pmod N$

**EUF-CMA**: 任意$(m_1,\sigma_1),(m_2,\sigma_2)$，都能构造新的一对：$(m',\sigma')=(m_1\cdot m_2\pmod N,\sigma_1\cdot\sigma_2\pmod N)$,其为合法数字签名。

### Hash-and-Sign

理论上而言，使用定长的数字签名方案，重复多次也能够起到加密任意长信息的效果。然而，这并不能满足对高效率的需求。

很自然的便有了使用Hash再签名的方案。需要注意的是哈希函数$H$的值域也需要满足数字签名的消息空间要求。

于是有以下构造：$\Sigma=(Gen,Sig,Vrfy)$作为长度$k(n)$的定长数字签名方案，设$\Gamma=(Gen_H,H)$作为输出长度$k(n)$的哈希方案，则构造任意长度数字签名方案$\Sigma'=(Gen',Sig',Vrfy')$

$Gen': Gen(1^n)\rightarrow (pk,sk)，Gen_H(1^n)\rightarrow s$，公钥为$(pk,s)$,私钥为$(sk,s)$.

$Sig': Sig_{sk}(H(s,m))\rightarrow$ 签名 $\sigma$。

$Vrfy': Vrfy_{pk}(H(s,m),\sigma)\rightarrow b$

可以看到，这里添加了哈希函数的密钥s。

:::warning Arbitrary long signature scheme
    若$\Sigma$为安全定长数字签名，$\Gamma$为抗碰撞，则$\Sigma'$为任意长度的安全数字签名。
:::

## Some construct scheme

### RSA FDH

若将普通RSA版本改为上方的Hash-and-Sign方式，则满足EUF-CMA性质，其证明用到了随机预言机。

### Scheme based on DL problem

接下来介绍的两方案本质上是一种无交互的零知识证明下使用DL problem的方案。

### Schnorr

$Gen：\mathcal{G}(1^n)\rightarrow(G,q,g)$，均匀选择$x\leftarrow \mathbb{Z}_q,y=g^x$，则公钥为$(G,q,g,y)$,私钥为$x$。同时，选择$H:\{0,1\}'\rightarrow \mathbb{Z}_q$

$Sign:m\in \{0,1\}'$，均匀选择$k\leftarrow \mathbb{Z}_q,I=g^k$，计算 $r=H(I,m),s=rx+k\pmod q $,最后输出$\sigma=(r,s)$.

$Vrfy:$ 计算 $I=g^s\cdot y^{-r}$，验证$r$是否等于$H(I,m)$

Correctness:$g^s\cdot y^{-r}=g^{rx+k}\cdot g^{-xr}=g^r=I$

:::warning Schnorr
    若H为随机预言机，则该问题基于DL problem下满足EUF-CMA secure。
:::

### DSA/ECDSA

这里只介绍DSA（因为不会椭圆曲线~~最重要的原因是PPT没有~~）

$Gen：\mathcal{G}(1^n)\rightarrow(G,q,g)$，均匀选择$x\leftarrow \mathbb{Z}_q,y=g^x$，则公钥为$(G,q,g,y)$,私钥为$x$。同时，选择$H:\{0,1\}'\rightarrow \mathbb{Z}_q$和函数$F:G\rightarrow \mathbb{Z}_q$

$Sign:m\in \{0,1\}'$，均匀选择$k\leftarrow \mathbb{Z}_q,r=F(g^k)$，则计算$s=k^{-1}(H(m)+rx)\pmod q $。若 $r,k,s$任意一个为0，则重新开始，选择全新的k。最后输出$\sigma=(r,s)$。

$Vrfy:$ 计算 $u=s^{-1} \pmod q$，验证$r$是否等于$F(g^{H(m)u}y^{ru})$

Correctness类似上方，化简下就出来了。

DSA工作在素数 $q$ 阶群，并且$F(I)=I \pmod q$,ECDSA类似。

:::warning DSA/ECDSA
    若$H,F$为随机预言机，那么该方案的EUF-CMA 基于DL问题。
:::

----

需要注意的是，这两个方案并不是完全安全的。

### One-time signatures

$Gen：\mathcal{G}(1^n)\rightarrow(G,q,g)$，均匀选择$x，y\leftarrow \mathbb{Z}_q,h=g^x,c=g^y$，则公钥为$(G,q,g,h,c)$,私钥为$(x,y)$。
$Sign:m\in \{0,1\}'$,计算$\sigma=(y-m)x^{-1} \pmod q$
$Vrfy:$ 计算 $u=s^{-1} \pmod q$，验证$c=g^mh^\sigma$

Correctness: $g^m,c^\sigma=g^{m+x\sigma}=g^{m+x(y-m)/x}=g^y=c$

:::warning One-time signatures
    该方案基于DL problem 满足 EUF-1-naCMA安全性。
:::

## 杂项

### Generic compilers for strong security

1. **CMA from RSA** 任意的RMA方案（消息空间 $k,q(k)$）都能构造出$q(k)$消息空间的CMA 方案。
具体而言，对消息$m\in\{0,1\}^*$，随机选择$m_L\rightarrow \{0,1\}^q$，计算$m_R=m_L\oplus m$则有$m=m_L\oplus m_R$,两个都具有随机性。
随机选择$r\leftarrow\{0,1\}^k$,则$r||m_L,r||m_R$分别可作为独立的$sk_L,sk_R$。
2. **CMA from naCMA**,通过使用一次性的naCMA方案生成消息的数字签名，并使用长期的naCMA方案来对一次性naCMA方案签名，即可构造CMA。

### CA

略。
