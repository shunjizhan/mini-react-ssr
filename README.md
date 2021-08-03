# Mini React SSR
实现一个简易版的React SSR

## 1) 服务端渲染
主要就是用到了react-dom的renderToString方法，把一个组件渲染成jsx,然后插进html里面，服务端就可以直接返回这个html。

```ts
// src/server/index.js
app.get('/', (req, res) => {
  const content = renderToString(<Home />);
  res.send(`
    <html>
      <head>
        <title>React SSR</title>
      </head>
      <body>
        <div id="root">${content}</div>
      </body>
    </html>
  `);
});
```

把server.js是不能直接运行的，因为node不能理解jsx，所以用webpack打包成server.bundle.js,然后`node server.bundle.js`就可以在localhost里面看到Home的内容了。

但是这个时候我们会发现，event handler是没用的，这时候app里面只有html，没有js，自然就没有event handler。我们需要继续对组件进行二次渲染（hydrate）来激活界面。

## 2) Hydrate注水
hydration本身的代码本简单，就是重新render一次组件，只不过把render换成了hydrate。

为什么不用render而用hydrate？因为hydrate方法在实现渲染的时候, 会复用原本已经存在的 DOM 节点 , 减少重新生成节点以及删除原本 DOM 节点的开销。

 ```ts
 // src/client/index.js
 ReactDOM.hydrate(<Home />, document.getElementById('root'));
 ```

运行这段代码就能实现注水，那怎么运行呢？很简单，首先是要打包到public/client.bundle.js,然后在server返回的html里面加上一个script调用这段注水代码就行了。

这个script在第一次服务端渲染返回html的时候是不会运行的，直到第二次渲染注水的时候才会运行。

```ts
// src/server/index.js
app.use(express.static('public'));    // client.bundle.js会直接在public/里面找

app.get('/', (req, res) => {
  const content = renderToString(<Home />);
  res.send(`
    ...
      <div id="root">${content}</div>
      <script src="client.bundle.js"></script>
    ...
  `);
});
```
