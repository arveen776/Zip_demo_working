# Quote and Customer Management System

This is a web-based application designed to help businesses manage their customers, quotes, and services. It provides a simple and efficient way to create and track quotes, manage a service catalog, and view customer information. The application has two user roles: **employee** and **manager**, each with a tailored interface.

## Key Features

### General

- **Role-Based Access Control:** Separate login and interfaces for employees and managers.
- **Responsive Design:** The application is designed to work on both desktop and mobile devices.
- **Dark/Light Theme:** Users can switch between a light and dark theme for their comfort.

### Employee View

- **Create Quotes:** Employees can create new quotes for customers, adding services and quantities.
- **Customer Profiles:** View basic customer information, including their next appointment.
- **Upcoming Appointments:** A dedicated section to view today's, tomorrow's, and this week's appointments.

### Manager View

- **Dashboard:** A comprehensive dashboard with KPIs for total revenue, total quotes, and average quote value.
- **Quote Management:** View all quotes, filter them by customer, label, and date range, and update their status.
- **Customer Management:** A full-featured customer relationship management (CRM) section to add, view, edit, and delete customers.
- **Service Catalog:** Manage the list of services offered, including their names, descriptions, and costs.
- **Analytics:** A dedicated analytics tab with charts for service frequency, quote status breakdown, top services by revenue, and quotes per customer.
- we need to add the inventiory for the  appointment daate fethc and recivie

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git 
    ```
2.  **Install dependencies:**
    ```bash
    cd your-repo-name/server
    npm install
    ```
3.  **Set up environment variables:**
    - Create a `.env` file in the `server` directory.
    - Add the following variables:
      ```
      DATABASE_URL="file:./dev.db"
      MANAGER_PASSWORD="your-manager-password"
      EMPLOYEE_PASSWORD="your-employee-password"
      EMAIL_HOST="your-smtp-host"
      EMAIL_PORT="your-smtp-port"
      EMAIL_USER="your-smtp-username"
      EMAIL_PASS="your-smtp-password"
      ```
4.  **Start the application:**
    ```bash
    npm start
    ```
