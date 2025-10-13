---
sidebar_position: 3
---

# Computational Security

## 计算安全性

Perfect Security在拥有无限算力的$eav$(窃听者)情况下是可证明安全的，不会泄露任何有关明文的信息，因此被称为**信息论安全**。

然而，该方法具有密钥长度必须和明文长度等长、密钥不能复用，且加密方案有着不必要的强安全性。因此，便有了更弱安全意义上的计算安全性。

计算安全性（Computational Security），这种安全性有着两个特点：

1. 它可以抵御任何拥有有限但庞大算力的敌手。
2. 有着极其微小的可能性被攻破。

因此，理想状况下，这种安全性的攻破方法只有暴力穷举所有的密钥。

有两种描述计算安全性的方法：具体/渐进方法。

### Concrete Approach

通过精确确定最大的被成功攻破的概率界限来描述计算安全性。敌手被认为是概率性的（randomized）。形式化而言，有：

:::warning $(t,\xi)-secure$
    A scheme is $(t,\xi)-secure$ if any adversary running for time at most $t$ succeeds in breaking the scheme with probability at most $\xi$.
:::

具体的安全性在实际问题十分重要，但在抽象讨论上的意义而言，精确的具体安全性很难进行讨论。在直觉上，我们可以这样认为：$t$应当足够的大，且该方法是有效的（多项式而非指数）算法；$\xi$是一个渐进等于0的值。于是，我们将重点投向渐进安全性。

### Asymptotic Approach

由之前的介绍，需要尽可能地构造出来图灵机（准确来讲是确定性图灵机）意义上的难解问题，从而构造出渐进意义上的计算安全性。

#### Assumption and PPT（概率意义上多项式能力）

在计算复杂性上讨论渐进安全，需要有以下假设：

1. 安全参数 $n\in N$必须被任何人所知。安全参数就是具体密钥的长度。
2. Honest parties（非敌手）拥有可以进行概率意义上的多项式算法能力（PPT），概率意义是指所有的PPT算法都可以无条件获取无偏的、独立的序列，多项式则是：
$\exists ~ polunomial~p(n)$,所有的honest parties都可以run in time $p(n)$。
3. efficient adversary也被定义为拥有PPT能力，被称为PPT adversary。

:::info Why PPT?
    1. 获取无偏独立的序列数据是密码学所必需的（例如生成随机数），非敌手用此生成随机密钥，则敌手也应当具有该能力。
    2. PPT敌手可能还有证明里无法体现、但相较真实世界的敌手具有的附加能力。为了证明能够更加严谨完善，假定敌手具有PPT能力。
:::

#### Strong Church-Turing Thesis

用类似讨论计算复杂性的方法讨论渐进安全性的另一个原因便是导言中讨论的、如小标题所示的理论。任何目前实际上的模型都可以划归到多项式的算法上，也因此我们可以讨论布尔表达式、图灵机、随机预言机等可以归约到多项式上的模型。

#### Definition

:::warning Negligible Function
    当$f(n)$满足以下条件时，为Negligible Function。
    $\forall~polynomial~p(.),\exists N~s.t. \forall n>N:$

    $$f(n)<\frac{1}{p(n)}$$
:::

即，随着$n$增加，$f(n)$下降的的较任意的$1/p(n)$更快。

接下来给出形式化的渐进安全定义：

:::warning Asymptotic Approach
    A scheme is secure if any PPT adversary succeeds in breaking scheme with at most **negligible** probability.
:::

形式化一点？

:::warning Abstract
    A scheme is secure that for every PPT adversary $\mathcal{A}$，其进行特定的攻击；for every positive polynomial $p$,there exists an integer $N$ such that when $n$（被选定的一个常数）>$N$,the probability that $\mathcal{A}$ succeeds in the attack is less than $1/p(n)$。
:::

因此，安全参数n的大小和渐进安全性息息相关。其中，honest parties一般而言运行的是固定的多项式算法，如$O(n^2)$，而防御的敌手需要针对所有多项式，也就是“有效的”算法。

## Computationally secure encryption

### Definition

$Gen(1^n)\rightarrow k,assume~~~~|k|\geq n$

$Enc_k(m)\rightarrow c(maybe~~probabilistic)$

$Dec_k( c)=m(deterministic)$

其中，$Gen$运行多项式时间，且若消息空间是固定的，可被称为fixed-length private-key encryption，与之后的操作模式相对应。该定义是无状态的（无上下文的状态消息）。

最后，该定义也满足之前类似的定义中的$Correctness$。

### EAV security experiment(oracle)

讨论计算安全性时，有以下性质：

1. 要求敌手具有有限算力，允许敌手有小概率获胜的机会，以及加密的消息长度可以任意长（与先前的perfect encryption区别）。
2. 密钥仍然不可复用。

也因此，计算安全性相比于信息论安全性，具有以上的“松弛”。

oracle：

1. 敌手向预言机发送两条消息$m_0,m_1$.
2. 预言机按定义生成k，随机选择$b\leftarrow \{0,1\}$并生成密文c返回敌手。
3. 敌手采取策略，返回b'，若$b=b',output~~1$，否则为0.

其实预言机过程和完美加密很像，但其具体定义不同。

也因此，有以下定义：

:::warning $PrivK_{\mathcal{A},\prod}^{eav}$
    $\prod=(Gen,Enc,Dec)$在以上实验若具有以下性质，则在EAV（窃听者）存在的情况下具有不可区分性：

    $$Pr[PrivK_{\mathcal{A},\prod}^{eav}(n)=1]\leq1/2+negl(n)$$

    换句话而言：for every PPT 敌手$\mathcal{A}$:

    $$|Pr[out\mathcal{A}(PrivK_{\mathcal{A},\prod}^{eav}(n,0))=1]-Pr[out_\mathcal{A}(PrivK_{\mathcal{A},\prod}^{eav}(n,1))=1]|\leq negl(n)$$
:::

第一和第二的定义虽然等价，但敌手获胜的概率不可能小于1/2（乱猜也能1/2），而第二种定义是绝对值式的定义，因此特地点明。

在上面的定义过程中，oracle实验只进行了单个密文的过程，敌手除了单个密文外没有得到任何的信息。

### Plaintext length

发送密文的过程中，基本肯定会泄露的信息除了密文被发送这个行为本身外，还有一个看上去不太敏感的地方：**明文长度**。很多情况下，明文长度的泄露不会造成什么影响，但仍然存在着攻击手段。例如Crime attack：很多明文在加密前会进行压缩，假设有两条信息X,Y，拼接后的字符串为X||Y,若X与Y相像，压缩算法会将其压缩，长度缩小从而暴露X,Y的相关信息。

遇到这种情况，一般而言需要对消息填充至固定长度，但无法完全避免长度消息的泄露。

### Semantic Security（语义安全）

在这之前，我们讨论的computational security notion建立在不可区分性（indistinguishability）上。在上一节的讨论中，明文长度的泄露不可避免。因此，我们希望除此之外不再泄露任何消息。

也因此有了 **Semantic Security（语义安全）** 以及其~~十分诡异的~~定义：

:::warning Semantic Security
    A private-key encryption scheme $Enc,Dec$ is semantical secure in the presence of an eavesdropper if for every PPT algorithm $\mathcal{A}$ there exists a PPT algorithm $\mathcal{A'}$ such that for any PPT algorithm $Samp$ and poly-time computable functions $f$ and $h$, the following is negligible:

    $$|Pr[\mathcal{A}(1^n,Enc_k(m),h(m))=f(m)]-Pr[\mathcal{A'}(1^n,|m|,h(m))=f(m)]|$$
:::

其中的$h(m)$可以看作附加的信息以函数的方式展现；而$f(m)$可以看作进行验证所需的谓词（或者说行为）。

太绕了？所幸的是，有以下等价性质让我们不用麻烦的证明：

:::info
    **Private-key encryption scheme 的不可区分性和语义安全是等价的**，该性质对于任意的威胁模型都成立。
:::

## Pseudorandomness（伪随机性）

真随机数的生成开销巨大（虽然是可以生成的），密码学的伪随机性意味着：该生成分布无法有效的（也就是有限算力）和真随机分布相区分。

:::warning a Sequence of Pseudorandom Distributions
    A sequence of distributions $\{Dist_n\}_{n\in N}$ where$\{Dist_n\}=l(n)$ for some  polynomial $l$ is pseudorandom, if for every PPT distinguisher $\mathcal{D}$:

    $$|Pr[\mathcal{D}(U_{l(n)})=1]-Pr[\mathcal{D}(Dist_n)=1]|\leq negl(n)$$
:::

也因此，可以将其作为上述加密方案中的$Gen$，用于生成密钥：

:::warning Pseudorandomness Generator(PRGs)
    A (deterministic) poly-time algorithm

    $$G:\{0,1\}^n\rightarrow \{0,1\}^{l(n)}$$ is a pseudorandom generator if:
    1. (**Expansion**)$\forall n,l(n)>n$.
    2. (**Pseudorandomness**)$\{G(U_N)\}_{n \in N} $ is a sequence of pseudorandom distributions.
:::

需要注意的是： PRG 的暴力破解方法具有以下被破解的优势：

$$|Pr[\mathcal{D}(U_{l(b)})=1]-Pr[\mathcal{D}(G(U_n))=1]|\geq 1-2^{n-l(n)}$$

虽然说PRG无法被有效的区分，但PRG的输出并不是uniform的。本质上，PRG可以看作从长度较小的uniform数据映射到长度较长的伪随机性密钥。

不做证明的：PRG存在当且仅当单向函数（暂时不做说明）存在。

### Encryption where |$|\mathcal{M}|>>|\mathcal{K}|$|

基于 One-time pad，这里提出一个加密方案。

using PRG $G:\{0,1\}^n\rightarrow \{0,1\}^{l(n)}$

选择安全参数 $n\in N,\mathcal{K}=\{0,1\}^n,\mathcal{M}=\mathcal{C}=\{0,1\}^{l(n)}$

$Gen$生成随机性密钥k：

$$Enc_k(m)=m\oplus G(k)$$

$$Dec_k( c )=c\oplus G(k)$$

于是有：

:::info
    在上述的加密方案中，若$Gen$是本节定义的PRG，则该fixed-length private-key encryption scheme 在$eav$下具有不可区分性。
:::

## Reduction（归约性证明）

**归约**的概念在计算机科学中十分重要。

其本质是对上述构造的加密方案进行证明，若要攻破其方案，必须要攻破其内置的已被证明安全性的模块。通过反证法即可证明构造的加密方案安全性。

而如何构建这种反证？既然我们将加密方案的安全性归约到了其**底层构件的安全性**，而如今我们所讨论过的证明安全性的方法只有**预言机**，那么答案呼之欲出：

构造一个敌手$\mathcal{A}$去攻破构建的加密方案。而攻破过程中，可以将通过一系列过程，将敌手输入转化为抽象的敌手$\mathcal{A'}$，其对底层的构件进行预言机实验，再将预言机输出转化后返回给$\mathcal{A}$.由于底层的构建已被证明安全性,那么便可以证明加密方案安全性。

需要注意的是模拟抽象敌手的过程。对于该归约过程而言，对敌手$\mathcal{A}$的唯一了解就是他期望与预言机进行挑战，那么归约过程必须模拟地和预言机行为一致。

具体而言还有许多算式，但这里略了。懒。

## Stronger security notions(CPA Security)

之前讨论的都为单消息的加密过程，这里开始讨论选择明文攻击，即可以选择多个明文，得到对应的密文（**都是用单个密钥加密**）来试图获得相关信息，而选择明文攻击又可以分为适应性和非适应性攻击。

**非适应性CPA**：在上述的预言机实验中，敌手第一步选择了一对明文进行实验；而这里的CPA则是在第一步将选择多个明文，和这一对明文同时发出，并获得用相同密钥加密的密文回应。敌手获得了多余的信息，并仍然对选定的一对明文进行甄别。

**适应性CPA**：无需在意多个明文的选择是否需要在第一步就全部完成。敌手可以根据上一次的回应而改变下一次发送的明文，从而获得更多的信息，敌手的能力也因此较非适应性CPA增强。适应性攻击可以在发送选定的一对明文前进行发送/收到回应，也可以在之后进行发送/收到回应，且仍然需要对该选定的明文进行甄别。

需要注意的是，两种CPA发送的多余明文，其长度都必须和选定的一对明文长度一致。

这里还有一个Left-or-right Security，不做多余介绍。

:::warning Left-or-right Security
    Private-key encryption scheme Π has indistinguishable multiple encryptions under a chosen-plaintext attack, or is CPA-secure for multiple encryptions, if for all probabilistic polynomial-time adversary A there is a negligible function negl such that
    $$Pr[PrivK_{\mathcal{A},\prod}^{LR-cpa}(n)=1]\leq 1/2+negl(n)$$
    where the probability is taken over the randomness used by A and the randomness used in the experiment.
:::

:::info
    Any private-key encryption scheme that is CPA-secure is also a CPA-secure for multiple encryptions.
:::
