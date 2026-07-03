// 宝通国际 - 订单查询 API
// ==========================================
// 集成 17Track 实时物流跟踪
// 配置环境变量 TRACK17_API_KEY 后自动启用
// ==========================================

// 17Track 状态码 → 中文描述映射
const STATUS_MAP = {
  "10": { text: "已揽收", status: "booking" },
  "20": { text: "运输中", status: "in-transit" },
  "21": { text: "到达中转", status: "in-transit" },
  "22": { text: "离开中转", status: "in-transit" },
  "30": { text: "清关中", status: "customs" },
  "31": { text: "清关完成", status: "customs" },
  "40": { text: "已签收", status: "delivered" },
  "41": { text: "派送中", status: "in-transit" },
  "50": { text: "异常", status: "exception" }
};

// 种子数据
const SEED_DATA = {
  "BT20240701001": {
    no: "BT20240701001", type: "海运整柜 (FCL)",
    route: "深圳港 → 洛杉矶港", status: "in-transit",
    statusText: "17Track 实时更新", eta: "",
    vessel: "", container: "CCLU1234567",
    client: "深圳华贸进出口有限公司",
    trackingNumber: "CMAU1234567",
    carrier: "",
    steps: [
      { title: "已订舱", time: "2026-07-01 10:30", desc: "订舱确认", done: true },
      { title: "17Track 实时追踪", time: "启用后将自动拉取数据", desc: "配置 TRACK17_API_KEY 后自动显示实时物流", done: true, current: true }
    ]
  },
  "BT20240615002": {
    no: "BT20240615002", type: "国际空运",
    route: "广州白云机场 → 纽约肯尼迪机场", status: "delivered",
    statusText: "17Track 实时更新", eta: "",
    vessel: "", container: "N/A",
    client: "广州鑫达电子科技有限公司",
    trackingNumber: "78412345678",
    carrier: "",
    steps: [
      { title: "已订舱", time: "2026-06-15 09:00", desc: "空运仓位已确认", done: true },
      { title: "17Track 实时追踪", time: "启用后将自动拉取数据", desc: "配置 TRACK17_API_KEY 后自动显示实时物流", done: true, current: true }
    ]
  }
};

// 内存 / KV 存储
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

// ===== 17Track API 查询 =====
async function query17Track(trackingNumber, carrier) {
  const apiKey = process.env.TRACK17_API_KEY;
  if (!apiKey || !trackingNumber) return null;

  try {
    const body = [{ number: trackingNumber }];
    if (carrier) body[0].carrier = carrier;

    const res = await fetch("https://api.17track.net/track/v2.2/gettrackinfo", {
      method: "POST",
      headers: { "Content-Type": "application/json", "17token": apiKey },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.code !== 0 || !data.data?.accepted?.[0]) return null;

    const track = data.data.accepted[0].track;
    if (!track) return null;

    const latest = track.latest || {};
    const milestones = track.milestones || [];
    const statusInfo = STATUS_MAP[latest.status] || { text: "运输中", status: "in-transit" };

    const carrierInfo = data.data.accepted[0].carrier || {};
    const carrierName = carrierInfo.name || carrier || "";

    const steps = milestones.map((m, i) => ({
      title: m.status_text || STATUS_MAP[m.status]?.text || "运输中",
      time: m.time || "",
      desc: [m.location, m.location_center?.name].filter(Boolean).join(" · ") || "",
      done: true,
      current: i === milestones.length - 1
    }));

    return {
      statusText: latest.status_text || statusInfo.text,
      status: statusInfo.status,
      eta: latest.estimated_delivery_date || "",
      vessel: carrierName,
      trackingSource: "17Track",
      steps: steps.length > 0 ? steps : [{ title: statusInfo.text, time: latest.time || "", desc: latest.location || "", done: true, current: true }]
    };
  } catch (e) {
    console.error("17Track error:", e.message);
    return null;
  }
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

      // 如果有 trackingNumber，拉取 17Track 实时数据
      if (order.trackingNumber) {
        const live = await query17Track(order.trackingNumber, order.carrier);
        if (live) {
          return res.json({
            found: true,
            no: order.no, client: order.client,
            type: order.type, container: order.container,
            trackingNumber: order.trackingNumber,
            trackingSource: "17Track",
            route: live.route || order.route,
            status: live.status || order.status,
            statusText: live.statusText || order.statusText,
            eta: live.eta || order.eta,
            vessel: live.vessel || order.vessel,
            steps: live.steps,
            liveUrl: "https://t.17track.net/track?nums=" + encodeURIComponent(order.trackingNumber)
          });
        }
      }

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
        trackingNumber: body.trackingNumber || "",
        carrier: body.carrier || "",
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