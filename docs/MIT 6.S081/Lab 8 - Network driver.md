---
sidebar_position: 8
---

# Lab 8 - Network driver

## 课程

主要讲了UART设备和console如何联系、如何读写。该部分调用关系的复杂导致理解上会出现困难性，下面是简略部分：

可能的寄存器：

1. SIE（各类中断）
2. SSTATUS（控制中断）
3. SIP 查看中断类型
4. SCAUSE 说明当前状态原因位中断。
5. STVEC usertrap等返回位置

其中，STVEC和SCAUSE已经在trap里知道用处了，而其他寄存器在设备驱动中起作用。

如何让UART设备与xv6正常协同工作：

start（m mode）设置supervisor mode 中断，以及定时器初始化
-> console初始化，配置UART芯片
-> PLIC 初始化
-> SCHEDULER CPU接收中断。

读写的过程可以分为top（系统调用到buffer）和bottom（buffer到下层寄存器读写代码），这两部分代码组合便是驱动的代码。

### write（console）

Top：shell-> putc-> write->filewrite->识别FD_DEVICE，consolewrite->获得char，uartputc->若满则sleep，否则写入buffer，调uartstart函数->写入THR

Bottom：送到后，收到中断-> PLIC-> devintr->plic_clai声明某个CPU获得中断（中断号）->uartintr-> consoleintr(由于接受寄存器为0，这里跳过)->uartstart,

### read(console)

Top：shell-> read->fileread->consoleread(buffer),若空则sleep，否则读取键盘写入的buffer。

Bottom：键盘读入：中断-> plic, cpu, devintr(同上)->uartgetc->consoleintr->consputc.

## Code(Hard)

lab的提示疑似有些太详尽了，~~这不是直接对着写完就行吗~~

lab只需要查部分文档即可写完，且用到的也就3个寄存器和4个标志位而已。
之后去查了一下6.828（6.S081的前身），发现量是真的多，相当于从头开始这个lab（虽然网络协议栈给了，但提示几乎没给，只能按照逻辑顺序重新实现e1000驱动。

```c
int
e1000_transmit(struct mbuf *m)
{
  //
  // Your code here.
  //
  // the mbuf contains an ethernet frame; program it into
  // the TX descriptor ring so that the e1000 sends it. Stash
  // a pointer so that it can be freed after sending.
  //

  // transmit是单个frame的传送，因此多进程的时候需要acquire。
  // 实际上transmit的加锁与否不会影响太多，可能这就是锁罢。但recv的锁似乎无法加，具体得看一下net.c里怎么实现的。
  acquire(&e1000_lock);

  int index = regs[E1000_TDT];
  struct tx_desc* current_tx = tx_ring + index;

  // check if the ring is overflowing
  if((current_tx->status & E1000_TXD_STAT_DD) == 0){
    return -1;
  }
  // free the last mbuf that was transmitted from the descriptor
  if(tx_mbufs[index]){
    mbuffree(tx_mbufs[index]);
    tx_mbufs[index] = 0;
  }
  // fill in the descriptor
  current_tx->addr = (uint64)m->head;
  current_tx->length = m->len;

  current_tx->cmd = E1000_TXD_CMD_RS | E1000_TXD_CMD_EOP;
  // update E1000_TDT to wake up DMA.
  regs[E1000_TDT] = (regs[E1000_TDT] + 1) % TX_RING_SIZE;
  tx_mbufs[index] = m;

  release(&e1000_lock);

  return 0;
}

static void
e1000_recv(void)
{
  //
  // Your code here.
  //
  // Check for packets that have arrived from the e1000
  // Create and deliver an mbuf for each packet (using net_rx()).
  //
  
  while(1){
    // 同时刻多个进程进行read，因此需要while。
    // ask the ring index
    int index = (regs[E1000_RDT] + 1) % RX_RING_SIZE;
    struct rx_desc *current_rx = rx_ring + index;
    // check if available
    if((current_rx->status & E1000_RXD_STAT_DD) == 0){
      return;
    }
    // update mbuf len
    struct mbuf* current_mbuf = rx_mbufs[index];
    current_mbuf->len = current_rx->length;
    net_rx(current_mbuf);

    // new mbuf
    struct mbuf* next_mbuf = mbufalloc(MBUF_DEFAULT_HEADROOM);
    rx_mbufs[index] = next_mbuf;
    current_rx->addr = (uint64)next_mbuf->head;
    current_rx->status = 0;
    
    // update E1000_RDT
    regs[E1000_RDT] = (regs[E1000_RDT] + 1) % RX_RING_SIZE;
  }
}
```
