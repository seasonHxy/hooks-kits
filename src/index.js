import React from "react";
import ReactDom from "react-dom";

let isMount = true;
let workInProgressHook = {};

const fiber = {
    memoizedState: null, 
    stateNode: App
};

const Dispatcher = ( () => {
    //mount时调用,并设置当前的hook
    function mountWorkInProgressHook() {
        const hook = {
            queue: {
                pending: null
            },
            memoizedState: null, 
            next: null
        };
        if(!fiber.memoizedState) {
            fiber.memoizedState = hook;
        } else {
            workInProgressHook.next = hook;
        }
        workInProgressHook = hook;
        return workInProgressHook;
    }

    //update时调用,并将下一个hook设置当前的hook
    function updateWorkInProgressHook(){
        let curentHook = workInProgressHook;
        workInProgressHook = workInProgressHook.next;
        return curentHook;
    }

    function useState(initialState) {
        let hook;
        if(isMount) {
            hook = mountWorkInProgressHook();
            hook.memoizedState = initialState;
        } else {
            hook = updateWorkInProgressHook();
        }

        let baseState = hook.memoizedState;
        if(hook.queue.pending) {
            let firstPendingUpdate = hook.queue.pending.next;
            // 循环update链表,通过update的action计算state
            do {
                const action = firstPendingUpdate.action;
                baseState = action(baseState);
                firstPendingUpdate = firstPendingUpdate.next;
            } while(firstPendingUpdate !== hook.queue.pending)
            //重置update链表
            hook.queue.pending = null;  
        }
        //赋值新的state
        hook.memoizedState = baseState;
        
        return [baseState, dispatchAction.bind(null, hook.queue)];
    }

    return {
        useState
    };
})();
//触发更新
function dispatchAction(queue, action) {
    const update = {
        action,
        next: null
    };
    if(queue.pending === null) {
        //update的环状链表
        update.next = update;
    } else {
        //新的update的next指向前一个update
        update.next = queue.pending.next;
        //前一个update的next指向新的update
        queue.pending.next = update;
    }
    queue.pending = update;

    isMount = false;
    workInProgressHook = fiber.memoizedState;
    //调度
    schedule();
}

function App(){
    let [count, setCount] = Dispatcher.useState(1);
    return (
        <>
            <p>Clicked me {count} times</p>
            <button onClick={() => setCount(() => count + 1)}> Add count</button>
        </>
    )
}

function schedule() {
    ReactDom.render(<App />, document.querySelector("#root"));
}

schedule();
