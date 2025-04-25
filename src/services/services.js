import pool from '../utils/db.js';
import bcrypt from 'bcryptjs';

export const AuthService = {
    async registerUser(name, email, password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        [name, email, hashedPassword]
      );
    },
  
    async loginUser(email, password) {
      const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      if (users.length === 0) throw new Error('Bruker ikke funnet');
      
      const user = users[0];
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) throw new Error('Feil passord');
      
      return user;
    }
  };

  export const UserService = {
    async deleteUser(userId) {
      const [questions] = await pool.query('SELECT * FROM questions WHERE user_id = ?', [userId]);
      if (questions.length > 0) throw new Error('Bruker har aktive spørsmål');
      await pool.query('DELETE FROM users WHERE id = ?', [userId]);
    }
  };
  
  export const AdminService = {
    async deleteUserWithQuestions(userId) {
      await pool.query('DELETE FROM questions WHERE user_id = ?', [userId]);
      await pool.query('DELETE FROM users WHERE id = ?', [userId]);
    },

    async listUsersWithQuestions() {
      const [users] = await pool.query(`
        SELECT users.id, users.email, COUNT(questions.id) AS question_count
        FROM users LEFT JOIN questions ON users.id = questions.user_id
        GROUP BY users.id
      `);
      return users;
    },

    async submitQuestion(userId, question) {
        await pool.query(
          'INSERT INTO questions (user_id, question) VALUES (?, ?)',
          [userId, question]
        );
      },

      async deleteUser(userId) {
        // Slett først alle brukerens spørsmål
        await pool.query('DELETE FROM questions WHERE user_id = ?', [userId]);
        // Slett deretter brukeren
        await pool.query('DELETE FROM users WHERE id = ?', [userId]);
      },
    
      async getAllUsers() {
        const [users] = await pool.query(`
          SELECT users.id, users.name, users.email, users.created_at, 
                 COUNT(questions.id) AS question_count
          FROM users
          LEFT JOIN questions ON users.id = questions.user_id
          GROUP BY users.id
        `);
        return users;
      }
    };     