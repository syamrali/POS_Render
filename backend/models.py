from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

# Initialize SQLAlchemy
db = SQLAlchemy()

class Table(db.Model):
    __tablename__ = 'tables'
    
    id = db.Column(db.String, primary_key=True)
    name = db.Column(db.String, nullable=False)
    seats = db.Column(db.Integer, nullable=False)
    category = db.Column(db.String, nullable=False)
    status = db.Column(db.String, nullable=False, default='available')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'seats': self.seats,
            'category': self.category,
            'status': self.status
        }

class TableOrder(db.Model):
    __tablename__ = 'table_orders'
    
    id = db.Column(db.Integer, primary_key=True)
    table_id = db.Column(db.String, db.ForeignKey('tables.id'), nullable=False)
    table_name = db.Column(db.String, nullable=False)
    items = db.Column(db.Text, nullable=True)  # JSON string
    start_time = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'tableId': self.table_id,
            'tableName': self.table_name,
            'items': json.loads(self.items) if self.items else [],
            'startTime': self.start_time.isoformat()
        }

class Invoice(db.Model):
    __tablename__ = 'invoices'
    
    id = db.Column(db.String, primary_key=True)
    bill_number = db.Column(db.String, nullable=False)
    order_type = db.Column(db.String, nullable=False)  # 'dine-in' or 'takeaway'
    table_name = db.Column(db.String, nullable=True)
    items = db.Column(db.Text, nullable=False)  # JSON string
    subtotal = db.Column(db.Float, nullable=False)
    tax = db.Column(db.Float, nullable=False)
    total = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'billNumber': self.bill_number,
            'orderType': self.order_type,
            'tableName': self.table_name,
            'items': json.loads(self.items),
            'subtotal': self.subtotal,
            'tax': self.tax,
            'total': self.total,
            'timestamp': self.timestamp.isoformat()
        }

class KOTConfig(db.Model):
    __tablename__ = 'kot_config'
    
    id = db.Column(db.Integer, primary_key=True)
    print_by_department = db.Column(db.Boolean, nullable=False, default=False)
    number_of_copies = db.Column(db.Integer, nullable=False, default=1)
    selected_printer = db.Column(db.String, nullable=True)  # Selected printer for KOT
    paper_size = db.Column(db.String, nullable=True)  # Thermal printer paper size
    format_type = db.Column(db.String, nullable=True)  # KOT format based on paper size
    
    def to_dict(self):
        return {
            'printByDepartment': self.print_by_department,
            'numberOfCopies': self.number_of_copies,
            'selectedPrinter': self.selected_printer,
            'paperSize': self.paper_size,
            'formatType': self.format_type
        }

class BillConfig(db.Model):
    __tablename__ = 'bill_config'
    
    id = db.Column(db.Integer, primary_key=True)
    auto_print_dine_in = db.Column(db.Boolean, nullable=False, default=False)
    auto_print_takeaway = db.Column(db.Boolean, nullable=False, default=False)
    selected_printer = db.Column(db.String, nullable=True)  # Selected printer for Bills
    paper_size = db.Column(db.String, nullable=True)  # Thermal printer paper size
    format_type = db.Column(db.String, nullable=True)  # Bill format based on paper size
    
    def to_dict(self):
        return {
            'autoPrintDineIn': self.auto_print_dine_in,
            'autoPrintTakeaway': self.auto_print_takeaway,
            'selectedPrinter': self.selected_printer,
            'paperSize': self.paper_size,
            'formatType': self.format_type
        }

class MenuItem(db.Model):
    __tablename__ = 'menu_items'
    
    id = db.Column(db.String, primary_key=True)
    name = db.Column(db.String, nullable=False)
    product_code = db.Column(db.String, nullable=False, unique=True)
    price = db.Column(db.Float, nullable=False)
    category = db.Column(db.String, nullable=False)
    department = db.Column(db.String, nullable=False)
    description = db.Column(db.Text, nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'productCode': self.product_code,
            'price': self.price,
            'category': self.category,
            'department': self.department,
            'description': self.description
        }

class Category(db.Model):
    __tablename__ = 'categories'
    
    id = db.Column(db.String, primary_key=True)
    name = db.Column(db.String, nullable=False, unique=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name
        }

class Department(db.Model):
    __tablename__ = 'departments'
    
    id = db.Column(db.String, primary_key=True)
    name = db.Column(db.String, nullable=False, unique=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name
        }

class RestaurantSettings(db.Model):
    __tablename__ = 'restaurant_settings'
    
    id = db.Column(db.Integer, primary_key=True)
    restaurant_name = db.Column(db.String, nullable=False)
    address = db.Column(db.String, nullable=True)
    phone = db.Column(db.String, nullable=True)
    email = db.Column(db.String, nullable=True)
    currency = db.Column(db.String, nullable=False, default='INR')
    tax_rate = db.Column(db.Float, nullable=False, default=5.0)
    
    def to_dict(self):
        return {
            'id': self.id,
            'restaurantName': self.restaurant_name,
            'address': self.address,
            'phone': self.phone,
            'email': self.email,
            'currency': self.currency,
            'taxRate': self.tax_rate
        }