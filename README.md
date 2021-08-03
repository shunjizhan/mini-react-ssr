# Mini React SSR
实现一个简易版的React SSR

## 1) 服务端渲染
主要就是用到了react-dom的renderToString方法，把一个组件渲染成jsx,然后插进html里面，服务端就可以直接返回这个html。

```ts
// server.js
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

但是这个时候我们会发现，event handler是没用的，这时候app里面只有html，没有js，自然就没有event handler。我们需要继续客户端渲染一次（hydrate）来激活界面。