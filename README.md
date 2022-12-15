# Peg

Peg `pʰɛɡ` 是基于 DogeCloud API 为 DogeCloud OSS 进行管理的指令行工具。其想法是帮助 DogeCloud OSS 的用户更方便地对存储桶和文件进行管理。命令行中大部分的指令都与其底层组件也就是 Tencent COS 保持了高度一致（部分文档与指令格式是直接抄过来的）。在实现方面由于 API 的限制与 COSCLI 的处理办法不同。Peg 的所有操作都建立在 DogeCloud OSS API 上，上传的部分则直接使用了 COS SDK。

## 快速上手

安装 deno 后将整个项目 clone 后解压到可存档的位置（后续程序将在此处不可删除），然后在该目录下执行如下指令安装。

```bash
deno install -A peg.ts
```

而后使用 `peg config init` 进行配置文件初始化。

## 本地化

项目采用了 i18next 做本地化，暂时支持 en-BG, zh-CN, zh-TW, zh-HK 几种语言。可以在 /cli/locales 中新增语言文件。

## 其他

请参照项目的 WIKI。
