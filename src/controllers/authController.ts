import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db/db";
import moment, { isDate } from "moment";
//Status Check
export const checkStatus = (req: Request, res: Response) => {
  res.status(200).json({ status: "OK", message: "API is working properly" });
};


export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { name, email } = req.query;

    let baseQuery = "SELECT id, name, email FROM users";
    let conditions = [];
    let values = [];

    if (name) {
      conditions.push('name ILIKE $1');
      values.push(`%${name}%`);
    }

    if (email) {
      conditions.push('email ILIKE $2');
      values.push(`%${email}%`);
    }

    if (conditions.length > 0) {
      baseQuery += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await pool.query(baseQuery, values);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};



//   getUserbyId
export const getUserById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Register API

export const register = async (req: Request, res: Response) => {
  const { name, email, password, confirmPassword } = req.body;

  // Check if password and confirmPassword match
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    // Check if the email already exists in the database
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rowCount && result.rowCount > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash the password before saving it to the database
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3)",
      [name, email, hashedPassword]
    );

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Login API
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rowCount === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user.id }, "your_jwt_secret", {
      expiresIn: "1h",
    });

    res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Forgot Password API

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rowCount === 0) {
      return res.status(400).json({ message: "User does not exist" });
    }

    const resetToken = jwt.sign({ email }, "your_jwt_secret", {
      expiresIn: "1h",
    });
    console.log(`Password reset token: ${resetToken}`);

    res
      .status(200)
      .json({ message: "Password reset token has been sent to your email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//Punch in punch out
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

  //punch in punch out for previous day
  
export const checkPreviousDayAttendance = async (req: Request, res: Response) => {
  const { user_id } = req.body;

  try {
    if (!user_id) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Calculate the previous day's date
    const previousDay = moment().subtract(1, 'days').format('YYYY-MM-DD');

    // Query to get punch-in and punch-out times for the previous day
    const result = await pool.query(
      `SELECT punch_in_time, punch_out_time 
       FROM calendar 
       WHERE user_id = $1 
         AND DATE(punch_in_time) = $2`,
      [user_id, previousDay]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'No attendance record found for the previous day' });
    }

    // Return the punch-in and punch-out times
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching previous day attendance:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


//check leave balance
export const checkLeaveBalance = async (req: Request, res: Response) => {
  const { user_id, leave_days } = req.body;

  try {
    // Ensure the required parameters are provided
    if (user_id === undefined || leave_days === undefined) {
      return res
        .status(400)
        .json({ message: "User ID and leave days are required" });
    }

    // Fetch the user's leave balance from the database
    const result = await pool.query(
      "SELECT leave_balance FROM users WHERE id = $1",
      [user_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const { leave_balance } = result.rows[0];

    // Check if the leave balance is sufficient
    if (leave_balance >= leave_days) {
      // Calculate new leave balance
      const newLeaveBalance = leave_balance - leave_days;

      // Optionally update the leave balance in the database
      await pool.query("UPDATE users SET leave_balance = $1 WHERE id = $2", [
        newLeaveBalance,
        user_id,
      ]);

      return res
        .status(200)
        .json({ message: "Leave granted", new_leave_balance: newLeaveBalance });
    } else {
      return res.status(400).json({ message: "Insufficient leave balance" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// Add Post API
export const addPost = async (req: Request, res: Response) => {
  const { title, comments, photo_url, user_id } = req.body;

  try {
    // Ensure all required fields are provided
    if (!title || !comments || !photo_url || !user_id) {
      return res
        .status(400)
        .json({
          message: "Title, comments, photo URL, and user ID are required",
        });
    }

    // Insert the new post into the feed table
    const result = await pool.query(
      "INSERT INTO feed (title, comments, photo_url, user_id, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *",
      [title, comments, photo_url, user_id]
    );

    res
      .status(201)
      .json({ message: "Post added successfully", post: result.rows[0] });
  } catch (error) {
    console.error("Error adding post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// Get All Feeds API
export const getAllFeeds = async (req: Request, res: Response) => {
  try {
    // Query the database to get all posts from the feed table
    const result = await pool.query(
      "SELECT * FROM feed ORDER BY created_at DESC"
    );

    // Return the retrieved posts as a response
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching feeds:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// Get Feed By User ID API
export const getFeedByUserId = async (req: Request, res: Response) => {
  const { user_id } = req.params;

  try {
    // Query the database to get all posts by the specified user_id
    const result = await pool.query("SELECT * FROM feed WHERE user_id = $1", [
      user_id,
    ]);

    // Check if posts were found for the given user_id
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "No feeds found for this user" });
    }

    // Return the retrieved posts as a response
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
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
    date_of_completion,
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
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if the user_id exists in the users table
    const userCheckResult = await pool.query(
      "SELECT * FROM users WHERE id = $1",
      [user_id]
    );
    if (userCheckResult.rowCount === 0) {
      return res.status(400).json({ message: "User does not exist" });
    }

    // Insert the new employee details into the new_employee table
    const result = await pool.query(
      `INSERT INTO new_employee (user_id, emp_code, dob, gender, blood_group, nationality, date_of_joining, company, reporting_manager, functional_manager, date_of_completion) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        user_id,
        emp_code,
        dob,
        gender,
        blood_group,
        nationality,
        date_of_joining,
        company,
        reporting_manager,
        functional_manager,
        date_of_completion,
      ]
    );

    res
      .status(201)
      .json({
        message: "Employee details added successfully",
        employee: result.rows[0],
      });
  } catch (error) {
    console.error("Error adding employee details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getAllNewEmployees = async (req: Request, res: Response) => {
  try {
    // Query to fetch all new employees
    const result = await pool.query("SELECT * FROM new_employee");

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "No new employees found" });
    }

    // Respond with the list of new employees
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching new employees:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// Get New Employee By ID API
export const getNewEmployeeById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Query the database to get the employee details by their ID
    const result = await pool.query(
      "SELECT * FROM new_employee WHERE user_id = $1",
      [id]
    );

    // Check if the employee was found
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Return the retrieved employee details as a response
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching employee details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add Referral API
export const addReferral = async (req: Request, res: Response) => {
  const {
    candidate_name,
    gender,
    email,
    country_code,
    phone_number,
    comments,
    portfolio_url,
    referred_by_user_id,
  } = req.body;

  try {
    // Ensure all required fields are provided
    if (
      !candidate_name ||
      !gender ||
      !email ||
      !country_code ||
      !phone_number ||
      !referred_by_user_id
    ) {
      return res
        .status(400)
        .json({
          message:
            "Candidate name, gender, email, country code, phone number, and referred by user ID are required",
        });
    }

    // Insert the new referral into the referrals table
    const result = await pool.query(
      "INSERT INTO referrals (candidate_name, gender, email, country_code, phone_number, comments, portfolio_url, referred_by_user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [
        candidate_name,
        gender,
        email,
        country_code,
        phone_number,
        comments,
        portfolio_url,
        referred_by_user_id,
      ]
    );

    res
      .status(201)
      .json({
        message: "Referral added successfully",
        referral: result.rows[0],
      });
  } catch (error) {
    console.error("Error adding referral:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get All Referrals API
export const getAllReferrals = async (req: Request, res: Response) => {
  try {
    // Query the database to get all referrals
    const result = await pool.query(
      "SELECT * FROM referrals ORDER BY created_at DESC"
    );

    // Return the retrieved referrals as a response
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching referrals:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Check if today is a user's birthday
export const checkBirthdays = async (req: Request, res: Response) => {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = moment().format("MM-DD");

    // Query to find employees with today's birthday
    const result = await pool.query(
      `
      SELECT e.user_id, u.name, e.dob
      FROM new_employee e
      JOIN users u ON e.user_id = u.id
      WHERE TO_CHAR(e.dob, 'MM-DD') = $1
    `,
      [today]
    );

    if (result.rowCount === 0) {
      return res.status(200).json({ message: "No birthdays today" });
    }

    const birthdayMessages = result.rows.map(
      (row) => `Today is ${row.name}'s birthday`
    );

    res.status(200).json({ messages: birthdayMessages });
  } catch (error) {
    console.error("Error checking birthdays:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Year Celebration API
export const checkAnniversary = async (req: Request, res: Response) => {
  try {
    // Get today's date in 'MM-DD' format
    const today = moment().format("MM-DD");

    // Query to get employees' joining dates
    const result = await pool.query("SELECT * FROM new_employee");
    const employees = result.rows;

    const anniversaryMessages = employees
      .map((employee) => {
        // Calculate the anniversary date in 'MM-DD' format
        const joiningDate = moment(employee.joining_date);
        const anniversaryDate = joiningDate.format("MM-DD");

        // Calculate years of service
        const years = moment().diff(joiningDate, "years");

        // Only include messages for employees with more than 0 years of service
        if (anniversaryDate === today && years > 0) {
          return `Congratulations ${employee.emp_code}, you have ${years} year(s) of service today!`;
        }
        return null;
      })
      .filter((message) => message !== null);

    if (anniversaryMessages.length > 0) {
      res.status(200).json({ message: anniversaryMessages.join(", ") });
    } else {
      res.status(200).json({ message: "No anniversaries today" });
    }
  } catch (error) {
    console.error("Error checking anniversaries:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add Core Value API
export const addCoreValue = async (req: Request, res: Response) => {
  const { title, description } = req.body;

  try {
    // Ensure all required fields are provided
    if (!title || !description) {
      return res
        .status(400)
        .json({ message: "Title and description are required" });
    }

    // Insert the new core value into the core_values table
    const result = await pool.query(
      "INSERT INTO core_values (title, description) VALUES ($1, $2) RETURNING *",
      [title, description]
    );

    res
      .status(201)
      .json({
        message: "Core value added successfully",
        coreValue: result.rows[0],
      });
  } catch (error) {
    console.error("Error adding core value:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// Get All Core Values API
export const getAllCoreValues = async (req: Request, res: Response) => {
  try {
    // Query the database to get all core values
    const result = await pool.query(
      "SELECT * FROM core_values ORDER BY created_at DESC"
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "No core values found" });
    }

    // Respond with the list of core values
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching core values:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
//Add mission-vision
// Add or Update Company Info
export const upsertCompanyInfo = async (req: Request, res: Response) => {
  const { type, content } = req.body;

  try {
    // Ensure the required fields are provided
    if (!type || !content) {
      return res.status(400).json({ message: "Type and content are required" });
    }

    // Check if the entry already exists
    const existingResult = await pool.query(
      "SELECT * FROM company_info WHERE type = $1",
      [type]
    );

    // Handle the possibility of rowCount being null
    if (existingResult.rowCount === null || existingResult.rowCount > 0) {
      // Update the existing entry
      const result = await pool.query(
        "UPDATE company_info SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE type = $2 RETURNING *",
        [content, type]
      );
      return res
        .status(200)
        .json({
          message: "Company info updated successfully",
          companyInfo: result.rows[0],
        });
    } else {
      // Insert a new entry
      const result = await pool.query(
        "INSERT INTO company_info (type, content) VALUES ($1, $2) RETURNING *",
        [type, content]
      );
      return res
        .status(201)
        .json({
          message: "Company info added successfully",
          companyInfo: result.rows[0],
        });
    }
  } catch (error) {
    console.error("Error upserting company info:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get Company Info
export const getCompanyInfo = async (req: Request, res: Response) => {
  const { type } = req.params;

  try {
    // Query the database to get the company info by type
    const result = await pool.query(
      "SELECT * FROM company_info WHERE type = $1",
      [type]
    );

    // Handle the possibility of rowCount being null
    if (result.rowCount === null || result.rowCount === 0) {
      return res.status(404).json({ message: "Company info not found" });
    }

    // Return the retrieved company info
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching company info:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//Leave request

export const applyForLeave = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { user_id, leave_type, start_date, end_date, comments } = req.body as {
    user_id: number;
    leave_type: string;
    start_date: string; // Should be in 'YYYY-MM-DD' format
    end_date: string; // Should be in 'YYYY-MM-DD' format
    comments?: string;
  };

  // Validation
  if (!user_id || !leave_type || !start_date || !end_date) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

  try {
    // Insert leave request into the database
    const query = `
            INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, comments)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
    const values = [user_id, leave_type, start_date, end_date, comments];
    const result = await pool.query(query, values);

    res.status(201).json({
      message: "Leave request submitted successfully",
      leaveRequest: result.rows[0],
    });
  } catch (error) {
    console.error("Error applying for leave:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//get leaveRequest
export const getLeaveRequests = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { user_id } = req.query as { user_id?: string };

  try {
    let query: string;
    let values: (string | undefined)[];

    if (user_id) {
      query = `SELECT * FROM leave_requests WHERE user_id = $1 ORDER BY start_date DESC;`;
      values = [user_id];
    } else {
      query = `SELECT * FROM leave_requests ORDER BY start_date DESC;`;
      values = [];
    }

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      res.status(404).json({ message: "No leave requests found" });
      return;
    }

    res.status(200).json({
      message: "Leave requests retrieved successfully",
      leaveRequests: result.rows,
    });
  } catch (error) {
    console.error("Error retrieving leave requests:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//People on leave today
export const getPeopleOnLeaveToday = async (req: Request, res: Response) => {
  try {
    const query = `
            SELECT u.name
            FROM leave_requests lr
            JOIN users u ON lr.user_id = u.id
            WHERE $1 BETWEEN lr.start_date AND lr.end_date;
        `;
    const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
    const result = await pool.query(query, [today]);

    if (result.rows.length === 0) {
      return res.status(200).json({ message: "No one is on leave today" });
    }

    const names = result.rows.map((row) => row.name);

    res.status(200).json({
      message: "People on leave today",
      names,
    });
  } catch (error) {
    console.error("Error fetching people on leave today:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Leave balance
export const getLeaveBalance = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { user_id } = req.query as { user_id?: string };

  // Validation
  if (!user_id) {
    res.status(400).json({ error: "User ID is required" });
    return;
  }

  try {
    // Get the current month and year
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // Months are 0-indexed, so add 1
    const currentYear = today.getFullYear();

    // Query to check if the user has applied for leave this month
    const query = `
            SELECT COUNT(*) AS leave_count
            FROM leave_requests
            WHERE user_id = $1
              AND EXTRACT(MONTH FROM start_date) = $2
              AND EXTRACT(YEAR FROM start_date) = $3;
        `;
    const values = [user_id, currentMonth, currentYear];
    const result = await pool.query(query, values);

    const leaveCount = parseInt(result.rows[0].leave_count, 10);

    if (leaveCount > 0) {
      res.status(200).json({
        message: "Leave balance retrieved successfully",
        leaveBalance: 0,
      });
    } else {
      res.status(200).json({
        message: "Leave balance retrieved successfully",
        leaveBalance: 1,
      });
    }
  } catch (error) {
    console.error("Error retrieving leave balance:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};



 
// Post a New Entry to Wall of Fame
export const addWallOfFameEntry = async (req: Request, res: Response) => {
  const {  badge_url, user_id,comment } = req.body;

  try {
    // Ensure all required fields are provided
    if ( !badge_url || !comment || !user_id) {
      return res.status(400).json({ message: ' badge_url, comment, and user ID are required' });
    }

    // Insert the new entry into the wall_of_fame table
    const result = await pool.query(
      'INSERT INTO wall_of_fame ( badge_url, comment, user_id,created_at, updated_at) VALUES ($1, $2, $3, NOW(),NoW()) RETURNING *',
      [ badge_url, comment, user_id]
    );

    res.status(201).json({ message: 'Entry added successfully', entry: result.rows[0] });
  } catch (error) {
    console.error('Error adding entry:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get All Wall of Fame Entries
export const getAllWallOfFameEntries = async (req: Request, res: Response) => {
  try {
    // Query the database to get all entries from the wall_of_fame table
    const result = await pool.query('SELECT * FROM wall_of_fame ORDER BY created_at DESC');
    
    // Return the retrieved entries as a response
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get Wall of Fame Entry by User ID
export const getWallOfFameEntryByUserId = async (req: Request, res: Response) => {
  const { user_id } = req.params;

  try {
    // Query the database to get all entries by the specified user_id
    const result = await pool.query('SELECT * FROM wall_of_fame WHERE user_id = $1', [user_id]);

    // Check if entries were found for the given user_id
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'No entries found for this user' });
    }

    // Return the retrieved entries as a response
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};



