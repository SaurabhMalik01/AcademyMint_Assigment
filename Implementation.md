# Implementation Document

## 1. Approach
The objective of this assignment was to implement analytics and tracking features for an e-commerce application. The main tasks included:
- Setting up MySQL database tables for products, categories, orders, and visitor tracking.
- Implementing APIs for analytics with support for date ranges and bucket-based grouping (day, week, month).
- Inserting demo data for products and categories using a utility script.
- Logging visitors on every request to track site traffic.
- Ensuring proper error handling and structured API responses.
The backend is built using Node.js, Express, Prisma ORM, and MySQL.

## 2. Schema Changes
New Tables Added:
1. visitor_logs
   Columns: visitor_id (VARCHAR(36)), ip (VARCHAR(50)), user_agent (TEXT), page_path (VARCHAR(255)), visited_at (DATETIME)
2. product_history
   Columns: product_id (VARCHAR(36)), event_type (ENUM: added|removed), event_time (DATETIME)

Existing tables for products, categories, users, orders, and images remain unchanged.

## 3. API Details

1. Products Trend Analytics
   Endpoint: GET /dashboard/products
   Query Parameters:
     - startDate: Optional, format YYYY-MM-DD
     - endDate: Optional, format YYYY-MM-DD
     - bucket: Optional, day|week|month
   Sample Response:
   {
     "currentTotal": 12,
     "trend": [
       {
         "startDate": "2025-09-01",
         "endDate": "2025-09-02",
         "productsAdded": 2,
         "productsRemoved": 0,
         "totalProducts": 12
       }
     ]
   }

2. Visitors Analytics
   Endpoint: GET /dashboard/visitors
   Query Parameters:
     - startDate: Optional, format YYYY-MM-DD
     - endDate: Optional, format YYYY-MM-DD
     - bucket: Optional, day|week|month
   Sample Response:
   {
     "totalVisitors": 50,
     "visitorsByBucket": [
       {
         "startDate": "2025-09-01",
         "endDate": "2025-09-02",
         "visitors": 10
       }
     ]
   }

## 4. Demo Data
12 demo products and 15 categories inserted using utils/insertDemoData.js. Each product has unique ID, slug, and associated category. This allows testing analytics endpoints without manual entry.

