from django.db import models

# Create your models here.

class Region(models.Model):
    """Mô hình cho vùng (Region)"""
    name = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.name

class Market(models.Model):
    """Mô hình cho thị trường (Market)"""
    name = models.CharField(max_length=100, unique=True)
    region = models.ForeignKey(Region, on_delete=models.CASCADE, related_name='markets')
    
    def __str__(self):
        return self.name

class Country(models.Model):
    """Mô hình cho quốc gia (Country)"""
    name = models.CharField(max_length=100, unique=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    market = models.ForeignKey(Market, on_delete=models.CASCADE, related_name='countries')
    
    def __str__(self):
        return self.name

class State(models.Model):
    """Mô hình cho vùng/tỉnh (State)"""
    name = models.CharField(max_length=100)
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name='states')
    
    class Meta:
        unique_together = ('name', 'country')  # Tên state phải là duy nhất trong mỗi quốc gia
    
    def __str__(self):
        return f"{self.name}, {self.country.name}"

class City(models.Model):
    """Mô hình cho thành phố (City)"""
    name = models.CharField(max_length=100)
    state = models.ForeignKey(State, on_delete=models.CASCADE, related_name='cities')
    
    class Meta:
        unique_together = ('name', 'state')  # Tên thành phố phải là duy nhất trong mỗi state
    
    def __str__(self):
        return f"{self.name}, {self.state.name}"

class CustomerSegment(models.Model):
    """Mô hình cho phân khúc khách hàng (Customer Segment)"""
    name = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.name

class Customer(models.Model):
    """Mô hình cho khách hàng (Customer)"""
    customer_id = models.CharField(max_length=100, unique=True)
    segment = models.ForeignKey(CustomerSegment, on_delete=models.CASCADE, related_name='customers')
    
    def __str__(self):
        return self.customer_id

class Category(models.Model):
    """Mô hình cho danh mục sản phẩm (Category)"""
    name = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.name

class Subcategory(models.Model):
    """Mô hình cho danh mục con (Subcategory)"""
    name = models.CharField(max_length=100)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='subcategories')
    
    class Meta:
        unique_together = ('name', 'category')  # Đảm bảo tên subcategory không trùng trong cùng một category
    
    def __str__(self):
        return f"{self.name} ({self.category.name})"

class Product(models.Model):
    """Mô hình cho sản phẩm (Product)"""
    name = models.CharField(max_length=255)
    subcategory = models.ForeignKey(Subcategory, on_delete=models.CASCADE, related_name='products')
    
    class Meta:
        unique_together = ('name', 'subcategory')  # Tên sản phẩm là duy nhất trong mỗi subcategory
    
    def __str__(self):
        return self.name

class Order(models.Model):
    """Mô hình cho đơn hàng (Order)"""
    order_id = models.CharField(max_length=100, unique=True)
    order_date = models.DateField()
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='orders')
    city = models.ForeignKey(City, on_delete=models.CASCADE)
    
    def __str__(self):
        return self.order_id

class OrderDetail(models.Model):
    """Mô hình cho chi tiết đơn hàng (Order Detail)"""
    row_id = models.IntegerField(unique=True)  # Row ID từ file Excel
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='details')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    sales = models.DecimalField(max_digits=15, decimal_places=2)
    discount = models.DecimalField(max_digits=5, decimal_places=2)
    profit = models.DecimalField(max_digits=15, decimal_places=2)
    
    def __str__(self):
        return f"Row {self.row_id} - Order {self.order.order_id}"