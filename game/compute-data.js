// Values are theoretical GPU peaks; petaFLOPS throughout, never application throughput.
export const verifiedOn='2026-10-04';
export const sources={
 dgx:['DGX B300 产品规格','https://www.nvidia.com/en-us/data-center/dgx-b300/'],
 hgx:['HGX B300 八 GPU 规格表','https://www.nvidia.com/en-us/data-center/hgx/'],
 datasheet:['Blackwell Ultra 官方数据表','https://resources.nvidia.com/en-us-gpu-resources/blackwell-ultra-datasheet'],
 manual:['DGX B300 用户手册','https://docs.nvidia.com/dgx/dgxb300-user-guide/introduction-to-dgxb300.html'],
 huawei:['华为昇腾路线图 · 2025-09-18','https://www.huawei.com/cn/news/2025/9/hc-xu-keynote-speech'],
 july:['Atlas 950 实机展示 · 2026-07-17','https://www.huawei.com/cn/news/2026/7/atlas-950-superpod'],
 september:['950 超节点规模商用 · 2026-09-17','https://www.huawei.com/cn/news/2026/9/hc-wang-keynote'],
 cann:['Ascend PyTorch 适配器','https://github.com/Ascend/pytorch']
};
export const precisions=[
 {id:'bf16',name:'BF16 / FP16',dense:18,sparse:36,engine:'Tensor Core',use:'训练与混合精度计算',description:'常见训练精度。BF16 的指数范围接近 FP32，FP16 的有效数字精度不同；训练通常仍混合使用更高精度的累加与状态。'},
 {id:'fp8',name:'FP8 / FP6',dense:36,sparse:72,engine:'Tensor Core',use:'低精度训练与推理',description:'FP8 常用于经过适配的训练和推理。量化、缩放及算子支持会影响模型质量与速度；这里的 FP8 与华为 MXFP8/HiF8 不能只凭位数认定完全等价。'},
 {id:'fp4',name:'FP4',dense:108,sparse:144,engine:'Tensor Core',use:'极低精度推理',description:'适合支持 FP4 的量化推理。官方给出的稠密峰值为 108，稀疏为 144 PFLOPS；此项不能套用“稀疏除以二”的规则。'},
 {id:'tf32',name:'TF32',dense:9,sparse:18,engine:'Tensor Core',use:'部分 FP32 工作负载加速',description:'Tensor Core 使用 TF32 计算格式加速适用算子。它与普通 CUDA Core 的 FP32 峰值不是同一指标。'},
 {id:'fp32',name:'FP32',dense:0.6,sparse:null,engine:'CUDA Core',use:'单精度通用计算',description:'600 TFLOPS 是八 GPU 的普通单精度计算峰值；不要把 9 PFLOPS TF32 Tensor Core 算力写成同口径 FP32。'},
 {id:'fp64',name:'FP64',dense:0.01,sparse:null,engine:'FP64 / FP64 Tensor Core',use:'双精度科学计算',description:'官方 HGX 表将八 GPU FP64 / FP64 Tensor Core 列为约 10 TFLOPS。由整机除以八得到的单 GPU 值含官方取整误差。'}
];
export function peak(id,basis='dense',chips=8){const p=precisions.find(p=>p.id===id);if(!p||![1,8].includes(chips)||!['dense','sparse'].includes(basis))throw Error('无效算力口径');return p[basis]===null?null:p[basis]*chips/8;}
export function formatPeak(p){return p===null?'未提供':p>=1?`${Number(p.toFixed(3))} PFLOPS`:`${Number((p*1000).toFixed(3))} TFLOPS`;}
export const ascend950dt={fp8:1,mxfp4:2,hbmGB:144,bandwidthTBs:4,interconnectTBs:2,basis:null,bf16:null,serverSKU:null};
export const questions=[
 {q:'一台 DGX B300，BF16 / FP16 稠密理论峰值是多少？',answers:['18 PFLOPS','36 PFLOPS','144 PFLOPS'],correct:0,why:'8 GPU × 2.25 PFLOPS = 18 PFLOPS。36 是相同精度下的结构化稀疏峰值。'},
 {q:'FP4 稀疏为 144 PFLOPS，稠密应该是多少？',answers:['直接除以二：72 PFLOPS','查看对应表：108 PFLOPS','与 FP8 相同：36 PFLOPS'],correct:1,why:'FP4 是不能机械折半的一项。NVIDIA 在 B300 产品表中明确给出 144 / 108。'},
 {q:'把八颗昇腾 950DT 的公布峰值相加，得到什么？',answers:['一款已确认的八卡服务器性能','实际大模型 tokens/s','同数量芯片的理论资源合计'],correct:2,why:'芯片合计不能确认整机型号、CPU、内存、功耗、互连拓扑或实际吞吐；这里也没有核实华为峰值的稠密／稀疏口径。'},
 {q:'比较两台机器运行同一个大模型，最有用的下一步是什么？',answers:['同模型、精度、质量门槛、批量和上下文下实测','只比较 FP4 与 MXFP4 的峰值大小','直接相加 GPU 显存与主机内存'],correct:0,why:'同时记录吞吐、首 token 延迟、单 token 延迟、输出质量与墙上功耗。软件和通信也会限制性能。'}
];
