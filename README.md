# KLUB KURT CMS System

A simple CMS system for managing events on the KLUB KURT website. Built with Node.js backend, Vue.js admin interface, and MongoDB database.

## Project Structure

```
leomedia/klub-kurt/
├── admin/
│   ├── server/          # Node.js/Express backend
│   └── client/          # Vue.js admin interface
└── website/             # Static website (updated to fetch dynamic events)
```

## Features

- **Event Management**: Create, read, update, and delete events
- **Authentication**: Simple JWT-based admin login system
- **Dynamic Content**: Website automatically fetches events from API
- **Responsive Design**: Mobile-friendly admin interface
- **Error Handling**: Graceful fallbacks if API is unavailable

## Prerequisites

- Node.js 18+
- MongoDB (running on localhost:27017)
- npm or yarn

## Setup Instructions

### 1. Backend Setup

```bash
# Navigate to server directory
cd admin/server

# Install dependencies
npm install

# Start MongoDB (make sure it's running on localhost:27017)
# The system will create a database named 'klubkurt'

# Start development server
npm run dev
# Server will run on http://localhost:3001
```

### 2. Admin Frontend Setup

```bash
# Navigate to client directory (in a new terminal)
cd admin/client

# Install dependencies
npm install

# Start development server
npm run dev
# Admin interface will run on http://localhost:3000
```

### 3. Website

The website is a static HTML file that automatically fetches events from the API. Simply open `website/index.html` in a browser or serve it with a local server.

## Default Credentials

- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Important**: Change these credentials in the environment files before production use!

## Environment Configuration

### Development (.env.development)

- Port: 3001
- MongoDB: mongodb://localhost:27017/klubkurt
- CORS: <http://localhost:3000>

### Production (.env.production)

- Update MongoDB URI, JWT secret, admin credentials
- Update CORS origin to your production domain

## API Endpoints

### Public Endpoints

- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get specific event
- `GET /api/health` - Health check

### Admin Endpoints (require authentication)

- `POST /api/auth/login` - Admin login
- `GET /api/auth/verify` - Verify token
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

## Usage

1. **Start the backend server** (admin/server)
2. **Start the admin interface** (admin/client)
3. **Login** with admin credentials
4. **Manage events** through the admin interface
5. **View the website** - events will automatically load from the API

## Event Data Structure

```json
{
  "title": "Event Title",
  "date": "2025-10-15T20:00:00.000Z",
  "description": "Event description",
  "lineup": ["Artist 1", "Artist 2"],
  "tags": ["techno", "house"],
  "isActive": true
}
```

## Development

### Adding New Features

1. **Backend**: Add routes in `admin/server/routes/`
2. **Frontend**: Add components in `admin/client/src/components/`
3. **API Integration**: Update stores in `admin/client/src/stores/`

### Building for Production

```bash
# Build admin interface
cd admin/client
npm run build

# Start production server
cd ../server
NODE_ENV=production npm start
```

## Security Notes

- Change default admin credentials
- Update JWT secret in production
- Use HTTPS in production
- Consider rate limiting for production use
- Validate and sanitize all inputs

## Troubleshooting

### Common Issues

1. **MongoDB connection failed**
   - Ensure MongoDB is running
   - Check connection string in environment file

2. **CORS errors**
   - Update CORS_ORIGIN in server environment file
   - Ensure admin client runs on expected port

3. **Events not loading on website**
   - Check if backend server is running
   - Verify API endpoint URL in website/scripts.js
   - Check browser console for errors

4. **Login issues**
   - Verify credentials in environment file
   - Check JWT secret configuration
   - Ensure server and client are running

## Future Enhancements

- Image upload for events
- Email notifications
- Event categories
- User roles and permissions
- Analytics and reporting
- SEO optimization
- Backup and restore functionality

## Support

For issues or questions, check the server logs and browser console for error messages.
