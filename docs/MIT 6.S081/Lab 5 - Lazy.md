---
sidebar_position: 5
---

# Lab 5 - Lazy(2020)

2021课程把这个lab删了。可能是因为课堂上已经把lab的至少一半的内容给泄完了。

## 课程

课程关于代码的解释都在lab里面，所以这里只稍微提一下原理。

lazy lab本身需要利用虚拟内存的Page faults来加载page，RISC-V里，Page fault的原因存储在`SCAUSE`，虚拟内存中的地址存储在`STVAL`寄存器中：

![RISC-V SCAUSE value](https://906337931-files.gitbook.io/~/files/v0/b/gitbook-legacy-files/o/assets%2F-MHZoT2b_bcLghjAOPsJ%2F-MMD_TK8Ar4GqWE6xfWV%2F-MMNmVfRDZSAOKze10lZ%2Fimage.png?alt=media&token=4bbfdfa6-1491-4ab8-8248-03bd0e36a8e9)

以及在`TRAPFRAME`中存储的用户程序寄存器值。

因此，我们可以根据以上信息来进行lazy page allocation，替代eager allocation以提高性能。

## Eliminate allocation from sbrk() (easy)

只要改一下sys_sbrk就行。

```c title="kernel/sysproc.c"
uint64
sys_sbrk(void)
{
  int addr;
  int n;
  struct proc* p;
  if(argint(0, &n) < 0)
    return -1;
  p =  myproc();
  p->sz = p->sz+n;
  //if(growproc(n) < 0)
  //  return -1;
  return addr;
}
```

运行结果大致如下：

```bash
init: starting sh
$ echo hi
usertrap(): unexpected scause 0x000000000000000f pid=3
            sepc=0x0000000000001258 stval=0x0000000000004008
va=0x0000000000004000 pte=0x0000000000000000
panic: uvmunmap: not mapped
```

可以看到`uvmunmap`出现了panic，因为这里只改了heap的位置，没有分配真正的内存，因此也没有真正的页表，无法进行unmap操作。

## Lazy allocation (moderate)

lazy allocation的思路是引发page fault（这里只处理load和save类型的page fault）时进行分配。由于物理内存和逻辑内存是全相联的，所以简单的分配给一页就行。

具体代码见下面整体任务。

## Lazytests and Usertests (moderate)

`trap.c`:处理Page Fault的分配页表。

```c title="kernel/trap.c"
void
usertrap(void)
{
  //......
  if(r_scause() == 8){
    // system call

    if(p->killed)
      exit(-1);

    // sepc points to the ecall instruction,
    // but we want to return to the next instruction.
    p->trapframe->epc += 4;

    // an interrupt will change sstatus &c registers,
    // so don't enable until done with those registers.
    intr_on();

    syscall();
  } else if (r_scause() == 13 || r_scause() == 15){
    uint64 va = r_stval();
    //printf("page fault: %p\n", va);
    //printf("%p, %p\n", r_stval(), va);
    if(va >= p->sz||va<=p->trapframe->sp){
      p->killed = 1;
      //printf("usertrap(): error va %p pid=%d\n", va, p->pid);
    } else {
      uint64 ka = (uint64)kalloc();
      if (ka==0){
        p->killed = 1;
      } else {
        memset((void*)ka, 0, PGSIZE);
        va = PGROUNDDOWN(va);
        if(mappages(p->pagetable, va, PGSIZE, ka, PTE_W|PTE_U|PTE_R)!=0){
          kfree((void*)ka);
          p->killed = 1;
        }
      }      
    }
  } else if((which_dev = devintr()) != 0){
    // ok
  }
  //....
}
```

上述代码在load或save page fault进入，首先进行合法性检查，之后开始分配内存。若无内存，就kill内存，否则将内存置0，mappages将其映射到目标用户的页表中。

接下来修改sbrk，增加对负数的处理。

```c title="kernel/sysproc.c"
uint64
sys_sbrk(void)
{
  int addr;
  int n;
  struct proc* p;
  if(argint(0, &n) < 0)
    return -1;
  p =  myproc();
  addr = p->sz;
  p->sz = p->sz+n;
  if (n<0) {
    uvmdealloc(p->pagetable, p->sz-n, p->sz);
  }

  //if(growproc(n) < 0)
  //  return -1;
  return addr;
}
```

`vm.c` 处理fork，copyin（write）和copyout（read）

```c title="kernel/vm.c"
// 要用到proc结构，引入头文件。
#include "spinlock.h"
#include "proc.h"

//该部分的改动实际上就是注释掉两个panic，这谁想得到，或者敢这样做？
//哎，以后得多试了，这里卡了好久。
// Remove npages of mappings starting from va. va must be
// page-aligned. The mappings must exist.
// Optionally free the physical memory.
void
uvmunmap(pagetable_t pagetable, uint64 va, uint64 npages, int do_free)
{
  uint64 a;
  pte_t *pte;

  if((va % PGSIZE) != 0)
    panic("uvmunmap: not aligned");

  for(a = va; a < va + npages*PGSIZE; a += PGSIZE){
    if((pte = walk(pagetable, a, 0)) == 0){
      //panic("uvmunmap: walk");
      continue;
    }

    if((*pte & PTE_V) == 0)
      continue;
      //panic("uvmunmap: not mapped");
    if(PTE_FLAGS(*pte) == PTE_V)
      panic("uvmunmap: not a leaf");
    if(do_free){
      uint64 pa = PTE2PA(*pte);
      kfree((void*)pa);
    }
    *pte = 0;
  }
}

// 同上。fork用的。
// Given a parent process's page table, copy
// its memory into a child's page table.
// Copies both the page table and the
// physical memory.
// returns 0 on success, -1 on failure.
// frees any allocated pages on failure.
int
uvmcopy(pagetable_t old, pagetable_t new, uint64 sz)
{
  pte_t *pte;
  uint64 pa, i;
  uint flags;
  char *mem;

  for(i = 0; i < sz; i += PGSIZE){
    if((pte = walk(old, i, 0)) == 0)
      //panic("uvmcopy: pte should exist");
      continue;
    if((*pte & PTE_V) == 0)
      //panic("uvmcopy: page not present");
      continue;
    pa = PTE2PA(*pte);
    flags = PTE_FLAGS(*pte);
    if((mem = kalloc()) == 0)
      goto err;
    memmove(mem, (char*)pa, PGSIZE);
    if(mappages(new, i, PGSIZE, (uint64)mem, flags) != 0){
      kfree(mem);
      goto err;
    }
  }
  return 0;

 err:
  uvmunmap(new, 0, i / PGSIZE, 1);
  return -1;
}

// Copy from kernel to user.
// Copy len bytes from src to virtual address dstva in a given page table.
// Return 0 on success, -1 on error.
int
copyout(pagetable_t pagetable, uint64 dstva, char *src, uint64 len)
{
  uint64 n, va0, pa0;
  struct proc* p = myproc();
  while(len > 0){
    va0 = PGROUNDDOWN(dstva);
    pa0 = walkaddr(pagetable, va0);

    if(pa0 == 0) {
      if(va0 >= p->sz||va0<=p->trapframe->sp){
        return -1;
        //printf("usertrap(): error va %p pid=%d\n", va, p->pid);
      } else {
        pa0 = (uint64)kalloc();
        if (pa0==0){
          p->killed = 1;
          return -1;
        } else {
          memset((void*)pa0, 0, PGSIZE);
          va0 = PGROUNDDOWN(va0);
          if(mappages(p->pagetable, va0, PGSIZE, pa0, PTE_W|PTE_U|PTE_R)!=0){
            kfree((void*)pa0);
            p->killed = 1;
            return -1;
          }
        }      
      }
    }
    n = PGSIZE - (dstva - va0);
    if(n > len)
      n = len;
    memmove((void *)(pa0 + (dstva - va0)), src, n);

    len -= n;
    src += n;
    dstva = va0 + PGSIZE;
  }
  return 0;
}

// Copy from user to kernel.
// Copy len bytes to dst from virtual address srcva in a given page table.
// Return 0 on success, -1 on error.
int
copyin(pagetable_t pagetable, char *dst, uint64 srcva, uint64 len)
{
  uint64 n, va0, pa0;
  struct proc* p = myproc();
  while(len > 0){
    va0 = PGROUNDDOWN(srcva);
    pa0 = walkaddr(pagetable, va0);

    if(pa0 == 0) {
      if(va0 >= p->sz||va0<=p->trapframe->sp){
        return -1;
        //printf("usertrap(): error va %p pid=%d\n", va, p->pid);
      } else {
        pa0 = (uint64)kalloc();
        if (pa0==0){
          p->killed = 1;
          return -1;
        } else {
          memset((void*)pa0, 0, PGSIZE);
          va0 = PGROUNDDOWN(va0);
          if(mappages(p->pagetable, va0, PGSIZE, pa0, PTE_W|PTE_U|PTE_R)!=0){
            kfree((void*)pa0);
            p->killed = 1;
            return -1;
          }
        }      
      }
    }
    n = PGSIZE - (srcva - va0);
    if(n > len)
      n = len;
    memmove(dst, (void *)(pa0 + (srcva - va0)), n);

    len -= n;
    dst += n;
    srcva = va0 + PGSIZE;
  }
  return 0;
}
```
