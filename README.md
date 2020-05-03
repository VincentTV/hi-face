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

## 目录结构

```bash
│  .gitignore          # git忽略文件
│  LICENSE             # 开源许可
│  project.config.json # 项目配置
│  README.md           # 项目说明
│
├─ cloudfunctions      # 云函数目录
│   │
│   ├─detect-face      # 人脸识别
│   ├─image-verify     # 图片安全审核
│   └─image-tag        # 获取图片标签
│
└─ miniprogram
    │
    ├─components       # 组件
    ├─images           # 图片
    ├─pages            # 页面
    └─style            # 样式
```