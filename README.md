# prototype-smart-dialogue-demo

基于《0022 智能对话接待记录能力 V1》的轻量前端交互 Demo，用于业务评审和流程验证。

## 项目用途

验证门店老师完成一次接待记录的完整闭环：

```text
选择记录方式 → 模拟语音采集 → 实时转写 → AI 分析中
→ 后台异步整理 → 待确认 → 员工确认/编辑 → 保存草稿或提交 → 记录查看
```

Demo 固定提供两条完整演示流程：

- 面客模式：客户在场，模拟实时交流和语音采集。
- 事后补录：员工接待结束后，模拟语音复盘和记录生成。

录音与文字稿继续使用本地 Mock；AI 整理通过同源 `/api/ai-summary` 服务端函数调用 TokenHub，不接入真实 ASR、数据库或登录系统。

## 页面规划

| 路径 | 页面 |
| --- | --- |
| `#/records` | 接待记录列表 |
| `#/mobile/records` | 移动端 H5 演示入口（兼容别名） |
| `#/records/new` | 选择面客模式或事后补录 |
| `#/records/:id/recording` | 录音采集与悬浮窗 |
| `#/records/:id/organizing` | AI 整理模拟：分析中、生成结构化结果 |
| `#/records/:id/confirm` | AI 整理确认与客户信息 |
| `#/records/:id/edit/:moduleKey` | 单模块编辑 |
| `#/records/:id/detail` | 接待记录详情 |
| `#/admin/records` | 后台已提交记录列表 |
| `#/admin/records/:id/detail` | 后台接待详情 |
| `#/admin/dialogue-records` | 潜客管理 / 智能对话记录 |
| `#/admin/dialogue-records/:id` | 智能对话记录只读详情 |
| `#/admin/member-center/members/:id` | 会员中心 / 会员详情 / 智能对话记录 |

模块编辑采用独立编辑页，只保存当前模块；取消不会应用未保存内容。

## V1 边界

本 Demo 支持通过完整手机号查询 Mock 已有会员并关联当前记录；不包含新建会员、修改会员档案、多会员选择、客户合并、客户画像、CRM 编辑、跟进任务、自动提醒、销售分析、成交预测或自动生成销售结果。

AI 内容只允许来自模拟转写文本；未提及内容显示“未提及”，不凭空补造。客户姓名和手机号是独立的选填客户信息；手机号支持 empty、invalid、querying、matched、not-found、ambiguous/error 状态，只有唯一匹配已有会员时才显示“已关联”。

Demo 顶层提供“移动端 H5 / SCRM 后台”切换。后台使用独立 PC Shell，包含 SCRM、潜客管理、智能对话记录菜单、筛选区、数据表格和 PC 详情；该切换仅用于演示导航，不代表正式产品菜单。

## 本地运行

```bash
pnpm install
pnpm dev
```

部署或使用 Vercel Function 时，在环境变量中配置 `.env.example` 所列的 TokenHub 参数；不要把真实 API Key 放入 `VITE_*` 变量或前端代码。

生产构建：

```bash
pnpm build
pnpm preview
```

## 当前状态

Phase 4 已完成“潜客管理 / 智能对话记录”PC 后台查看入口、已提交记录筛选表格、原始文字稿和 AI 整理成稿只读详情。本轮补充手机号查询已有会员、关联状态展示，以及“会员中心 / 会员详情 / 智能对话记录”只读历史记录。当前 Demo 还支持结束录音后异步整理：员工可返回列表，记录从“整理中”变为“待确认”，不会自动跳转确认页。`ReceptionRecord` 共用客户关联状态、会员标识、转录状态和 AI 整理状态字段，后台不根据手机号推断关联状态；异常记录不伪造文字稿或最终成稿。后台不提供编辑、删除、会员关联操作、CRM 查询、跟进任务或销售分析。
