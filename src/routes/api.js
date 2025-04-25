import express from 'express';
import { AuthService, UserService, AdminService } from '../services/services.js';

const router = express.Router();

// GET-ruter (nye)
router.get('/login', (req, res) => {
    res.render('login', { error: null });
  });

router.get('/register', (req, res) => {
    res.render('register', { error: null }); // Send med error som null som standard
  });

// POST-ruter (eksisterende)
router.post('/register', async (req, res) => {
    try {
      await AuthService.registerUser(
        req.body.name,
        req.body.email,
        req.body.password
      );
      res.redirect('/login');
    } catch (err) {
      res.render('register', { 
        error: err.message,
        formData: req.body // Beholder skjemadata ved feil
      });
    }
  })

  router.post('/login', async (req, res) => {
    try {
      const user = await AuthService.loginUser(req.body.email, req.body.password);
      req.session.user = user;
      res.redirect('/');
    } catch (err) {
      res.render('login', { 
        error: err.message,
        email: req.body.email // Behold e-posten ved feil
      });
    }
  });


  router.post('/ask', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    
    try {
      const { question } = req.body;
      await AdminService.submitQuestion(req.session.user.id, question);
      res.redirect('/thank-you'); // Send til takkeside i stedet for /ask
    } catch (err) {
      res.render('index', { 
        user: req.session.user,
        error: 'Kunne ikke sende spørsmålet. Prøv igjen.'
      });
    }
  });
  
 
  router.get('/thank-you', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.render('thank-you', { user: req.session.user });
  });


router.post('/delete-account', async (req, res) => {
    try {
      await UserService.deleteUser(req.session.user.id);
      req.session.destroy();
      res.redirect('/');
    } catch (err) {
      res.render('delete-error', { 
        error: err.message,
        user: req.session.user 
      });
    }
  });

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Feil under utlogging:', err);
        return res.redirect('/?error=Kunne+ikke+logge+ut');
      }
      res.clearCookie('connect.sid'); // Fjerner session cookie
      res.redirect('/?message=Du+er+nå+utlogget'); // Redirect til hovedsiden med bekreftelse
    });
  });

  router.get('/admin/dashboard', async (req, res) => {
    if (!req.session.user?.is_admin) {
      return res.status(403).send('Ingen tilgang');
    }
  
    try {
      const users = await AdminService.getAllUsers();
      res.render('admin/dashboard', { 
        users,
        currentUser: req.session.user 
      });
    } catch (err) {
      res.status(500).send('Feil ved henting av brukere');
    }
  });
  
  // Slett bruker (admin)
  router.post('/admin/delete-user', async (req, res) => {
    if (!req.session.user?.is_admin) {
      return res.status(403).send('Ingen tilgang');
    }
  
    try {
      await AdminService.deleteUser(req.body.userId);
      res.redirect('/admin/dashboard?message=Bruker+slettet');
    } catch (err) {
      res.redirect('/admin/dashboard?error=Kunne+ikke+slette+bruker');
    }
  });

export default router;