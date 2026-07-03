// 宝通国际 - 订单查询 API
// ==========================================
// 数据由后台管理员手动更新
// ==========================================

// 种子数据（演示用，正式使用时会通过管理后台添加）
const SEED_DATA = {
  "BT20240701001": {
    no: "BT20240701001", type: "海运整柜 (FCL)",
    route: "深圳港 → 洛杉矶港", status: "in-transit",
    statusText: "运输中", eta: "2026-08-01",
    vessel: "MSC 地中海航运", container: "CCLU1234567",
    client: "深圳华贸进出口有限公司",
    steps: [
      { title: "已订舱", time: "2026-07-01 10:30", desc: "订舱确认，预计7月5日开船", done: true },
      { title: "已装船", time: "2026-07-05 14:00", desc: "深圳港盐田码头", done: true },
      { title: "开航", time: "2026-07-06 08:00", desc: "船舶已驶离深圳港", done: true }
    ]
  },
  "BT20240615002": {
    no: "BT20240615002", type: "国际空运",
    route: "广州白云机场 → 纽约肯尼迪机场", status: "delivered",
    statusText: "已签收", eta: "2026-06-20",
    vessel: "南方航空", container: "N/A",
    client: "广州鑫达电子科技有限公司",
    steps: [
      { title: "已订舱", time: "2026-06-15 09:00", desc: "空运仓位已确认", done: true },
      { title: "已交货", time: "2026-06-16 10:30", desc: "货物已交付广州白云机场", done: true }
    ]
  },
  "BT20240315003": {
    no: "BT20240315003", type: "海运拼箱 (LCL)",
    route: "宁波港 → 汉堡港", status: "in-transit",
    statusText: "清关中", eta: "2026-08-15",
    vessel: "马士基航运", container: "MSKU9876543",
    client: "浙江博远国际贸易有限公司",
    steps: [
      { title: "已订舱", time: "2026-07-10 11:00", desc: "拼箱仓位确认", done: true },
      { title: "已装船", time: "2026-07-12 16:00", desc: "宁波港装船完成", done: true },
      { title: "开航", time: "2026-07-13 06:00", desc: "船舶驶离宁波港", done: true }
    ]
  },
  "BT20240520004": {
    no: "BT20240520004", type: "国际快递",
    route: "深圳 → 新加坡", status: "delivered",
    statusText: "已签收", eta: "2026-07-25",
    vessel: "DHL Express", container: "N/A",
    client: "深圳前海科技有限公司",
    steps: [
      { title: "已揽收", time: "2026-07-20 14:00", desc: "DHL已揽收", done: true },
      { title: "出口报关", time: "2026-07-21 09:00", desc: "深圳海关放行", done: true },
      { title: "到达新加坡", time: "2026-07-22 15:00", desc: "货物到达新加坡", done: true }
    ]
  }
};

// 内存存储
let memoryStore = null;

async function getStore() {
  if (process.env.KV_URL && process.env.KV_TOKEN) {
    try {
      const { createClient } = await import("@vercel/kv");
      const kv = createClient({ url: process.env.KV_URL, token: process.env.KV_TOKEN });
      if (!(await kv.exists("orders"))) {
        for (const [k, v] of Object.entries(SEED_DATA)) await kv.hset("orders", { [k]: v });
      }
      return { type: "kv", client: kv };
    } catch (e) { console.error("KV init:", e.message); }
  }
  if (!memoryStore) memoryStore = new Map(Object.entries(SEED_DATA));
  return { type: "memory", client: memoryStore };
}

// ===== 主处理函数 =====
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const store = await getStore();

  try {
    // ===== GET =====
    if (req.method === "GET") {
      const no = (req.query.no || "").toString().trim().toUpperCase();

      if (!no) {
        // 管理后台：列出所有订单
        const key = req.query.key || "";
        if (!key || key !== process.env.ADMIN_KEY) return res.status(401).json({ error: "未授权" });
        const orders = [];
        if (store.type === "kv") {
          const all = await store.client.hgetall("orders");
          if (all) Object.values(all).forEach(o => orders.push(o));
        } else {
          store.client.forEach(o => orders.push(o));
        }
        return res.json({ count: orders.length, orders });
      }

      let order = store.type === "kv"
        ? await store.client.hget("orders", no)
        : store.client.get(no);

      if (!order) return res.status(404).json({ found: false, message: "未找到该订单" });

      // 直接返回本地数据（无外部API调用）
      return res.json({ found: true, ...order });
    }

    // ===== POST =====
    if (req.method === "POST") {
      const key = req.query.key || "";
      if (!key || key !== process.env.ADMIN_KEY) return res.status(401).json({ error: "未授权" });

      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      if (!body || !body.no) return res.status(400).json({ error: "订单号必填" });

      const orderNo = body.no.toUpperCase();
      const order = {
        no: orderNo, type: body.type || "", route: body.route || "",
        status: body.status || "pending", statusText: body.statusText || "待处理",
        eta: body.eta || "", vessel: body.vessel || "",
        container: body.container || "", client: body.client || "",
        steps: body.steps || [],
        updatedAt: new Date().toISOString()
      };

      if (store.type === "kv") await store.client.hset("orders", { [orderNo]: order });
      else store.client.set(orderNo, order);

      return res.json({ success: true, order });
    }

    // ===== DELETE =====
    if (req.method === "DELETE") {
      const key = req.query.key || "";
      if (!key || key !== process.env.ADMIN_KEY) return res.status(401).json({ error: "未授权" });
      const no = (req.query.no || "").toString().trim().toUpperCase();
      if (!no) return res.status(400).json({ error: "请提供订单号" });
      if (store.type === "kv") await store.client.hdel("orders", no);
      else store.client.delete(no);
      return res.json({ success: true, message: "已删除" });
    }

  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: "服务器错误" });
  }
  return res.status(405).json({ error: "不支持的请求方法" });
}
