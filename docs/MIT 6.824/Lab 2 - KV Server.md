---
sidebar_position: 2
---

# Lab 2 - KV Server

其实还是练手项目。可能课程觉得之前lab 2直接开大不太好，用小项目来充数。

Lab链接：https://pdos.csail.mit.edu/6.824/labs/lab-kvsrv1.html

代码：`src/kvsrv1`

## 思路

### Step 1：KV Server with reliable network

照题意写即可。最简单的一集。

### Step 2：Implementing a lock using key/value clerk

其实Hint相当于把整个思路都给你讲了。

之前实现的KV Server实际上就是用版本号给你规定了`Get/Put`的序列化，很容易将其类比至Lock的行为。

很容易想到用特定的一个key（比如Hint里的`l`，来保存value的状态，value为空则无人持有锁，value有值则为对应的server持有锁。

### Step 3：dropped messages

题干也写的很明白，加个ErrMaybe做区分，并且通过定时器的方式不断query得到最终结果即可。

### Step 4：Lock with dropped message

Step 2写的很简单，所以这里也可以写的很简单。做完翻了别人代码，发现因为Step 2复杂了，这里要判断的就更多了。实际上只需要对ErrMaybe增加点判断即可。