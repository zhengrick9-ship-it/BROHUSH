# YOLO研究目录 v0.2

这是 YOLO 研究库的目录层，不是投资研究报告，也不构成买卖建议。

## 当前交付

- 申万当前行业树：一级 31 个、二级 131 个、三级 337 个。
- 同花顺参考目录：1,694 行参考快照，单独标记为非主干数据。
- YOLO板块目录：沿用已建立的跨行业研究板块。
- 网站研究导航：`板块 -> 专题 -> 个股`；“模块”不作为独立导航层。
- AI科技专题预留六条线：算力线、存储线、互联线、供电线、承载线、应用线。
- 个股目录已建立，但目前不把任何公司伪装成已完成研究。

## 文件说明

- `index.json`：目录统一入口。
- `taxonomy/shenwan_hierarchy.json`：申万一级—三级当前树及数据来源。
- `taxonomy/shenwan_nodes.csv`：申万节点平表，便于检索和导入。
- `taxonomy/ths_index_catalog_reference.csv`：同花顺参考快照。
- `taxonomy/ths_reference_manifest.json`：同花顺快照来源、哈希、时点和限制。
- `crosswalks/yolo_theme_catalog.json`：YOLO板块目录。
- `crosswalks/yolo_theme_shenwan_ths_crosswalk.json`：YOLO板块与申万/同花顺的映射框架。
- `navigation.json`：网站导航及板块—专题—个股关系。
- `companies/index.json`：个股研究目录入口。
- `versions/`：历史目录版本备份。

## 数据边界

- 申万主干来自 QDataHub accepted release，并记录 `release_id`、数据集、质量等级和读取方法。
- 同花顺仅用于参考行业、概念和热点标签；概念不等于真实业务。
- 当前成员树按 `is_new=Y` 形成当前目录；历史区间不混入当前树。
- 未确认的映射统一标记为 `pending_verification`，不强行归类。

## 内容状态

- `placeholder`：只有目录位置，尚无完成文章。
- `in_progress`：已有研究草稿，尚未完成验收。
- `published`：完成研究并通过发布验收。
- `pending_verification`：来源、映射或业务证据仍需核验。
- `archived`：移入垃圾箱，不在正常导航展示，但保留备份。

后续研究文章必须挂载到本目录的父级路径，并保留版本、来源、更新时间和证据状态。
