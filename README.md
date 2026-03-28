# 🥗 יומן תזונה — הוראות הפעלה

## צעד 1 — GitHub
1. היכנס ל־ https://github.com ← צור חשבון חינמי
2. לחץ על **New repository** (כפתור ירוק)
3. שם: `nutrition-diary` ← לחץ **Create repository**
4. גרור את כל הקבצים מהתיקייה `nutrition-app` לדף שנפתח ← לחץ **Commit changes**

## צעד 2 — API Key של Anthropic
1. היכנס ל־ https://console.anthropic.com ← צור חשבון חינמי
2. לחץ על **API Keys** ← **Create Key**
3. שמור את המפתח (מתחיל ב-`sk-ant-...`) — תשתמש בו בצעד הבא

## צעד 3 — Vercel (הוסטינג חינמי)
1. היכנס ל־ https://vercel.com ← **Sign up with GitHub**
2. לחץ **New Project** ← בחר את ה-repo שיצרת ← לחץ **Import**
3. לפני שלוחצים Deploy, פתח **Environment Variables** והוסף:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** המפתח שלך `sk-ant-...`
4. לחץ **Deploy** ← חכה כדקה

## סיום! 🎉
Vercel יתן לך כתובת בסגנון:
`https://nutrition-diary-xxxx.vercel.app`

זה האתר שלך! חינמי לחלוטין, עובד על מובייל ומחשב.

---

## עדכונים עתידיים
כל שינוי ב-GitHub יתעדכן אוטומטית באתר תוך דקה.
