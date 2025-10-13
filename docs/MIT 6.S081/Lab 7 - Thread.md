---
sidebar_position: 7
---

# Lab 7 - Thread

怎么有人记错了栈的增长方向的，消息了。

----

课程内容其实就帮你把Lab做一遍了，略。

## Uthread: switching between threads (moderate)

首先建个上下文`context`结构体，用结构体存必要的callee寄存器以及ra，sp， 用汇编进行switch即可。

```c title="uthread.c"
struct ucontext
{
  uint64 ra;
  uint64 sp;

  // callee-saved
  uint64 s0;
  uint64 s1;
  uint64 s2;
  uint64 s3;
  uint64 s4;
  uint64 s5;
  uint64 s6;
  uint64 s7;
  uint64 s8;
  uint64 s9;
  uint64 s10;
  uint64 s11;
};

struct thread {
  char       stack[STACK_SIZE]; /* the thread's stack */
  int        state;             /* FREE, RUNNING, RUNNABLE */
  struct ucontext context;
};
struct thread all_thread[MAX_THREAD];
struct thread *current_thread;

void 
thread_schedule(void)
{   
    //....
  if (current_thread != next_thread) {         /* switch threads?  */
    next_thread->state = RUNNING;
    t = current_thread;
    current_thread = next_thread;
    /* YOUR CODE HERE
     * Invoke thread_switch to switch from t to next_thread:
     * thread_switch(??, ??);
     */
    thread_switch((uint64)(&t->context), (uint64)(&next_thread->context));
  } else
    next_thread = 0;
}

void 
thread_create(void (*func)())
{
  struct thread *t;

  for (t = all_thread; t < all_thread + MAX_THREAD; t++) {
    if (t->state == FREE) break;
  }
  t->state = RUNNABLE;
  // YOUR CODE HERE
  memset(&t->context, 0, sizeof(t->context));
  t->context.ra = (uint64)func;
  t->context.sp = (uint64)(t->stack+STACK_SIZE-1);
  // 坑： sp是反向增长。。。。令人感叹。
}
```

汇编的内容可以直接把`kernel/swtch.S`抄过来。

## Using threads (moderate)

pthread的简单应用。但这里有一个优化是可以单独说的。

原题要求将一个单线程安全的哈希表改成多线程安全，若每个桶都用相同的锁，那么多线程将退化为串行执行，不能起到并行加速的效果；但若对每个桶单独加个锁，便可以做到并行加速。

因此，这部分有`ph_safe`和`ph_fast`两个测试，分别测试正确性和优化后的并行加速。

```c title="ph.c"
pthread_mutex_t entry_mutex[NBUCKET];

static 
void put(int key, int value)
{
  int i = key % NBUCKET;

  // is the key already present?
  struct entry *e = 0;
  pthread_mutex_lock(&entry_mutex[i]);
  for (e = table[i]; e != 0; e = e->next) {
    if (e->key == key)
      break;
  }
  if(e){
    // update the existing key.
    e->value = value;
  } else {
    // the new is new.
    insert(key, value, &table[i], table[i]);
  }
  pthread_mutex_unlock(&entry_mutex[i]);
}
```

再加个锁的初始化即可。

## Barrier(moderate)

pthread中的信号量简单使用。

Barrier的作用是指定所有线程执行完后才能进行下一步，相当于一个整合的作用。

```c title="barrier.c"
static void 
barrier()
{
  // YOUR CODE HERE
  //
  // Block until all threads have called barrier() and
  // then increment bstate.round.
  //
  pthread_mutex_lock(&bstate.barrier_mutex);
  bstate.nthread++;
  if(bstate.nthread == nthread){
    pthread_mutex_unlock(&bstate.barrier_mutex);
    bstate.nthread = 0;
    bstate.round++;
    pthread_cond_broadcast(&bstate.barrier_cond);
  } else {
    pthread_cond_wait(&bstate.barrier_cond, &bstate.barrier_mutex);
  } 
}
```
