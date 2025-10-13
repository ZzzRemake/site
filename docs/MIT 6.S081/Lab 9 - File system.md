---
sidebar_position: 9
---

# Lab 9 - File system

## 课程

### buffer

这部分主要为`bread`，`bwrite`和`brelse`。

`bread`：调用的`bget`其中`bcache.lock`保证了`bcache`和得到的buffer初始化的原子性，从而让`bget`可以在`bcache.lock` release后再获取`b->lock.`
而`bwrite`， `brelse`反而无关紧要，`bwrite`必须写一个带锁的block，而`brelse`将锁去除并将block放回bcache。

### logging

主要流程为：

```c
begin_op();
//...
bp = bread();
bp->data[...] = ...;
log_write(bp);
//...
end_op();
```

`begin_op`完成对`log`这一全局变量的commit状态检查以及预留空间（`log`写入的空间不能超过`LOGSIZE`）的检查。
`log_write`则在完成必要的检查后，pin了一个block（防止其被evict）并在上面进行多次写。多次写相比于一次写立刻提交有了性能提升。
`end_op()`完成写入log、commit log（通过写入head），`install_trans`（将log写入文件系统），清空log(log.lh.n = 0)，最后再写入head来擦除transaction。

若commit后发生崩溃，则`recover_from_log`会在系统启动中由`fsinit-initlog`调用，写入log。

## Code

### Large files (moderate)

实现双重间接块。

改下定义：

```c
//fs.h
#define NDIRECT 11
#define NINDIRECT_DOUBLE (NINDIRECT * NINDIRECT)
#define MAXFILE (NDIRECT + NINDIRECT + NINDIRECT_DOUBLE)

struct dinode {
  short type;           // File type
  short major;          // Major device number (T_DEVICE only)
  short minor;          // Minor device number (T_DEVICE only)
  short nlink;          // Number of links to inode in file system
  uint size;            // Size of file (bytes)
  uint addrs[NDIRECT+1+1];   // Data block addresses
};

//file.h
struct inode {
  uint dev;           // Device number
  uint inum;          // Inode number
  int ref;            // Reference count
  struct sleeplock lock; // protects everything below here
  int valid;          // inode has been read from disk?

  short type;         // copy of disk inode
  short major;
  short minor;
  short nlink;
  uint size;
  uint addrs[NDIRECT+1+1];
};
```

```c title="kernel/bmap.c"
static uint
bmap(struct inode *ip, uint bn)
{
  uint addr, *a;
  struct buf *bp;
  if(bn < NDIRECT){
    if((addr = ip->addrs[bn]) == 0)
      ip->addrs[bn] = addr = balloc(ip->dev);
    return addr;
  }
  bn -= NDIRECT;

  if(bn < NINDIRECT){
    // Load indirect block, allocating if necessary.
    if((addr = ip->addrs[NDIRECT]) == 0)
      ip->addrs[NDIRECT] = addr = balloc(ip->dev);
    bp = bread(ip->dev, addr);
    a = (uint*)bp->data;
    if((addr = a[bn]) == 0){
      a[bn] = addr = balloc(ip->dev);
      log_write(bp);
    }
    brelse(bp);
    return addr;
  }
  // begin
  bn -= NINDIRECT;

  int first_index = bn/NINDIRECT, second_index = bn%NINDIRECT;
  if(bn < NINDIRECT_DOUBLE){
    if((addr = ip->addrs[NDIRECT+1]) == 0)
      ip->addrs[NDIRECT+1] = addr = balloc(ip->dev);
    bp = bread(ip->dev, addr);
    a = (uint*)bp->data;
    if((addr = a[first_index]) == 0){
      a[first_index] = addr = balloc(ip->dev);
      log_write(bp);
    }
    brelse(bp);
    // second : to data
    bp = bread(ip->dev, addr);
    a = (uint*)bp->data;
    if((addr = a[second_index]) == 0){
      a[second_index] = addr = balloc(ip->dev);
      log_write(bp);
    }
    brelse(bp);
    return addr;
  }
  // end
  panic("bmap: out of range");
}

void
itrunc(struct inode *ip)
{
  int i, j;
  struct buf *bp;
  uint *a;

  for(i = 0; i < NDIRECT; i++){
    if(ip->addrs[i]){
      bfree(ip->dev, ip->addrs[i]);
      ip->addrs[i] = 0;
    }
  }

  if(ip->addrs[NDIRECT]){
    bp = bread(ip->dev, ip->addrs[NDIRECT]);
    a = (uint*)bp->data;
    for(j = 0; j < NINDIRECT; j++){
      if(a[j])
        bfree(ip->dev, a[j]);
    }
    brelse(bp);
    bfree(ip->dev, ip->addrs[NDIRECT]);
    ip->addrs[NDIRECT] = 0;
  }


  // begin
  struct buf *bp_index;
  uint *a_index;

  if(ip->addrs[NDIRECT+1]){
    bp = bread(ip->dev, ip->addrs[NDIRECT+1]);
    a = (uint*)bp->data;
    for(i = 0; i<NINDIRECT;i++){
      if(a[i]){
        bp_index = bread(ip->dev, a[i]);
        a_index = (uint*)bp_index->data;
        for(j = 0; j<NINDIRECT;j++){
          if(a_index[j])
            bfree(ip->dev, a_index[j]);
        }
        brelse(bp_index);
        bfree(ip->dev, a[i]);
        a[i] = 0;
      }
    }
    brelse(bp);
    bfree(ip->dev, ip->addrs[NINDIRECT+1]);
    ip->addrs[NDIRECT+1] = 0;
  }
  // end
  ip->size = 0;
  iupdate(ip);
}
```

### Symbolic links (moderate)

增加系统调用的部分略。

定义：

```c
//stat.h
#define T_SYMLINK 4   // Symlink
//fcntl.h
#define O_NOFOLLOW 0x100
```

```c "kernel/sysfile.c"
uint64
sys_open(void)
{
  char path[MAXPATH];
  int fd, omode;
  struct file *f;
  struct inode *ip;
  int n;

  if((n = argstr(0, path, MAXPATH)) < 0 || argint(1, &omode) < 0)
    return -1;

  begin_op();

  if(omode & O_CREATE){
    ip = create(path, T_FILE, 0, 0);
    if(ip == 0){
      end_op();
      return -1;
    }
  } else {
    int cnt = 0;
    for(cnt = 0;cnt<10;++cnt){
      //printf("cnt: %d\n", cnt);
      if((ip = namei(path)) == 0){
        end_op();
        return -1;
      }
      ilock(ip);
      if(ip->type == T_SYMLINK && ((omode & O_NOFOLLOW) == 0)){
        if(readi(ip, 0, (uint64)path, 0, MAXPATH) != MAXPATH){
          iunlockput(ip);
          end_op();
          return -1;
        }
        iunlockput(ip);
      } else {
        break;
      }
    }
    if(cnt==10){
      iunlockput(ip);
      end_op();
      return -1;
    }

    if(ip->type == T_DIR && omode != O_RDONLY){
      iunlockput(ip);
      end_op();
      return -1;
    }
  }
  //...

}

uint64
sys_symlink(void){
  char target[MAXPATH], path[MAXPATH];
  if(argstr(0, target, MAXPATH) < 0 || argstr(1, path, MAXPATH) < 0){
    return -1;
  }

  int len = strlen(target);

  struct inode* ip;
  begin_op();
  if((ip = create(path, T_SYMLINK, 0, 0)) == 0){
    end_op();
    return -1;
  }
  //create 就是加锁的ip，这里铸币了
  //ilock(ip);
  if(writei(ip, 0, (uint64)target, 0, len) != len){
    end_op();
    return -1;
  }
  iunlockput(ip);
  end_op();
  return 0;
}
```

几个错误点：

1. 文档里的api不记得了，甚至还想自己实现一遍`writei`/`readi`，幸好悬崖勒马了。
2. 另外对open的使用也不太熟悉，导致我还以为要在`symlink`的系统调用里头用`O_TAG`，我寻思也没有file层的调用啊。
3. 最后就是ilock...这部分到现在还是不太了解，等之后细细梳理了。不过在这里和lock的原理无关，单纯就是自己会忘记加`iunlockput`而已。
