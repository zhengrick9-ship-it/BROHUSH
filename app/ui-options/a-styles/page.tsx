const skins = [
  {
    id: "01",
    name: "Notion 圆润纸面型",
    fit: "推荐：安静、清晰、圆润，适合长期维护研究库",
    className: "skin-notion",
    note: "强调文字、层级和标签，不用大面积装饰；板块、专题、个股更像一套可持续维护的知识库。",
  },
  {
    id: "02",
    name: "Apple 极简型",
    fit: "最适合首页和公开展示：留白、克制、轻量",
    className: "skin-apple",
    note: "保留侧栏结构，但用更轻的卡片、圆角和层次，整体更像苹果系统里的资料管理工具。",
  },
  {
    id: "03",
    name: "Linear 深色型",
    fit: "最适合交易库和策略库：状态、版本、动作更醒目",
    className: "skin-linear",
    note: "深色高密度界面适合版本输出、作战计划和条件触发；研究文章的长文阅读不如前两种。",
  },
  {
    id: "04",
    name: "研究刊物型",
    fit: "最适合对外文章：像专业研究栏目，不用衬线大标题",
    className: "skin-journal",
    note: "以文章列表和专题摘要为中心，保留侧栏导航；适合把研究成果做成连续发布的栏目。",
  },
];

function Sidebar() {
  return <aside className="style-mock-sidebar">
    <b>YOLO</b>
    <span>首页</span>
    <strong>研究库</strong>
    <span className="style-indent active">板块</span>
    <span className="style-indent">专题</span>
    <span className="style-indent">个股</span>
    <strong>交易库</strong>
    <span className="style-indent">作战计划</span>
    <span className="style-indent">复盘</span>
    <strong>策略库</strong>
    <span className="style-indent">策略输出</span>
  </aside>;
}

function MockContent() {
  return <div className="style-mock-content">
    <div className="style-mock-top"><small>研究库 / 板块 / AI科技</small><span>2026.08.23</span></div>
    <h3>AI科技</h3>
    <p className="style-mock-dek">从算力、存储、互联、供电到应用的研究入口。</p>
    <div className="style-mock-rule"></div>
    <div className="style-mock-section-title"><b>研究结构</b><small>3 个入口</small></div>
    <div className="style-mock-items"><div><b>算力线</b><span>芯片 · 先进封装 · 服务器</span></div><div><b>互联线</b><span>光芯片 · 光模块 · 交换机</span></div><div><b>供电线</b><span>电源 · 液冷 · 数据中心</span></div></div>
  </div>;
}

export default function AStylesPage() {
  return <main className="ui-style-page">
    <header className="ui-style-header">
      <div>
        <p className="section-label">YOLO / A LAYOUT / STYLE PREVIEW</p>
        <h1>A 侧栏结构，换一套视觉语言</h1>
        <p>下面四个预览使用同一套导航和信息结构，只比较字体、颜色、卡片和页面气质。正式网站仍未修改。</p>
      </div>
      <a href="/ui-options" className="ui-style-back">返回方案总览</a>
    </header>
    <div className="ui-style-grid">
      {skins.map((skin) => <section className="ui-style-card" key={skin.id}>
        <div className="ui-style-meta"><span>{skin.id}</span><div><h2>{skin.name}</h2><p>{skin.fit}</p></div></div>
        <div className={`style-mockup ${skin.className}`}><Sidebar /><MockContent /></div>
        <p className="ui-style-note">{skin.note}</p>
      </section>)}
    </div>
  </main>;
}
