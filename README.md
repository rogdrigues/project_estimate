
# Project Management Tool

## Description
A comprehensive project management tool designed to help companies efficiently manage their projects, resources, technologies, and collaboration. It features role-based access control, task tracking, and real-time updates, making it ideal for both small and large teams.

## Table of Contents
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## Features
- **User Management**: Role-based access control (Admin, Project Manager, Employee, Customer).
- **Project Management**: Create, update, and manage projects, including assigning resources and deadlines.
- **Resource Management**: Assign team members, track productivity, and manage resources across projects.
- **Real-time Collaboration**: Comment on projects and tasks to provide updates and feedback.
- **Import/Export Functionality**: Export project templates to Excel and import them back for bulk project creation.
- **File Uploads**: Manage document uploads through Cloudinary for project-related files.
- **Customizable Permissions**: Manage permissions through a dynamic permission set structure.

## Installation

### Prerequisites
- Node.js (v14.x or higher)
- MongoDB
- Cloudinary account for file storage (optional)

### Installation Steps
1. Clone the repository:
    ```bash
    git clone https://github.com/rogdrigues/project-management-tool.git
    ```
2. Navigate to the project directory:
    ```bash
    cd project-management-tool
    ```
3. Install dependencies:
    ```bash
    npm install
    ```
4. Configure environment variables:
    - Create a `.env` file in the root directory and configure the following:
      ```bash
      MONGO_URI=mongodb://<your-mongo-uri>
      JWT_SECRET=your_jwt_secret_key
      ACCESS_TOKEN_EXPIRES_IN=15m
      REFRESH_TOKEN_EXPIRES_IN=7d
      CLOUDINARY_CLOUD_NAME=your_cloudinary_name
      CLOUDINARY_API_KEY=your_cloudinary_api_key
      CLOUDINARY_API_SECRET=your_cloudinary_api_secret
      ```
5. Start the development server:
    ```bash
    npm run dev
    ```

## Usage

### Running the Application
1. After starting the server, open your browser and navigate to `http://localhost:3000`.
2. Sign in using the admin credentials or create new users via the admin panel.
3. Once logged in, you can:
   - Manage users (create, edit, delete).
   - Create, update, and assign resources to projects.
   - Export projects to Excel or import project templates.

### User Authentication
- **Admin Control**: Admin users can add, delete, or update other users and manage permissions.
- **Authentication**: Users log in with JWT-based authentication. Refresh tokens are managed to ensure smooth sessions.

### Managing Projects
- **Create Projects**: Add new projects, assign team members, and set deadlines.
- **Track Progress**: View project status and completion percentage in real-time.
- **Commenting System**: Collaborate with team members using project comments.

## API Documentation

### API Endpoints
#### Users
- **POST /api/users/login**: User login
- **POST /api/users/add-user**: Add a new user (admin only)
- **POST /api/users/refresh-token**: Refresh access token
- **GET /api/users/get-all-users**: Retrieve a list of all users
- **PATCH /api/users/profile**: Update user profile
- **DELETE /api/users/:userId**: Delete a user by ID

#### Projects
- **GET /api/projects**: Retrieve a list of all projects
- **POST /api/projects**: Create a new project
- **PUT /api/projects/:id**: Update an existing project
- **DELETE /api/projects/:id**: Delete a project by ID

#### Resources
- **GET /api/resources**: Get list of available resources
- **POST /api/resources**: Create a new resource

Detailed API documentation can be found in the project [API Docs](link to apis will be update soon).

## Contributing
We welcome contributions to this project. If you'd like to contribute:
1. Fork the repository.
2. Create a new feature branch (`git checkout -b feature/your-feature-name`).
3. Make your changes, ensuring that the code follows project standards.
4. Commit your changes (`git commit -m 'Add some feature'`).
5. Push your branch to GitHub (`git push origin feature/your-feature-name`).
6. Create a pull request, and we will review your changes.

## Connect to FE github
Due to some problem, I had to separate the front-end file which you can found in this link (https://github.com/rogdrigues/project_estimate_fe)