# Kev & Kolo Kitchen

Private cookbook companion and recipe finder.

This project stores **metadata only** for published cookbooks: recipe title, book, ingredients/tags and where to find it. It does **not** store full copyrighted recipe text or methods.

## Current status

- Version: 1.0 foundation
- Pilot source: *The Hairy Dieters: How to Love Food and Lose Weight*
- Data format: JSON
- Future database target: Supabase
- Future hosting target: Vercel or GitHub Pages while testing

## Folder structure

```text
app/        phone-first web app
 data/       JSON database files
database/   Supabase schema
docs/       notes and project documentation
```

## How to test locally

Open `app/index.html` in Chrome. If the browser blocks local JSON loading, use a local server later or host it from GitHub Pages/Vercel.

## Copyright rule

Cookbook references should only display metadata and a note to open the owned book/Kindle copy. Original Kev & Mac or family recipes can store full ingredients and method later.
