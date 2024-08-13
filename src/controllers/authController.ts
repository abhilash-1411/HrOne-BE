import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db/db';



export const checkStatus = (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', message: 'API is working properly' });
  };
//getAllUsers
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT id, name, email FROM users');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


//   getUserbyId
export const getUserById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

  
// Register API

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rowCount && result.rowCount > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3)', [name, email, hashedPassword]);

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// Login API
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rowCount === 0) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id }, 'your_jwt_secret', { expiresIn: '1h' });

    res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Forgot Password API
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rowCount === 0) {
      return res.status(400).json({ message: 'User does not exist' });
    }

    const resetToken = jwt.sign({ email }, 'your_jwt_secret', { expiresIn: '1h' });
    console.log(`Password reset token: ${resetToken}`);

    res.status(200).json({ message: 'Password reset token has been sent to your email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

//punch in punch out
export const checkAttendance = async (req: Request, res: Response) => {
    const { user_id, punch_in_time, punch_out_time } = req.body;
   
    try {
      // Ensure the required parameters are provided
      if (!user_id || !punch_in_time || !punch_out_time) {
        return res.status(400).json({ message: 'User ID, punch-in time, and punch-out time are required' });
      }
   
      // Calculate the difference in hours between punch-in and punch-out times
      const punchIn = new Date(punch_in_time);
      const punchOut = new Date(punch_out_time);
      const differenceInHours = (punchOut.getTime() - punchIn.getTime()) / (1000 * 60 * 60);
   
      // Check if the difference is greater than 9.5 hours
      const flag = differenceInHours > 9.5;
   
      res.status(200).json({ flag });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
   
//check leave balance
export const checkLeaveBalance = async (req: Request, res: Response) => {
    const { user_id, leave_days } = req.body;
   
    try {
      // Ensure the required parameters are provided
      if (user_id === undefined || leave_days === undefined) {
        return res.status(400).json({ message: 'User ID and leave days are required' });
      }
   
      // Fetch the user's leave balance from the database
      const result = await pool.query('SELECT leave_balance FROM users WHERE id = $1', [user_id]);
   
      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
   
      const { leave_balance } = result.rows[0];
   
      // Check if the leave balance is sufficient
      if (leave_balance >= leave_days) {
        // Calculate new leave balance
        const newLeaveBalance = leave_balance - leave_days;
   
        // Optionally update the leave balance in the database
        await pool.query('UPDATE users SET leave_balance = $1 WHERE id = $2', [newLeaveBalance, user_id]);
   
        return res.status(200).json({ message: 'Leave granted', new_leave_balance: newLeaveBalance });
      } else {
        return res.status(400).json({ message: 'Insufficient leave balance' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
  // Add Post API
export const addPost = async (req: Request, res: Response) => {
  const { title, comments, photo_url, user_id } = req.body;

  try {
    // Ensure all required fields are provided
    if (!title || !comments || !photo_url || !user_id) {
      return res.status(400).json({ message: 'Title, comments, photo URL, and user ID are required' });
    }

    // Insert the new post into the feed table
    const result = await pool.query(
      'INSERT INTO feed (title, comments, photo_url, user_id, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [title, comments, photo_url, user_id]
    );

    res.status(201).json({ message: 'Post added successfully', post: result.rows[0] });
  } catch (error) {
    console.error('Error adding post:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
// Get All Feeds API
export const getAllFeeds = async (req: Request, res: Response) => {
  try {
    // Query the database to get all posts from the feed table
    const result = await pool.query('SELECT * FROM feed ORDER BY created_at DESC');
    
    // Return the retrieved posts as a response
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching feeds:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
// Get Feed By User ID API
export const getFeedByUserId = async (req: Request, res: Response) => {
  const { user_id } = req.params;

  try {
    // Query the database to get all posts by the specified user_id
    const result = await pool.query('SELECT * FROM feed WHERE user_id = $1', [user_id]);

    // Check if posts were found for the given user_id
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'No feeds found for this user' });
    }

    // Return the retrieved posts as a response
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
