---
sidebar_position: 1
---

# Lab 1 - MapReduce

go语言练手项目，但难度已经相当于某西部985研究生分布式课程大作业。我们的计算机教育...究竟会...变成什么样子...

工作量大约三四百行代码，当时写了两三天写完的。

Lab链接：https://pdos.csail.mit.edu/6.824/labs/lab-mr.html

代码目录：`src/mr`

## 思路

理解题意后其实很简单：对worker节点而言，不同的任务之间没有任何联系，worker处理完任务后也不用维持任何状态。换言之，worker只需要单纯的对每个任务判断类型、读写文件以及其他操作即可，交付给worker的任务可重复、可任意顺序（当然reduce任务总得等map阶段完成，这是coordinator该干的事）发送。

总结一句话就是：Task具有**幂等性**。

所以worker就可以抽象一个状态机：

```go title="mr/worker.go"
func Worker(mapf func(string, string) []KeyValue,
	reducef func(string, []string) string) {
	for {
		response := doHeartBeat()
		switch response.TaskType {
		case MapTask:
			doMapTask(&response, mapf)
		case ReduceTask:
			doReduceTask(&response, reducef)
		case WaitTask:
			time.Sleep(time.Second)
		case CompleteTask:
			return
		default:
			fmt.Printf("unknown task type %d, complete at %v\n", response.TaskType, t)
			return
		}
	}
}
```

而对coordinator而言，需要分两个阶段分发任务。理论上这里应该用channel之类的go原语的，但我不会（ 那还是用朴素的lock吧。

总体而言抛开debug过程还是很愉快的。当时debug几乎de了一天，最后发现是自己之前注释了的代码忘记删注释了。
