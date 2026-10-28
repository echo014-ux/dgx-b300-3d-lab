# DGX B300 3D 拆解实验室

中文交互式硬件学习游戏：旋转、拆解和观察 DGX B300 教学模型，结合实物参考图、组件课程、echo 数字人讲解与知识挑战，理解一台 AI 服务器的组成。

## 开始体验

需要 **Python 3.10+** 和支持 WebGL 2 的现代浏览器。运行无需安装 Python 第三方库；Three.js、模型和课程媒体均已包含。

```bash
git clone https://github.com/echo014-ux/dgx-b300-3d-lab.git
cd dgx-b300-3d-lab
python serve_game.py 27730
```

Windows 也可以下载 GitHub 的 **Code → Download ZIP**，完整解压后双击 `启动游戏.cmd`。启动后会自动打开浏览器；默认地址为 http://127.0.0.1:27730/ 。若端口被其他程序占用，请使用启动窗口实际显示的地址。

请保持启动窗口运行；关闭窗口会停止服务。不要直接双击 `game/index.html`，浏览器的本地文件限制会影响模型和课程加载。若只想启动服务而不自动打开浏览器：

```bash
python serve_game.py 27730 --no-browser
```

## 可以玩什么

- **自由探索**：观察 12 组组件，旋转、缩放、拆解与聚焦；对照 NVIDIA 官方参考图片。
- **装机挑战**：完成 11 步概念配对任务，在任务卡中安装所选组件。
- **知识闯关**：10 道问题，附答案解释。
- **音视频课程**：12 节组件课程，包含本地视频、音频、字幕和章节导航。
- **echo 数字人**：组件讲解、算力与比较讲解，以及独立自我介绍示例。
- **算力课堂**：切换精度、单 GPU / 整机口径，理解理论峰值与资源差异。
- **集群估算**：调整整机数量，查看 GPU 数量和服务器功耗估算。
- **River 场景**：查看复用 Blender 工程导出的数字人讲解场景。

学习进度保存在当前浏览器的 localStorage 中，不上传到服务端。

## 文件结构

```text
game/                         静态网页与交互代码
  assets/                     当前版本模型、参考图、课程和数字人媒体
  vendor/                     Three.js 及配套加载器（含许可证）
serve_game.py                 本机 HTTP 服务，支持音视频 Range 请求
启动游戏.cmd                  Windows 启动入口
desktop_launcher.py            Windows 桌面启动器脚本
THIRD_PARTY_NOTICES.md         第三方素材与来源说明
```

这是当前可运行版本的发布快照，不包含 Blender 工程原件、音色训练/生成资源、备份或本机生成缓存。模型以可直接加载的 GLB 格式发布。

## 内容口径

本项目为独立教学作品，与 NVIDIA、华为无隶属关系，也不是厂商官方 CAD 或维修步骤。被遮挡的结构与展开动作含教学示意。

硬件参数保留原版本的来源链接及日期；本次发布未重新更新规格。算力页面区分精度、稠密/稀疏和单芯片/整机；峰值不等于实际训练或推理吞吐。昇腾 950DT 比较是原资料口径下的芯片资源比较，八芯片理论合计不代表已确认的八卡整机。采购和部署请以具体设备版本与厂商最新资料为准。

数字人部分视频为 256×256 本地生成版本；自我介绍和机箱视频保留 HeyGen 水印。echo 改名片段保留原口型动画，并非重新生成口型。

## 参考与权利说明

- [NVIDIA Blackwell 架构](https://www.nvidia.com/en-us/data-center/technologies/blackwell-architecture/)
- [NVIDIA DGX B300](https://www.nvidia.com/en-us/data-center/dgx-b300/)
- [DGX B300 用户指南](https://docs.nvidia.com/dgx/dgxb300-user-guide/)

第三方图片、商标、人物肖像与媒体保留各自权利；详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。仓库公开不代表所有素材获得统一的开源许可。
