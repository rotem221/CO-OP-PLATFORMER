# פריסת המשחק (Vercel + Railway)

המשחק דורש **שרת Node.js עם Socket.io** (WebSockets). Vercel לא תומך ב-WebSockets, לכן משתמשים ב-**הרכב היברידי**:

- **Vercel** – ממשק (הדפים שהשחקנים רואים)
- **Railway** – שרת המשחק (Socket.io)

## שלב 1: העלאת שרת המשחק ל-Railway

1. היכנס ל-[railway.app](https://railway.app) והתחבר עם GitHub.
2. **New Project** → **Deploy from GitHub repo** → בחר את ה-repo `CO-OP-PLATFORMER`.
3. ב-**Settings** של השירות:
   - **Root Directory:** (השאר ריק – השורש של הפרויקט)
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. ב-**Settings** → **Networking** → **Generate Domain**.
5. העתק את הכתובת שנוצרה, למשל: `https://co-op-platformer-production.up.railway.app`

## שלב 2: העלאת הממשק ל-Vercel

1. היכנס ל-[vercel.com](https://vercel.com) והתחבר עם GitHub.
2. **Add New** → **Project** → ייבא את ה-repo `CO-OP-PLATFORMER`.
3. **Configure Project:**
   - Framework Preset: **Other**
   - Build Command ו-Output כבר מוגדרים ב-`vercel.json` – אין צורך לשנות.
4. לפני ה-Deploy, הוסף **Environment Variable**:
   - **Name:** `SOCKET_SERVER_URL`
   - **Value:** הכתובת של Railway (ללא slash בסוף), למשל:  
     `https://co-op-platformer-production.up.railway.app`
5. לחץ **Deploy**.

## אחרי הפריסה

- **כתובת המשחק (מארח):** `https://your-project.vercel.app`
- **כתובת השליטה (טלפון):** `https://your-project.vercel.app/controller.html?room=XXXX`

הלקוח ב-Vercel יקבל אוטומטית את כתובת שרת ה-Socket מ-`/api/config` (שתמשת ב-`SOCKET_SERVER_URL`).

## הרצה מקומית

```bash
npm install
npm start
```

ואז לפתוח בדפדפן: `http://localhost:3000`.  
במקומי אין צורך ב-`SOCKET_SERVER_URL` – הלקוח מתחבר לאותו שרת.
