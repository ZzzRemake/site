---
sidebar_position: 1
---


# Lab 1 - Util

熟悉项目的lab（真能熟悉吗？），类POSIX接口实现用户的一些功能。

## 课程

大体其实和普通的OS差不多，但6.S081的一大特点是上来就讲代码，因此很多操作系统课不会讲的代码具体实现在课程里会详细介绍。

除了xv6代码的细节，例如程序必须`exit(0)`退出，`exec`载入elf格式文件等，值得讲的就是`fork`和`exec`的I/O和File的descriptors，一切似乎都是水到渠成。

----

File descriptor作为一种流的抽象，被广泛应用于UNIX的各个部分（除了网络部分，虽然有类似实现但又存在不同），诸如管道等。

`fork`在普通OS课程中只会用变量等例子来展示"子进程是父进程的复制"，但实际的Linux不仅于此。`fork`在复制程序本身的情况下还复制了父进程的文件描述符表，而exec虽然改变了程序（通过load的image），但不会对文件描述符表进行改变。

因此，父进程可以通过临时改变文件描述符来操作子进程的描述符，子进程只知道描述符本身，而不知道描述符后面代表的是文件，设备、或者管道。

另外，`fork`虽然复制了描述符表，但每个描述符下的偏移量是独立的。因此，两个进程的描述符下可能是同一个东西，共享同一个偏移量。

----

既然介绍了这么多，那么`pipe`也就水到渠成了。父进程和子进程共享一个descriptor。在实际的操作中，一端操作需要对另一端进行关闭，否则便会一直阻塞。`pipe`的语义中，read端返回需要：

1. write端写入 bytes
2. 写入端关闭

因此，需要按需关闭`pipe`。

----

最后一个可以关注的点便是shell内置命令。Unix时代经常把mkdir等命令内置，但Unix将其作为可执行程序，从`$PATH`中寻找。但cd命令不同，如果用传统的fork-exec来进行，改变的只有子进程的工作目录，shell并不会关注子进程的这一信息。

## Lab部分

### sleep (easy)

简单的系统调用。

```c title="user/sleep.c"
#include "kernel/types.h"
#include <user/user.h>

void my_sleep(const char* argument){
    int sleep_second = atoi(argument);
    sleep(sleep_second);
}

int main(int argc, char const *argv[]){
    if(argc <= 1){
        fprintf(2, "usage: sleep need number(second).\n");
        exit(1);
    }
    if(argc >=3){
        fprintf(2, "error: too many argument.(sleep)\n");
    }

    my_sleep(argv[1]);

    exit(0);
}
```

### pingpong (easy)

简单的进程间通信，理解了pipe和fork的关系就行。

```c title="user/pingpong.c"
//Simple pingpong: pipe.

#include <kernel/types.h>
#include <user/user.h>

int main(int argc, char const *argv[]) {
    int p[2];
    char buf[2];
    
    if(pipe(p)<0){
        fprintf(2, "error: pipe exit(pingpong)\n");
        exit(1);
    }

    int pid = fork();
    if(pid == 0){
        //child
        int read_bytes = read(p[0], buf, 1);
        close(p[0]);
        if(read_bytes>0){
            int now_pid = getpid();
            printf("%d: received ping\n", now_pid);
            write(p[1], buf, 1);
            close(p[1]);
        } else {
            exit(1);
        }

    } else if(pid>0){
        //parent
        char *buf="y";
        char* buf_test="y";
        write(p[1], buf, 1);
        close(p[1]);
        int read_bytes = read(p[0], buf, 1);
        close(p[0]);
        if(read_bytes>0){
            int now_pid = getpid();
            if(strcmp(buf, buf_test)){
                printf("%d: received pong\n", now_pid);               
            }
        }
    } else {
        fprintf(2, "error: fork(pingpong)\n");
    }
    return 0;
}
```

### primes (moderate)/(hard)

抽象起来了。

问题在于理解下面这张图：

![primes](https://swtch.com/~rsc/thread/sieve.gif)

可以看到，主进程fork完后，便一直向子进程发送递增数据，而子程序接受数据后，需要视情况fork，然后传递数据。

其主要伪代码为：

```python
p = get a number from left neighbor
print p
loop:
    n = get a number from left neighbor
    if (p does not divide n)
        send n to right neighbor
```

对着写：

```c title="user/primes.c"
#include <kernel/types.h>
#include <user/user.h>

void prime(int*fd){
    int p, d;
    close(fd[1]);

    if(read(fd[0], &p, 4)==0){
        exit(0);
    }
    printf("prime %d\n", p);
    if (read(fd[0], (void *)&d, sizeof(d))){
        int fd1[2];
        pipe(fd1);
        if (fork() == 0){
            prime(fd1);
        }else{
            // 关闭读
            close(fd1[0]);
            do{
                if (d % p != 0){
                    write(fd1[1], (void *)&d, sizeof(d));
                }
            }while(read(fd[0], (void *)&d, sizeof(d)));
            // 关闭读
            close(fd[0]);
            // 关闭写
            close(fd1[1]);
            wait(0);
        }
    }
    exit(0);
}

int main(int argc, char const *argv[]) {
    int p[2];
    pipe(p);
    int pid=fork();

    if(pid==0){
        prime(p);
    } else if(pid>0){
        close(p[0]);
        for(int i = 2;i<=35;++i){
            write(p[1], &i, 4);
        }
        close(p[1]);
        wait((int*)0);
    } else {
        fprintf(2, "error: fork(prime).\n");
    }
    exit(0);
}
```

当时犯了两错误。

1. 题目一眼用函数递归实现，但当时钻了牛角尖非得在main函数实现，甚至打算用goto了。
2. 函数顺序应该是`read -> read -> fork` ，这样第二个read便可以成为停止条件；而我当时理解成了 `read -> fork -> read` 这会导致一个进程一直在等待信息，从而无法退出程序。

### xargs (moderate)

注意读题（

本题并没有什么难度，但做的时候读错题意导致后面代码可读性很差，最后还是参考了别人，令人感叹。

注意要用exec实现，第一次实现的时候虽然过了但并不是exec实现。

```c title="user/xargs.c"
#include <kernel/types.h>
#include <kernel/param.h>
#include <user/user.h>

void copy(char **p1, char *p2){
    *p1 = malloc(strlen(p2) + 1);
    strcpy(*p1, p2);
}


int readline(char** parm, int begin){
    char buf[512];
    
    int i = 0;
    while(read(0, buf+i, 1)){
        if(buf[i]=='\n'){
            buf[i]=0;
            break;
        }
        ++i;
    }
    if(i==0){
        return 0;
    }
    int j = 0;
    while(j<i){
        if(begin>MAXARG){
            fprintf(2, "too many parameters!(xargs)\n");
            exit(1);
        }
        int temp = j;
        while((j<i)&&(buf[j]!=' ')){
            ++j;
        }
        buf[j++] = 0;
        copy(&parm[i], buf+temp);
    }
    return begin;
}

int main(int argc, char *argv[])
{
    if(argc<2){
        fprintf(2, "Please enter more parameters.(xargs)\n");
        exit(1);
    }
    char*pars[MAXARG];
    for(int i = 1;i<argc;++i){
        copy(&pars[i-1], argv[i]);
    }
    int end;
    end=readline(pars, argc-1);
    while(end){
        pars[end]=0;
        if(fork()==0){
            for(int i =0;i<end;++i){
                printf("%s\n", pars[i]);
            }
            //exec(pars[0], pars);
            exit(1);
        } else {
            wait(0);
        }
        end=readline(pars, argc-1);
    }
    exit(0);
}
```
