import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db/db';
import moment from 'moment';
//Status Check
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

// Add Employee API
export const addEmployee = async (req: Request, res: Response) => {
  const {
    user_id, // should correspond to the `id` from `users` table
    emp_code,
    dob,
    gender,
    blood_group,
    nationality,
    date_of_joining,
    company,
    reporting_manager,
    functional_manager,
    date_of_completion
  } = req.body;

  try {
    // Ensure all required fields are provided
    if (
      !user_id || // ensure user_id is provided
      !emp_code ||
      !dob ||
      !gender ||
      !blood_group ||
      !nationality ||
      !date_of_joining ||
      !company ||
      !reporting_manager ||
      !functional_manager ||
      !date_of_completion
    ) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if the user_id exists in the users table
    const userCheckResult = await pool.query('SELECT * FROM users WHERE id = $1', [user_id]);
    if (userCheckResult.rowCount === 0) {
      return res.status(400).json({ message: 'User does not exist' });
    }

    // Insert the new employee details into the new_employee table
    const result = await pool.query(
      `INSERT INTO new_employee (user_id, emp_code, dob, gender, blood_group, nationality, date_of_joining, company, reporting_manager, functional_manager, date_of_completion) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [user_id, emp_code, dob, gender, blood_group, nationality, date_of_joining, company, reporting_manager, functional_manager, date_of_completion]
    );

    res.status(201).json({ message: 'Employee details added successfully', employee: result.rows[0] });
  } catch (error) {
    console.error('Error adding employee details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
export const getAllNewEmployees = async (req: Request, res: Response) => {
  try {
    // Query to fetch all new employees
    const result = await pool.query('SELECT * FROM new_employee');
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'No new employees found' });
    }

    // Respond with the list of new employees
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching new employees:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
// Get New Employee By ID API
export const getNewEmployeeById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Query the database to get the employee details by their ID
    const result = await pool.query(
      'SELECT * FROM new_employee WHERE user_id = $1',
      [id]
    );

    // Check if the employee was found
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Return the retrieved employee details as a response
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching employee details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Add Referral API
export const addReferral = async (req: Request, res: Response) => {
    const { candidate_name, gender, email, country_code, phone_number, comments, portfolio_url, referred_by_user_id } = req.body;

    try {
        // Ensure all required fields are provided
        if (!candidate_name || !gender || !email || !country_code || !phone_number || !referred_by_user_id) {
            return res.status(400).json({ message: 'Candidate name, gender, email, country code, phone number, and referred by user ID are required' });
        }

        // Insert the new referral into the referrals table
        const result = await pool.query(
            'INSERT INTO referrals (candidate_name, gender, email, country_code, phone_number, comments, portfolio_url, referred_by_user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [candidate_name, gender, email, country_code, phone_number, comments, portfolio_url, referred_by_user_id]
        );

        res.status(201).json({ message: 'Referral added successfully', referral: result.rows[0] });
    } catch (error) {
        console.error('Error adding referral:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get All Referrals API
export const getAllReferrals = async (req: Request, res: Response) => {
    try {
        // Query the database to get all referrals
        const result = await pool.query('SELECT * FROM referrals ORDER BY created_at DESC');
        
        // Return the retrieved referrals as a response
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching referrals:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Check if today is a user's birthday
export const checkBirthdays = async (req: Request, res: Response) => {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = moment().format('MM-DD');

    // Query to find employees with today's birthday
    const result = await pool.query(`
      SELECT e.user_id, u.name, e.dob
      FROM new_employee e
      JOIN users u ON e.user_id = u.id
      WHERE TO_CHAR(e.dob, 'MM-DD') = $1
    `, [today]);

    if (result.rowCount === 0) {
      return res.status(200).json({ message: 'No birthdays today' });
    }

    const birthdayMessages = result.rows.map(row => `Today is ${row.name}'s birthday`);

    res.status(200).json({ messages: birthdayMessages });
  } catch (error) {
    console.error('Error checking birthdays:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// Year Celebration API
export const checkAnniversary = async (req: Request, res: Response) => {
  try {
    // Get today's date in 'MM-DD' format
    const today = moment().format('MM-DD');
    
    // Query to get employees' joining dates
    const result = await pool.query('SELECT * FROM new_employee');
    const employees = result.rows;
    
    const anniversaryMessages = employees
      .map(employee => {
        // Calculate the anniversary date in 'MM-DD' format
        const joiningDate = moment(employee.joining_date);
        const anniversaryDate = joiningDate.format('MM-DD');
        
        // Calculate years of service
        const years = moment().diff(joiningDate, 'years');
        
        // Only include messages for employees with more than 0 years of service
        if (anniversaryDate === today && years > 0) {
          return `Congratulations ${employee.emp_code}, you have ${years} year(s) of service today!`;
        }
        return null;
      })
      .filter(message => message !== null);
    
    if (anniversaryMessages.length > 0) {
      res.status(200).json({ message: anniversaryMessages.join(', ') });
    } else {
      res.status(200).json({ message: 'No anniversaries today' });
    }
  } catch (error) {
    console.error('Error checking anniversaries:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

