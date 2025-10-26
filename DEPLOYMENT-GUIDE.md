# Attendance System Deployment Guide

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account (or other MongoDB hosting)
- Email service account (Gmail or Resend)
- Web hosting service (Heroku, Vercel, Netlify, etc.)

## Configuration Steps

### 1. Database Setup

1. Create a MongoDB Atlas account if you don't have one
2. Create a new cluster and database
3. Get your MongoDB connection string
4. Update the `.env` file with your connection string

### 2. Environment Variables

Update the following environment variables in the `.env` file:

```
DEMO_MODE=false
DATABASE_URL=mongodb+srv://your_mongodb_atlas_connection_string
JWT_SECRET=your_secure_jwt_secret
PORT=5001
RESEND_API_KEY=your_resend_api_key
GMAIL_USER=your_gmail_address
GMAIL_APP_PASSWORD=your_gmail_app_password
```

### 3. Backend Deployment

1. Push your code to a Git repository
2. Deploy the backend to your hosting service (Heroku, DigitalOcean, AWS, etc.)
3. Set the environment variables on your hosting service
4. Ensure the backend is running and accessible

### 4. Frontend Deployment

1. Update the `axios.defaults.baseURL` in `client/src/contexts/AuthContext.js` to point to your deployed backend URL
2. Build the frontend: `cd client && npm run build`
3. Deploy the frontend to a static hosting service (Vercel, Netlify, etc.)

### 5. Testing

After deployment, test the following functionality:

1. User registration
2. User login (admin, teacher, student)
3. Admin panel functionality
4. Teacher panel functionality
5. Student attendance tracking

### 6. Default Users

The system automatically creates these default users if they don't exist:

- Admin: admin@attendance.com / password123
- Teacher: demo@teacher.com / password123

### 7. Port Configuration

- Backend: Runs on port 5001 by default (configurable via PORT environment variable)
- Frontend: Typically runs on port 3000 in development

### 8. Troubleshooting

- If you encounter connection issues, ensure your MongoDB connection string is correct
- Check that the frontend is correctly pointing to the backend URL
- Verify that all environment variables are properly set
- Check server logs for any errors

## Security Considerations

- Change the default passwords immediately after deployment
- Use a strong JWT_SECRET value
- Consider implementing HTTPS
- Regularly update dependencies
- Implement proper backup procedures for your database