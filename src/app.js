import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';

// Konfigurer __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Legg til for JSON-data
app.use(express.static(path.join(__dirname, 'public'))); // Bruk absolutt sti

// Session konfigurasjon
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Bruk secure cookies i produksjon
      maxAge: 24 * 60 * 60 * 1000 // 1 dag
    }
  }));

// Sett opp EJS som view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Sett riktig sti til views-mappen

// Enkel GET / route for testing
app.get('/', (req, res) => {
  res.render('index', { user: req.session.user });
});

const checkAdmin = (req, res, next) => {
    if (req.session.user?.is_admin) {
      return next();
    }
    res.status(403).render('error', { 
      message: 'Du har ikke tilgang til denne siden' 
    });
  };
  
  // Bruk den på admin-ruter
  app.use('/admin', checkAdmin);
  
// Bruk dine API-ruter
app.use('/', apiRoutes);

// 404-håndtering
app.use((req, res) => {
  res.status(404).send('Siden finnes ikke');
});

// Feilhåndtering
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Noe gikk galt!');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server kjører på http://localhost:${PORT}`));