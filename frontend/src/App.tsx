import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Canvas } from "@react-three/fiber";
import { Float, MeshDistortMaterial, OrbitControls, Sphere } from "@react-three/drei";
import "./App.css";

type Page = "Overview" | "Transactions" | "Budgets" | "Analytics" | "My cards";
type Tx = { id: string; title: string; category: string; date: string; amount: number; type: "income" | "expense"; account: string };

const nav: { name: Page; icon: string }[] = [
  { name:"Overview", icon:"⌂" }, { name:"Transactions", icon:"⇄" }, { name:"Budgets", icon:"▤" }, { name:"Analytics", icon:"▥" }, { name:"My cards", icon:"▱" },
];
const money = (n:number) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);
const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api/transactions";
function Orb() {
  return <Canvas camera={{position:[0,0,4],fov:42}} dpr={[1,1.5]}>
    <ambientLight intensity={1.5}/><directionalLight position={[3,4,5]} intensity={2} color="#e5ffeb"/><pointLight position={[-3,-2,2]} intensity={2} color="#65c997"/>
    <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.4}><Sphere args={[1,64,64]}><MeshDistortMaterial color="#76c89a" roughness={0.17} metalness={0.24} distort={0.27} speed={1.5}/></Sphere></Float>
    <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.55}/>
  </Canvas>;
}
function Spark({n=0}:{n?:number}) {
  const pts = ["0,24 8,19 16,22 24,11 32,15 40,7 48,12 56,4 64,8 72,1","0,25 8,20 16,22 24,14 32,17 40,9 48,13 56,6 64,9 72,2","0,25 8,23 16,16 24,19 32,11 40,15 48,7 56,10 64,4 72,1"];
  return <svg className="spark" viewBox="0 0 74 28" aria-hidden="true"><polyline points={pts[n%3]} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function CashChart() {
  const income=[34,46,40,62,49,72], expense=[22,28,25,37,30,42], months=["May","Jun","Jul","Aug","Sep","Oct"];
  return <div className="chart"><div className="chart-legend"><span><i className="dot inc"/>Income</span><span><i className="dot exp"/>Expenses</span></div><div className="bars">{months.map((m,i)=><div className="bar-group" key={m}><div className="bar-pair"><i className="bar inc-bar" style={{height:`${income[i]}%`}}/><i className="bar exp-bar" style={{height:`${expense[i]}%`}}/></div><small>{m}</small></div>)}</div></div>;
}
function Spending({tx}:{tx:Tx[]}) {
  const data=useMemo(()=>{const map=new Map<string,number>();tx.filter(t=>t.type==="expense").forEach(t=>map.set(t.category,(map.get(t.category)||0)+t.amount));return [...map].sort((a,b)=>b[1]-a[1]).slice(0,4)},[tx]);
  const colors=["#39795c","#d9a36f","#8e88c9","#78a7bb"], total=data.reduce((s,x)=>s+x[1],0)||1;
  let used=0; const stops=data.map(([,v],i)=>{const start=used;used+=v/total*100;return `${colors[i]} ${start}% ${used}%`}).join(",");
  return <><div className="donut-layout"><div className="donut" style={{background:`conic-gradient(${stops||"#dce8dc 0% 100%"})`}}><div className="donut-hole"><small>Total spending</small><strong>{money(total)}</strong></div></div><div className="donut-legend">{data.map(([name,v],i)=><div className="legend-row" key={name}><span><i style={{background:colors[i]}}/>{name}</span><b>{money(v)}</b></div>)}</div></div></>;
}
function Stat({label,value,change,icon,tone,n}:{label:string;value:string;change:string;icon:string;tone:string;n:number}) {
  return <article className="stat-card"><div className="stat-top"><span>{label}</span><span className={`stat-icon ${tone}`}>{icon}</span></div><strong className="stat-value">{value}</strong><div className="stat-bottom"><b>↗ {change}</b><span>vs last month</span></div><Spark n={n}/></article>;
}
function TxTable({items,onEdit,onDelete,compact=false}:{items:Tx[];onEdit:(t:Tx)=>void;onDelete:(id:string)=>void;compact?:boolean}) {
  return <div className="table-wrap"><table><thead><tr><th>Transaction</th><th>Category</th><th>Date</th><th>Account</th><th className="amount">Amount</th><th/></tr></thead><tbody>{items.map(t=><tr key={t.id}><td><div className="tx-name"><span className={`tx-icon ${t.type}`}>{t.type==="income"?"↙":"↗"}</span><span><b>{t.title}</b><small>{t.type==="income"?"Money in":"Money out"}</small></span></div></td><td><span className="category">{t.category}</span></td><td>{new Date(`${t.date}T12:00:00`).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</td><td>{t.account}</td><td className={`amount ${t.type==="income"?"positive":""}`}>{t.type==="income"?"+":"−"}{money(t.amount)}</td><td><div className="row-actions"><button title="Edit" onClick={()=>onEdit(t)}>✎</button>{!compact&&<button title="Delete" onClick={()=>onDelete(t.id)}>×</button>}</div></td></tr>)}</tbody></table></div>;
}

export default function App() {
  const [page,setPage]=useState<Page>("Overview");
  const [tx, setTx] = useState<Tx[]>([]);
  const [monthlyBudget,setMonthlyBudget]=useState(()=>Number(localStorage.getItem("luma-wallet-monthly-budget-v1")||21000));
  const [query,setQuery]=useState(""); const [filter,setFilter]=useState<"all"|"income"|"expense">("all");
  const [modal,setModal]=useState(false); const [editing,setEditing]=useState<string|null>(null);
  const [form,setForm]=useState({title:"",category:"Groceries",date:"2026-10-27",amount:"",type:"expense" as "income"|"expense"});
  useEffect(() => {
  async function loadTransactions() {
    try {
      const response = await fetch(API_URL);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not load transactions.");
      }

      setTx(
        result.data.map((item: Omit<Tx, "account">) => ({
          ...item,
          account: "Personal account",
        })),
      );
    } catch (error) {
      console.error("Load transactions error:", error);
      alert("Could not load transactions. Check whether the backend is running.");
    }
  }

  void loadTransactions();
}, []);
  useEffect(()=>{localStorage.setItem("luma-wallet-monthly-budget-v1",String(monthlyBudget))},[monthlyBudget]);
  const income=tx.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const expenses=tx.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const savings=income-expenses; const rate=income?savings/income*100:0;
  const balance=124580+savings-(61300-24870);
  const visible=tx.filter(t=>`${t.title} ${t.category} ${t.date}`.toLowerCase().includes(query.toLowerCase())&&(filter==="all"||t.type===filter)).sort((a,b)=>b.date.localeCompare(a.date));
  function add(){setEditing(null);setForm({title:"",category:"Groceries",date:"2026-10-27",amount:"",type:"expense"});setModal(true)}
  function edit(t:Tx){setEditing(t.id);setForm({title:t.title,category:t.category,date:t.date,amount:String(t.amount),type:t.type});setModal(true)}
  async function save(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();

  const amount = Number(form.amount);

  if (!form.title.trim() || !Number.isFinite(amount) || amount <= 0) {
    return;
  }

  const payload = {
    title: form.title.trim(),
    category: form.category,
    date: form.date,
    amount,
    type: form.type,
  };

  try {
    const response = await fetch(
      editing ? `${API_URL}/${editing}` : API_URL,
      {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Could not save transaction.");
    }

    const savedTransaction: Tx = {
      ...result.data,
      account: "Personal account",
    };

    setTx((old) =>
      editing
        ? old.map((t) =>
            t.id === editing ? savedTransaction : t,
          )
        : [savedTransaction, ...old],
    );

    setModal(false);
  } catch (error) {
    console.error("Save transaction error:", error);
    alert(
      error instanceof Error
        ? error.message
        : "Could not save transaction.",
    );
  }
}
  async function remove(id: string) {
  if (!window.confirm("Delete this transaction?")) return;

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Could not delete transaction");
    }

    setTx((old) => old.filter((item) => item.id !== id));
  } catch (error) {
    console.error("Delete transaction error:", error);
    alert(error instanceof Error ? error.message : "Could not delete transaction.");
  }
}
  function exportCsv(){const rows=[["Title","Category","Date","Type","Amount","Account"],...visible.map(t=>[t.title,t.category,t.date,t.type,String(t.amount),t.account])];const csv=rows.map(r=>r.map(v=>`"${v.replace(/"/g,'""')}"`).join(",")).join("\n");const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8;"}));const a=document.createElement("a");a.href=url;a.download="luma-wallet-transactions.csv";a.click();URL.revokeObjectURL(url)}
  const description:Record<Page,string>={Overview:"Here's the story your money is telling this month.",Transactions:"Every little detail, all in one place.",Budgets:"Give every rupee a thoughtful purpose.",Analytics:"Understand your habits and find your next step.","My cards":"Your everyday spending, thoughtfully organised."};
  return <div className="app-shell">
    <aside className="sidebar"><a className="brand" href="#" onClick={e=>{e.preventDefault();setPage("Overview")}}><span className="brand-mark">l.</span><span className="brand-name">luma<span>.</span></span></a>
      <div className="side-label">WORKSPACE</div><button className="workspace" onClick={()=>setPage("Overview")}><span className="avatar">A</span><span><b>Personal space</b><small>My finances</small></span><i>⌄</i></button>
      <div className="side-label menu-label">MENU</div><nav>{nav.map(n=><button key={n.name} className={`nav-item ${page===n.name?"active":""}`} onClick={()=>setPage(n.name)}><span className="nav-symbol">{n.icon}</span><span>{n.name}</span>{n.name==="Transactions"&&<small className="count">{String(tx.length).padStart(2,"0")}</small>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-tip"><span>✦</span><p><b>Small steps add up.</b><br/>You're building better money habits.</p></div><div className="profile"><span className="avatar">A</span><span><b>Aayushi</b><small>Personal account</small></span><i>•••</i></div></div>
    </aside>
    <main className="main"><header className="topbar"><div className="crumb"><span>Workspace</span><b>/</b><strong>{page}</strong></div><div className="top-actions"><span className="month">◷ &nbsp; October 2026</span><button className="bell" aria-label="Notifications">♧</button><button className="primary" onClick={add}>＋ &nbsp; Add transaction</button></div></header>
      <div className="content"><div className="page-heading"><div><div className="eyebrow">MONDAY, OCTOBER 26</div><h1>{page==="Overview"?"Good things are adding up.":page}</h1><p>{description[page]}</p></div><button className="secondary" onClick={page==="Transactions"?exportCsv:()=>setPage("Transactions")}>↗ {page==="Transactions"?"Export CSV":"View transactions"}</button></div>
      {page==="Overview"&&<><section className="overview-grid"><article className="balance-card"><div className="orb"><Orb/></div><div className="balance-top"><span className="card-eyebrow">TOTAL BALANCE</span><span className="accounts"><i/>All accounts</span></div><div className="balance-number">{money(balance)}<span>.00</span></div><div className="balance-change"><b>↗ 8.4%</b> compared to last month</div><div className="balance-line"/><div className="account-line"><span>▣</span>Personal account<button>•••</button></div><div className="balance-footer"><i/> YOUR MONEY, IN MOTION</div></article>
      <div className="stats-grid"><Stat label="Total income" value={money(income)} change="12.8%" icon="↙" tone="green" n={0}/><Stat label="Total expenses" value={money(expenses)} change="3.2%" icon="↗" tone="peach" n={1}/><Stat label="Savings" value={money(savings)} change="18.6%" icon="✳" tone="lilac" n={2}/><Stat label="Savings rate" value={`${rate.toFixed(1)}%`} change="5.4%" icon="%" tone="gold" n={0}/></div></section>
      <section className="content-grid"><article className="panel"><div className="panel-heading"><div><h2>Cash flow</h2><p>Your income and spending over time</p></div><span className="period">Last 6 months⌄</span></div><div className="chart-totals"><span><i className="dot inc"/>Income<strong>{money(income)}</strong></span><span><i className="dot exp"/>Expenses<strong>{money(expenses)}</strong></span></div><CashChart/></article><article className="panel"><div className="panel-heading"><div><h2>Where it goes</h2><p>Your spending breakdown</p></div><span className="round-action">↗</span></div><Spending tx={tx}/><button className="text-link" onClick={()=>setPage("Analytics")}>Explore analytics →</button></article></section>
      <section className="panel recent"><div className="panel-heading"><div><h2>Recent activity</h2><p>The latest moves in your money</p></div><button className="text-link" onClick={()=>setPage("Transactions")}>See all →</button></div><TxTable items={visible.slice(0,4)} onEdit={edit} onDelete={remove} compact/></section></>}
      {page==="Transactions"&&<section className="panel"><div className="toolbar"><label className="search">⌕ <input placeholder="Search transactions..." value={query} onChange={e=>setQuery(e.target.value)}/></label><div className="filters">{(["all","income","expense"] as const).map(f=><button className={filter===f?"selected":""} key={f} onClick={()=>setFilter(f)}>{f==="all"?"All":f==="income"?"Income":"Expenses"}</button>)}</div><button className="secondary" onClick={exportCsv}>↓ Export CSV</button></div><TxTable items={visible} onEdit={edit} onDelete={remove}/>{!visible.length&&<div className="empty"><h3>No transactions found</h3><p>Try another search or add a transaction.</p><button className="primary" onClick={add}>＋ Add transaction</button></div>}</section>}
      {page==="Budgets"&&<><section className="panel budget-summary"><div><div className="eyebrow">MONTHLY BUDGET</div><h2>{money(monthlyBudget)}</h2><p>Set a comfortable spending limit for the month.</p></div><label>Monthly limit<input type="number" min="0" value={monthlyBudget} onChange={e=>setMonthlyBudget(Math.max(0,Number(e.target.value)))}/></label></section><section className="budget-grid">{[{name:"Groceries",limit:8000,color:"#4d896b",icon:"◈"},{name:"Shopping",limit:6000,color:"#d59b62",icon:"◇"},{name:"Bills",limit:4000,color:"#8b83c9",icon:"▤"},{name:"Dining",limit:3000,color:"#6a9fbd",icon:"♧"}].map(b=>{const spent=tx.filter(t=>t.type==="expense"&&t.category===b.name).reduce((s,t)=>s+t.amount,0);const pct=Math.min(100,spent/b.limit*100);return <article className="panel budget-card" key={b.name}><div className="budget-card-top"><span className="budget-icon" style={{color:b.color,background:`${b.color}18`}}>{b.icon}</span><span className={`status ${pct>=90?"warning":""}`}>{pct>=90?"Almost there":"On track"}</span></div><h3>{b.name}</h3><div className="budget-numbers"><b>{money(spent)}</b><span>of {money(b.limit)}</span></div><div className="progress"><span style={{width:`${pct}%`,background:b.color}}/></div><div className="budget-foot"><span>{Math.round(pct)}% used</span><span>{money(Math.max(0,b.limit-spent))} left</span></div></article>})}</section></>}
      {page==="Analytics"&&<section className="analytics-grid"><article className="panel"><div className="panel-heading"><div><h2>Income vs expenses</h2><p>A six-month snapshot of your money flow</p></div><span className="period">Last 6 months⌄</span></div><CashChart/></article><article className="panel"><div className="panel-heading"><div><h2>Spending categories</h2><p>Where your money goes</p></div></div><Spending tx={tx}/></article><article className="panel insight"><span>✦</span><div><h3>Your savings snapshot</h3><p>You have kept <b>{rate.toFixed(1)}%</b> of your recorded income after expenses. Keep tracking consistently to understand your monthly pattern.</p></div></article></section>}
      {page==="My cards"&&<section className="cards-grid"><article className="virtual-card"><div className="virtual-top"><span className="brand-mark">l.</span><span>PERSONAL ACCOUNT</span></div><div className="chip"><i/><i/><i/><i/></div><div className="card-number">•••• &nbsp; •••• &nbsp; •••• &nbsp; 2048</div><div className="virtual-bottom"><span><small>ACCOUNT HOLDER</small><b>AAYUSHI</b></span><span className="network"><i/><i/></span></div></article><article className="panel account-details"><span className="detail-icon">▣</span><h2>Personal account</h2><p>Your main account overview</p><div className="detail-row"><span>Available balance</span><b>{money(balance)}</b></div><div className="detail-row"><span>Recorded income</span><b>{money(income)}</b></div><div className="detail-row"><span>Recorded expenses</span><b>{money(expenses)}</b></div><small className="demo-note">Demo account · No bank is connected</small></article></section>}
      </div>
    </main>
    {modal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(false)}}><form className="modal" onSubmit={save}><div className="modal-head"><div><div className="eyebrow">YOUR MONEY, YOUR WAY</div><h2>{editing?"Edit transaction":"Add transaction"}</h2><p>Keep your money story up to date.</p></div><button type="button" className="close" onClick={()=>setModal(false)}>×</button></div><div className="type-toggle"><button type="button" className={form.type==="expense"?"chosen expense-choice":""} onClick={()=>setForm({...form,type:"expense"})}>− Expense</button><button type="button" className={form.type==="income"?"chosen income-choice":""} onClick={()=>setForm({...form,type:"income"})}>＋ Income</button></div><label className="field">Transaction name<input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Grocery shopping"/></label><div className="form-row"><label className="field">Amount (₹)<input required type="number" min="1" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="0.00"/></label><label className="field">Date<input required type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label></div><label className="field">Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{["Groceries","Shopping","Bills","Dining","Transport","Health","Salary","Freelance","Other"].map(c=><option key={c}>{c}</option>)}</select></label><div className="modal-actions"><button type="button" className="secondary" onClick={()=>setModal(false)}>Cancel</button><button type="submit" className="primary">{editing?"Save changes":"Save transaction"}</button></div></form></div>}
  </div>;
}
