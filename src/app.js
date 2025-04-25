import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();


app.use(express.urlencoded({ extended: true }));
app.use(express.json()); 
app.use(express.static(path.join(__dirname, 'public'))); 


app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', 
      maxAge: 24 * 60 * 60 * 1000 
    }
  }));


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); 


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
  
  
  app.use('/admin', checkAdmin);


app.use('/', apiRoutes);


app.use((req, res) => {
  res.status(404).send('Siden finnes ikke');
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Noe gikk galt!');
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server kjører på http://localhost:${PORT}`));