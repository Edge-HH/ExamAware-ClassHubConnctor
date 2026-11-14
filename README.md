# examaware-plugin-remoteci

ExamAware 插件。装到教室电脑后，它读取 ClassIsland 里 RemoteCI 插件写出的连接信息，向 RemoteCI 登记为本班考试端，并放映从 RemoteCI「管理 › 考试」分发下来的考试档案。

登记使用的是考试绑定票据，不会占用教室 RemoteCI 插件自己的连接。

## 和 RemoteCI 的配合

RemoteCI「管理 › 考试」默认从本仓库的最新 Release 下载 `.ea2x`，并同时从 [ExamAware/ExamAware2](https://github.com/ExamAware/ExamAware2/releases) 下载 Windows 安装包。服务端先下好这两份文件，再分发给选定的班级。

发布新版本时，把 `pnpm run pack` 生成的 `.ea2x` 附到 GitHub Release 上。文件名需要以 `.ea2x` 结尾。

教室里的 RemoteCI 插件会静默安装 ExamAware，并把插件放到当前用户的 `%APPDATA%\ExamAware\plugins`。ExamAware 启动后，本插件绑定并等待考试。上传 `.ea2` 后点「分发考试到所选班级」即可放映。

连接信息在 `%LOCALAPPDATA%\RemoteCI\connection.json`。那是 RemoteCI 插件连上服务端之后写的，里面有服务器地址和考试绑定票据。如果票据还没生成，插件也会尝试读取 ClassIsland 里 RemoteCI 的 `Settings.json`（服务器地址和尚未用掉的配对码）。

## 构建

```bash
pnpm install
pnpm test
pnpm run pack
```

`pnpm test` 只检查连接信息的读取。`pnpm run pack` 生成 `dist/examaware-plugin-remoteci-<版本>.ea2x`，把它附到 GitHub Release 后，RemoteCI 才会下载到这一版。
