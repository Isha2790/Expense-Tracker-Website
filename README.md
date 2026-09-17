# Expense Tracker
 
A simple expense tracker built with vanilla HTML, CSS, and JavaScript. Data is stored locally in the browser using `localStorage` — no backend required.
 
## Features
 
- Add, edit, and delete expenses (description, amount, category, date)
- Recurring expenses (weekly/monthly)
- Monthly budget tracking with progress bar
- Dashboard summary (monthly total, today's total, transaction count, daily average)
- Spending trend and category split charts
- Search and filter by category or time period
- Dark/light theme toggle
## Tech Stack
 
- HTML5, CSS3
- Vanilla JavaScript
- Browser `localStorage` for data persistence
## Getting Started
 
1. Clone or download this repository.
2. Open `index.html` in your browser, or serve it locally:
```bash
   npx serve .
```
3. Start adding expenses — data saves automatically.
## File Structure
 
```
├── index.html
├── style.css
├── app.js
└── README.md
```
- All data is stored locally in the browser (no cloud sync, no accounts).
- Clearing browser data or switching devices will not carry over saved data.
 
