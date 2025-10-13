---
sidebar_position: 4
---

# Private Key Encryption

## 对上节的补充说明

我们目前已经拥有的加密方案，只有one-time pad以及其Ⅲ里头的改进型。改进型的加密方案是在单消息意义下的$EAV$不可区分性。
在多消息的情况下，由于one-time pad的$Enc$本质是**确定性**的，所以不能保证安全性。由此可以导出：

:::info
    若一个加密方案中Enc为确定性的，则在EAV下无法保证多消息加密的不可区分性。
:::

因此，需要概率意义上的Enc，有了它就可以继续讨论CPA-Security。

另外，多消息加密的、固定明文长度的加密方案，理论上不断重复同一过程便可以加密任意长的消息，但在这章的后续部分中，将介绍更为有效率的加密任意长度的消息方式。

----

在开始本节构造CPA加密方案前，有必要对伪随机性进行深入讨论。

## Pseudorandom functions(PRF)

注意与PRG（Pseudorandom generator）区分。
PRG是将作为种子的随机序列进行扩展长度，使其无法与相同长度的uniformly随机序列区分；PRF则是一类以密钥key作为输入的多项式可计算函数，其无法与随机函数进行区分。

:::warning PRF
    $$F:\{0,1\}^{l_{key}} \times \{0,1\}^{l_{in}} \rightarrow \{0,1\}^{l_{out}}$$
    1. Efficient:
        $$l_{key}(n)=l_{in}(n)=l_{out}(n)^a$$
    2. Secure: $F(k,\cdot)$with a random key $\mathcal{k} \in \{0,1\}^{n}$ 和随机函数$\{0,1\}^{n}\rightarrow\{0,1\}^{n} $无法区分。
:::

实际上的PRF可以不等长，但在接下来的讨论中，可以认为上面的$l_?(n)=n$.

我们知道，函数本质是一种一一映射，因此可以将所有可能的函数看作一个函数集合$Func_n$,则有：$|Func_n|=2^{2^n\cdot n}$。
描述随即均匀选取的$f\in Func_n$ 则需要$2^n\cdot n$bits 的空间去建立映射；因此，在多项式的算法下无法有效的读取f的所有可能的取值，也因此无法使用多项式算法直接定义与随机函数的不可区分性。
于是，可以通过试图区分 $f$ 和随机函数的区分者$\mathcal{D}$访问**预言机**来形式化PRF的安全定义。

### PRF Definition(oracle)

Definition：

1. 敌手（$\mathcal{D}$）向oracle发送**单个**信息x。
2. 预言机行为与之前相似，随机生成密钥k和b。**不一样的**：如果$b=0$，则用$F_k(x)$返回，否则则用$f\leftarrow Func_n $生成$f(x)$返回。f为均匀随机选择的函数。
3. 敌手返回b'，oracle行为与之前的预言机行为相同。

于是，上方的Definition中secure可以改为：

:::warning PRF(2)
    Secure：for every PPT $\mathcal{D}$:
    $$|Pr[b'=1|b=0]-Pr[b'=1|b=1]|=     |Pr_{k\leftarrow \{0,1\}^{n}}[D^{F(k,\cdot)}=1]-Pr_{f\leftarrow Func_n}[D^{f(\cdot)}]|\leq negl(n)$$
:::

## Pseudorandom permutations（PRP）

现定义$Perm_n\subset Func_n$,表示所有在$\{0,1\}^n$上的排列集合。于是：
$$|Perm_n|=2^n!$$
我们可以用几乎和PRFs相同的定义方式定义伪随机性排列PRPs：

:::warning Pseudorandom permutations
    $$F:\{0,1\}^{l_{key}} \times \{0,1\}^{l_{in}} \rightarrow \{0,1\}^{l_{out}}$$是PRP，则有：
    1. Efficient: 同PRF
    2. $F_k(\cdot)$是排列。
    3. Secure：for every PPT $\mathcal{D}$:
    $$|Pr_{k\leftarrow \{0,1\}^{l_{key}(n)}}[D^{F(k,\cdot)}=1]-Pr_{f\leftarrow Perm_{l_{in}(n)}}[D^{f(\cdot)}]|\leq negl(n)$$
:::

需要指出的是，由于是PRP，要求多项式时间内计算函数与逆函数，所以要求$l_{in}(n)=l_{key}(n)$.

:::info PRP and PRF
    如果F是PRP且$l_{in}(n)\geq n$,那么F同样也是PRF。
:::

上述情况在渐进意义上成立，但具体安全性仍然可能受到影响。

### Strong PRPs

PRP在实际使用中，逆函数同样也被honest parties 所需。因此，需要考虑更高的安全性。

:::warning Definition Strong PRP
    F为有效的、具有key输入的、长度固定的（n的多项式）排列。若为Strong PRPs，则有：
    $$Pr[\mathcal{D}^{F(k,\cdot),F^{-1}(k,\cdot)}=1]-Pr[\mathcal{D}^{f(\cdot),f^{-1}(\cdot)}=1]\leq negl(n)$$
:::

:::info missing block-ciphers(分组密码)
    实际上，像DES,AES这类我们熟悉的**分组密码**，其最初始的目的就是作为strong PRPs进行使用。其区别仅仅在于分组以及密钥的长度固定（而非渐进意义上），以及认为暴力破解才是最佳的破解方式。
    因此，**分组密码不是加密方案**。
:::

### CPA-Secure

通过PRFs/PRPs，我们现在可以很好的定义CPA-secure的加密方案。

$F:\{0,1\}^n\times \{0,1\}^n\rightarrow \{0,1\}^n$

$Enc(k,m\in \{0,1\}^n )$ 选取$r\leftarrow\{0,1\}^n$

$$c\leftarrow <r,m\oplus F_k( r)>$$

$Dec(c=<r,s>):m\leftarrow F_k( r)\oplus s$

:::info
    如果F是PRF,上述构造为 CPA-secure 的固定明文长度的私钥加密方案。
:::

## Modes of Operation(操作模式)

在实际应用中，PRGs更多用于初始化流密码，而PRPs则用于分组密码。实际上，分组密码的另一个名字就是PRP。

### Stream ciphers(流密码)

#### basic definition

在此之前，我们定义的加密方案都对明文有明确的长度限制，不够有扩展性。流密码则提供了更高的延展性。

流密码在形式上，提供了以下确定性的算法作为基本部件：

1. $Init$: 输入种子$s$和选定的初始向量$IV$,输出初始状态$st$.
2. $Next$：以状态作为输入，输出a bit $y$ 并且更新状态 $st’$.

则可以定义带有密钥输入的函数：
$$F_s^l(IV)=GetBits_1(Init(s,IV),1^l)$$
若$F^l$为为随机函数，则该流密码是安全的。

#### 流密码の操作模式

略。分同步和异步两种方式。

### Block-cipher modes of operation

具体的操作模式形式就不在本节介绍了，一搜都有。

操作模式可以看作一种构造，这种构造将一个密码学上的模块（或者，原语？）（PRF,PRP/分组密码抑或是日后要介绍的hash function）转变为一种useful的密码学方案（加密方案，或是日后介绍的认证方案）。

#### ECB

最最基本的模式，但这种模式**绝对**不能继续使用了。ECB的模式是确定性的，因此并不是CPA-secure的。

~~老师甚至在课堂讲如果有人毕设在安全部份用ECB被他逮到直接毙了~~

#### CBC

若CBC用到的带有密钥输入的函数$F$为PRP，则CBC是CPA-Secure的。

CBC的主体部分是作为一个链条进行的，所以只能序列性的进行加密，无法有效的并行化处理从而加速加密过程。

##### Chain CBC mode

这种模式在SSL 3.0和TLS 1.0中使用，将其上一次加密的最后一个分组返回的密文块作为下一条明文加密的$IV$。看上去，这种方式能够加密更多的消息而不用重新生成新的$IV$.然而，这种方式不是CPA secure的。

介绍这个案例的更多原因是警醒别人不要随意改动原来已被证明安全的方案。即使只是很小的改动也无法保证能保持安全性。

#### OFB

相比于CBC：

1. OFB的$F_k$不需要逆函数来作为Dec解密，因此$F_k$可以是PRF，而不是CBC因需要逆函数而选择的PRP。
2. OFB若采取上节的Chain CBC的形式选取$IV$，能够保证安全性。
3. 虽然计算上。OFB仍然需要序列化的计算，但可以在加密前把序列化的部分完成，而加密便可以使用并行化进行加速。
4. 明文长度无需是$n$的倍数。

#### CTR

CTR对明文长度具有限制。这里详细介绍CTR。

$Enc_k(m_1,...,m_l)$,其中$m_i$表示明文块:

1. random $IV\leftarrow\{0,1\}^{3n/4}$
2. $y_i=F_k(IV||i)$
3. $c_i=y_i\oplus m_i$
4. $c=<IV,c_1,...c_l>$

$Dec(c):m_i=c_i\oplus F_k(IV||i)$

可以看到，其限制了$l<2^{n/4}$，初始向量长度也有变化，这里是因为CTR采用计数器模式，而计数器能够计数的部分只有$3n/4$bits空出来的$n/4$。

CTR的加密过程是完全的并行化的，并且可以直接查看密文的某一块解密结果，而无需解密整条信息。

#### Concrete Security

CTR,CBC,OFB基本上能够保证$q(n)$ 次查询下的$q(n)^2/2^n$优势，在具体安全中需要使用较大的blocks size，因此$n$要大。
CTR限制了长度，因此在$n=64$，比如采用DES时能够加密34GB的明文，换用n=128比如AES就基本差不多能满足各种需要了。
