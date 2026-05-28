@AGENTS.md

# כללים לעבודה עם מערכת HR

## עדכון מדריך למשתמש
**חובה:** בכל הוספת פיצ'ר חדש או שינוי משמעותי, עדכן את קובץ המדריך:
`src/app/guide/page.tsx`

המדריך בנוי כמצגת עם מערך `SLIDES`. לכל שקף יש:
- `title` — כותרת
- `subtitle` — תת-כותרת
- `icon` — אייקון מ-lucide-react
- `color` — gradient tailwind (from-X to-Y)
- `content` — תוכן React (השתמש בקומפוננט `Step` לצעדים ממוספרים)

בעת הוספת פיצ'ר: הוסף שקף חדש ל-SLIDES, או עדכן שקף קיים אם הפיצ'ר שייך לנושא קיים.

## דחיפה לגיטהאב
בכל commit יש לדחוף לשני ריפואים:
```
git push origin main && git push oribasson main
```
