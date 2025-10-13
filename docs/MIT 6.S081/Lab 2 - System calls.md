---
sidebar_position: 2
---

# Lab 2 - System calls

## 课程

从lab2开始便深入xv6细节。

:::info misc
    qemu模拟器模拟了ROM, RAM, Disk和 serial connection to 用户的屏幕/键盘。

    RISC-V具有三个模式：machine supervisor和user mode，一般的特权指令是指supervisor mode，user space要调用系统调用的时候，需要在寄存器先设置好参数，再通过ecall指令到特权模式，通过sret退出。
:::

xv6的地址空间为39bit，而xv6只用其中的38bit。逻辑空间最大值MAXVA=$2^{38}-1$。
进程抽象为`proc`结构，其中存储着诸如`pagetable`等成员。同时，进程维护着两个堆栈，用户堆栈和内核堆栈`kstack`，内核堆栈在进入特权模式下使用且独立，因此进程损坏的时候，kernel仍然能在`kstack`中执行。

----

xv6的启动过程中：

1. 首先在`bootloader`（ROM）读取引导程序，引导程序将xv6 kernel载入内存在`_entry`中：

```riscv title="kernel/entry.S"
.section .text
.global _entry
_entry:
        # set up a stack for C.
        # stack0 is declared in start.c,
        # with a 4096-byte stack per CPU.
        # sp = stack0 + (hartid * 4096)
        la sp, stack0
        li a0, 1024*4
        csrr a1, mhartid
        addi a1, a1, 1
        mul a0, a0, a1
        add sp, sp, a0
        # jump to start() in start.c
        call start
spin:
        j spin
```

RISC-V（此时为machine mode）启动的时候禁用了分页硬件，因此程序的虚拟地址直接映射入物理地址。

loader直接将kernel映射入物理地址`0x80000000`，这也是qemu的入口地址。`0`到`0x80000000`的这一部分则是IO设备。

2. `entry.S`创建了C代码所需的栈`stack0`，并启动了start function(`kernel/start.c`)
3. `start.c`将mode转为supervisor（通过`mret`）并载入`main`函数地址（`mepc`）以及其他必要设置，如委托中断和异常给supervisor mode，启动clock等，最后将pc转为main函数。
4. main函数启动必要的配置，在`userinit`里创建第一个进程。
5. 进程执行`kernel/initcode.S`汇编程序，invoke exec 系统调用，转变为`/init`。当kernel执行exec完毕，将会返回`/init` 程，该进程会执行诸如打开标准文件描述符和启动shell等任务。

:::info main函数干了什么？
    kinit：设置page allocator

    kvminit：设置虚拟内存
    
    kvminitstart：打开页表
    
    processinit：设置初始进程
    
    trapinit：设置user/kernel mode转换代码
    
    plicinit：中断控制器
    
    binit：buffer cache
    
    fileinit：文件系统

    virtio_disk_init：初始化磁盘

    userinit：启动第一个进程
:::

## System call tracing (moderate)

还是读题问题。英语太差是这样的。

这题讲明了需要在proc结构里增加变量来实现tracing。因此，系统调用trace只需要改变调用进程的mask，fork的子进程便会继承mask(修改fork实现)。

当进行系统调用的时候，syscall函数便会检查mask，默认0，其他情况便可以检查来打印具体函数。

----

proc结构里增加mask字段来记录要trace的系统调用。

```c title="kernel/syscall.c"
void syscall(void)
{
  int num;
  struct proc *p = myproc();

  num = p->trapframe->a7; // 记录系统调用
  if(num > 0 && num < NELEM(syscalls) && syscalls[num]) {
    p->trapframe->a0 = syscalls[num](); //返回值记录a0
    if((1 << num) & p->mask){
      printf("%d: syscall %s -> %d\n",
        p->pid, sysnames[num], p->trapframe->a0);
    }
  } else {
    printf("%d %s: unknown sys call %d\n",
            p->pid, p->name, num);
    p->trapframe->a0 = -1;
  }
}
```

`kernel/sysproc.c` 添加：

```c title="kernel/sysproc.c"
uint64 sys_trace(void)
{ 
  uint64 mask;
  if(argaddr(0, &mask)<0)
    return -1;
  myproc()->mask = mask;
  return 0;
}
```

剩余的诸如修改fork和头文件等略。

## Sysinfo (moderate)

具体函数用法需要看具体的用例。lab已经在`kernel/file.c`里头给出用法。

重要的就是`arg`函数以及`copyout`函数使用。

----

1. `kernel/kalloc.c`里增加：

```c title="kernel/kalloc.c"
uint64 get_memory_count(void){
  uint64 count=0;
  struct run*r = kmem.freelist;
  while(r){
    count+=PGSIZE;
    r = r->next;
  }
  return count;
}
```

2. `kernel/proc.c`增加：

```c title="kernel/proc.c"
int get_process_count(void){
  int count = 0;
  struct proc* p;
  for(p = proc; p < &proc[NPROC]; p++) {
      if(p->state != UNUSED){
        count++;
      }
  }
  return count;
}
```

`kernel/sysproc.c` 增加系统调用：

```c title="kernel/sysproc.c"
uint64 sys_sysinfo(void)
{
  uint64 info;

  struct sysinfo nowinfo;
  if(argaddr(0, &info) < 0)
    return -1;
  nowinfo.freemem = get_memory_count();
  nowinfo.nproc = get_process_count();
  
  struct proc *p = myproc();
  if(copyout(p->pagetable, info, (char*)&nowinfo, sizeof(nowinfo))<0)
    return -1;
  return 0;
}
```

其他修改同trace。
