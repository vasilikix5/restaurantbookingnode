const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Μέγιστος αριθμός τραπεζιών ανά ζώνη ώρας
const MAX_TABLES = 5;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const JSON_FILE = path.join(__dirname, 'bookings.json');

// 1. Λήψη όλων των κρατήσεων
app.get('/api/bookings', (req, res) => {
    fs.readFile(JSON_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: "Σφάλμα ανάγνωσης αρχείου" });
        res.json(JSON.parse(data || '[]'));
    });
});

// 2. Δημιουργία νέας κράτησης με έλεγχο διαθεσιμότητας τραπεζιών
app.post('/api/bookings', (req, res) => {
    const { name, date, timeSlot, guests } = req.body;

    if (!name || !date || !timeSlot || !guests) {
        return res.status(400).json({ error: "Όλα τα πεδία είναι υποχρεωτικά!" });
    }

    fs.readFile(JSON_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: "Σφάλμα ανάγνωσης" });

        const bookings = JSON.parse(data || '[]');

        // Μέτρηση πόσα τραπέζια είναι ήδη κλεισμένα για την ΙΔΙΑ ημερομηνία και ΙΔΙΑ ώρα
        const bookedTablesCount = bookings.filter(b => b.date === date && b.timeSlot === timeSlot).length;

        // Αν έχουμε φτάσει το όριο, απορρίπτουμε την κράτηση
        if (bookedTablesCount >= MAX_TABLES) {
            return res.status(400).json({ error: `Δυστυχώς εξαντλήθηκαν τα τραπέζια για την ημερομηνία ${date} στις ${timeSlot}!` });
        }

        // Προσθήκη της νέας κράτησης
        const newBooking = { name, date, timeSlot, guests: parseInt(guests) };
        bookings.push(newBooking);

        fs.writeFile(JSON_FILE, JSON.stringify(bookings, null, 2), (err) => {
            if (err) return res.status(500).json({ error: "Σφάλμα αποθήκευσης" });
            res.json({ message: "Η κράτηση του τραπεζιού έγινε με επιτυχία!" });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
