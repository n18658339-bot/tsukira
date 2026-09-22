const express=require("express");
const path=require("path"),fs=require("fs"),bcrypt=require("bcryptjs"),jwt=require("jsonwebtoken"),cors=require("cors");
const app=express(),PORT=process.env.PORT||3000,SECRET=process.env.JWT_SECRET||"CHANGE_ME_IN_PRODUCTION";
const DB=path.join(__dirname,"data.json");
app.use(cors());app.use(express.json());app.use(express.static(path.join(__dirname,"public")));
function load(){if(!fs.existsSync(DB))fs.writeFileSync(DB,JSON.stringify({users:[],lists:[],comments:[],ratings:[]},null,2));return JSON.parse(fs.readFileSync(DB,"utf8"))}
function save(d){fs.writeFileSync(DB,JSON.stringify(d,null,2))}
function auth(req,res,next){try{let h=req.headers.authorization||"";req.user=jwt.verify(h.replace("Bearer ",""),SECRET);next()}catch(e){res.status(401).json({error:"ورود لازم است"})}}
const anime=[
{id:1,title:"وانیتاس",year:2021,score:8.2,genres:["فانتزی","اکشن"],image:"https://cdn.myanimelist.net/images/anime/1000/117857.jpg"},
{id:2,title:"هایکیو!!",year:2014,score:8.7,genres:["ورزشی","کمدی"],image:"https://cdn.myanimelist.net/images/anime/7/76014.jpg"},
{id:3,title:"جوجوتسو کایسن",year:2020,score:8.6,genres:["اکشن","فانتزی"],image:"https://cdn.myanimelist.net/images/anime/1171/109222.jpg"},
{id:4,title:"وان پیس",year:1999,score:9.0,genres:["ماجراجویی","اکشن"],image:"https://cdn.myanimelist.net/images/anime/1244/138851.jpg"},
{id:5,title:"فروتس بسکت",year:2019,score:8.6,genres:["عاشقانه","کمدی"],image:"https://cdn.myanimelist.net/images/anime/1447/99827.jpg"}];
app.get("/api/anime",(q,s)=>s.json(anime));
app.get("/api/anime/:id",(q,s)=>{let a=anime.find(x=>x.id==q.params.id);a?s.json(a):s.status(404).json({error:"پیدا نشد"})});
app.post("/api/auth/register",async(q,s)=>{let {email,password,name}=q.body||{},d=load();if(!email||!password||password.length<6)return s.status(400).json({error:"ایمیل و رمز عبور لازم است"});if(d.users.some(u=>u.email===email))return s.status(409).json({error:"ایمیل قبلاً ثبت شده"});let u={id:Date.now().toString(),email,name:name||email.split("@")[0],password:await bcrypt.hash(password,10)};d.users.push(u);save(d);s.json({token:jwt.sign({id:u.id,email:u.email,name:u.name},SECRET,{expiresIn:"7d"})})});
app.post("/api/auth/login",async(q,s)=>{let {email,password}=q.body||{},d=load(),u=d.users.find(x=>x.email===email);if(!u||!(await bcrypt.compare(password,u.password)))return s.status(401).json({error:"ایمیل یا رمز اشتباه است"});s.json({token:jwt.sign({id:u.id,email:u.email,name:u.name},SECRET,{expiresIn:"7d"})})});
app.get("/api/me",auth,(q,s)=>s.json(q.user));
app.get("/api/me/lists",auth,(q,s)=>s.json(load().lists.filter(x=>x.userId===q.user.id)));
app.post("/api/me/lists",auth,(q,s)=>{let {animeId,status}=q.body||{},d=load(),x=d.lists.find(v=>v.userId===q.user.id&&v.animeId==animeId);if(x)x.status=status;else d.lists.push({userId:q.user.id,animeId:Number(animeId),status});save(d);s.json({ok:true})});
app.delete("/api/me/lists/:id",auth,(q,s)=>{let d=load();d.lists=d.lists.filter(x=>!(x.userId===q.user.id&&x.animeId==q.params.id));save(d);s.json({ok:true})});
app.get("/api/anime/:id/comments",(q,s)=>s.json(load().comments.filter(x=>x.animeId==q.params.id)));
app.post("/api/anime/:id/comments",auth,(q,s)=>{let t=(q.body.text||"").trim();if(!t)return s.status(400).json({error:"کامنت خالی است"});let d=load();d.comments.push({id:Date.now(),animeId:Number(q.params.id),userId:q.user.id,name:q.user.name,text:t,createdAt:new Date().toISOString()});save(d);s.json({ok:true})});
app.post("/api/anime/:id/rating",auth,(q,s)=>{let n=Number(q.body.rating);if(n<1||n>10)return s.status(400).json({error:"امتیاز ۱ تا ۱۰"});let d=load(),r=d.ratings.find(x=>x.animeId==q.params.id&&x.userId===q.user.id);if(r)r.rating=n;else d.ratings.push({animeId:Number(q.params.id),userId:q.user.id,rating:n});save(d);s.json({ok:true})});
app.get("*",(q,s)=>s.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,()=>console.log("TSUKIRA running on http://localhost:"+PORT));