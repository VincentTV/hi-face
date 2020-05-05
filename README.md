# Hi-face 小程序

微信小程序云开发常规挑战赛项目

## 阶段

* 初级阶段：【图像标签】
    * 图像安全审核
    * 获取图像标签
* 中级阶段：【人脸魅力识别】
    * 云开发扩展-图像安全审核
    * 云开发扩展-图像处理（图像标签、人脸智能裁剪、图像主色调）
    * 腾讯云-人脸识别（人脸检测分析）
* 高级阶段：【头像智能绘制】
    * 本地图片压缩转base64
    * 云环境进行图片安全审核与人脸五官分析
    * 根据五官信息给人脸戴口罩
    * 口罩等贴纸可手动添加、移动、旋转、缩放
    * 渲染图片后可上传云存储
    * 云相册页面可查看、删除已上传的图片

## 目录结构

```bash
│  .gitignore          # git忽略文件
│  LICENSE             # 开源许可
│  project.config.json # 项目配置
│  README.md           # 项目说明
│
├─ cloudfunctions      # 云函数目录
│   │
│   ├─analyze-face     # 腾讯云图片安全审核+五官分析
│   ├─detect-face      # 人脸识别
│   ├─image-verify     # 图片安全审核
│   └─image-tag        # 获取图片标签
│
└─ miniprogram
    │
    ├─components       # 组件
    │   │
    │   └─cover             # 高级阶段-弹窗组件
    │
    └─pages            # 页面
        │
        ├─avatar-render     # 高级阶段-云相册页
        ├─profile           # 高级阶段-云相册页
        ├─detect-face       # 中级阶段页面
        └─index             # 初级阶段页面
```