---
sidebar_position: 5
---

# Message Authentication

## 消息认证

至今为止，我们所讨论的安全都是**secrecy**，即保证EAV、CPA下不泄露任何除明文长度外的明文信息。本章要讨论的便是另一方面的安全：**消息认证**。即：保证消息的完整性，或保证消息来源身份的可靠性。

:::warning Encryption and Message Authentication
    Secrecy(秘密性)，和authenticity(认证性)是两个**完全不同**的性质。Encryption不能保证任何的authenticity，而message authentication也不能保证任何的secrecy。
:::

为什么这里特地强调？之前在群里和群友讨论过这类话题，群友似乎认为哈希（后面可以看到是MAC）能够加密信息,所以说加密和认证是十分容易搞混的。

举个例子，即使你加密了信息传给另一方，敌手截获了你的信息，改了下你的密文转发给目标，解密出来的可能是完全不同的东西。如果你对OFB，CTR这类模式加密的密文进行异或某些位的操作，可以直接改变明文特定位的信息。

## Message Authentication Codes(MAC)

### Definition

:::warning Definition
    MAC is a tuple($Gen,Mac,Vrfy$) of PPT algorithm:
    1. $Gen(1^n)\rightarrow k,|k|\geq n$,典型的k保证uniform。
    2. $Mac_k( m)\rightarrow t$,计算认证标签tag。
    3. $Vrfy_k(m,t)\rightarrow b$ b=1表示有效，否则认证失败。
    ----
    $Gen$ and possibly $Mac$ are **probabilistic**，and if $|m|$ is restricted to $l(n)$:fixed-length MAC
:::

Correctness:
虽然$Gen$和$Mac$有概率性，但有：

$$Pr[Vrfy_k(m,Mac_k( m))=1|k\leftarrow Gen(1^n)]=1$$

Canonical verification：一般而言，$Mac$是确定性的，则$Vrfy$可被顺理成章的定义为：

$$Vrfy_k(m,t)=1<=> Mac_k(m)=t$$，即Vrfy用Mac来定义。

### Security of MACs

假设情景：两方互相通信（使用明文M和标签T），敌手在通信信道中截取信息，他的目标是伪造出一组$M',T'$，使得$Vrfy_k ( M',T')=1$

搬出预言机来形式化定义罢！

----

对消息认证实验：$Mac-forge_{\mathcal{a},\prod(n)}$

事前，敌手和预言机都已知安全参数n，k也由预言机的Gen生成。

1. 敌手向预言机发送信息$m\in \{0,1\}'$.
2. 预言机维护一个集合$\mathcal{Q}=Q\cup m$,并返回$Mac_k( m)$.
3. 不断重复1.2.（PPT敌手嘛）,最后，敌手发送$(m',t'),\mathcal{A}$wins if $Vrfy(m',t')=1,m' \notin \mathcal{Q}$

----

:::warning Definition
    A MAC $\prod=(Gen,Mac,Vrfy)$ is existentically unforgeable under an adaptive Chosen-message attack if for all PPT adversaries $\mathcal{A}$:

    $$Pr[\mathcal{A}~win]=Pr[Mac-forge_{\mathcal{A},\prod}(n)=1]\leq negl(n)$$
:::

existentically unforgeable(存在不可伪造性)：A wins if he manages to find any message。
Chosen-message：允许 A选择任何的消息进行相关信息学习。

以上定义算是较强的一个MAC定义了，但其仍然无法阻挡重放攻击：敌手若选取了$m \in \mathcal{Q}$进行攻击，则直接获胜,因为这里的MAC是无状态的。
除此之外，还无法阻挡调整次序，甚至删除message一部分。这些则可以通过序列号，以及time-stamps等调整解决。

## Strong MACs

上述预言机中，$Mac$并不一定是确定性算法，因此一个 $m$ 可以对应多个 $t$ ,这让敌手有了另一种攻击方式：伪造出不同于$Mac_k(m)$的tag $t'$，满足$Vrfy_k(m,t')=1$.因此，加上前面所提到的canonical Mac性质，便可以定义出Strong MAC。

### verification queries

理论上而言可以定义更强性质的MAC，可以让敌手除了访问上述的预言机外，还可以让敌手适应性地访问$Vrfy$预言机：发送$(m',t)$,预言机返回$Vrfy_k(m',t)$。
但实际上，若采用canonical MAC，这并不能使定义更强。我们在接下来的部分也只讨论canonical Mac。

## A potential timing attack

换个思路：
若攻击者能够在上述的方案中获得除了最后发送的消息是否$Vrfy$成功外，还能得到**时间信息**：这里的时间信息是指$Vrfy$这个决策过程中所花费的时间。
比方说，Canonical Mac（之后直接用Mac代指了）的$Vrfy$过程是逐位比较tag是否相同，若遇到不同位直接提前返回结果。那么，这和$Vrfy$过程成功，比较完所有位的时间花费相比，必定短了一些。

于是：比如，对于一个16-byte长度的tag，敌手对于第一个byte的判断，向预言机发送$(m,t_0),(m,t_1),...(m,t_{255})$，遍历所有可能性，后面全部置0.这样便可以通过时间比较来检测$t_j$含有正确的一块，这样不断循环下一步，便可以通过$256\times 16$来寻找到该tag的正确信息。

实际上，这种攻击方式已经获得成功过（现实中有成功的案例），也就是密码学上一个新的攻击方式：侧信道攻击（旁路攻击）。

## Constructions：MAC

### Fixed-length MAC

可以用PRF来构造出一个MAC方案：

:::info PRF->MAC
    Every PRF $F:\{0,1\}^{l_{key}^n}\times \{0,1\}^{l_{in}^n}\rightarrow \{0,1\}^{l_{out}^n}$ 可以用来构造一个消息空间为$\{0,1\}^{l_{in}^n}$的MAC（$\{0,1\}^{l_{out}^n}\in \omega(log(n))$）
:::

Constructions:

$Gen(1^n)\rightarrow k$：like PRF F：generate k.

$Mac_k( m)=F_k( m),|m|=\{0,1\}^{l_{in}^n}$

$Vrfy_k(m,t)<=>Mac_k( m)=t$

证明安全性可以用PRF的安全性+反证法。

### Arbitrary length MAC

很容易往**复用fix-length MAC**
方向去构造任意长度的MAC，但这里仍然会出现问题：

假设$Mac_k( m)=<t_1,...t_d>,t_i=Mac'_k(m_i)$

1. 重排次序：比如$<t_1,t_2>,<m_1,m_2>$，调换1，2位置照样通过$Vrfy$。
方法：加上序列号，$t_i=Mac'_i(i,m_i)$
2. 截断，截取一部分t，m进行vrfy。
方法：$t_i=Mac'_i(l,i,m_i),l=|m|$
3. 混合调换。假设两条相同长度的消息，可以将其各取一部分进行混合，可以通过Vrfy
方法：加上一个message identifier $r$，一般而言是随机数：$t_i=Mac'_k(r,l,i,m_i)$.

基本满足需要了。具体构造略（

### CBC-MAC

回忆一下上一章CBC模式：

$c_0=IV$,

$c_i=F_k(m_i\oplus c_{i-1})$

CBC-MAC省去选取$IV$并异或的一步，并且只生成tag $t$。
形式化而言：

$t_1=F_k(m_1)$

$t_i=F_k(m_i\oplus t_{i-1})$

$t_{output}=t_{last}$
