---
tags: post
title: Node.js event loop
layout: layouts/blog_layout.njk
---

![Node.js event loop](/assets/images/event_loop.webp)

### What is event loop in JavaScript?

The event loop is a core mechanism in JavaScript that enables its single-threaded nature to handle asynchronous operations without blocking the main execution thread. It orchestrates the execution flow by continuously checking if the call stack is empty and moving tasks from the queues into the call stack to be run.

This is essential for web browsers and Node.js because long-running tasks, such as fetching data from a server or waiting on a timer, would otherwise freeze the entire application. The event loop ensures responsiveness by allowing JavaScript to offload these tasks and return to them later.

### Key components of the event loop:

The event loop works in tandem with several other components in the JavaScript runtime environment:
Call stack: A LIFO stack that executes synchronous code. When a function is called, it is pushed onto the stack. When it returns, it is popped off.

**Web APIs**: These are browser of Node.js APIs that handle asynchronous tasks in the background. Examples include `setTimeout`, fetch calls, and DOM events like a button click.

**Microtask queue**: A FIFO queue for high-priority asynchronous tasks. It is processed after the call stack is empty but before the next microtask is run. Examples include resolved Promises (.then(), .catch()) and queueMicrotask().

**Macrotask queue (or Task queue)**: A FIFO queue for lower-priority asynchronous tasks. Examples include `setTimeout`, `setInterval`, I/O and UI rendering.

### How the event loop works:

Initial execution: The JavaScript engine runs the initial synchronous code and pushes function calls onto the call stack.

**Offloading async tasks**: When an asynchronous function like `setTimeout` is encountered, it is passed to the appropriate Web API. The Web API handles the task and the function call is immediately popped from the call stack, so the synchronous code continues to execute.

**Task completion**: Once the Web API finishes its work (e.g., the timer for `setTimeout` expires), it places its callback function into either the macrotask or microtask queue.

**Looping and prioritizing**: The event loop continually performs the following cycle:
It checks if the call stack is empty.

If the stack is empty, it processes all tasks in the higher-priority microtask queue until it is empty.
Only after the microtask queue is cleared will the event loop move a single task from the lower-priority macrotask queue to the call stack to be executed.
This cycle repeats indefinitely.

### Example walkthrough:

```js
console.log("Start");

setTimeout(() => {
  console.log("Timeout");
}, 0);

Promise.resolve().then(() => {
  console.log("Promise");
});

console.log("End");
```

In this example, `Start` and `End` are executed first as synchronous code. The `setTimeout` callback is sent to Web APIs and eventually placed in the macrotask queue, while the Promise.then callback goes into the microtask queue. After the synchronous code finishes, the event loop prioritizes the microtask queue, executing the promise callback. Finally, the macrotask queue is processed, running the `setTimeout` callback.

**The resulting output sequence is**:

```
Start
End
Promise
Timeout
```
