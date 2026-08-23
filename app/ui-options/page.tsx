const updates = [
  { type: "板块研究", title: "AI科技产业链全景：从算力到应用", date: "2026.08.23" },
  { type: "专题研究", title: "AI互联线：光芯片、光器件与集群网络", date: "2026.08.23" },
  { type: "个股研究", title: "中际旭创：互联线龙头跟踪", date: "2026.08.22" },
  { type: "作战计划", title: "本周交易计划与持仓风险检查", date: "2026.08.22" },
  { type: "策略输出", title: "低位双维策略 · 最新运行结果", date: "2026.08.21" },
];

function Sidebar() {
  return <aside className="full-preview-sidebar">
    <div className="full-preview-brand"><b>YOLO</b><span>个人研究系统</span></div>
    <a className="full-preview-home active" href="#home">首页</a>

    <div className="full-preview-group">
      <strong>研究库</strong>
      <a href="#themes">板块</a>
      <a href="#topics">专题</a>
      <a href="#stocks">个股</a>
    </div>

    <div className="full-preview-group">
      <strong>交易库</strong>
      <a href="#plans">作战计划</a>
      <a href="#reviews">复盘</a>
      <a href="/private/login?next=%2Fportfolio">持仓与交易明细</a>
    </div>

    <div className="full-preview-group">
      <strong>策略库</strong>
      <a href="#mechanisms">交易机制</a>
      <a href="#outputs">策略输出</a>
    </div>

    <div className="full-preview-sidebar-foot">本地预览 · 未连接个人数据</div>
  </aside>;
}

export default function UiOptionsPage() {
  return <main className="ui-full-preview">
    <div className="full-preview-label">YOLO / A LAYOUT / LOCAL PREVIEW</div>
    <div className="full-preview-window">
      <Sidebar />
      <section className="full-preview-content">
        <div className="full-preview-breadcrumb"><span>首页</span><span>更新于 2026.08.23</span></div>
        <header className="full-preview-heading">
          <div><h1>首页</h1><p>最近更新、研究入口和交易记录入口。</p></div>
          <span className="full-preview-status">本地预览</span>
        </header>

        <section className="full-preview-section" id="home">
          <div className="full-preview-section-head"><div><small>RECENT UPDATES</small><h2>近期更新</h2></div><span>最新 5 条</span></div>
          <div className="full-preview-update-list">
            {updates.map((item) => <a className="full-preview-update" href="#home" key={`${item.type}-${item.title}`}><span className="full-preview-update-type">{item.type}</span><b>{item.title}</b><time>{item.date}</time><em>→</em></a>)}
          </div>
        </section>

        <section className="full-preview-section" id="themes">
          <div className="full-preview-section-head"><div><small>LIBRARIES</small><h2>进入研究与交易</h2></div><span>层层递进</span></div>
          <div className="full-preview-entry-grid">
            <a href="#research" className="full-preview-entry"><small>研究库</small><h3>板块 · 专题 · 个股</h3><p>从 AI科技、生物医药等板块进入，再下探到专题和个股。</p><i>进入研究库　→</i></a>
            <a href="#trading" className="full-preview-entry"><small>交易库</small><h3>作战计划 · 复盘</h3><p>按日期查看每日和每周作战计划、交易复盘与版本记录。</p><i>进入交易库　→</i></a>
            <a href="#strategies" className="full-preview-entry"><small>策略库</small><h3>交易机制 · 策略输出</h3><p>保存规则、运行版本、筛选结果以及后续归因分析。</p><i>进入策略库　→</i></a>
          </div>
        </section>
      </section>
    </div>
  </main>;
}
