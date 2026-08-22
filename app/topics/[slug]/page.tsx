import Link from "next/link";
import { ResearchShell } from "@/app/components/ResearchShell";
import moduleIndex from "@/content/research/modules/index.json";

const topicNames: Record<string, string> = { "semiconductor-materials-and-equipment": "半导体材料与设备", "optical-materials-and-devices": "光学材料与器件", "pcb-and-thermal-materials": "PCB与热管理材料", "ai-chip-architecture": "AI芯片架构", "advanced-packaging": "先进封装", "hbm-and-high-bandwidth-memory": "HBM与高带宽存储", "enterprise-ssd": "企业级SSD", "distributed-ai-storage": "分布式AI存储", "800g-and-1-6t-optics": "800G与1.6T光互联", "thin-film-lithium-niobate": "薄膜铌酸锂", "silicon-photonics-and-cpo": "硅光与CPO", "ai-networking": "AI网络", "ethernet-and-infiniband": "以太网与InfiniBand", "high-speed-copper-and-connectors": "高速铜连接与连接器", "high-speed-pcb-and-ccl": "高速PCB与CCL", "mlcc-for-ai-power": "AI电源MLCC", "glass-substrate": "玻璃基板", "ai-data-center-power": "AI数据中心供电", "ups-and-power-electronics": "UPS与电力电子", "energy-storage-for-data-centers": "数据中心储能", "direct-liquid-cooling": "直接液冷", "immersion-cooling": "浸没式液冷", "data-center-thermal-management": "数据中心热管理", "private-ai-deployment": "私有化AI部署", "gpu-cloud-and-idc": "GPU云与IDC", "data-center-energy-efficiency": "数据中心能效", "ai-data-pipelines": "AI数据流水线", "model-training-and-post-training": "模型训练与后训练", "inference-serving-and-agents": "推理服务与智能体", "private-model-deployment": "私有模型部署", "rag-and-enterprise-knowledge": "RAG与企业知识库", "ai-security-and-governance": "AI安全与治理", "ai-observability": "AI观测与评测", "ai-security-and-compliance": "AI安全与合规", "private-ai-operations": "私有AI运维" };

export function generateStaticParams() { return moduleIndex.items.flatMap((item) => item.topics.map((topic) => ({ slug: topic }))); }

export default async function TopicDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const owner = moduleIndex.items.find((item) => item.topics.includes(slug));
  if (!owner) return null;
  return <ResearchShell eyebrow="03 / RESEARCH TOPIC" title={topicNames[slug] ?? slug.replaceAll("-", " ")} description="专题档案入口">
    <div className="mt-4 border border-dashed border-[var(--line-strong)] bg-[rgba(250,248,243,.5)] p-5"><p className="section-label">RESEARCH QUEUE / NOT YET COMPLETE</p><h2 className="mt-3 text-lg font-semibold">该专题已纳入AI产业链全景图，详细研究待建立。</h2><p className="mt-3 text-sm leading-7 text-[var(--secondary)]">这里将逐步补充：技术路线、真实需求、客户与供应链、竞争格局、财务兑现、催化剂、风险和对应个股。当前状态只表示研究入口存在，不表示已经形成买入结论。</p><div className="mt-5 flex flex-wrap gap-4 text-xs"><Link href={`/modules/${owner.id}`} className="font-semibold text-[var(--accent-dark)]">所属模块：{owner.name} →</Link><Link href="/stocks" className="font-semibold text-[var(--accent-dark)]">个股档案 →</Link></div></div>
  </ResearchShell>;
}
