# acanvas-weapp
微信小程序画布组件-可直接生成二维码海报

## 概述
acanvas 组件是对最新的小程序 Canvas 2D组件的封装，采用新版的组件接口。官方[说法](https://developers.weixin.qq.com/community/develop/doc/00020a02c2c040114d19a398f5b001)相比于旧版接口提升一倍左右的渲染性能。acanvas-weapp 组件提供了易于使用的画图接口，支持在线图片渲染。

aposter 组件使用了 acanvas提供的接口，开箱即用，可生成二维码海报。组件自身支持生成二维码，也支持指定二维码图片（支持本地和在线图片）。

<span style="color: red">注意：请使用真机调试，前微信IDE存在bug，模拟器无法读取生成的临时文件（`http://tmp/wx...`）。Canvas 2d 暂不支持真机远程调试。</span>
## 参数解释

- genPoster

| 字段            | 类型                     | 必填 | 描述                                       |
| --------------- | ------------------------ | ---- | ------------------------------------------ |
|autoHeight       | Boolean                 | 否   | 是否根据海报主图自动计算海报高度               |

待续。。。