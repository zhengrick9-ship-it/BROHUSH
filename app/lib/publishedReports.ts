export type PublishedReport = {
  slug: string;
  title: string;
  summary: string;
};

export const publishedReports = {
  valueLogic: {
    slug: "20260830-value-logic-full-research-v3",
    title: "价值逻辑分析报告：36项逻辑与三周期作战计划",
    summary: "对36项价值逻辑进行全量复核，并按长线价值、中线轮动、短线爆发给出下周研究与行动边界。",
  },
  opticalPanorama: {
    slug: "20260828-optical-interconnect-panorama",
    title: "光互连技术路线全景研究",
    summary: "从SK海力士论文触发的技术路线重估出发，拆解可插拔光模块、CPO、薄膜铌酸锂、光I/O与全光交换的演进、产业链和跟踪指标。",
  },
  panorama: {
    slug: "ai-panorama-six-lines-20260823",
    title: "AI科技板块产业链总图（六线总纲）",
    summary: "从算力线、存储线、互联线、供电线、应用线、承载线梳理AI科技板块的产业链入口。",
  },
  interconnect: {
    slug: "ai-interconnect-investment-20260823",
    title: "AI互联线投资研究报告",
    summary: "沿材料、光芯片、光器件、光模块、交换机与集群网络拆解互联线的价值与投资线索。",
  },
  thermal: {
    slug: "optical-module-thermal-investment-20260823",
    title: "光模块散热赛道投资研究报告",
    summary: "研究光模块功耗上升、液冷与热管理材料的产业变化、代表公司和风险。",
  },
} satisfies Record<string, PublishedReport>;

const { opticalPanorama, panorama, interconnect, thermal } = publishedReports;

export const reportsForLine: Record<string, PublishedReport[]> = {
  "互联线": [panorama, opticalPanorama, interconnect],
  "供电线": [panorama, thermal],
};

export const reportsForModule: Record<string, PublishedReport[]> = {
  "optical-interconnect": [panorama, opticalPanorama, interconnect],
  "switching-and-high-speed-connection": [panorama, interconnect],
  "power-and-ups": [panorama, thermal],
  "cooling-and-thermal-management": [panorama, thermal],
  "pcb-ccl-mlcc-and-glass-substrate": [panorama, thermal],
};

export const reportsForTopic: Record<string, PublishedReport[]> = {
  "800g-and-1-6t-optics": [interconnect],
  "optical-materials-and-devices": [opticalPanorama, interconnect],
  "thin-film-lithium-niobate": [opticalPanorama, interconnect],
  "silicon-photonics-and-cpo": [opticalPanorama, interconnect],
  "ai-networking": [opticalPanorama, interconnect],
  "ethernet-and-infiniband": [interconnect],
  "high-speed-copper-and-connectors": [interconnect],
  "data-center-thermal-management": [thermal],
  "direct-liquid-cooling": [thermal],
  "immersion-cooling": [thermal],
  "pcb-and-thermal-materials": [thermal],
};
