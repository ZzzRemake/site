---
sidebar_position: 6
---

# Lab 6 - Copy-On-Write

## 课程

其实课程内容很少。

Xv6以及其他类POSIX 系统，若要使用fork-exec方式来生成新的进程，fork便会带来不必要的复制：fork的意义是为exec带来新的pid以及进程资源，原进程的复制只会带来不必要的IO。

于是，大部分操作系统都实现了Copy-On-Write（COW）fork，按需进行复制。

### 具体过程

可以将fork后的父子进程共享同一份物理内存（page），这样，若不发生写入，则只需要修改一下子进程的pagetable即可。而为了满足这一点，需要将PTE标志位设为只读，且明确标明这是COW的结果（可在RSW位中设置），方便和出错情况区分。而当需要写入的时候，按需对写入页进行复制。

写时复制带来了性能的提升，但相对也带来了维护的复杂性：什么时候释放页呢？这里就需要引入引用计数，而引用计数的相关知识。。略。感觉都会罢。

## Implement copy-on write (hard)

该部分确实和Lazy重合度大，重点在PTE标志位的设定，以及kalloc.c中引用数据结构的维护。

不用最开始就考虑复杂情况。由于xv6本身较为简单，因此标志位不会设定的太复杂，不需要考虑R和W位的组合问题，这里钻了牛角尖了。

```c title="kernel/riscv.h"
#define PTE_COW (1L << 8) // 1 -> Copy-On-Write PAGE
```

```c title="kernel/kalloc.h"
#include "types.h"
#include "param.h"
#include "memlayout.h"
#include "spinlock.h"
#include "riscv.h"
#include "defs.h"

#define PA2CNT_INDEX(pa) (((uint64)pa)>>12)

void freerange(void *pa_start, void *pa_end);

struct cnt {
  struct spinlock lock;
  uint cnt[PHYSTOP>>PGSHIFT];
} kcnt;



extern char end[]; // first address after kernel.
                   // defined by kernel.ld.

struct run {
  struct run *next;
};

struct {
  struct spinlock lock;
  struct run *freelist;
} kmem;

void
kinit()
{
  initlock(&kmem.lock, "kmem");
  initlock(&kcnt.lock, "kcnt");
  freerange(end, (void*)PHYSTOP);
}

void
freerange(void *pa_start, void *pa_end)
{
  char *p;
  p = (char*)PGROUNDUP((uint64)pa_start);
  for(; p + PGSIZE <= (char*)pa_end; p += PGSIZE){
    kcnt.cnt[PA2CNT_INDEX(p)] = 0;
    kfree(p);
  }
}

// Free the page of physical memory pointed at by v,
// which normally should have been returned by a
// call to kalloc().  (The exception is when
// initializing the allocator; see kinit above.)
void
kfree(void *pa)
{
  struct run *r;

  if(((uint64)pa % PGSIZE) != 0 || (char*)pa < end || (uint64)pa >= PHYSTOP)
    panic("kfree");

  acquire(&kcnt.lock);
  if(kcnt.cnt[PA2CNT_INDEX(pa)] != 0){
    --kcnt.cnt[PA2CNT_INDEX(pa)];
  }
  release(&kcnt.lock);
  if (kcnt.cnt[PA2CNT_INDEX(pa)] != 0){
    return;
  }

  // Fill with junk to catch dangling refs.
  memset(pa, 1, PGSIZE);

  r = (struct run*)pa;

  acquire(&kmem.lock);
  r->next = kmem.freelist;
  kmem.freelist = r;
  release(&kmem.lock);

}

// Allocate one 4096-byte page of physical memory.
// Returns a pointer that the kernel can use.
// Returns 0 if the memory cannot be allocated.
void *
kalloc(void)
{
  struct run *r;

  acquire(&kmem.lock);
  r = kmem.freelist;
  if(r){
    kmem.freelist = r->next;
    acquire(&kcnt.lock);
    kcnt.cnt[PA2CNT_INDEX(r)] = 1;
    release(&kcnt.lock);
  }

  release(&kmem.lock);

  if(r){
    memset((char*)r, 5, PGSIZE); // fill with junk
  }
  return (void*)r;
}

void kincrease(uint64 pa){
  acquire(&kcnt.lock);
  kcnt.cnt[PA2CNT_INDEX(pa)] += 1;
  release(&kcnt.lock);
}
```

```c title="kernel/vm.c"
int
uvmcopy(pagetable_t old, pagetable_t new, uint64 sz)
{
  pte_t *pte;
  uint64 pa, i;
  uint flags;
  //char *mem;

  for(i = 0; i < sz; i += PGSIZE){
    if((pte = walk(old, i, 0)) == 0)
      panic("uvmcopy: pte should exist");
    if((*pte & PTE_V) == 0)
      panic("uvmcopy: page not present");
    pa = PTE2PA(*pte);    
    kincrease(pa);
    
    *pte |= PTE_COW;
    *pte &= ~PTE_W;
    flags = PTE_FLAGS(*pte);
    //if((mem = kalloc()) == 0)
    //  goto err;
    //memmove(mem, (char*)pa, PGSIZE);
    if(mappages(new, i, PGSIZE, (uint64)pa, flags) != 0){
      // 若无法分配一个page。。。感觉要改mappage，这里头有个remap。
      //kfree((void*)pa);
      goto err;
    }
  }
  return 0;
  //...
}


int
copyout(pagetable_t pagetable, uint64 dstva, char *src, uint64 len)
{
  uint64 n, va0, pa0;
  pte_t* pte0;
  while(len > 0){
    va0 = PGROUNDDOWN(dstva);
    pa0 = walkaddr(pagetable, va0);
    if(pa0 == 0)
      return -1;

    pte0 = walk(pagetable, va0, 0);
    if((*pte0 & PTE_W) == 0){
      if(cow(pagetable, va0)<0){
        return -1;
      }
    }
    pa0 = PTE2PA(*pte0);
    //.....
  }
}

int cow(pagetable_t pagetable, uint64 va)
{
  if(va>=MAXVA){
    return -1;
  }
  pte_t* pte;
  if((pte = walk(pagetable, va, 0)) == 0){
    panic("cow(): cow walk error.");
    return -1;
  }
  if((*pte & PTE_V) == 0){
    return -1;
  }
  if((*pte & PTE_COW) == 0){
    return -1;
  }
  if((*pte & PTE_U) == 0){
    return -1;
  }

  uint64 ka = (uint64)kalloc(), pa = PTE2PA(*pte);
  uint flags = PTE_FLAGS(*pte);
  if (ka==0){
    return -1;
  }

  memmove((void*)ka, (char*)pa, PGSIZE);
  flags &= ~PTE_COW;
  flags |= PTE_W;
  *pte = PA2PTE(ka) | flags;
  kfree((void*)pa);
  return 0;
}
```

```c title="kernel/trap.c"
void
usertrap(void)
{
  //...
  if(r_scause() == 8){
    // system call
    // ...
    syscall();
  } else if (r_scause() == 15){
    uint64 va = r_stval();
    if(cow(p->pagetable, va)<0){
      p->killed = 1;
    }
  } //...
}

```

再修改一下`kernel/defs.h`即可。
