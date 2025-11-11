import os
import sys
from app import app, db
from models import Table, KOTConfig, BillConfig, MenuItem, Category, Department, RestaurantSettings
from sqlalchemy import inspect, text

def column_exists(table_name, column_name):
    """Check if a column exists in a table"""
    inspector = inspect(db.engine)
    columns = [column['name'] for column in inspector.get_columns(table_name)]
    return column_name in columns

def add_missing_columns():
    """Add missing columns to existing tables"""
    with app.app_context():
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        
        # Check and add missing columns for kot_config table
        if 'kot_config' in tables:
            if not column_exists('kot_config', 'paper_size'):
                try:
                    with db.engine.connect() as conn:
                        conn.execute(text('ALTER TABLE kot_config ADD COLUMN paper_size VARCHAR'))
                        conn.commit()
                    print("Added paper_size column to kot_config table")
                except Exception as e:
                    print(f"Error adding paper_size column to kot_config: {e}")
            
            if not column_exists('kot_config', 'format_type'):
                try:
                    with db.engine.connect() as conn:
                        conn.execute(text('ALTER TABLE kot_config ADD COLUMN format_type VARCHAR'))
                        conn.commit()
                    print("Added format_type column to kot_config table")
                except Exception as e:
                    print(f"Error adding format_type column to kot_config: {e}")
        
        # Check and add missing columns for bill_config table
        if 'bill_config' in tables:
            if not column_exists('bill_config', 'paper_size'):
                try:
                    with db.engine.connect() as conn:
                        conn.execute(text('ALTER TABLE bill_config ADD COLUMN paper_size VARCHAR'))
                        conn.commit()
                    print("Added paper_size column to bill_config table")
                except Exception as e:
                    print(f"Error adding paper_size column to bill_config: {e}")
            
            if not column_exists('bill_config', 'format_type'):
                try:
                    with db.engine.connect() as conn:
                        conn.execute(text('ALTER TABLE bill_config ADD COLUMN format_type VARCHAR'))
                        conn.commit()
                    print("Added format_type column to bill_config table")
                except Exception as e:
                    print(f"Error adding format_type column to bill_config: {e}")

def init_database():
    """Initialize the database with sample data"""
    with app.app_context():
        # Create all tables
        db.create_all()
        
        # Add missing columns to existing tables
        add_missing_columns()
        
        # Check if we already have data
        if Table.query.first() is None:
            # Add sample tables
            sample_tables = [
                Table(id="1", name="A1", seats=2, category="General", status="available"),
                Table(id="2", name="A2", seats=2, category="General", status="available"),
                Table(id="3", name="B1", seats=4, category="Family", status="available"),
                Table(id="4", name="B2", seats=4, category="Family", status="available"),
                Table(id="5", name="M1", seats=6, category="Mandi", status="available"),
                Table(id="6", name="M2", seats=6, category="Mandi", status="available"),
                Table(id="7", name="VIP1", seats=8, category="Party Hall", status="available"),
                Table(id="8", name="C1", seats=4, category="General", status="available"),
            ]
            
            for table in sample_tables:
                db.session.add(table)
            
            print("Added sample tables to database")
        
        # Check if we have KOT config
        if KOTConfig.query.first() is None:
            kot_config = KOTConfig(
                print_by_department=False, 
                number_of_copies=1,
                paper_size="80mm",
                format_type="detailed"
            )
            db.session.add(kot_config)
            print("Added default KOT configuration")
        
        # Check if we have Bill config
        if BillConfig.query.first() is None:
            bill_config = BillConfig(
                auto_print_dine_in=False, 
                auto_print_takeaway=False,
                paper_size="80mm",
                format_type="standard"
            )
            db.session.add(bill_config)
            print("Added default Bill configuration")
        
        # Check if we have departments
        if Department.query.first() is None:
            departments = [
                Department(id="1", name="Kitchen"),
                Department(id="2", name="Bar"),
                Department(id="3", name="Grill"),
            ]
            for dept in departments:
                db.session.add(dept)
            print("Added default departments")
        
        # Check if we have categories
        if Category.query.first() is None:
            categories = [
                Category(id="1", name="Mains"),
                Category(id="2", name="Salads"),
                Category(id="3", name="Beverages"),
                Category(id="4", name="Desserts"),
                Category(id="5", name="Appetizers"),
            ]
            for cat in categories:
                db.session.add(cat)
            print("Added default categories")
        
        # Check if we have menu items
        if MenuItem.query.first() is None:
            menu_items = [
                MenuItem(id="1", name="Classic Burger", product_code="CB001", price=259, category="Mains", department="Kitchen", description="Beef patty with lettuce, tomato, cheese"),
                MenuItem(id="2", name="Caesar Salad", product_code="CS002", price=199, category="Salads", department="Kitchen", description="Romaine lettuce, croutons, parmesan"),
                MenuItem(id="3", name="Margherita Pizza", product_code="MP003", price=299, category="Mains", department="Kitchen", description="Fresh mozzarella, basil, tomato sauce"),
                MenuItem(id="4", name="Fish & Chips", product_code="FC004", price=319, category="Mains", department="Kitchen", description="Beer-battered fish with crispy fries"),
                MenuItem(id="5", name="Greek Salad", product_code="GS005", price=219, category="Salads", department="Kitchen", description="Feta, olives, cucumber, tomatoes"),
                MenuItem(id="6", name="Pasta Carbonara", product_code="PC006", price=279, category="Mains", department="Kitchen", description="Creamy sauce with bacon and parmesan"),
                MenuItem(id="7", name="Coca Cola", product_code="CC007", price=59, category="Beverages", department="Bar", description="330ml can"),
                MenuItem(id="8", name="Fresh Orange Juice", product_code="FOJ008", price=99, category="Beverages", department="Bar", description="Freshly squeezed"),
                MenuItem(id="9", name="Chocolate Cake", product_code="CHC009", price=139, category="Desserts", department="Kitchen", description="Rich chocolate layer cake"),
                MenuItem(id="10", name="Ice Cream Sundae", product_code="ICS010", price=119, category="Desserts", department="Kitchen", description="Vanilla ice cream with toppings"),
            ]
            for item in menu_items:
                db.session.add(item)
            print("Added sample menu items")
        
        # Check if we have restaurant settings
        if RestaurantSettings.query.first() is None:
            settings = RestaurantSettings(
                restaurant_name="My Restaurant",
                currency="INR",
                tax_rate=5.0
            )
            db.session.add(settings)
            print("Added default restaurant settings")
        
        # Commit changes
        try:
            db.session.commit()
            print("Database initialized successfully!")
        except Exception as e:
            db.session.rollback()
            print(f"Error committing changes: {e}")
            raise

if __name__ == "__main__":
    # Ensure the Flask app is properly configured before initializing the database
    with app.app_context():
        init_database()