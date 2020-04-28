# Hi-face 小程序

微信小程序云开发，人脸智能裁剪，人脸识别。

## 主要功能

* 图片上传云存储
* 图片安全审核
* 人脸智能裁剪
* 人脸识别

## 目录结构

```bash
│  .gitignore          # git忽略文件
│  LICENSE             # 开源许可
│  project.config.json # 项目配置
│  README.md           # 项目说明
│
├─ cloudfunctions      # 云函数目录
│   │
│   └─image-verify     # 图片安全审核
│
└─ miniprogram
    │
    ├─components       # 组件
    ├─images           # 图片
    ├─pages            # 页面
    └─style            # 样式
```